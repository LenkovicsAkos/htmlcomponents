# Data driven web components

- json-form
- paginated-table

## Data driven component

The class exposes setters and getters for it's private driving data
and during render, the component writes it's shadow dom.

If data is huge, but immutable, `Object.freeze([...data])` makes it highly performant
because of javascript's internal workings and how it interacts with the DOM.
If data is expected to change rapidly, the render function should queueMicrotask
to only draw on browser paint cycles.

```js
class PaginatedTable extends HTMLElement {
  // 1. Initialize private memory storage
  #data = []; 
  #currentPage = 1;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // 2. The Public Setter: Captures incoming data via reference
  set rows(newArray) {
    if (!Array.isArray(newArray)) {
      console.error('Data must be an array.');
      return;
    }
    this.#data = newArray;
    this.#currentPage = 1; // Reset to page 1 on new data injection
    this.#render();        // Automatically trigger UI updates
  }

  // 3. The Public Getter: Allows external apps to read current state
  get rows() {
    return this.#data;
  }

  // 4. Internal Rendering Logic
  #render() {
    const itemsPerPage = 10;
    const start = (this.#currentPage - 1) * itemsPerPage;
    const activeRows = this.#data.slice(start, start + itemsPerPage);

    // Update shadow DOM with only the sliced segment
    this.shadowRoot.innerHTML = `
      <table>
        ${activeRows.map(row => `<tr><td>${row.name || ''}</td></tr>`).join('')}
      </table>
    `;
  }
}
customElements.define('paginated-table', PaginatedTable);


// Fetch a direct reference to your custom element
const tableEl = document.querySelector('paginated-table');

// Fetch the massive payload from an API
const hugeDataset = await fetch('/api/large-dataset').then(r => r.json());

// Wire the data straight into memory (Instantly triggers internal #render)
tableEl.rows = hugeDataset; 
```
