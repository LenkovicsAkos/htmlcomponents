// React JSX typing for the graph custom elements. Emits no runtime code, so the
// elements stay React-free. All inputs are attributes (strings/numbers), so this
// works regardless of React's custom-element property handling.
import 'react';

type HostProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'graph-host': HostProps;
            'graph-node': HostProps & {
                'node-id'?: string;
                x?: number | string;
                y?: number | string;
            };
            'graph-connector': HostProps & {
                name?: string;
                kind?: 'in' | 'out';
            };
            'graph-edge': HostProps & {
                from?: string;
                to?: string;
            };
        }
    }
}
