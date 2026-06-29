// A framework-agnostic custom element.
//
// It imports NOTHING — that is the whole point: the component is usable on a
// plain HTML page with vanilla JS, and equally inside React. The React glue
// (JSX typing) lives next to it in `templated-table.d.ts`, so React never
// leaks into the component itself.
//
// Contract (same in HTML and in React):
//   <templated-table>            // receives `data` as a JS *property*
//     <thead>                    // declares the columns + expected shape
//       <tr><th data-value="name">Name</th></tr>
//     </thead>
//     <template>                 // the row blueprint
//       <tr><td data-value="name"></td></tr>
//     </template>
//   </templated-table>
//
//   el.data = [{ name: 'Ada' }]  // -> the body fills itself
//
// The head declares which key feeds each column via `data-value`. The template
// declares how one row looks; the component clones it per datum and writes
// `row[data-value]` into each matching cell.

type Row = Record<string, unknown>;

class TemplatedTable<T extends Row = Row> extends HTMLElement {
    private _data: T[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Shadow output. `slot { display: contents }` keeps native table layout
        // intact across the shadow boundary, so the slotted <thead>/<tbody>
        // behave as real table sections. Styling `table` here demonstrates that
        // shadow styles are encapsulated (they don't leak to the page).
        this.shadowRoot!.innerHTML = `
            <style>
                :host { display: block; }
                slot { display: contents; }
                table { border-collapse: collapse; width: 100%; }
            </style>
            <table><slot></slot></table>
        `;
    }

    get data(): T[] {
        return this._data;
    }

    set data(rows: T[]) {
        this._data = Array.isArray(rows) ? rows : [];
        this.render();
    }

    connectedCallback() {
        // On first connect the light-DOM children (<thead>/<template>) are
        // finally available, so render now even if `data` was set earlier.
        this.render();
    }

    private render() {
        // Skip while detached: React assigns the `data` property before it
        // appends children, so there is nothing to render yet. connectedCallback
        // re-runs render once the children exist.
        if (!this.isConnected) return;

        const body = this.body();
        body.replaceChildren();

        const blueprint = this.rowBlueprint();
        const keys = this.columnKeys();
        for (const row of this._data) {
            body.appendChild(this.buildRow(row, blueprint, keys));
        }
    }

    // The <tbody> the component owns and refills. Kept in light DOM so it is
    // projected through the shadow <slot> alongside the author's <thead>.
    private body(): HTMLTableSectionElement {
        let body = this.querySelector<HTMLTableSectionElement>(':scope > tbody[data-generated]');
        if (!body) {
            body = document.createElement('tbody');
            body.setAttribute('data-generated', '');
            this.appendChild(body);
        }
        return body;
    }

    // The row blueprint, tolerant of how the <template> got populated:
    //  - HTML parser puts children into `template.content` (standalone page)
    //  - React/script appendChild puts them as light children of <template>
    private rowBlueprint(): HTMLTableRowElement | null {
        const tpl = this.querySelector<HTMLTemplateElement>(':scope > template');
        if (!tpl) return null;
        return tpl.content.querySelector('tr') ?? tpl.querySelector('tr');
    }

    // Column keys declared by the head, in document order.
    private columnKeys(): string[] {
        return [...this.querySelectorAll<HTMLElement>(':scope > thead [data-value]')]
            .map((cell) => cell.dataset.value ?? '');
    }

    private buildRow(row: T, blueprint: HTMLTableRowElement | null, keys: string[]): Node {
        // Preferred path: clone the template row, fill each [data-value] cell.
        if (blueprint) {
            const tr = blueprint.cloneNode(true) as HTMLElement;
            tr.querySelectorAll<HTMLElement>('[data-value]').forEach((cell) => {
                cell.textContent = format(row[cell.dataset.value ?? '']);
            });
            return tr;
        }
        // Fallback when no <template> is given: build cells straight from the
        // head's declared keys, so the head alone is enough to drive the body.
        const tr = document.createElement('tr');
        for (const key of keys) {
            const td = document.createElement('td');
            td.textContent = format(row[key]);
            tr.appendChild(td);
        }
        return tr;
    }
}

function format(value: unknown): string {
    return value == null ? '' : String(value);
}

if (!customElements.get('templated-table')) {
    customElements.define('templated-table', TemplatedTable);
}

export { TemplatedTable };
