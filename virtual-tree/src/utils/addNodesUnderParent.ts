import {
    getDescendantCount,
    TreeItem,
    map,
    GetNodeKeyFunction,
} from "atroo-react-sortable-tree";
import { DataNode, PlaceholderNode, Append, Replace } from "../types";

interface IAddNodeUnderParentParams<T extends Record<string, any>> {
    treeData: TreeItem[] | DataNode<T>[] | PlaceholderNode[];
    newNodes: TreeItem[] | DataNode<T>[] | PlaceholderNode[];
    parentKey?: string | number | null;
    getNodeKey: GetNodeKeyFunction;
    ignoreCollapsed?: boolean;
    expandParent?: boolean;
    append?: Append;
    replace?: Replace;
    parentData?: Partial<DataNode<T>>;
}

interface MapCallback<T extends Record<string, any>> {
    treeIndex: number;
    path: Array<string | number>;
    node: TreeItem | DataNode<T>;
}

const appendNodes = (
    oldTree: TreeItem[],
    newTree: TreeItem[],
    place: Append,
) => {
    let treeIndex: number = 0;
    if (place === "start") {
        return {
            treeIndex,
            treeData: [...newTree, ...oldTree],
        };
    }

    if (place === "end") {
        treeIndex = oldTree.length;
        return {
            treeIndex,
            treeData: [...oldTree, ...newTree],
        };
    }

    if (place === "instead") {
        return {
            treeIndex,
            treeData: newTree,
        };
    }

    return {
        treeIndex,
        treeData: oldTree,
    };
};

const replaceNodes = (
    oldTree: TreeItem[],
    newTree: TreeItem[],
    startIndex: number,
) => {
    let start = 0;
    if (Array.isArray(startIndex)) {
        start = startIndex[0];
    } else {
        start = startIndex;
    }

    /**
     * endIndex specified by user is no longer used.
     * it will be always calculated based on startIndex
     */
    const end = start + newTree.length - 1;

    /**
     * this is REPLACE operation
     * user nodes will be ignored in case
     * user nodes array is longer than existing
     */
    oldTree.forEach((_, idx) => {
        const s = idx - start;
        const e = idx - end;
        if (s < 0 || e > 0) {
            return;
        }

        const n = newTree[s];
        if (n) {
            oldTree[idx] = n;
        }
    });

    return {
        treeIndex: startIndex,
        treeData: oldTree,
    };
};

const appendOrReplace = <T extends Record<string, any>>(
    oldTree: TreeItem[],
    newTree: TreeItem[],
    appendOrReplace:
        | IAddNodeUnderParentParams<T>["append"]
        | IAddNodeUnderParentParams<T>["replace"],
) => {
    if (typeof appendOrReplace === "string") {
        return appendNodes(oldTree, newTree, appendOrReplace);
    }

    if (typeof appendOrReplace?.start === "number") {
        return replaceNodes(oldTree, newTree, appendOrReplace?.start);
    }

    return {
        treeData: oldTree,
        treeIndex: 0,
    };
};

export const addNodesUnderParent = <T extends Record<string, any>>({
    treeData,
    newNodes,
    parentKey = null,
    getNodeKey,
    ignoreCollapsed = true,
    expandParent = false,
    replace,
    append,
    parentData,
}: IAddNodeUnderParentParams<T>) => {
    if (parentKey === null) {
        const changedTreeData = map({
            treeData,
            getNodeKey,
            ignoreCollapsed,
            callback: ({ node, path }: MapCallback<T>) => {
                const key = path ? path[path.length - 1] : null;
                if (key === parentKey) {
                    return {
                        ...node,
                        ...parentData,
                    };
                }

                return node;
            },
        });

        return appendOrReplace(changedTreeData, newNodes, append || replace);
    }

    let insertedTreeIndex = null;
    let hasBeenAdded = false;
    const changedTreeData = map({
        treeData,
        getNodeKey,
        ignoreCollapsed,
        callback: ({ node, treeIndex, path }: MapCallback<T>) => {
            const key = path ? path[path.length - 1] : null;
            // Return nodes that are not the parent as-is
            if (hasBeenAdded || key !== parentKey) {
                return node;
            }
            hasBeenAdded = true;

            const parentNode = {
                ...node,
                ...parentData,
            };

            if (expandParent) {
                parentNode.expanded = true;
            }

            // If no children exist yet, just add the single newNode
            if (!parentNode.children) {
                insertedTreeIndex = treeIndex + 1;
                return {
                    ...parentNode,
                    children: [...newNodes],
                };
            }

            if (typeof parentNode.children === "function") {
                throw new Error("Cannot add to children defined by a function");
            }

            const parentNodeChildren = parentNode.children;

            let nextTreeIndex = treeIndex + 1;
            for (let i = 0; i < parentNodeChildren.length; i += 1) {
                nextTreeIndex +=
                    1 +
                    getDescendantCount({
                        node: parentNodeChildren[i],
                        ignoreCollapsed,
                    });
            }

            insertedTreeIndex = nextTreeIndex;

            const children = appendOrReplace(
                parentNodeChildren,
                newNodes,
                append || replace,
            ).treeData;

            return {
                ...parentNode,
                children,
            };
        },
    });

    if (!hasBeenAdded) {
        throw new Error("No node found with the given key.");
    }

    return {
        treeData: changedTreeData,
        treeIndex: insertedTreeIndex,
    };
};
