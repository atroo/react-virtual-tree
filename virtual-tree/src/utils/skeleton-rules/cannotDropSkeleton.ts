import {
    NodeData,
    OnDragPreviousAndNextLocation,
} from "atroo-react-sortable-tree";
import { DataNode, PlaceholderNode } from "../../types";
import { PLACEHOLDER_TYPE } from "../../variables";

export const cannotDropSkeleton = (
    data: OnDragPreviousAndNextLocation & NodeData,
) => {
    const node = data.node as DataNode<never> | PlaceholderNode;
    if (node.type === PLACEHOLDER_TYPE) {
        return false;
    }

    return true;
};
