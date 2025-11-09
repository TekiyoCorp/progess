import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      duration: 3000,
      style: {
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
      },
    });
  },
  
  error: (message: string) => {
    sonnerToast.error(message, {
      duration: 4000,
      style: {
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#fff',
      },
    });
  },
  
  info: (message: string) => {
    sonnerToast.info(message, {
      duration: 3000,
      style: {
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
      },
    });
  },
  
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      style: {
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
      },
    });
  },
};


