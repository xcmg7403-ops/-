import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        return (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        );
      })}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { key?: string; toast: ToastMessage; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    error: 'bg-rose-50 border-rose-100 text-rose-900',
    info: 'bg-sky-50 border-sky-100 text-sky-900'
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-5 ${bgColors[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
