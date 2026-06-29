// Draggable chrome around a node. It owns the live drag gesture (updating its
// own CSS transform per frame, React idle) and slots in React-rendered content:
//   slot="title"  -> the node label
//   slot="in"     -> input connectors (left)
//   slot="out"    -> output connectors (right)
//   default slot  -> the node body (editable value / computed result)
//
// Committed position arrives as the `x`/`y` attributes (React owns them); the
// element emits `node-moved` on drop and `node-dragging` each frame so the host
// can keep edges glued to the connectors while React sleeps.
//
// Imports nothing.

class GraphNode extends HTMLElement {
    static observedAttributes = ['x', 'y'];

    private dragging = false;
    private startX = 0;
    private startY = 0;
    private originX = 0;
    private originY = 0;
    private curX = 0;
    private curY = 0;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot!.innerHTML = `
            <style>
                :host { position: absolute; top: 0; left: 0; will-change: transform; }
                .node {
                    position: relative; min-width: 130px;
                    background: #1e1e24; border: 1px solid #3a3a44; border-radius: 8px;
                    color: #eee; font: 13px system-ui, sans-serif;
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
                }
                header {
                    cursor: grab; padding: 6px 10px; font-weight: 600; user-select: none;
                    background: #2a2a33; border-radius: 8px 8px 0 0;
                }
                header:active { cursor: grabbing; }
                .body { padding: 10px; }
                .ports { position: absolute; top: 34px; display: flex; flex-direction: column; gap: 10px; }
                .ports.in { left: -7px; align-items: flex-start; }
                .ports.out { right: -7px; align-items: flex-end; }
            </style>
            <div class="node">
                <header><slot name="title"></slot></header>
                <div class="ports in"><slot name="in"></slot></div>
                <div class="ports out"><slot name="out"></slot></div>
                <div class="body"><slot></slot></div>
            </div>
        `;
    }

    attributeChangedCallback(name: string, _old: string | null, value: string | null) {
        if (name === 'x') this.curX = Number(value) || 0;
        if (name === 'y') this.curY = Number(value) || 0;
        if (!this.dragging) this.applyTransform();
    }

    connectedCallback() {
        this.applyTransform();
        this.shadowRoot!.querySelector('header')!.addEventListener('pointerdown', this.onDown);
    }

    private applyTransform() {
        this.style.transform = `translate(${this.curX}px, ${this.curY}px)`;
    }

    private onDown = (e: PointerEvent) => {
        this.dragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.originX = this.curX;
        this.originY = this.curY;
        const header = e.currentTarget as HTMLElement;
        header.setPointerCapture(e.pointerId);
        header.addEventListener('pointermove', this.onMove);
        header.addEventListener('pointerup', this.onUp);
    };

    private onMove = (e: PointerEvent) => {
        if (!this.dragging) return;
        this.curX = this.originX + (e.clientX - this.startX);
        this.curY = this.originY + (e.clientY - this.startY);
        this.applyTransform(); // synchronous: connector rects are up to date
        // Ask the host to redraw connected edges this frame (React is idle).
        this.dispatchEvent(
            new CustomEvent('node-dragging', {
                bubbles: true,
                composed: true,
                detail: { node: this.getAttribute('node-id') },
            }),
        );
    };

    private onUp = (e: PointerEvent) => {
        if (!this.dragging) return;
        this.dragging = false;
        const header = e.currentTarget as HTMLElement;
        header.releasePointerCapture(e.pointerId);
        header.removeEventListener('pointermove', this.onMove);
        header.removeEventListener('pointerup', this.onUp);
        // Commit to React, which becomes the source of truth again.
        this.dispatchEvent(
            new CustomEvent('node-moved', {
                bubbles: true,
                composed: true,
                detail: { node: this.getAttribute('node-id'), x: this.curX, y: this.curY },
            }),
        );
    };
}

if (!customElements.get('graph-node')) {
    customElements.define('graph-node', GraphNode);
}

export { GraphNode };
