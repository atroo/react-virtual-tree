import { DataNode, DefaultDataItem } from "virtual-tree";
import { makeData } from "./makeData";

export const makeNode = (
  data: ReturnType<typeof makeData>[0]
): DataNode<DefaultDataItem> => {
  const node: DataNode<DefaultDataItem> = {
    id: data.media_id,
    title: data.title,
    data,
    childrenCount: data.countByAssetType.collection,
  };

  return node;
};
