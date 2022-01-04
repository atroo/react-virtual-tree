import namor from "namor";
import shortid from "shortid";
import { DataNode, DefaultDataItem } from "virtual-tree";

export const makeData = (
  parent: DataNode<any> | null,
  startIndex: number,
  endIndex: number
): DefaultDataItem[] => {
  const length = endIndex - startIndex + 1;
  return new Array(length).fill(null).map(() => {
    const id = `id${shortid.generate()}`;
    return {
      parent,
      title: namor.generate({ words: 1, numbers: 0 }),
      ownerLoginName: namor.generate({ words: 1, numbers: 0 }),
      owner: "testOwner",
      shared: Boolean(Math.round(Math.random())),
      sharedWith: {
        id: 0,
        rights: "",
        type: "",
      },
      media_type: "document",
      created: Date.now(),
      document_id: id,
      media_id: id,
      countByAssetType: {
        collection: 1 + Math.round(Math.random() * 10),
        picture: 0,
        article: 0,
        page: 0,
      },
    };
  });
};
