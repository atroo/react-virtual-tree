import { DataNode, DefaultDataItem } from "virtual-tree";
import { makeData } from "./makeData";
import { makeNode } from "./makeNode";

export const loadNodes = async (
  parent: DataNode<any> | null,
  startIndex: number,
  endIndex: number
): Promise<DefaultDataItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = makeData(parent, startIndex, endIndex);
      resolve(data);
    }, 1500);
  });
};

export const syncLoadNodes = (
  parent: DataNode<any> | null,
  startIndex: number,
  endIndex: number
) => {
  const data = makeData(parent, startIndex, endIndex);
  return data.map((d) => {
    return makeNode(d);
  });
};
