// The registry of atomic functionalities. Each type declares its input/output
// ports and a pure `compute`. Adding a node type here is all it takes to extend
// the editor.
import type { NodeTypeName } from './types';

export interface NodeTypeDef {
    label: string;
    inputs: string[];
    outputs: string[];
    /** Shows an editable number field in the node body. */
    editable?: boolean;
    /** Pure function: resolved inputs (+ the node's own literal) -> outputs. */
    compute(inputs: Record<string, number>, value: number | undefined): Record<string, number>;
}

export const NODE_TYPES: Record<NodeTypeName, NodeTypeDef> = {
    number: {
        label: 'Number',
        inputs: [],
        outputs: ['out'],
        editable: true,
        compute: (_inputs, value) => ({ out: value ?? 0 }),
    },
    add: {
        label: 'Add',
        inputs: ['a', 'b'],
        outputs: ['sum'],
        compute: (i) => ({ sum: (i.a ?? 0) + (i.b ?? 0) }),
    },
    multiply: {
        label: 'Multiply',
        inputs: ['a', 'b'],
        outputs: ['product'],
        compute: (i) => ({ product: (i.a ?? 0) * (i.b ?? 0) }),
    },
    output: {
        label: 'Output',
        inputs: ['in'],
        outputs: [],
        compute: () => ({}),
    },
};
