/// <reference types="vite/client" />

declare global {
  interface Window {
    __redirectingToLogin?: boolean;
    adsbygoogle?: unknown[];
  }
}

export {};


