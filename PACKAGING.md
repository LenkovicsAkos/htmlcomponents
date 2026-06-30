# Packaging components

This repo is **one npm package** (`@komfortmuhely/htmlcomponents`) with **one
subpath export per component**, installable straight from GitHub — no registry,
no build step:

```bash
npm install github:LenkovicsAkos/htmlcomponents#v0.1.0
```

```js
import "@komfortmuhely/htmlcomponents/tooltip";        // registers <tool-tip>
import "@komfortmuhely/htmlcomponents/react";          // TSX typing for the tags
```

The components are plain-JS ES modules with **hand-written `.d.ts`** beside them,
so they ship as-is and still type-check from TypeScript and TSX. Beasts the size
of `node-editor/` do **not** belong here — they get their own repo with a real
TS + Vite build (their `dependencies` and version cadence differ). See the chat
history / README for why.

`tooltip` is the worked template. To add a component, copy its four moving parts.

## Per-component checklist

For a component `foo` exposing `<foo-bar>`:

### 1. `src/foo.js` — the runtime (ES module)
- Lift the class out of the demo's inline `<script>`.
- `export` the class (enables `new`, subclassing, and typing).
- Self-register, guarded so a double import never throws:
  ```js
  export class FooBar extends HTMLElement { /* … */ }
  if (!customElements.get("foo-bar")) customElements.define("foo-bar", FooBar);
  ```
- Keep the component's doc comment at the top — this file is now the source of
  truth, not the HTML.

### 2. `src/foo.d.ts` — hand-written types
- Declare the class's **public** surface only (public methods/getters; private
  `#fields` stay out).
- Export any attribute value unions (e.g. `FooVariant`) so the React types can
  reuse them.
- Augment the DOM tag map so `querySelector("foo-bar")` is typed — this is what
  makes it "usable from TypeScript" outside JSX:
  ```ts
  export type FooVariant = "a" | "b";
  export declare class FooBar extends HTMLElement {
      get value(): string;
      open(): void;
  }
  declare global {
      interface HTMLElementTagNameMap { "foo-bar": FooBar; }
  }
  ```

### 3. Register it in `package.json` `exports`
Add a subpath with both conditions (order matters — `types` first):
```json
"./foo": { "types": "./src/foo.d.ts", "import": "./src/foo.js" }
```
Also re-export it from `src/index.js` **and** `src/index.d.ts` (`export * from
"./foo.js";`) so the `.` aggregate entry registers and types it too.

### 4. Add JSX typing in `src/react.d.ts`
Augment React's `IntrinsicElements` so `<foo-bar>` works in TSX. Reuse the
attribute unions from step 2:
```ts
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { FooBar, FooVariant } from "./foo.js";
declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "foo-bar": DetailedHTMLProps<HTMLAttributes<FooBar>, FooBar> & {
                variant?: FooVariant;
            };
        }
    }
}
```
`src/react.js` stays a one-line `export {};` — the value is entirely in the
`.d.ts`; importing the module activates the augmentation.

### 5. Repoint the demo
In `foo.html`, replace the inline `<script>…class…</script>` with:
```html
<script type="module" src="./src/foo.js"></script>
```
The demo markup is unchanged; it now loads the packaged module.

### 6. Extend the smoke test
Add a few lines to `fixtures/smoke.tsx` exercising the new tag (a DOM
`querySelector` call and a JSX element with a typed attribute). This is the
only thing guarding the hand-written `.d.ts` against drift — see below.

## Verifying

```bash
npm install        # one-time: pulls typescript + react types (devDeps only)
npm run typecheck  # tsc --noEmit over src/ + fixtures/ — must exit 0
```

`fixtures/smoke.tsx` resolves the package **by its own name** through the
`exports` map (TypeScript self-reference), so this works with no build and
nothing published. A green run proves three contracts at once: the class's
public API, the DOM tag-map augmentation, and the JSX augmentation.

Because nothing checks the `.js` against its hand-written `.d.ts` automatically,
the smoke test *is* the safety net — every component must touch it. (If hand
maintenance gets tedious, the escape hatch is JSDoc-typed JS with
`tsc --allowJs --declaration --emitDeclarationOnly` generating the `.d.ts`; that
reintroduces a small build but keeps types in lockstep.)

## Releasing

No build, no publish — consumers install from a git ref:

```bash
# bump "version" in package.json, then:
git tag v0.1.0
git push --tags
```

Consumers pin `#v0.1.0` (exact), `#semver:^0.1.0` (resolves against tags), or
`#main` (tracks the branch). Bump the version on every change consumers depend
on; that tag is the whole release mechanism.

## Consumer requirements (document these in README)

- **`moduleResolution` must be `bundler`, `node16`, or `nodenext`.** The
  per-subpath `types` conditions are invisible to the legacy `node` resolver —
  such consumers get no types for `.../tooltip`. (If you must support them, add
  a `typesVersions` fallback to `package.json`.)
- **For TSX**, import `@komfortmuhely/htmlcomponents/react` once anywhere in the
  app (or add it to tsconfig `types`). React is an *optional* peer dependency —
  the JSX `.d.ts` resolves `react` from the consumer's own `@types/react`, so
  non-React consumers install and pull in nothing extra.
- The JSX augmentation targets **React 18/19** (JSX under the `react` module).
  Other frameworks (Vue, Solid) would each need their own opt-in subpath
  (`./vue`, `./solid`) — still in this package, never a separate repo.
