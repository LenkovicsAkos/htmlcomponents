// A single port. Inputs sit on a node's left, outputs on its right.
// Responsibilities: be the drag-start for outgoing connections, be the drop
// hit-target (resolved by the host via elementFromPoint), and report the exact
// screen position of its dot so the host can draw edges to it.
//
// Imports nothing — usable on a plain HTML page as much as inside React.

class GraphConnector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot!.innerHTML = `
            <style>
                :host { display: inline-flex; align-items: center; gap: 6px; cursor: crosshair; }
                :host([kind="out"]) { flex-direction: row-reverse; }
                .dot {
                    width: 12px; height: 12px; border-radius: 50%;
                    background: #6aa3ff; border: 2px solid #15151a; box-shadow: 0 0 0 1px #6aa3ff;
                }
                :host([kind="in"]) .dot { background: #f0a35e; box-shadow: 0 0 0 1px #f0a35e; }
                .label { font-size: 11px; color: #b9b9c6; }
            </style>
            <span class="dot"></span><span class="label"><slot></slot></span>
        `;
    }

    connectedCallback() {
        this.addEventListener('pointerdown', this.onPointerDown);
    }

    disconnectedCallback() {
        this.removeEventListener('pointerdown', this.onPointerDown);
    }

    /** Screen rect of the dot, used by the host to anchor edges precisely. */
    getDotRect(): DOMRect {
        return this.shadowRoot!.querySelector('.dot')!.getBoundingClientRect();
    }

    private onPointerDown = (e: PointerEvent) => {
        // Only outputs start a connection; inputs are drop targets only.
        if (this.getAttribute('kind') !== 'out') return;
        e.stopPropagation(); // don't let the node header start a drag
        e.preventDefault();
        const node = this.closest('graph-node')?.getAttribute('node-id') ?? null;
        if (node === null) return;
        this.dispatchEvent(
            new CustomEvent('connector-start', {
                bubbles: true,
                composed: true,
                detail: {
                    node,
                    port: this.getAttribute('name'),
                    pointerId: e.pointerId,
                    clientX: e.clientX,
                    clientY: e.clientY,
                },
            }),
        );
    };
}

if (!customElements.get('graph-connector')) {
    customElements.define('graph-connector', GraphConnector);
}

export { GraphConnector };
