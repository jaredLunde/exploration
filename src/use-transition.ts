import * as React from "react";

export const useTransition: () => [boolean, typeof React.startTransition] =
  typeof React.useTransition === "function"
    ? React.useTransition
    : () => [false, (fn) => fn()];
