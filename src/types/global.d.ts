/**
 * Global Type Definitions
 * React Native ortamı için tip tanımlamaları
 */

// NodeJS.Timeout ve ReturnType<typeof setTimeout> arasındaki uyumluluk
// React Native ortamında number döner, Node.js ortamında Timeout nesnesi döner
declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Timeout {}
  }
}

// Timer types for cross-platform compatibility
export type TimerRef = ReturnType<typeof setTimeout> | null;
export type IntervalRef = ReturnType<typeof setInterval> | null;

export {};
