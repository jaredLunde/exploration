import type { Branch } from "./branch";
export declare class Leaf<NodeData = {}> {
    parent: Branch<NodeData> | null;
    data: NodeData;
    readonly id: number;
    constructor(parent: Branch<NodeData> | null, data: NodeData);
    get depth(): number;
}
