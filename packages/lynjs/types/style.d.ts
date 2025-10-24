declare module '*.scss' {
  const content: {
    raw: string;
    sheet?: CSSStyleSheet;
  };
  export default content;
}

declare module '*.css' {
  const content: {
    raw: string;
    sheet?: CSSStyleSheet;
  };
  export default content;
}

declare module '*.module.scss' {
  const content: {
    raw: string;
    sheet?: CSSStyleSheet;
  };
  export default content;
}

declare module '*.module.css' {
  const content: {
    raw: string;
    sheet?: CSSStyleSheet;
  };
  export default content;
}
