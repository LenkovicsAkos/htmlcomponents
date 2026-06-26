# Custom HTML components

## Implemented

### live-form

`live-form` is a custom component that contains `<input>` and `<output>` elements
and based on the for attribute of outputs, this custom component automatically
recalculates the outputs.

## Ideas

### landmark components and unsorted components

- markdown renderer
- katex+markdown renderer
- alert
- tablist/tabpanels
- popover/hoverable
- clipboardable-textarea
- code-snippet // clippable
- file-dropzone
- json-form (auto-creates the form based on nesting of object in the json passed as text content, renders in the shadow dom)
- resize-handle / or resizable panels
- [dual-listbox (two lists, and elements can be moved from one list to the other)](#dual-listbox)
- proxy-placeholder (placeholder box)
- theme-toggle
- dropdown
- drawer



### visual with encapsulated state or UX behaviour

- badge // bordered visually outstanding surface with a single term on it.
- tag // badge with an X
- danger-button // click asks for confirmation and/or password
- other

### semantic dialog

- modal // arbitrary surface in overlay with backdrop
- dialog // modal-like with backdrop, user answers from a defined set of options (yes or no in it's default form)

- dropdown
- contextmenu

- popover // modal-like overlay without backdrop, draggable window-like panel
- popup // modal-like without backdrop, auto-dismissed when the cursor leaves the observed element, or the popup
- tooltip // uninteractive informational box that stays open for the duration of hovering over the observed element

Arbitrary dialogs should be handled with <dialog>


### tree components

- tree
- tree-view


### Dual listbox

- Encapsulated Logic: It manages complex internal states, such as tracking selected items, moving items between lists, and filtering.
- Reusable Layout: It bundles the required three-part layout (left list, middle buttons, right list) into a single, clean HTML tag.
- Event Mapping: You can emit clean, custom JavaScript events like onChange or itemMoved to the parent application.

- Keyboard Navigation: Users must be able to move between lists and transfer items using only the Tab, Arrow, and Enter/Space keys.
- Search Filters: Add a small input field above each list to filter long sets of data quickly.
- Drag and Drop: Allow users to visually drag items across panels as an alternative to clicking the arrow buttons.

## References

Other repos or libraries worth checking out

- [webawesome](https://webawesome.com/)
- [IBS's web components](https://carbondesignsystem.com//)
- [georapbox's custom elements (great list at the end)](https://github.com/georapbox/custom-elements)