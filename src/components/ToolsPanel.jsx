import {
  Aperture,
  ChevronLeft,
  ChevronRight,
  Contrast,
  Focus,
  Info,
  Maximize2,
  Palette,
  PenTool,
  RotateCcw,
  Ruler,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useState } from 'react'
import AppearancePanel from './AppearancePanel'

const tools = [
  { id: 'enhance', label: '增强', icon: Sparkles, type: 'toggle', hint: '智能影像优化' },
  { id: 'exposure', label: '曝光', icon: Aperture, type: 'slider', hint: '调节摄像头曝光' },
  { id: 'brightness', label: '亮度', icon: Sun, type: 'slider' },
  { id: 'contrast', label: '对比度', icon: Contrast, type: 'slider' },
  { id: 'sharpen', label: '锐化', icon: Focus, type: 'toggle', hint: '提升显示锐度，仅用于实时预览' },
  { id: 'annotate', label: '标注', icon: PenTool, type: 'toggle', hint: '在画面上添加标记' },
  { id: 'measure', label: '测量', icon: Ruler, type: 'toggle', hint: '未标定的参考测量，不用于临床计量' },
  { id: 'fullscreen', label: '全屏', icon: Maximize2, type: 'action', hint: '全屏查看实时画面' },
]

function ToolRow({ tool, active, onClick, onExpand }) {
  const Icon = tool.icon

  return (
    <button
      type="button"
      onClick={tool.type === 'action' ? onClick : tool.type === 'toggle' ? onClick : onExpand}
      className={`group flex h-[45px] w-full items-center gap-3 rounded-[13px] border px-2.5 text-left transition-all duration-150 ${
        active
          ? 'border-accent-200 bg-accent-50/80'
          : 'border-transparent hover:border-slate-100 hover:bg-slate-50/90'
      }`}
      aria-pressed={tool.type === 'toggle' ? active : undefined}
      title={tool.hint || tool.label}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-colors ${
          active
            ? 'bg-white text-accent-600 shadow-sm ring-1 ring-accent-200'
            : 'bg-slate-50 text-ink-500 group-hover:bg-white group-hover:text-accent-600 group-hover:shadow-sm'
        }`}
      >
        <Icon size={16.5} strokeWidth={1.8} />
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block text-[12.5px] font-medium ${active ? 'text-accent-700' : 'text-ink-800'}`}>
          {tool.label}
        </span>
      </span>

      {active && tool.type === 'toggle' ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
      ) : null}
      <ChevronRight
        size={14}
        strokeWidth={1.8}
        className="shrink-0 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink-400"
      />
    </button>
  )
}

function SliderRow({ tool, value, onChange, valueText, onReset, disabled = false }) {
  const Icon = tool.icon

  return (
    <div
      className={`tool-slider rounded-[13px] px-2.5 pb-2.5 pt-2 transition-colors hover:bg-slate-50/90 ${
        disabled ? 'opacity-55' : ''
      }`}
    >
      <div className="flex h-7 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-slate-50 text-ink-500">
          <Icon size={16.5} strokeWidth={1.8} />
        </span>
        <span className="flex-1 text-[12.5px] font-medium text-ink-800">{tool.label}</span>
        <span className="min-w-[35px] text-right text-[10.5px] font-semibold tabular-nums text-accent-600">
          {valueText ?? `${value}%`}
        </span>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-ink-400 transition hover:bg-slate-100 hover:text-accent-600"
            title="恢复自动曝光"
            aria-label="恢复自动曝光"
          >
            <RotateCcw size={11} />
          </button>
        ) : null}
        <ChevronRight size={14} strokeWidth={1.8} className="shrink-0 text-slate-300" />
      </div>
      <div className="pl-11 pr-1">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="range-input"
          style={{ '--range-progress': `${value}%` }}
          aria-label={`${tool.label}调节`}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

