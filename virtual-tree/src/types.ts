import { CSSProperties } from "react";
import { ConnectableElement, DragPreviewOptions } from "react-dnd";

/**
 * ReactSortableTreeNode, TreeIndex, TreePath, NodeData, NumberOrStringArray, GetTreeItemChildrenFn, TreeItem
 * These types come from react-sortable-tree lib
 * Why we copied these types instead of exporting them from lib?
 * We forked "react-sortable-tree" lib in order to make minor fix (package called "atroo-react-sortable-tree")
 * We still use react-sortable-tree types. I declared "atroo-react-sortable-tree" module (tree.d.ts)
 * that use "react-sortable-tree" types.
 * When external user uses build "virtual-tree" it is impossible to resolve
 * "atroo-react-sortable-tree" types for some reason. This module is just not included built types.d.ts
 *
 */
export interface ReactSortableTreeNode {
    node: TreeItem;
}

export interface TreeIndex {
    treeIndex: number;
}

export interface TreePath {
    path: NumberOrStringArray;
}

export interface NodeData extends ReactSortableTreeNode, TreePath, TreeIndex {}

type NumberOrStringArray = Array<string | number>;

export interface GetTreeItemChildren {
    done: (children: TreeItem[]) => void;
    node: TreeItem;
    path: NumberOrStringArray;
    lowerSiblingCounts: number[];
    treeIndex: number;
}

export type GetTreeItemChildrenFn = (data: GetTreeItemChildren) => void;

export interface TreeItem {
    title?: React.ReactNode | undefined;
    subtitle?: React.ReactNode | undefined;
    expanded?: boolean | undefined;
    children?: TreeItem[] | GetTreeItemChildrenFn | undefined;
    [x: string]: any;
}

import {
    PLACEHOLDER_LOADING_TYPE,
    PLACEHOLDER_SKELETON_TYPE,
    PLACEHOLDER_TYPE,
} from "./variables";

export type ID = string | number;

export interface DataNode<T extends Record<string, any>> extends TreeItem {
    data: T;
    id: ID;
    childrenCount: number;
    initiated?: boolean;
}

export interface PlaceholderNode extends TreeItem {
    type: typeof PLACEHOLDER_TYPE;
    placeholderType:
        | typeof PLACEHOLDER_LOADING_TYPE
        | typeof PLACEHOLDER_SKELETON_TYPE;
}

export type TreeNode<T extends Record<string, any>> =
    | DataNode<T>
    | PlaceholderNode;

export type LoadMore<T extends Record<string, any>> = (
    parent: DataNode<T> | null,
    done: (value: ID | null) => void,
) => void;

export type ObserveLoadMore<T extends Record<string, any>> = () => ReturnType<
    LoadMore<T>
>;

export interface DataToObserve<T extends Record<string, any>> {
    parentNode: DataNode<T> | null;
    childId: ID | null;
}

export type OnDraggedFinished<T extends Record<string, any>> = (info: {
    parentNode: DataNode<T> | null;
    node: DataNode<T>;
    path: Array<string | number>;
    oldParentNode: DataNode<T> | null;
    oldPath: Array<string | number>;
    treeData: DataNode<T>[];
}) => void;

export type WalkCallback<T extends DefaultDataItem> = (info: {
    node: DataNode<T>;
    parentNode: DataNode<T>;
    path: Array<string | number>;
}) => void;

export interface DefaultDataItem {
    parent: DataNode<DefaultDataItem> | null;
    title: string;
    initiated?: boolean;
    owner: string;
    ownerLoginName: string;
    shared: boolean;
    sharedWith: { id: ID; rights: string; type: string };
    media_type: string;
    media_id: string;
    created: number;
    document_id: ID;
    countByAssetType: {
        collection: number;
        page: number;
        picture: number;
        article: number;
    };
}

export type LoadData<T extends DefaultDataItem> = (
    parent: DataNode<T> | null,
    startIndex: number,
    endIndex: number,
) => Promise<T[]>;
export type MakeNode<T extends DefaultDataItem> = (data: T) => DataNode<T>;
export type Loader<T extends DefaultDataItem> = (
    parent: DataNode<T> | null,
    startIndex: number,
    endIndex: number,
) => Promise<DataNode<T>[]>;

export type Job<T extends unknown> = () => T;
export type AddJob<T> = (job: Job<T>) => Promise<T>;

export interface FetchAndBuildDataResult<T extends DefaultDataItem> {
    error: Error | null;
    newNodes: DataNode<T>[];
}

export type ParentLike<T extends DefaultDataItem> = {
    children?: DataNode<T>[] | TreeItem[] | GetTreeItemChildrenFn;
};

export type FetchMeta<T extends DefaultDataItem> = {
    parentNode: ParentLike<T> | DataNode<T> | null;
    startIndex: DataNode<T> | number;
    endIndex: DataNode<T> | number;
};

export type FetchAndBuildData<T extends DefaultDataItem> = (
    parentId: ID | null,
    childrenCount: number,
    startIndex: number,
    endIndex: number,
) => Promise<FetchAndBuildDataResult<T>>;

export type OnNodeSelected<T extends DefaultDataItem> = (
    node: DataNode<T> | null,
) => void;

export type Append = "start" | "end" | "instead";
export type Replace = { start: number };

export interface FetchParams<T extends DefaultDataItem> {
    meta: FetchMeta<T>;
    childrenCount: number;
}

export type FetchNodes<T extends DefaultDataItem> = (
    meta: FetchMeta<T>,
    childrenCount: number,
    refetch?: boolean,
    onlyInitial?: boolean | undefined,
) => Promise<void>;

export type IsFetchingForParent<T extends DefaultDataItem> = (
    parentNode: DataNode<T> | null,
) => boolean;

export interface IRenderNodeProps<T extends DefaultDataItem> {
    parentNode: DataNode<T> | null;
    node: DataNode<T>;
    expandButtonStyle: CSSProperties;
    onExpandButtonClick: (() => void) | undefined;
    rowStyle: CSSProperties;
    isPlaceholder: boolean;
    nodeTitle: string;
    buttons: JSX.Element[];
    icons: JSX.Element[];
    scaffold: JSX.Element[];
    connectDragPreview: (
        elementOrNode: ConnectableElement,
        options?: DragPreviewOptions | undefined,
    ) => React.ReactElement<
        any,
        string | React.JSXElementConstructor<any>
    > | null;
    otherProps: {
        subtitle?: ((data: NodeData) => JSX.Element) | undefined;
        startDrag: any;
        endDrag: any;
        children?: React.ReactNode;
    };
    canDrag: boolean;
    defaultClassNames: {
        rowWrapperClassName: string;
        rowClassName: string;
        expandNodeClassName: string;
        expandIcon: string;
        ["expandIcon--collapse"]: string;
        rowContents: string;
        rowToolbar: string;
        toolbarButton: string;
        rowLabel: string;
        rowTitle: string;
        childrenCount: string;
        rowContentsDragDisabled: string;
        folder: string;
    };
}

export interface INodeRenderers<T extends DefaultDataItem> {
    skeletons?: (parentNode: DataNode<T> | null) => JSX.Element;
    nodes?: (parentNode: DataNode<T> | null) => JSX.Element;
    node?: (props: IRenderNodeProps<T>) => JSX.Element;
}
