// Minimal JSX runtime that produces satori-compatible vdom nodes.
// satori expects { type: string, props: { ...props, children } }

export function jsx(type: string, props: Record<string, any>): any {
  const { children, ...rest } = props;
  return { type, props: { ...rest, children } };
}

export function jsxs(type: string, props: Record<string, any>): any {
  return jsx(type, props);
}

export const Fragment = ({ children }: { children?: any }) => children;

export namespace JSX {
  export type Element = any;
  export interface IntrinsicElements {
    [tag: string]: any;
  }
}
