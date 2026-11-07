import { Copy, Minus, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import ToothIcon from './ToothIcon'

function WindowButton({ label, onClick, children, danger = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`no-drag group flex h-8 w-11 items-center justify-center rounded-lg transition-colors duration-150 ${
        danger
          ? 'text-ink-500 hover:bg-[#e5484d] hover:text-white'
          : 'text-ink-500 hover:bg-slate-100 hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  )
}

export default function TitleBar() {
  const desktop = typeof window !== 'undefined' ? window.electronAPI : undefined
  const isMac =
    desktop?.platform === 'darwin' ||
    (typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('platform') === 'mac')
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!desktop?.onMaximizedChange) return undefined
    return desktop.onMaximizedChange(setIsMaximized)
  }, [desktop])

  return (
    <header
      className={`titlebar flex h-16 shrink-0 items-center justify-between border-b border-white/80 bg-white ${
        isMac ? 'pl-[86px] pr-5' : 'px-5'
      }`}
      onDoubleClick={() => desktop?.maximize?.()}
      data-platform={isMac ? 'mac' : 'windows'}
    >
      <div className="flex items-center gap-3">
        <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-[12px] text-white shadow-blue-glow">
          <ToothIcon size={22} strokeWidth={1.75} />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-[15.5px] font-semibold tracking-[0.01em] text-ink-900">
            口腔内窥相机系统
          </h1>
          <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-ink-500">
            Intraoral Imaging Workstation
          </p>
        </div>
      </div>

      {!isMac ? (
        <div
          className="no-drag flex items-center gap-1 rounded-xl bg-slate-50/70 p-0.5"
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <WindowButton label="最小化" onClick={() => desktop?.minimize?.()}>
            <Minus size={15} strokeWidth={2} />
          </WindowButton>
          <WindowButton
            label={isMaximized ? '还原窗口' : '最大化'}
            onClick={() => desktop?.maximize?.()}
          >
            {isMaximized ? (
              <Copy size={12.5} strokeWidth={1.9} />
            ) : (
              <Square size={12.5} strokeWidth={1.9} />
            )}
          </WindowButton>
          <WindowButton label="关闭" danger onClick={() => desktop?.close?.()}>
            <X size={15.5} strokeWidth={2} />
          </WindowButton>
        </div>
      ) : (
        <span aria-hidden="true" />
      )}
    </header>
  )
}
