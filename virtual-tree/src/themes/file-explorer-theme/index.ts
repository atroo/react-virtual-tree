import { DefaultDataItem, INodeRenderers } from "../..";
import { createNodeContentRenderer } from "./node-content-renderer/NodeContentRenderer";
import { TreeNodeRenderer } from "./tree-node-renderer/TreeNodeRenderer";

export const createFileExplorerTheme = <T extends DefaultDataItem>(
    renderers?: INodeRenderers<T>,
) => {
    return {
        nodeContentRenderer: createNodeContentRenderer(renderers),
        treeNodeRenderer: TreeNodeRenderer,
        scaffoldBlockPxWidth: 25,
        rowHeight: 25,
        slideRegionSize: 50,
    };
};
