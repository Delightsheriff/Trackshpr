/**
 * Global toast store — one active toast at a time.
 * Consumed by <ToastOverlay /> in the tabs layout.
 */
import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface ToastEntry {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toast: ToastEntry | null;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (message, type = "success") =>
    set({ toast: { id: Date.now(), message, type } }),
  hide: () => set({ toast: null }),
}));
