import { useEffect, useState } from "react";
import { OnDragStateChangedData, walk } from "atroo-react-sortable-tree";
import { DefaultDataItem } from "..";
import { DataNode, OnDraggedFinished, WalkCallback } from "../types";
import { getNodeKey } from "../utils/getNodeKey";

export const useOnDragFinished = <T extends DefaultDataItem>(
    treeData: DataNode<T>[],
    onDragFinished?: OnDraggedFinished<T>,
) => {
    const [draggedNode, setDraggedNode] = useState<DataNode<T> | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [oldData, setOldData] = useState<{
        parentNode: DataNode<T>;
        path: Array<string | number>;
    } | null>(null);

    useEffect(() => {
        if (!onDragFinished || !isDragging || !draggedNode) {
            return;
        }

        const walkCallback: WalkCallback<T> = info => {
            const { node, parentNode, path } = info;
            if (node.id !== draggedNode.id) {
                return;
            }

            setOldData({ parentNode, path });
            return false;
        };
        walk({
            treeData,
            getNodeKey,
            callback: walkCallback,
            ignoreCollapsed: false,
        });
    }, [isDragging, draggedNode]);

    useEffect(() => {
        if (isDragging || !draggedNode || !onDragFinished) {
            return;
        }

        const walkCallback: WalkCallback<T> = info => {
            const { node, parentNode, path } = info;
            if (node.id !== draggedNode.id) {
                return;
            }

            if (!oldData) {
                console.error("oldParentNode is not found");
                return false;
            }
            onDragFinished({
                parentNode,
                node,
                path,
                oldParentNode: oldData.parentNode,
                oldPath: oldData.path,
                treeData,
            });
            return false;
        };

        walk({
            treeData,
            getNodeKey,
            callback: walkCallback,
            ignoreCollapsed: false,
        });
        setDraggedNode(null);
        setOldData(null);
    }, [treeData, isDragging, draggedNode]);

    const onDragStateChanged = ({
        isDragging,
        draggedNode,
    }: OnDragStateChangedData) => {
        if (!onDragFinished) {
            return;
        }

        if (draggedNode) {
            setDraggedNode(draggedNode as DataNode<T>);
        }
        setIsDragging(isDragging);
    };

    return onDragStateChanged;
};
