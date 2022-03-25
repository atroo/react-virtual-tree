import React, { useContext, useEffect, useRef, useState } from "react";
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
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
global.process = require("process");

const loader = createLoader<DefaultDataItem>(loadNodes, makeNode);

const SelectedCtx = React.createContext<{
  selected: string;
  setSelected: (a: any) => void;
}>({
  selected: "",
  setSelected: () => {
    //nop
  },
});

const MyTreeNode = (props: IRenderNodeProps<DefaultDataItem>) => {
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

  const { selected, setSelected } = useContext(SelectedCtx);

  let FolderIconComponent = FolderIcon;
  if (node?.data?.shared) {
    FolderIconComponent = FolderSharedIcon;
  }

  return (
    <>
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
          <div
            style={{ display: "flex" }}
            onClick={() => {
              setSelected(node.id);
              console.log("console log my clickor", node);
            }}
          >
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
                        {nodeTitle} {node.id === selected ? "S" : ""}
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
    </>
  );
};

const renderNode = (props: IRenderNodeProps<DefaultDataItem>) => {
  const { onExpandButtonClick, node, otherProps } = props;
  return (
    <div style={{ height: "100%" }} {...otherProps}>
      <MyTreeNode {...props} />
    </div>
  );
};

export const ExampleVirtualTree: React.FC = () => {
  const [selected, setSelected] = useState<any>(undefined);
  const listRef = useRef<any>();
  const [selectionManager, setSelectionManger] = useState({
    selected,
    setSelected,
  });
  useEffect(() => {
    setSelectionManger({ selected, setSelected });
  }, [selected]);
  return (
    <SelectedCtx.Provider value={selectionManager}>
      <DndProvider backend={HTML5Backend}>
        <div style={{ flex: 1 }}>
          <VirtualTree
            listRef={listRef}
            rowHeight={({ node, index }) => {
              return index === 0 && node.expanded ? 80 : 40;
            }}
            withoutDefaultDragContext={true}
            url="hey"
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
            onTreeDataChange={() => {
              console.log("hallo", listRef);
              listRef.current?.wrappedInstance.current?.recomputeRowHeights(0);
            }}
          />
        </div>
      </DndProvider>
    </SelectedCtx.Provider>
  );
};
