/// <reference types="vite/client" />

declare namespace chrome {
  export namespace runtime {
    export function getURL(path: string): string;
  }
}
