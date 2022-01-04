import { DataNode, DefaultDataItem } from "..";
import { LoadData, MakeNode, Loader } from "../types";

export const createLoader = <T extends DefaultDataItem>(
    loadData: LoadData<T>,
    makeNode: MakeNode<T>,
): Loader<T> => {
    return async (
        parent: DataNode<T> | null,
        startIndex: number,
        endIndex: number,
    ) => {
        const data = await loadData(parent, startIndex, endIndex);
        return data.map(d => {
            return makeNode(d);
        });
    };
};
