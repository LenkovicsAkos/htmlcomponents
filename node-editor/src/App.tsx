import { useEffect, useMemo, useRef, useState } from 'react'
import './custom-components/graph-host'
import './custom-components/graph-node'
import './custom-components/graph-connector'
import './custom-components/graph-edge'
import { NODE_TYPES } from './graph/nodeTypes'
import { evaluate, wouldCreateCycle, type EvalResult } from './graph/evaluator'
import type { GraphNodeState, GraphEdgeState, NodeTypeName, PortRef } from './graph/types'
import './App.css'

const idNum = (id: string) => Number(id.replace(/\D/g, '')) || 0

function App() {
  // React is the single source of truth for the whole graph.
  const [nodes, setNodes] = useState<GraphNodeState[]>([
    { id: 'n1', type: 'number', x: 40, y: 60, value: 2 },
    { id: 'n2', type: 'number', x: 40, y: 220, value: 3 },
    { id: 'n3', type: 'add', x: 300, y: 130 },
    { id: 'n4', type: 'output', x: 560, y: 150 },
  ])
  const [edges, setEdges] = useState<GraphEdgeState[]>([
    { id: 'e1', from: { node: 'n1', port: 'out' }, to: { node: 'n3', port: 'a' } },
    { id: 'e2', from: { node: 'n2', port: 'out' }, to: { node: 'n3', port: 'b' } },
    { id: 'e3', from: { node: 'n3', port: 'sum' }, to: { node: 'n4', port: 'in' } },
  ])

  // Monotonic id source. Generated in event handlers (which run once), NEVER
  // inside a setState updater — StrictMode double-invokes updaters in dev, and
  // an impure updater would mint duplicate/colliding ids. Seeded past the seed
  // graph so the first new node can't collide with an existing id.
  const idCounter = useRef(
    Math.max(0, ...nodes.map((n) => idNum(n.id)), ...edges.map((e) => idNum(e.id))),
  )
  const uid = (prefix: string) => `${prefix}${++idCounter.current}`

  // The whole point of "React owns the data": evaluation runs here, in React.
  const result = useMemo(() => evaluate(nodes, edges), [nodes, edges])

  // The web components report interactions via DOM CustomEvents; React listens
  // imperatively and commits to state. This is the entire WC -> React boundary.
  const hostRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const onMoved = (e: Event) => {
      const { node, x, y } = (e as CustomEvent).detail
      setNodes((prev) => prev.map((n) => (n.id === node ? { ...n, x, y } : n)))
    }
    const onConnected = (e: Event) => {
      const { from, to } = (e as CustomEvent).detail as { from: PortRef; to: PortRef }
      const id = uid('e') // minted once, in the handler — not in the updater
      setEdges((prev) => {
        if (wouldCreateCycle(prev, from, to)) return prev // reject cycles
        // An input takes a single source: drop any existing edge into it.
        const kept = prev.filter((ed) => !(ed.to.node === to.node && ed.to.port === to.port))
        return [...kept, { id, from, to }]
      })
    }

    host.addEventListener('node-moved', onMoved)
    host.addEventListener('edge-connected', onConnected)
    return () => {
      host.removeEventListener('node-moved', onMoved)
      host.removeEventListener('edge-connected', onConnected)
    }
  }, [])

  const addNode = (type: NodeTypeName) => {
    const id = uid('n') // minted once, in the handler — not in the updater
    const stagger = (idCounter.current % 8) * 26 // fan new nodes out instead of stacking
    setNodes((prev) => [
      ...prev,
      { id, type, x: 40 + stagger, y: 40 + stagger, value: type === 'number' ? 0 : undefined },
    ])
  }

  const setValue = (id: string, value: number) =>
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, value } : n)))

  return (
    <div className="graph-demo">
      <div className="toolbar">
        <span>Add node:</span>
        {(Object.keys(NODE_TYPES) as NodeTypeName[]).map((t) => (
          <button key={t} onClick={() => addNode(t)}>
            + {NODE_TYPES[t].label}
          </button>
        ))}
        <span className="hint">Drag headers to move · drag an output dot onto an input dot to connect</span>
      </div>

      <div className="canvas">
        <graph-host ref={hostRef}>
          {nodes.map((n) => {
            const def = NODE_TYPES[n.type]
            return (
              <graph-node key={n.id} node-id={n.id} x={n.x} y={n.y}>
                <span slot="title">{def.label}</span>
                {def.inputs.map((p) => (
                  <graph-connector key={p} slot="in" name={p} kind="in">
                    {p}
                  </graph-connector>
                ))}
                {def.outputs.map((p) => (
                  <graph-connector key={p} slot="out" name={p} kind="out">
                    {p}
                  </graph-connector>
                ))}
                <NodeBody node={n} result={result} onValue={(v) => setValue(n.id, v)} />
              </graph-node>
            )
          })}
          {edges.map((e) => (
            <graph-edge
              key={e.id}
              from={`${e.from.node}.${e.from.port}`}
              to={`${e.to.node}.${e.to.port}`}
            />
          ))}
        </graph-host>
      </div>
    </div>
  )
}

function NodeBody({
  node,
  result,
  onValue,
}: {
  node: GraphNodeState
  result: EvalResult
  onValue: (value: number) => void
}) {
  const def = NODE_TYPES[node.type]

  if (def.editable) {
    return (
      <input
        type="number"
        value={node.value ?? 0}
        onChange={(e) => onValue(Number(e.target.value))}
      />
    )
  }

  if (node.type === 'output') {
    const v = result.inputs[node.id]?.in
    return <strong className="value">{v ?? '—'}</strong>
  }

  const out = result.outputs[node.id]
  const v = out ? Object.values(out)[0] : undefined
  return <span className="value">= {v ?? '—'}</span>
}

export default App
