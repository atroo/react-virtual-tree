import { DataNode, PlaceholderNode } from "../../types";
import { PLACEHOLDER_TYPE } from "../../variables";

export const skeletonCannotHaveChildren = (
    node: DataNode<never> | PlaceholderNode,
) => {
    if (node.type === PLACEHOLDER_TYPE) {
        return false;
    }

    return true;
};
