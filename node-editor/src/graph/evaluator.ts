// Pure dataflow evaluation. React calls this whenever nodes/edges/values change
// and pushes the results back down to the nodes. No DOM, fully unit-testable.
import type { GraphNodeState, GraphEdgeState, PortRef } from './types';
import { NODE_TYPES } from './nodeTypes';

export interface EvalResult {
    /** nodeId -> resolved input port values. */
    inputs: Record<string, Record<string, number>>;
    /** nodeId -> computed output port values. */
    outputs: Record<string, Record<string, number>>;
    /** True if the graph contains a cycle (nodes in the cycle stay unevaluated). */
    hasCycle: boolean;
}

export function evaluate(nodes: GraphNodeState[], edges: GraphEdgeState[]): EvalResult {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const indeg = new Map<string, number>();
    const adj = new Map<string, string[]>();
    for (const n of nodes) {
        indeg.set(n.id, 0);
        adj.set(n.id, []);
    }
    for (const e of edges) {
        if (!byId.has(e.from.node) || !byId.has(e.to.node)) continue;
        adj.get(e.from.node)!.push(e.to.node);
        indeg.set(e.to.node, (indeg.get(e.to.node) ?? 0) + 1);
    }

    // Kahn topological sort.
    const queue = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
    const order: string[] = [];
    while (queue.length) {
        const id = queue.shift()!;
        order.push(id);
        for (const next of adj.get(id) ?? []) {
            const d = (indeg.get(next) ?? 0) - 1;
            indeg.set(next, d);
            if (d === 0) queue.push(next);
        }
    }

    const inputs: Record<string, Record<string, number>> = {};
    const outputs: Record<string, Record<string, number>> = {};
    for (const id of order) {
        const node = byId.get(id)!;
        const resolved: Record<string, number> = {};
        for (const e of edges) {
            if (e.to.node !== id) continue;
            const upstream = outputs[e.from.node]?.[e.from.port];
            if (upstream !== undefined) resolved[e.to.port] = upstream;
        }
        inputs[id] = resolved;
        outputs[id] = NODE_TYPES[node.type].compute(resolved, node.value);
    }

    return { inputs, outputs, hasCycle: order.length !== nodes.length };
}

/**
 * Would adding `from -> to` introduce a cycle? True if `from.node` is already
 * reachable from `to.node`. Used to reject illegal connections before commit.
 */
export function wouldCreateCycle(edges: GraphEdgeState[], from: PortRef, to: PortRef): boolean {
    if (from.node === to.node) return true;
    const adj = new Map<string, string[]>();
    for (const e of edges) {
        if (!adj.has(e.from.node)) adj.set(e.from.node, []);
        adj.get(e.from.node)!.push(e.to.node);
    }
    const stack = [to.node];
    const seen = new Set<string>();
    while (stack.length) {
        const cur = stack.pop()!;
        if (cur === from.node) return true;
        if (seen.has(cur)) continue;
        seen.add(cur);
        for (const next of adj.get(cur) ?? []) stack.push(next);
    }
    return false;
}
