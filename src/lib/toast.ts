type ToastType = 'success' | 'error';

export const toast = {
  success: (message: string) => {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'success', message } }));
  },
  error: (message: string) => {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message } }));
  }
};
