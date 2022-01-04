import { DataNode, DefaultDataItem } from "../types";
import { PLACEHOLDER_TYPE } from "../variables";

export const isPlaceholder = <T extends DefaultDataItem>(node: DataNode<T>) => {
    return node.type === PLACEHOLDER_TYPE;
};
