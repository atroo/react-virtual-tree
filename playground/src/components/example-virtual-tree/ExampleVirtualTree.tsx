import React from "react";
import {
  DefaultDataItem,
  createLoader,
  VirtualTree,
  IRenderNodeProps,
} from "virtual-tree";
import { loadNodes } from "../../build-data-utils/loadNodes";
import { makeNode } from "../../build-data-utils/makeNode";
import "virtual-tree/dist/index.css";
import clsx from "clsx";
import FolderIcon from "@material-ui/icons/Folder";
import FolderSharedIcon from "@material-ui/icons/FolderShared";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

const loader = createLoader<DefaultDataItem>(loadNodes, makeNode);

const renderNode = (props: IRenderNodeProps<DefaultDataItem>) => {
  const {
    onExpandButtonClick,
    node,
    otherProps,
    expandButtonStyle,
    connectDragPreview,
    scaffold,
    isPlaceholder,
    rowStyle,
    icons,
    buttons,
    nodeTitle,
    canDrag,
    defaultClassNames,
  } = props;

  let FolderIconComponent = FolderIcon;
  if (node?.data?.shared) {
    FolderIconComponent = FolderSharedIcon;
  }

  return (
    <div style={{ height: "100%" }} {...otherProps}>
      {onExpandButtonClick && node.childrenCount ? (
        <button
          type="button"
          aria-label={node.expanded ? "Collapse" : "Expand"}
          className={defaultClassNames.expandNodeClassName}
          style={expandButtonStyle}
          onClick={onExpandButtonClick}
        >
          <ChevronRightIcon
            className={clsx(
              defaultClassNames.expandIcon,
              node.expanded && defaultClassNames["expandIcon--collapse"]
            )}
          />
        </button>
      ) : null}
      <div className={defaultClassNames.rowWrapperClassName}>
        {/* Set the row preview to be used during drag and drop */}
        {connectDragPreview(
          <div style={{ display: "flex" }}>
            {scaffold}
            {isPlaceholder && (
              <FolderIconComponent className={defaultClassNames.folder} />
            )}
            <div className={defaultClassNames.rowClassName} style={rowStyle}>
              <div
                className={
                  defaultClassNames.rowContents +
                  (!canDrag
                    ? ` ${defaultClassNames.rowContentsDragDisabled}`
                    : "")
                }
              >
                {isPlaceholder ? (
                  <div>
                    <b>Skeleton</b>
                  </div>
                ) : (
                  <div>
                    <div className={defaultClassNames.rowToolbar}>
                      {icons.map((icon, index) => (
                        <div
                          key={index} // eslint-disable-line react/no-array-index-key
                          className={defaultClassNames.toolbarButton}
                        >
                          {icon}
                        </div>
                      ))}
                    </div>
                    <div className={defaultClassNames.rowLabel}>
                      <span className={defaultClassNames.rowTitle}>
                        {nodeTitle}
                        {Boolean(node.childrenCount) && (
                          <span className={defaultClassNames.childrenCount}>
                            ({node.childrenCount})
                          </span>
                        )}
                      </span>
                    </div>

                    <div className={defaultClassNames.rowToolbar}>
                      {buttons.map((btn, index) => (
                        <div
                          key={index} // eslint-disable-line react/no-array-index-key
                          className={defaultClassNames.toolbarButton}
                        >
                          {btn}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ExampleVirtualTree: React.FC = () => {
  return (
    <div style={{ flex: 1 }}>
      <VirtualTree
        url="hey"
        onNodeSelected={(node) => console.log("Selected node: ", node)}
        onDraggedFinished={(info) => {
          console.log("info", info);
        }}
        canDragInterceptor={(data) => {
          return data.treeIndex !== 0;
        }}
        canDropInterceptor={({ treeIndex, nextPath, nextParent }) => {
          console.log("nodrop", nextParent.treeIndex !== 1);
          return nextParent.treeIndex !== 1;
        }}
        loader={loader}
        renderers={{
          node: renderNode,
        }}
      />
    </div>
  );
};
