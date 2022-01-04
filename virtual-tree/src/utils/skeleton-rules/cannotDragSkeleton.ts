import { RefObject } from "react";
import { ExtendedNodeData } from "atroo-react-sortable-tree";
import { DataNode, PlaceholderNode } from "../../types";
import { PLACEHOLDER_TYPE } from "../../variables";

export const createCannotDragSkeleton = (
    dragForbiddenRef: RefObject<boolean>,
) => {
    return (data: ExtendedNodeData) => {
        if (dragForbiddenRef.current) {
            return false;
        }

        const node = data.node as DataNode<never> | PlaceholderNode;
        if (node.type === PLACEHOLDER_TYPE) {
            return false;
        }

        return true;
    };
};
