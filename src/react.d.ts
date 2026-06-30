// React JSX augmentation — opt-in via `import "@komfortmuhely/htmlcomponents/react"`.
// Kept out of the always-loaded types so non-React consumers never pull React's
// JSX namespace, and so this version-sensitive augmentation is only active where
// React actually exists. Targets React 18/19 (JSX lives under the `react` module).

import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { Tooltip, TooltipVariant } from "./tooltip.js";

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "tool-tip": DetailedHTMLProps<HTMLAttributes<Tooltip>, Tooltip> & {
                variant?: TooltipVariant;
            };
        }
    }
}
