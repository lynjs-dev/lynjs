import { LynButtonElement } from "../src/components/inputs/button.tsx";

declare global {
  interface HTMLElementTagNameMap {
    'lyn-button': LynButtonElement;
  }
}
