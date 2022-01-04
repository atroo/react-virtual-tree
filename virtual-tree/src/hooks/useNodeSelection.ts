import React, { useEffect, useState } from "react";
import { ExtendedNodeData } from "atroo-react-sortable-tree";
import { DefaultDataItem } from "..";
import { DataNode, OnNodeSelected } from "../types";
import { PLACEHOLDER_TYPE } from "../variables";

export const useNodeSelection = <T extends DefaultDataItem>(
    onNodeSelected?: OnNodeSelected<T>,
) => {
    const [selectedNode, setSelectedNode] = useState<DataNode<never> | null>(
        null,
    );

    useEffect(() => {
        if (onNodeSelected) {
            onNodeSelected(selectedNode);
        }
    }, [selectedNode]);

    const generateNodeProps = (data: ExtendedNodeData) => {
        return {
            onClick: (e: React.SyntheticEvent<HTMLElement, MouseEvent>) => {
                if ((e.target as HTMLElement).closest('[type="button"]')) {
                    return;
                }

                if (data.node.type === PLACEHOLDER_TYPE) {
                    return;
                }

                const node = data.node as DataNode<never>;
                if (selectedNode && node.id === selectedNode.id) {
                    setSelectedNode(null);
                } else {
                    setSelectedNode(node);
                }
            },
            selected: data.node.id === selectedNode?.id,
        };
    };

    return { generateNodeProps };
};
