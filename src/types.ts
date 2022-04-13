export type WindowRef =
  | Window
  | React.MutableRefObject<HTMLElement | null>
  | HTMLElement
  | null;
