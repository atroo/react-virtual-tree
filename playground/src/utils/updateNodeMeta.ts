import { TreeItem } from "virtual-tree";

type Meta = Record<string, string | number | boolean | null>;

export const updateNodeMeta = (
  treeItem: TreeItem,
  updateFn: (old: Meta) => Meta
) => {
  if (!treeItem.meta) {
    treeItem.meta = {};
  }

  treeItem.meta = updateFn(treeItem.meta);
  return treeItem.meta;
};
