import React, { Children, cloneElement, isValidElement } from "react";
import { TreeRendererProps } from "atroo-react-sortable-tree";
import styles from "./TreeNodeRenderer.module.scss";

export const TreeNodeRenderer: React.FC<TreeRendererProps> = props => {
    const {
        children,
        listIndex,
        swapFrom,
        swapLength,
        swapDepth,
        scaffoldBlockPxWidth,
        lowerSiblingCounts,
        connectDropTarget,
        isOver,
        draggedNode,
        canDrop,
        treeIndex,
        treeId, // Delete from otherProps
        getPrevRow, // Delete from otherProps
        node, // Delete from otherProps
        path, // Delete from otherProps
        rowDirection,
        ...otherProps
    } = props;

    const mapChildren = (children: JSX.Element[] & React.ReactNode) => {
        return Children.map(children, child => {
            if (!isValidElement(child)) {
                return child;
            }

            return cloneElement(child, {
                isOver,
                canDrop,
                draggedNode,
                lowerSiblingCounts,
                listIndex,
                swapFrom,
                swapLength,
                swapDepth,
            });
        });
    };

    const nodeJsx = (
        <div key={node.id} {...otherProps} className={styles.node}>
            {mapChildren(children)}
        </div>
    );

    return connectDropTarget(nodeJsx);
};
