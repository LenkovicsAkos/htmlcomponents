// React-only glue for <templated-table>. This file emits no runtime code, so
// the component itself stays free of any React dependency.
//
// NOTE: the basename intentionally differs from `templated-table.ts`. A
// `templated-table.d.ts` would be treated by TypeScript as the declaration file
// *for* the `.ts` and ignored, dropping this augmentation.
//
// React 19 moved the JSX namespace into the `react` module (it is no longer the
// global `JSX`), so intrinsic elements are augmented via `declare module 'react'`.
// We add `data` as a prop: because an array is not a primitive, React 19 assigns
// it as a JS *property* (`el.data = [...]`) rather than a string attribute, which
// is exactly what the component's `set data()` setter expects.
import 'react';

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'templated-table': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            > & {
                data?: readonly Record<string, unknown>[];
            };
        }
    }
}
