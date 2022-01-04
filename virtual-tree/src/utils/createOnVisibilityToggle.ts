import { OnVisibilityToggleData } from "atroo-react-sortable-tree";
import { DataNode, DefaultDataItem, FetchNodes } from "../types";

export const createOnVisibilityToggle = <T extends DefaultDataItem>(
    fetchNodes: FetchNodes<T>,
) => {
    return async (data: OnVisibilityToggleData) => {
        if (!data.expanded) {
            return;
        }

        const node = data.node as DataNode<T>;

        /**
         * it is lazy initialization
         * add skeletons only once when tree is expanded first time and start fetching data for fist nodes
         * We need to start fetching manually because InfiniteLoader won't fire callback when tree is expanded.
         */
        const endIndex = Math.min(node.childrenCount - 1, 10);
        fetchNodes(
            { parentNode: node, startIndex: 0, endIndex },
            node.childrenCount,
            false,
            true,
        );
    };
};
