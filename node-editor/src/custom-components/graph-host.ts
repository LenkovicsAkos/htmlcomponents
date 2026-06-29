// The coordinator. Owns the single SVG edge layer and:
//  - draws every <graph-edge> by resolving its endpoints to connector positions
//  - redraws edges live during node drags (React idle) and on structural change
//  - runs the connect gesture: drag from an output, drop on an input, then emit
//    `edge-connected` for React to validate and commit
//
// Imports nothing.

const SVGNS = 'http://www.w3.org/2000/svg';

interface Point {
    x: number;
    y: number;
}

interface Pending {
    from: { node: string; port: string };
    pointerId: number;
    temp: SVGPathElement;
}

class GraphHost extends HTMLElement {
    private svg!: SVGSVGElement;
    private observer?: MutationObserver;
    private raf = 0;
    private pending: Pending | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot!.innerHTML = `
            <style>
                :host { position: relative; display: block; width: 100%; height: 100%; overflow: hidden; background: #15151a; }
                svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
                path { fill: none; stroke: #6aa3ff; stroke-width: 2; }
                path.temp { stroke-dasharray: 5 4; opacity: 0.8; }
                ::slotted(graph-edge) { display: none; }
            </style>
            <svg></svg>
            <slot></slot>
        `;
        this.svg = this.shadowRoot!.querySelector('svg')!;
    }

    connectedCallback() {
        // Any structural change React makes (add/remove node or edge, commit a
        // move via x/y) triggers a redraw.
        this.observer = new MutationObserver(this.scheduleRedraw);
        this.observer.observe(this, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['x', 'y', 'from', 'to', 'node-id', 'name', 'kind'],
        });
        this.addEventListener('node-dragging', this.scheduleRedraw);
        this.addEventListener('edges-changed', this.scheduleRedraw);
        this.addEventListener('connector-start', this.onConnectorStart);
        this.scheduleRedraw();
    }

    disconnectedCallback() {
        this.observer?.disconnect();
        this.removeEventListener('node-dragging', this.scheduleRedraw);
        this.removeEventListener('edges-changed', this.scheduleRedraw);
        this.removeEventListener('connector-start', this.onConnectorStart);
    }

    private scheduleRedraw = () => {
        if (this.raf) return;
        this.raf = requestAnimationFrame(() => {
            this.raf = 0;
            this.redraw();
        });
    };

    private redraw() {
        // Rebuild persistent paths (few edges; clearing each frame is cheap).
        // The in-flight temp path is left untouched.
        this.svg.querySelectorAll('path:not(.temp)').forEach((p) => p.remove());
        for (const edge of this.querySelectorAll('graph-edge')) {
            const from = this.anchor(edge.getAttribute('from'), 'out');
            const to = this.anchor(edge.getAttribute('to'), 'in');
            if (!from || !to) continue;
            const path = document.createElementNS(SVGNS, 'path');
            path.setAttribute('d', curve(from, to));
            this.svg.appendChild(path);
        }
    }

    // Resolve "nodeId.portName" to the centre of the matching connector's dot,
    // in host-local coordinates (the SVG's coordinate space).
    private anchor(ref: string | null, kind: 'in' | 'out'): Point | null {
        if (!ref) return null;
        const dot = ref.indexOf('.');
        if (dot < 0) return null;
        const node = ref.slice(0, dot);
        const port = ref.slice(dot + 1);
        const connector = this.querySelector(
            `graph-node[node-id="${node}"] graph-connector[name="${port}"][kind="${kind}"]`,
        ) as { getDotRect(): DOMRect } | null;
        if (!connector) return null;
        const r = connector.getDotRect();
        const h = this.getBoundingClientRect();
        return { x: r.left - h.left + r.width / 2, y: r.top - h.top + r.height / 2 };
    }

    private toLocal(clientX: number, clientY: number): Point {
        const h = this.getBoundingClientRect();
        return { x: clientX - h.left, y: clientY - h.top };
    }

    private onConnectorStart = (e: Event) => {
        const { node, port, pointerId, clientX, clientY } = (e as CustomEvent).detail;
        const start = this.anchor(`${node}.${port}`, 'out');
        if (!start) return;
        const temp = document.createElementNS(SVGNS, 'path');
        temp.classList.add('temp');
        temp.setAttribute('d', curve(start, this.toLocal(clientX, clientY)));
        this.svg.appendChild(temp);
        this.pending = { from: { node, port }, pointerId, temp };
        this.setPointerCapture(pointerId);
        this.addEventListener('pointermove', this.onConnectMove);
        this.addEventListener('pointerup', this.onConnectUp);
    };

    private onConnectMove = (e: PointerEvent) => {
        if (!this.pending) return;
        const start = this.anchor(`${this.pending.from.node}.${this.pending.from.port}`, 'out');
        if (start) this.pending.temp.setAttribute('d', curve(start, this.toLocal(e.clientX, e.clientY)));
    };

    private onConnectUp = (e: PointerEvent) => {
        if (!this.pending) return;
        const { from, pointerId, temp } = this.pending;
        this.pending = null;
        temp.remove();
        this.releasePointerCapture(pointerId);
        this.removeEventListener('pointermove', this.onConnectMove);
        this.removeEventListener('pointerup', this.onConnectUp);

        // elementFromPoint retargets to the connector (it lives in the document
        // light tree), so closest() finds it.
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('graph-connector');
        if (!target || target.getAttribute('kind') !== 'in') return;
        const toNode = target.closest('graph-node')?.getAttribute('node-id');
        const toPort = target.getAttribute('name');
        if (!toNode || !toPort || toNode === from.node) return;
        this.dispatchEvent(
            new CustomEvent('edge-connected', {
                bubbles: true,
                composed: true,
                detail: { from, to: { node: toNode, port: toPort } },
            }),
        );
    };
}

function curve(a: Point, b: Point): string {
    const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5);
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

if (!customElements.get('graph-host')) {
    customElements.define('graph-host', GraphHost);
}

export { GraphHost };
