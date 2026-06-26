# Semantic dialog

- modal
- dialog
- window
- dropdown
- contextmenu
- popover
- popup
- tooltip

Arbitrary dialogs should be handled with `<dialog>`


| name        | interactivity | modality | dismissed by |
| ---         | --- | --- | --- |
| modal       | arbitrary content | backdrop | clicking backdrop or with callback |
| dialog      | information with set of predefined answers | backdrop | answer |
| window      | draggable, minimizable window | backdrop | \[X\] button |
| dropdown    | list of buttons (right click) | - | click on button or outside |
| contextmenu | list of buttons (left click) | - | click on button or outside |
| popover     | arbitrary form | - | clicking outside |
| popup       | arbitrary information | - | leaving |
| tooltip     | uninteractive | - | dismissed by cursor leaving the observed element |

------------------------------

## 1. Modal vs. Dialog (The Interaction Blocks)

```visualization
+-------------------------------------------------------------+

|  [Modal] (Arbitrary Content)                                |
|  +-------------------------------------+                    |
|  | [X] Close                           |                    |
|  | Title: Edit Profile                 |                    |
|  | [Input Field]                       |                    |
|  | [Save Changes]                      |                    |
|  +-------------------------------------+                    |
+-------------------------------------------------------------+

+-------------------------------------------------------------+

|  [Dialog] (Decision Matrix)                                 |
|  +-------------------------------------+                    |
|  |    Save changes?                    |                    |
|  |                                     |                    |
|  |                  [Cancel]  [Save]   |                    |
|  +-------------------------------------+                    |
+-------------------------------------------------------------+
```

- `<my-modal>` (The Content Container)
- Purpose: Houses arbitrary, complex UI surfaces (e.g., a massive profile settings form, a media gallery).
-- Behavior: Blocks the main screen page with a dark backdrop. It always includes an explicit "Close" or "X" button.
-- Under the hood: Renders using native `<dialog>` but styled as a large canvas.
- `<my-dialog>` (The Decision Trap)
- Purpose: Forces the user to make an explicit, narrow choice (e.g., "Confirm Delete", "Save Changes? Yes/No").
-- Behavior: Highly restrictive. It usually blocks clicking outside to close it.\
 The user must click one of the provided action buttons to make it go away.
-- Under the hood: Native `<dialog>` where the cancel event (ESC key) might be explicitly disabled if the decision is mandatory.

------------------------------

## 2. Popover vs. Popup (The Contextual Panels)

The difference here lies entirely in cursor-based behavior and persistence.

```visualization
    [Trigger Button]
           |
           v
+------------------------+      +------------------------+

| [Popover]              |      | [Popup]                |
| Text, Links, Buttons   |      | Pure text / previews   |
| (Stays until click-out)|      | (Vanishes on mouseout) |
+------------------------+      +------------------------+
```

- `<my-popover>` (The Persistent Utility)
- Purpose: Rich content panels tied to a trigger button (e.g., a mini color picker, a profile card with a "Follow" button, a date picker).
-- Behavior: Non-modal (no dark backdrop). It stays open if the user moves their mouse away.\
 It closes via light dismiss (clicking anywhere else on the screen) or pressing ESC.
-- Under the hood: Uses the native HTML popover attribute (popover="auto").
- `<my-popup>` (The Preview Glancer)
- Purpose: Hover-triggered content cards (e.g., hovering over a username to see their avatar and bio, hovering over a product to see a quick-view pane).
-- Behavior: Completely governed by the mouse. It opens on hover and instantly auto-dismisses when the\
 cursor leaves both the trigger element and the popup surface.
-- Under the hood: Programmed with JavaScript mouse listeners (mouseenter/mouseleave)\
 and structured delay timers so it doesn’t flicker shut accidentally.

------------------------------

## 3. Tooltip (The Static Label)

