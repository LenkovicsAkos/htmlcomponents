// Hand-written declarations for ./tooltip.js. Keep these in sync with the
// runtime by eye; fixtures/smoke.tsx + `npm run typecheck` guard against drift.

/** Which corner the tooltip opens into, reflected on the `variant` attribute. */
export type TooltipVariant =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

export declare class Tooltip extends HTMLElement {
    /** The element the tooltip describes and is positioned against (its parent). */
    get trigger(): HTMLElement | null;
    /** Show the tooltip and position it against the trigger. */
    show(): void;
    /** Hide the tooltip. */
    hide(): void;
}

declare global {
    interface HTMLElementTagNameMap {
        "tool-tip": Tooltip;
    }
}
