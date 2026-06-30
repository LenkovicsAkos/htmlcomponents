// Type-only smoke test. Never executed — it exists so `npm run typecheck` fails
// the moment a component's runtime, its hand-written .d.ts, or its JSX
// augmentation drift apart. Resolves the package by its own name via the
// `exports` map (TypeScript self-reference), so it needs no build or publish.

import "@komfortmuhely/htmlcomponents/tooltip"; // registers <tool-tip> at runtime
import "@komfortmuhely/htmlcomponents/react"; // turns on <tool-tip> JSX typing

// DOM-API typing comes from the HTMLElementTagNameMap augmentation in
// tooltip.d.ts: querySelector("tool-tip") is typed as Tooltip, not Element.
const tip = document.querySelector("tool-tip");
tip?.show();
tip?.hide();
const trigger: HTMLElement | null | undefined = tip?.trigger;
void trigger; // assert the type above without tripping noUnusedLocals

// JSX typing comes from the IntrinsicElements augmentation in react.d.ts:
// the tag is known and `variant` is constrained to TooltipVariant.
export function Demo() {
    return (
        <span>
            hover me
            <tool-tip variant="top-left">helpful text</tool-tip>
        </span>
    );
}
