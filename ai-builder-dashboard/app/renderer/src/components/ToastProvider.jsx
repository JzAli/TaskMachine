import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext({ showToast: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toast) => {
    const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    const payload = { id, title: toast.title || 'Notification', description: toast.description, type: toast.type || 'info' };
    setToasts((prev) => [...prev, payload]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, toast.duration || 5000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 flex w-80 flex-col gap-3 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border border-white/10 p-4 shadow-soft backdrop-blur bg-surface-muted/90 ${
              toast.type === 'success'
                ? 'border-emerald-500/40'
                : toast.type === 'error'
                ? 'border-rose-500/40'
                : toast.type === 'warning'
                ? 'border-amber-500/40'
                : 'border-white/10'
            }`}
          >
            <p className="text-sm font-semibold text-white">{toast.title}</p>
            {toast.description && <p className="mt-1 text-xs text-slate-300">{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
