import { useRef } from "react";
import { AddJob, ID } from "..";
import {
    FetchMeta,
    DataNode,
    DefaultDataItem,
    Loader,
    ParentLike,
    FetchNodes,
} from "../types";
import { buildAndAppendSkeletons } from "../utils/data-builders/buildAndAppendSkeletons";
import { findParentAndAppendNodes } from "../utils/findParentAndAppendNodes";

const isDataNode = <T extends DefaultDataItem>(
    node: ParentLike<T> | DataNode<T> | null,
): node is DataNode<T> => {
    if (!node) {
        return false;
    }

    return "id" in node;
};

const findNodeIndex = <T extends DefaultDataItem>(
    parentNode: ParentLike<T>,
    node: DataNode<T>,
) => {
    const children = parentNode.children;
    if (!children || typeof children === "function" || !children.length) {
        return null;
    }

    const index = children.findIndex(n => {
        return node.id === n.id;
    });

    if (typeof index !== "number") {
        return null;
    }

    return index;
};

const findNodeIndexOrThrowError = <T extends DefaultDataItem>(
    parentNode: ParentLike<T> | null,
    node: DataNode<T>,
) => {
    const index = parentNode ? findNodeIndex(parentNode, node) : null;
    if (index === null) {
        throw new Error(
            "Couldn\t retrieve start or end index. Provide either start and end as numbers or either parent node has to have an array of children (not empty)",
        );
    }

    return index;
};

export const useFetch = <T extends DefaultDataItem>(
    addJob: AddJob<any>,
    loader: Loader<T>,
    setTreeData: React.Dispatch<React.SetStateAction<DataNode<T>[]>>,
) => {
    const initiatedRoot = useRef(false);
    const queueRef = useRef(
        new Map<ID | null, Array<[DataNode<T> | null, number, number]>>(),
    );

    /**
     * forbid any drag operations while tree is transformed by this hook.
     * otherwise it will lead to unexpecated results
     * in worst case lib will ignore new transformed tree completely.
     */
    const dragOperationsForbiddenRef = useRef(false);

    const isFetchingForParent = (parentNode: DataNode<T> | null) => {
        const queue = queueRef.current.get(
            parentNode ? parentNode.id : parentNode,
        );
        return Boolean(queue && queue.length);
    };

    const isFetching = (parentNode: ParentLike<T>, node: DataNode<T>) => {
        const parentId = node?.data.parent?.id ? node.data.parent.id : null;
        let nodeIndex = -1;

        const idx = findNodeIndex(parentNode, node);
        if (idx === null) {
            throw new Error("Item not found!");
        }

        nodeIndex = idx;

        const loading = queueRef.current.get(parentId);
        if (!loading || !loading.length) {
            return false;
        }

        for (const indices of loading) {
            if (nodeIndex >= indices[1] && nodeIndex <= indices[2]) {
                return true;
            }
        }

        return false;
    };

    const flush = async (
        parentNode: DataNode<T> | null,
        startIndex: number,
        endIndex: number,
    ) => {
        const newNodes = await loader(parentNode, startIndex, endIndex);
        return addJob(() => {
            let error = null;
            setTreeData(oldTree => {
                dragOperationsForbiddenRef.current = true;
                let tree = oldTree;
                try {
                    tree = findParentAndAppendNodes({
                        parentId: parentNode ? parentNode.id : null,
                        treeData: oldTree,
                        nodesToAppend: newNodes,
                        replace: { start: startIndex },
                    });
                } catch (err) {
                    error = err;
                    console.error(error);
                }
                dragOperationsForbiddenRef.current = false;
                return tree;
            });
            return { error, newNodes };
        });
    };

    const fetchNodes: FetchNodes<T> = async (
        meta: FetchMeta<T>,
        childrenCount: number,
        refetch?: boolean,
        onlyInitial?: boolean,
    ) => {
        let startIndex = 0;
        let endIndex = 0;

        if (typeof meta.startIndex === "number") {
            startIndex = meta.startIndex;
        } else {
            startIndex = findNodeIndexOrThrowError(
                meta.parentNode,
                meta.startIndex,
            );
        }

        if (typeof meta.endIndex === "number") {
            endIndex = meta.endIndex;
        } else {
            endIndex = findNodeIndexOrThrowError(
                meta.parentNode,
                meta.endIndex,
            );
        }

        const parentId = isDataNode(meta.parentNode)
            ? meta.parentNode?.id || null
            : null;

        let emptyQueue = true;
        let loading = queueRef.current.get(parentId);
        const parentNode = isDataNode(meta.parentNode) ? meta.parentNode : null;
        if (loading?.length) {
            loading.push([parentNode, startIndex, endIndex]);
            emptyQueue = false;
        } else {
            queueRef.current.set(parentId, [
                [parentNode, startIndex, endIndex],
            ]);
            loading = queueRef.current.get(parentId);
        }

        const initiated =
            !refetch &&
            (!isDataNode(meta.parentNode)
                ? initiatedRoot.current
                : meta.parentNode.initiated);
        if (!initiated) {
            if (!parentNode) {
                initiatedRoot.current = true;
            }
            dragOperationsForbiddenRef.current = true;
            await buildAndAppendSkeletons({
                parent: parentNode,
                count: childrenCount,
                addJob,
                setTreeData,
                append: "instead",
                parentData: { initiated: true },
            });
            dragOperationsForbiddenRef.current = false;
        }

        if (onlyInitial && initiated) {
            loading?.shift();
            return;
        }

        if (!emptyQueue) {
            return;
        }

        const queueEntries = queueRef.current?.entries?.();
        for (const val of queueEntries) {
            const loading = val[1];
            if (loading && loading.length) {
                while (loading.length) {
                    const indices = loading.shift();
                    if (!indices) {
                        break;
                    }
                    await flush(...indices);
                }
            }
        }
    };

    return {
        fetchNodes,
        isFetching,
        isFetchingForParent,
        dragOperationsForbiddenRef,
    };
};