- Purpose: Purely informational text strings (e.g., hovering over a chart icon to see the text "View Analytics").
- Behavior: Zero interactivity. The user cannot move their cursor into a tooltip, click text inside it, or select its contents. It disappears the millisecond the cursor leaves the trigger.
- Under the hood: Enforces accessibility by automatically linking aria-describedby from the trigger to the tooltip ID.

------------------------------

## Matrix Architecture for Your Codebase

| Component Name | Has Backdrop? | Blocks Screen Interaction? | Dismiss Trigger | Contains Interactive Elements? |
| --- | --- | --- | --- | --- |
| Modal | Yes | Yes (Modal) | Close Button / Backdrop Click | Yes (Forms, lists, etc.) |
| Dialog | Yes | Yes (Strict Modal) | Explicit Action Buttons Only | Yes (Only choice buttons) |
| Popover | No | No (Non-modal) | Click Outside / Escape Key | Yes (Links, inputs, buttons) |
| Popup | No | No (Non-modal) | Mouse Leaving Area | Minimal (Mostly read-only) |
| Tooltip | No | No (Non-modal) | Mouse Leaving Trigger | No (Strictly text-only) |

Would you like to explore how to leverage the native browser popover attribute to build the <my-popover> component without needing heavy JavaScript positioning libraries?



Expanding your library to include Dropdowns, Context Menus, and a dedicated Window component is a fantastic direction. This addition completely clarifies the layout because you are separating transient overlays (which disappear automatically) from application surfaces (which behave like desktop software tools). [1, 2, 3] 
Here is how to integrate these new elements into your architectural matrix.
------------------------------
## 1. The Missing Link: <my-window> (The OS Surface)
Your original idea of a "window-like panel" should be extracted into its own distinct component, separate from the Popover. A popover is meant to be lightweight and fleeting; a window is a persistent workspace. [4, 5, 6] 

* Purpose: Emulates desktop operating system windows (e.g., a floating calculator, a detachable chat pane, an advanced code editor workbench).
* Behavior:
* No Light-Dismiss: Clicking outside does absolutely nothing.
   * Strict Control: It stays open until explicitly closed via an internal [X] action button.
   * Window Management: Includes dedicated state controls for minimizing to a taskbar, maximizing to fullscreen, and dragging via a header bar. [7] 
* Under the hood: Does not use the native popover attribute or a modal <dialog>. Instead, it uses a standard div placed in a global window-manager container, positioned absolutely or fixed, using custom pointer event listeners (pointerdown, pointermove) to handle smooth dragging. [8] 

------------------------------
## 2. Context Menus vs. Dropdowns vs. Popovers
These three all utilize the browser's native popover="auto" functionality for automatic stacking and "light-dismiss" behavior. However, their trigger mechanics and internal accessibility structures are entirely different. [9, 10, 11, 12, 13] 

+-------------------+      +-------------------------+      +--------------------------+

|   [Click Button]  |      |   [Right-Click Page]    |      |      [Input Field]       |
|         |         |      |            |            |      |            |             |
|         v         |      |            v            |      |            v             |
|   <my-dropdown>   |      |    <my-context-menu>    |      |       <my-popover>       |
|  +-------------+  |      |   +-----------------+   |      |  +--------------------+  |
|  | Profile     |  |      |   | Copy            |   |      |  | [Color Picker UI]  |  |
|  | Settings    |  |      |   | Paste           |   |      |  | [R] [G] [B]        |  |
|  | Logout      |  |      |   | Delete          |   |      |  +--------------------+  |
|  +-------------+  |      |   +-----------------+   |      +--------------------------+
+-------------------+      +-------------------------+


* <my-dropdown> (The Action Selector)
* Trigger: Left-click on a target button.
   * Internal Layout: A linear list of command items or links.
   * Behavior: Once an item is selected, the dropdown instantly executes the command and closes.
   * ARIA Role: Enforces role="menu" with items marked as role="menuitem". Keyboard navigation relies heavily on vertical ArrowUp and ArrowDown keys. [14, 15, 16, 17] 
