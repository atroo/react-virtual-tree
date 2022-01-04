import { DataNode, DefaultDataItem } from "../../types";

export const makeDefaultDataNode = (
    data: DefaultDataItem,
): DataNode<DefaultDataItem> => {
    const node: DataNode<DefaultDataItem> = {
        data: data,
        id: data.media_id,
        title: data.title,
        childrenCount: data.countByAssetType.collection,
    };

    return node;
};
