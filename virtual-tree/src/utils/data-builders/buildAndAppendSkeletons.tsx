import { DataNode, Job, PlaceholderNode } from "../../types";
import { PLACEHOLDER_SKELETON_TYPE, PLACEHOLDER_TYPE } from "../../variables";
import { findParentAndAppendNodes } from "../findParentAndAppendNodes";
import shortid from "shortid";
import { DefaultDataItem, Append } from "../..";
import React from "react";

export const buildAndAppendSkeletons = <T extends DefaultDataItem>(params: {
    parent: DataNode<T> | null;
    count: number;
    addJob: (job: Job<any>) => Promise<any>;
    setTreeData: React.Dispatch<React.SetStateAction<DataNode<T>[]>>;
    newNodesPromise?: Promise<DataNode<T>[]>;
    append: Append;
    parentData?: Partial<DataNode<T>>;
    skeletonRenderer?: () => React.ReactNode;
}) => {
    const {
        parent,
        count,
        addJob,
        setTreeData,
        newNodesPromise,
        append,
        parentData,
        skeletonRenderer,
    } = params;

    const skeletons = Array(count)
        .fill(null)
        .map(() => {
            const id = shortid.generate();
            return {
                type: PLACEHOLDER_TYPE,
                placeholderType: PLACEHOLDER_SKELETON_TYPE,
                title: skeletonRenderer
                    ? skeletonRenderer()
                    : `[skeleton...]: ${id}`,
                id,
                data: {
                    parent,
                },
            } as PlaceholderNode;
        });

    let newNodes: DataNode<T>[] | null = null;
    newNodesPromise?.then(n => {
        newNodes = n;
    });

    return addJob(() => {
        // skeletons are added asynchronously
        // and there's no need to add skeletons
        // if data are loaded at the time skeletons
        // CAN be added.
        if (newNodes) {
            return;
        }
        setTreeData(oldTree => {
            try {
                const parentId = parent ? parent.id : null;
                return findParentAndAppendNodes({
                    parentId,
                    treeData: oldTree,
                    nodesToAppend: skeletons,
                    append,
                    parentData,
                });
            } catch (err) {
                return oldTree;
            }
        });
    });
};
