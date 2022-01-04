import { walk } from "atroo-react-sortable-tree";
import { DefaultDataItem } from "..";
import { DataNode, ID, WalkCallback } from "../types";
import { getNodeKey } from "../utils/getNodeKey";

export const findParentNode = <T extends DefaultDataItem>(
    parentId: ID | null,
    treeData: DataNode<T>[],
) => {
    if (!parentId) {
        return null;
    }

    let parentKey: ID | null = null;
    let newNode: DataNode<T> | null = null;
    const walkCallback: WalkCallback<never> = info => {
        if (info.node.id === parentId) {
            newNode = info.node;
            parentKey = info.path ? info.path[info.path.length - 1] : null;
            return false;
        }

        return;
    };

    walk({
        treeData,
        getNodeKey,
        callback: walkCallback,
        ignoreCollapsed: false,
    });

    if (!newNode || !parentKey) {
        return null;
    }

    return {
        parentNode: newNode as DataNode<T>,
        parentKey: parentKey as string,
    };
};
