declare module '*.svg' {
  import React = require('react');
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export { ReactComponent };
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}
