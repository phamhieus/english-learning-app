import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Optional action button rendered inside the toast. */
  action?: ToastAction;
  /** Auto-dismiss delay in ms. Defaults to 3000; pass `null` to keep it until dismissed. */
  duration?: number | null;
}

export interface ToastContextType {
  addToast: (message: string, type: ToastType, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
