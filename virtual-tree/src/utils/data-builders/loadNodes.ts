import axios from "axios";
import { DataNode } from "../..";
import { DefaultDataItem } from "../../types";

export const createLoadNodes = <T extends DefaultDataItem>(url: string) => {
    return async (
        parent: DataNode<T> | null,
        startIndex: number,
        endIndex: number,
    ): Promise<DefaultDataItem[]> => {
        const resp = await axios.get(url, {
            params: {
                parent,
                startIndex,
                endIndex,
            },
        });
        return resp.data;
    };
};
