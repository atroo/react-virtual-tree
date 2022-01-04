import React from "react";
import { NodeRendererProps, TreeItem } from "atroo-react-sortable-tree";
import styles from "./NodeContentRenderer.module.scss";
import { isPlaceholder } from "../../../utils/isPlaceholder";
import { DataNode, DefaultDataItem, INodeRenderers } from "../../../types";

function isDescendant(older: TreeItem, younger: TreeItem): boolean {
    return (
        !!older.children &&
        typeof older.children !== "function" &&
        older.children.some(
            child => child === younger || isDescendant(child, younger),
        )
    );
}

export const createNodeContentRenderer = <T extends DefaultDataItem>(
    renderers?: INodeRenderers<T>,
) => {
    const renderSkeletons = renderers?.skeletons;
    const renderNode = renderers?.node;
    const NodeContentRenderer: React.FC<NodeRendererProps> = props => {
        const {
            scaffoldBlockPxWidth,
            toggleChildrenVisibility,
            connectDragPreview,
            connectDragSource,
            isDragging,
            canDrop,
            canDrag,
            node,
            title,
            draggedNode,
            path,
            treeIndex,
            isSearchMatch,
            isSearchFocus,
            icons = [],
            buttons = [],
            className,
            style,
            didDrop,
            lowerSiblingCounts,
            listIndex,
            swapFrom,
            swapLength,
            swapDepth,
            treeId, // Not needed, but preserved for other renderers
            isOver, // Not needed, but preserved for other renderers
            parentNode, // Needed for dndManager
            rowDirection,
            ...otherProps
        } = props;
        const nodeTitle = title || node.title;

        const isDraggedDescendant =
            draggedNode && isDescendant(draggedNode, node);
        const isLandingPadActive = isOver;

        // Construct the scaffold representing the structure of the tree
        const scaffold: JSX.Element[] = [];
        lowerSiblingCounts.forEach((_, i) => {
            scaffold.push(
                <div
                    key={`pre_${1 + i}`}
                    style={{ width: scaffoldBlockPxWidth }}
                    className={styles.lineBlock}
                />,
            );

            if (treeIndex !== listIndex && i === swapDepth) {
                // This row has been shifted, and is at the depth of
                // the line pointing to the new destination
                let highlightLineClass = "";

                if (
                    swapFrom !== undefined &&
                    swapLength !== undefined &&
                    listIndex === swapFrom + swapLength - 1
                ) {
                    // This block is on the bottom (target) line
                    // This block points at the target block (where the row will go when released)
                    highlightLineClass = styles.highlightBottomLeftCorner;
                } else if (treeIndex === swapFrom) {
                    // This block is on the top (source) line
                    highlightLineClass = styles.highlightTopLeftCorner;
                } else {
                    // This block is between the bottom and top
                    highlightLineClass = styles.highlightLineVertical;
                }

                scaffold.push(
                    <div
                        key={`highlight_${1 + i}`}
                        style={{
                            width: scaffoldBlockPxWidth,
                            left: scaffoldBlockPxWidth * i,
                        }}
                        className={`${styles.absoluteLineBlock} ${highlightLineClass}`}
                    />,
                );
            }
        });

        const expandButtonLeft =
            Math.round(
                (lowerSiblingCounts.length - 0.7) * scaffoldBlockPxWidth * 10,
            ) /
                10 -
            8.4;

        const expandNodeClassName = node.expanded
            ? styles.collapseButton
            : styles.expandButton;

        const expandButtonStyle: React.CSSProperties = {
            left: expandButtonLeft,
        };

        const onExpandButtonClick = toggleChildrenVisibility
            ? () =>
                  toggleChildrenVisibility({
                      node,
                      path,
                      treeIndex,
                  })
            : undefined;

        const rowWrapperClassName =
            styles.rowWrapper +
            (!canDrag ? ` ${styles.rowWrapperDragDisabled}` : "");

        const rowClassName =
            styles.row +
            (isLandingPadActive ? ` ${styles.rowLandingPad}` : "") +
            (isLandingPadActive && !canDrop ? ` ${styles.rowCancelPad}` : "") +
            (isSearchMatch ? ` ${styles.rowSearchMatch}` : "") +
            (isSearchFocus ? ` ${styles.rowSearchFocus}` : "") +
            (className ? ` ${className}` : "");

        const rowStyle: React.CSSProperties = {
            opacity: isDraggedDescendant ? 0.5 : 1,
            ...style,
        };

        const placeholder = isPlaceholder(node as DataNode<T>);

        const nTitle =
            typeof nodeTitle === "function"
                ? nodeTitle({
                      node,
                      path,
                      treeIndex,
                  })
                : nodeTitle;

        let nodeContent: JSX.Element;
        if (renderNode) {
            const p = parentNode as DataNode<T> | null;
            const n = node as DataNode<T>;
            nodeContent = renderNode({
                parentNode: p,
                node: n,
                expandButtonStyle,
                onExpandButtonClick,
                rowStyle,
                isPlaceholder: placeholder,
                nodeTitle: nTitle,
                buttons,
                icons,
                connectDragPreview,
                scaffold,
                canDrag,
                otherProps,
                defaultClassNames: {
                    rowWrapperClassName,
                    rowClassName,
                    expandNodeClassName,
                    expandIcon: styles.expandIcon,
                    "expandIcon--collapse": styles["expandIcon--collapse"],
                    rowContents: styles.rowContents,
                    rowToolbar: styles.rowToolbar,
                    toolbarButton: styles.toolbarButton,
                    rowLabel: styles.rowLabel,
                    rowTitle: styles.rowTitle,
                    childrenCount: styles.childrenCount,
                    rowContentsDragDisabled: styles.rowContentsDragDisabled,
                    folder: styles.folder,
                },
            });
        } else {
            nodeContent = (
                <div style={{ height: "100%" }} {...otherProps}>
                    {toggleChildrenVisibility && node.childrenCount ? (
                        <button
                            type="button"
                            aria-label={node.expanded ? "Collapse" : "Expand"}
                            className={expandNodeClassName}
                            style={expandButtonStyle}
                            onClick={onExpandButtonClick}
                        >
                            {node.expanded ? "Collapse" : "Expand"}
                        </button>
                    ) : null}
                    <div className={rowWrapperClassName}>
                        {/* Set the row preview to be used during drag and drop */}
                        {connectDragPreview(
                            <div style={{ display: "flex" }}>
                                {scaffold}
                                <div className={rowClassName} style={rowStyle}>
                                    <div
                                        className={
                                            styles.rowContents +
                                            (!canDrag
                                                ? ` ${styles.rowContentsDragDisabled}`
                                                : "")
                                        }
                                    >
                                        {placeholder && renderSkeletons ? (
                                            renderSkeletons(
                                                parentNode as DataNode<T> | null,
                                            )
                                        ) : (
                                            <div>
                                                <div
                                                    className={
                                                        styles.rowToolbar
                                                    }
                                                >
                                                    {icons.map(
                                                        (icon, index) => (
                                                            <div
                                                                key={index} // eslint-disable-line react/no-array-index-key
                                                                className={
                                                                    styles.toolbarButton
                                                                }
                                                            >
                                                                {icon}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                                <div
                                                    className={styles.rowLabel}
                                                >
                                                    <span
                                                        className={
                                                            styles.rowTitle
                                                        }
                                                    >
                                                        {nTitle}
                                                        {Boolean(
                                                            node.childrenCount,
                                                        ) && (
                                                            <span
                                                                className={
                                                                    styles.childrenCount
                                                                }
                                                            >
                                                                (
                                                                {
                                                                    node.childrenCount
                                                                }
                                                                )
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>

                                                <div
                                                    className={
                                                        styles.rowToolbar
                                                    }
                                                >
                                                    {buttons.map(
                                                        (btn, index) => (
                                                            <div
                                                                key={index} // eslint-disable-line react/no-array-index-key
                                                                className={
                                                                    styles.toolbarButton
                                                                }
                                                            >
                                                                {btn}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>,
                        )}
                    </div>
                </div>
            );
        }

        return canDrag
            ? connectDragSource(nodeContent, { dropEffect: "copy" })
            : nodeContent;
    };

    return NodeContentRenderer;
};
