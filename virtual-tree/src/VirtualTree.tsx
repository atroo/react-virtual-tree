import React, {
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import SortableTree, {
    FlatDataItem,
    getFlatDataFromTree,
    ReactSortableTreeProps,
    changeNodeAtPath,
    getNodeAtPath,
    ExtendedNodeData,
    NodeData,
    OnDragPreviousAndNextLocation,
    SortableTreeWithoutDndContext,
} from "atroo-react-sortable-tree";
import { useOnDragFinished } from "./hooks/useOnDragFinished";
import { createFileExplorerTheme } from "./themes/file-explorer-theme";
import {
    DataNode,
    DefaultDataItem,
    FetchAndBuildDataResult,
    FetchParams,
    ID,
    INodeRenderers,
    Loader,
    OnDraggedFinished,
    OnNodeSelected,
} from "./types";
import { getNodeKey } from "./utils/getNodeKey";
import "atroo-react-sortable-tree/style.css";
import { useNodeSelection } from "./hooks/useNodeSelection";
import InfiniteLoader from "react-window-infinite-loader";
import { createLoadNodes } from "./utils/data-builders/loadNodes";
import {
    createCannotDragSkeleton,
    cannotDropSkeleton,
    createOnVisibilityToggle,
    makeDefaultDataNode,
    skeletonCannotHaveChildren,
    createLoader,
} from "./utils";
import { useFetch } from "./hooks/useFetch";
import { isPlaceholder } from "./utils/isPlaceholder";
// no types for "lodash.debounce"
const debounce = require("lodash.debounce");
import styles from "./VirtualTree.module.scss";
import { useScrollQueue } from "./hooks/useScrollQueue";
import { FetchNodes } from ".";

/**
 * TODOS
 *
 * TODO: update reference to parent to after node was dragged (?)
 * TODO: get total count root children from response (?)
 * TODO: alow custom "canDrag", "canDrop", "onRowsRendered" functions to be passed (?)
 * TODO: performance optimizations (?)
 */

interface IVirtialTreeProps<T extends DefaultDataItem>
    extends Omit<
        ReactSortableTreeProps,
        "reactVirtualizedListProps" | "treeData" | "onChange"
    > {
    onDraggedFinished?: OnDraggedFinished<T>;
    onNodeSelected?: OnNodeSelected<T>;
    url: string;
    initalTreeData?: DataNode<T>[];
    loader?: Loader<T>;
    renderers?: INodeRenderers<T>;
    countOfRootItems?: number;
    onTreeDataChange?: (treeData: DataNode<T>[]) => void;
    canDragInterceptor?: (data: ExtendedNodeData) => boolean;
    canDropInterceptor?: (
        data: OnDragPreviousAndNextLocation & NodeData,
    ) => boolean;
    withoutDefaultDragContext: boolean;
}

export interface VirtualTreeRef<T extends DefaultDataItem> {
    toggleNode: (props: ToggleNodeProps<T>) => void;
    forceLoadCurrentSkeletons: () => void;
    treeData: DataNode<T>[];
    setTreeData: React.Dispatch<React.SetStateAction<DataNode<T>[]>>;
    fetchNodes: FetchNodes<T>;
}

interface ToggleNodeProps<T> {
    treeData: DataNode<T>[];
    path: Array<string | number>;
    expanded?: boolean;
}
const VirtualTreeImpl = <T extends DefaultDataItem>(
    props: IVirtialTreeProps<T>,
    ref: React.ForwardedRef<VirtualTreeRef<T>>,
) => {
    const rootItems = props.countOfRootItems || 1000;
    const {
        onDragStateChanged: onDragStateChangedFromProps,
        onNodeSelected,
        onDraggedFinished,
        onTreeDataChange,
        url,
        loader: userLoader,
        ...rest
    } = props;

    const toggleNode = useCallback((props: ToggleNodeProps<T>) => {
        const { path, expanded, treeData } = props;
        const data = getNodeAtPath({ treeData, path, getNodeKey });
        if (data) {
            const node = data.node;

            const newTD = changeNodeAtPath({
                treeData,
                path,
                getNodeKey,
                newNode: {
                    ...node,
                    expanded:
                        expanded !== undefined ? expanded : !node.expanded,
                },
            }) as DataNode<T>[];

            const newData = getNodeAtPath({
                treeData: newTD,
                path,
                getNodeKey,
            });
            setTreeData(() => newTD);
            onVisibilityToggle({
                treeData: newTD,
                node: newData!.node,
                expanded: !!newData!.node.expanded,
            });
        }
    }, []);

    const iRef = useRef<InfiniteLoader>(null);

    const forceLoadCurrentSkeletons = useCallback(() => {
        iRef.current?.resetloadMoreItemsCache(true);
    }, []);

    const [treeData, setTreeData] = useState<DataNode<T>[]>(
        props.initalTreeData || [],
    );

    useEffect(() => {
        onTreeDataChange && onTreeDataChange(treeData);
    }, [treeData]);

    const onDragStateChanged = useOnDragFinished(treeData, onDraggedFinished);
    const { generateNodeProps } = useNodeSelection(onNodeSelected);

    const loader = useMemo(() => {
        if (userLoader) {
            return userLoader;
        }

        const loadNodes = createLoadNodes(url);
        return createLoader(loadNodes, makeDefaultDataNode);
    }, []) as Loader<T>;

    const rootRef = useRef<HTMLDivElement>(null);
    const { addJob } = useScrollQueue<FetchAndBuildDataResult<T>>(rootRef);
    const { fetchNodes, isFetching, dragOperationsForbiddenRef } = useFetch(
        addJob,
        loader,
        setTreeData,
    );

    useImperativeHandle(
        ref,
        () => {
            return {
                toggleNode,
                setTreeData,
                treeData,
                fetchNodes,
                forceLoadCurrentSkeletons,
            };
        },
        [toggleNode, treeData, fetchNodes],
    );

    useEffect(() => {
        if (!props.initalTreeData) {
            (async () => {
                fetchNodes(
                    { parentNode: null, startIndex: 0, endIndex: 10 },
                    rootItems,
                );
            })();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }, []);

    const [flatData, setFlatData] = useState<FlatDataItem[]>([]);
    useEffect(() => {
        setFlatData(
            getFlatDataFromTree({
                treeData,
                getNodeKey,
                ignoreCollapsed: true,
            }),
        );
    }, [treeData]);

    const onVisibilityToggle = createOnVisibilityToggle(fetchNodes);

    const loadMoreItems = useMemo(() => {
        /**
         * react-window-infinite-loader can work only with flat list!
         * the idea is to transform item's index from flat list
         * into index of item from parenNode's "children" array
         *
         * it possible that indices between [startIndex, endIndex] can be mapped to different "parentNode"s
         * "loadMore" should handle all this cases: find all "parentNode"s with correct start and end indices
         * and queue fetching for all these parent nodes.
         *
         * use debounce to reduce number of operations if user scrolls really fast.
         */
        return debounce(async (startIndex: number, endIndex: number) => {
            const sliceFlat = flatData.slice(startIndex, endIndex + 1);
            if (!sliceFlat.length) {
                return;
            }

            const fethConfigMap = sliceFlat.reduce<
                Map<ID | null, FetchParams<T>>
            >((acc, currentNode) => {
                const parentNode = (currentNode.parentNode ||
                    null) as DataNode<T> | null;

                const parentId = parentNode ? parentNode.id : null;
                const entry = acc.get(parentId);
                const node = currentNode.node as DataNode<T>;
                if (entry) {
                    entry.meta.endIndex = node;
                } else {
                    const newEntry: FetchParams<T> = {
                        meta: {
                            parentNode:
                                parentNode === null
                                    ? { children: treeData }
                                    : parentNode,
                            startIndex: node,
                            endIndex: node,
                        },
                        childrenCount: parentNode
                            ? parentNode.childrenCount
                            : rootItems,
                    };

                    acc.set(parentId, newEntry);
                }

                return acc;
            }, new Map());

            for (const entry of fethConfigMap) {
                const data = entry[1];
                fetchNodes(data.meta, data.childrenCount);
            }
        }, 250);
    }, [flatData, treeData]);

    const theme = useMemo(() => {
        return createFileExplorerTheme(props.renderers);
    }, []);

    const TreeComp =
        props.withoutDefaultDragContext === true
            ? SortableTreeWithoutDndContext
            : SortableTree;

    return (
        <div ref={rootRef} className={styles.root}>
            <InfiniteLoader
                ref={iRef}
                isItemLoaded={index => {
                    const flatItem = flatData[index];

                    /**
                     * I use Infinity as totalCount for Loader.
                     * Real item count is always equals to skeletons count.
                     *  */
                    if (!flatItem) {
                        return true;
                    }

                    const parentNode = flatItem.parentNode;
                    const node = flatItem.node
                        ? (flatItem.node as DataNode<T>)
                        : null;

                    if (!node) {
                        throw new Error("Node doesn't exist");
                    }

                    if (!isPlaceholder(flatItem.node as DataNode<T>)) {
                        return true;
                    }

                    return isFetching(
                        parentNode ? parentNode : { children: treeData },
                        node,
                    );
                }}
                loadMoreItems={loadMoreItems}
                itemCount={Infinity}
            >
                {({ onItemsRendered }) => (
                    <TreeComp
                        treeData={treeData}
                        onChange={(tData: DataNode<T>[]) => setTreeData(tData)}
                        canDrag={data => {
                            let interceptorAllows = true;
                            if (props.canDragInterceptor) {
                                interceptorAllows =
                                    props.canDragInterceptor(data);
                            }
                            if (!interceptorAllows) {
                                return false;
                            }
                            return createCannotDragSkeleton(
                                dragOperationsForbiddenRef,
                            )(data);
                        }}
                        canDrop={data => {
                            let interceptorAllows = true;
                            if (props.canDropInterceptor) {
                                interceptorAllows =
                                    props.canDropInterceptor(data);
                            }
                            if (!interceptorAllows) {
                                return false;
                            }
                            return cannotDropSkeleton(data);
                        }}
                        canNodeHaveChildren={skeletonCannotHaveChildren}
                        reactVirtualizedListProps={{
                            onRowsRendered: info => {
                                return onItemsRendered({
                                    overscanStartIndex: info.overscanStartIndex,
                                    overscanStopIndex: info.overscanStopIndex,
                                    visibleStartIndex: info.startIndex,
                                    visibleStopIndex: info.stopIndex,
                                });
                            },
                        }}
                        theme={theme}
                        getNodeKey={getNodeKey}
                        isVirtualized={true}
                        generateNodeProps={rowInfo => {
                            const { node, path } = rowInfo;
                            return Object.assign(
                                {
                                    "data-id": `id${node.id}`,
                                    path,
                                },
                                generateNodeProps(rowInfo),
                            );
                        }}
                        onDragStateChanged={(...args) => {
                            onDragStateChanged(...args);
                            if (onDragStateChangedFromProps) {
                                onDragStateChangedFromProps(...args);
                            }
                        }}
                        onVisibilityToggle={onVisibilityToggle}
                        scaffoldBlockPxWidth={28}
                        rowHeight={40}
                        {...rest}
                    />
                )}
            </InfiniteLoader>
        </div>
    );
};

export const VirtualTree = React.forwardRef(VirtualTreeImpl);
