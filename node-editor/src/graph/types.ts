// Shared graph types. React owns all of this state; the custom elements only
// render it and report interactions back.

export type NodeTypeName = 'number' | 'add' | 'multiply' | 'output';

export interface GraphNodeState {
    id: string;
    type: NodeTypeName;
    x: number;
    y: number;
    /** Editable literal for `number` nodes; undefined for computed nodes. */
    value?: number;
}

export interface PortRef {
    node: string;
    port: string;
}

export interface GraphEdgeState {
    id: string;
    /** An output port. */
    from: PortRef;
    /** An input port. */
    to: PortRef;
}
