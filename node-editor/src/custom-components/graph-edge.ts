// A declarative edge: React renders <graph-edge from="n1.out" to="n3.a" />.
// The element itself draws nothing (the host owns one shared SVG layer, so all
// edges share a coordinate space). It is hidden config — like <template> in the
// templated-table demo — that tells the host which paths to draw. It announces
// changes so the host can redraw.
//
// Imports nothing.

class GraphEdge extends HTMLElement {
    static observedAttributes = ['from', 'to'];

    connectedCallback() {
        this.notify();
    }

    disconnectedCallback() {
        this.notify();
    }

    attributeChangedCallback() {
        this.notify();
    }

    private notify() {
        this.dispatchEvent(new CustomEvent('edges-changed', { bubbles: true, composed: true }));
    }
}

if (!customElements.get('graph-edge')) {
    customElements.define('graph-edge', GraphEdge);
}

export { GraphEdge };