* <my-context-menu> (The Pointer Trap)
* Trigger: Right-click (contextmenu event) anywhere inside a bound area.
   * Behavior: Overrides the native browser menu. It opens directly at the coordinate coordinates of the user's cursor (clientX, clientY) rather than anchoring to a specific element.
   * ARIA Role: Identical to the dropdown (role="menu"), but requires dynamic coordinates positioning logic upon opening. [18, 19] 
* <my-popover> (The Complex Utility Surface)
* Trigger: Left-click on a button or interactive field.
   * Internal Layout: Houses complex multi-dimensional interactive elements (e.g., date-picker grids, color sliders, tabs).
   * Behavior: Selecting an item or clicking inside does not close it. It remains open while the user interacts with its internal UI until they click completely outside the container. [20, 21, 22, 23, 24] 

------------------------------
## The Completed Architecture Matrix
Adding these definitions gives you a rock-solid, production-grade map for your entire library's overlay system:

| Component Name [25, 26, 27, 28, 29] | Trigger Mechanism | Light-Dismiss? (Click-out) | Closes on Internal Selection? | ARIA Role / Target Architecture |
|---|---|---|---|---|
| Modal | Programmatic / UI Button | Optional | No | Native <dialog> (Modal state) |
| Dialog | System Alert / Guard Rail | No | No (Requires explicit button click) | Native <dialog> (Strict modal state) |
| Window | Application Event / Toolbar | No | No (Persistent canvas) | role="region" / Absolute tracking |
| Popover | Left-Click Trigger | Yes | No (Stays open for interaction) | popover="auto" / Custom UI utility |
| Dropdown | Left-Click Trigger | Yes | Yes (Closes on selection) | popover="auto" + role="menu" |
| Context Menu | Right-Click Document | Yes | Yes (Closes on selection) | popover="auto" + role="menu" + Pointer coords |
| Popup | Mouse Hover Over Target | Yes (On mouseout) | No | Hover detection + Delayed timeout loop |
| Tooltip | Mouse Hover Over Target | Yes (On mouseout) | N/A (Uninteractive) | role="tooltip" + aria-describedby |

Posssible references:

- [1] [Dropdowns in Wordpress](https://www.youtube.com/watch?v=W_IuGhLj_ns)
- [2] [Gnome Glass Grid](https://extensions.gnome.org/review/45265)
- [3] [Popover UX](https://www.eleken.co/blog-posts/popover-ux)
- [4] [Dialogs vs Popovers](https://levelup.gitconnected.com/dialogs-vs-popovers-understanding-the-key-differences-8919d5be0fcc)
- [5] [Elastic UI popover](https://eui.elastic.co/docs/components/containers/popover/)
- [6] [Popup UX mistakes](https://popupsmart.com/blog/popup-ux-design)
- [8] [Popover API tutorial](https://webdesign.tutsplus.com/using-the-popover-api-native-modals-for-the-web--cms-107257t)
- [9] [Popover API introduction](https://developer.chrome.com/blog/introducing-popover-api)
- [10] [Popover - hint](https://developer.chrome.com/blog/popover-hint)
- [14] [Vaadin Popover](https://vaadin.com/api/platform/current/com/vaadin/flow/component/popover/Popover.html)
- [15] [W3C Menu button](https://www.w3.org/TR/2016/WD-wai-aria-practices-1.1-20161214/examples/menu-button/menu-button-1/menu-button-1.html)
- [16] [W3C WAI-ARIA best practices](https://www.w3.org/TR/2017/NOTE-wai-aria-practices-1.1-20171214/)
- [17] [Bootstrap Context Menu](https://dgoguerra.github.io/bootstrap-menu/demos.html)
- [18] [Dropdown Menus](https://terrillthompson.com/202)
- [24] [Accessible modal vs non-modal](https://www.makethingsaccessible.com/guides/modal-vs-non-modal-dialogs/)
