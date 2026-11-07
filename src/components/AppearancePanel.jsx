import { Check, Palette, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

export default function AppearancePanel({
  themePresets,
  accentPresets,
  themeId,
  customBg,
  accent,
  onClose,
  onThemeChange,
  onCustomBgChange,
  onAccentChange,
  onResetAppearance,
}) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        aria-label="关闭外观设置"
        onClick={onClose}
      />
      <div
        className="appearance-popover absolute right-3 top-[58px] z-50 w-[248px] rounded-[16px] border p-3.5 shadow-float animate-fade-up"
        role="dialog"
        aria-modal="true"
        aria-label="外观设置"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <Palette size={14.5} strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                Appearance
              </p>
              <h3 className="mt-0.5 text-[12px] font-semibold text-ink-900">外观与配色</h3>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-400 transition hover:bg-slate-100 hover:text-ink-800"
            aria-label="关闭外观设置"
          >
            <X size={13} />
          </button>
        </div>

        <div className="mt-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-medium text-ink-700">界面底色</span>
            <span className="text-[9.5px] text-ink-500">
              {themeId === 'custom'
                ? '自定义'
                : themePresets.find((preset) => preset.id === themeId)?.name}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {themePresets.map((preset) => {
              const selected = themeId === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onThemeChange(preset.id)}
                  title={preset.name}
                  aria-label={`切换到${preset.name}主题`}
                  aria-pressed={selected}
                  className={`relative flex h-8 flex-1 items-center justify-center rounded-lg border transition ${
                    selected
                      ? 'border-accent-500 ring-2 ring-accent-500/20'
                      : 'border-slate-200/80 hover:border-ink-300'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${preset.appBg} 0%, ${preset.panel} 100%)`,
                  }}
                >
                  {selected ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-600 text-[var(--accent-on-color)] shadow-sm">
                      <Check size={9} strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              )
            })}
            <label
              className={`relative flex h-8 flex-1 cursor-pointer items-center justify-center rounded-lg border transition ${
                themeId === 'custom'
                  ? 'border-accent-500 ring-2 ring-accent-500/20'
                  : 'border-slate-200/80 hover:border-ink-300'
              }`}
              style={{ background: customBg }}
              title="自定义界面底色"
            >
              {themeId === 'custom' ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-600 text-[var(--accent-on-color)] shadow-sm">
                  <Check size={9} strokeWidth={3} />
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-ink-500">自定</span>
              )}
              <input
                type="color"
                value={customBg}
                onChange={(event) => onCustomBgChange(event.target.value)}
                className="sr-only"
                aria-label="自定义界面底色"
              />
            </label>
          </div>
        </div>

        <div className="mt-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-medium text-ink-700">强调色</span>
            <span className="font-mono text-[9.5px] uppercase text-ink-500">{accent}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {accentPresets.map((preset) => {
              const selected = accent.toLowerCase() === preset.value.toLowerCase()
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onAccentChange(preset.value)}
                  title={preset.name}
                  aria-label={`使用${preset.name}强调色`}
                  aria-pressed={selected}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                    selected ? 'border-ink-900' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.value }}
                >
                  {selected ? <Check size={11} strokeWidth={3} className="text-white" /> : null}
                </button>
              )
            })}
            <label
              className="relative ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-ink-300 bg-[conic-gradient(#ef5d5d,#f0c64f,#61c66f,#54b8de,#8a70e8,#ef5d5d)]"
              title="自定义强调色"
            >
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-white text-[10px] font-bold text-ink-700">
                +
              </span>
              <input
                type="color"
                value={accent}
                onChange={(event) => onAccentChange(event.target.value)}
                className="sr-only"
                aria-label="自定义强调色"
              />
            </label>
          </div>
        </div>

        <div className="mt-3.5 flex justify-end border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={onResetAppearance}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[9.5px] font-medium text-ink-500 transition hover:bg-slate-100 hover:text-ink-800"
          >
            <RotateCcw size={10.5} />
            恢复默认
          </button>
        </div>
      </div>
    </>
  )
}
