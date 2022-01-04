import { GetNodeKeyFunction } from "atroo-react-sortable-tree";

export const getNodeKey: GetNodeKeyFunction = ({ node }) => {
    return node.id;
};
