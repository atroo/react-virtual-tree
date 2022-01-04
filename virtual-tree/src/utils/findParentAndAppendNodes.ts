import { TreeItem } from "atroo-react-sortable-tree";
import { DefaultDataItem } from "..";
import { DataNode, ID, PlaceholderNode, Append, Replace } from "../types";
import { getNodeKey } from "../utils/getNodeKey";
import { addNodesUnderParent } from "./addNodesUnderParent";
import { findParentNode } from "./findParentNode";

export const findParentAndAppendNodes = <T extends DefaultDataItem>(params: {
    parentId: ID | null;
    treeData: DataNode<T>[];
    nodesToAppend: DataNode<T>[] | PlaceholderNode[];
    append?: Append;
    replace?: Replace;
    parentData?: Partial<DataNode<T>>;
    parentExpanded?: boolean;
}) => {
    const { parentId, treeData, nodesToAppend, append, replace, parentData } =
        params;

    const parentNodeBag = findParentNode<T>(
        parentId,
        treeData as DataNode<never>[],
    );
    let parentKey = null;
    let newNode = null;
    if (parentNodeBag) {
        parentKey = parentNodeBag.parentKey;
        newNode = parentNodeBag.parentNode;
    }

    let expanded = params.parentExpanded;
    if (expanded === undefined) {
        expanded = newNode ? (newNode as TreeItem).expanded : false;
    }

    try {
        const newTree = addNodesUnderParent({
            treeData,
            newNodes: nodesToAppend,
            getNodeKey,
            parentKey: parentKey,
            expandParent: expanded,
            ignoreCollapsed: false,
            append,
            replace,
            parentData,
        });

        return newTree.treeData as DataNode<T>[];
    } catch (error) {
        console.error(error);
        throw error;
    }
};
