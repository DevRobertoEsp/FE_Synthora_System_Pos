import { useEffect } from 'react'

const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  error:   'border-red-500/30 bg-red-500/10 text-red-400',
  info:    'border-amber-500/30 bg-amber-500/10 text-amber-400',
}

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    '●',
}

export function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium
            backdrop-blur-sm shadow-lg pointer-events-auto
            animate-[slideIn_0.2s_ease]
            ${STYLES[toast.type]}`}
        >
          <span className="text-base">{ICONS[toast.type]}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 opacity-50 hover:opacity-100 transition text-xs"
          >✕</button>
        </div>
      ))}
    </div>
  )
}