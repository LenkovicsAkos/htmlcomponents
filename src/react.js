// Opt-in JSX typing entry point. There is no runtime behaviour here — the value
// of this module lives entirely in its sibling react.d.ts, which augments
// React's JSX.IntrinsicElements so <tool-tip> (and friends) type-check in TSX.
//
//   import "@komfortmuhely/htmlcomponents/react";
//
// Importing the module pulls that ambient augmentation into your program.
export {};