export default function ToolsPanel({
  collapsed,
  onToggle,
  activeTools,
  onToolAction,
  brightness,
  contrast,
  onBrightnessChange,
  onContrastChange,
  exposure,
  exposureMode,
  exposureSupported,
  onExposureChange,
  onAutoExposure,
  themePresets,
  accentPresets,
  themeId,
  customBg,
  accent,
  onThemeChange,
  onCustomBgChange,
  onAccentChange,
  onResetAppearance,
}) {
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  if (collapsed) {
    return (
      <aside className="panel flex h-full min-w-0 flex-col items-center overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-panel">
        <button
          type="button"
          onClick={onToggle}
          className="mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-slate-100 hover:text-ink-800"
          aria-label="展开工具栏"
          title="展开工具栏"
        >
          <ChevronLeft size={17} />
        </button>

        <div className="mb-2 mt-4 flex shrink-0 items-center justify-center">
          <span className="vertical-label text-[10.5px] font-semibold tracking-[0.22em] text-ink-400">
            工具
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto thin-scroll">
          {tools.map((tool) => {
            const Icon = tool.icon
            const active =
              Boolean(activeTools[tool.id]) || (tool.id === 'exposure' && exposureMode === 'manual')
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onToolAction(tool.id)}
                title={tool.label}
                aria-label={tool.label}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                  active
                    ? 'bg-accent-50 text-accent-600 ring-1 ring-accent-200'
                    : 'text-ink-400 hover:bg-slate-100 hover:text-ink-800'
                }`}
              >
                <Icon size={17.5} strokeWidth={1.8} />
              </button>
            )
          })}
        </div>
      </aside>
    )
  }

  const activeCount = ['enhance', 'sharpen', 'annotate', 'measure'].filter(
    (key) => activeTools[key],
  ).length

  return (
    <aside className="panel relative flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-panel">
      <div className="flex shrink-0 items-start justify-between px-5 pb-3 pt-5">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-ink-500">
            Tools
          </p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-[0.01em] text-ink-900">工具</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAppearanceOpen((value) => !value)}
            className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg transition ${
              appearanceOpen
                ? 'bg-accent-50 text-accent-600'
                : 'text-ink-400 hover:bg-slate-100 hover:text-ink-800'
            }`}
            aria-label="外观设置"
            title="外观与配色"
            aria-expanded={appearanceOpen}
          >
            <Palette size={16} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-slate-100 hover:text-ink-800"
            aria-label="收起工具栏"
            title="收起工具栏"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 pt-1 thin-scroll">
        <div className="space-y-1.5">
          {tools.map((tool) => {
            if (tool.id === 'exposure') {
              return (
                <SliderRow
                  key={tool.id}
                  tool={tool}
                  value={exposure}
                  onChange={onExposureChange}
                  valueText={
                    exposureSupported ? (exposureMode === 'auto' ? '自动' : `${exposure}%`) : '不支持'
                  }
                  onReset={exposureSupported && exposureMode === 'manual' ? onAutoExposure : undefined}
                  disabled={!exposureSupported}
                />
              )
            }

            if (tool.type === 'slider') {
              const value = tool.id === 'brightness' ? brightness : contrast
              const onChange = tool.id === 'brightness' ? onBrightnessChange : onContrastChange
              return <SliderRow key={tool.id} tool={tool} value={value} onChange={onChange} />
            }

            return (
              <ToolRow
                key={tool.id}
                tool={tool}
                active={Boolean(activeTools[tool.id])}
                onClick={() => onToolAction(tool.id)}
                onExpand={onToggle}
              />
            )
          })}
        </div>
      </div>

      <div className="mx-3 mb-2 shrink-0 rounded-[14px] border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3.5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.03em] text-ink-600">
          <Info size={12} strokeWidth={1.9} className="text-accent-500" />
          操作提示
        </div>
        <p className="mt-1.5 text-[10.5px] leading-[1.6] text-ink-500">
          曝光直接调节摄像头硬件；亮度与对比度作用于数字画面。标注与测量工具支持直接在预览区域操作。
        </p>
      </div>

      <div className="shrink-0 border-t border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2 text-[10.5px] leading-4 text-ink-400">
          <span className={`h-1.5 w-1.5 rounded-full ${activeCount ? 'bg-accent-500' : 'bg-emerald-400'}`} />
          <span>{activeCount ? `已启用 ${activeCount} 项影像工具` : '调节参数实时应用至预览'}</span>
        </div>
      </div>

      {appearanceOpen ? (
        <AppearancePanel
          themePresets={themePresets}
          accentPresets={accentPresets}
          themeId={themeId}
          customBg={customBg}
          accent={accent}
          onClose={() => setAppearanceOpen(false)}
          onThemeChange={onThemeChange}
          onCustomBgChange={onCustomBgChange}
          onAccentChange={onAccentChange}
          onResetAppearance={onResetAppearance}
        />
      ) : null}
    </aside>
  )
}
