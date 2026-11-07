import { Check, ChevronDown, ChevronLeft, ChevronRight, ImagePlus, Images } from 'lucide-react'
import { useRef } from 'react'

export default function ImageStrip({
  images,
  selectedIndex,
  onSelect,
  collapsed,
  onToggle,
}) {
  const scrollerRef = useRef(null)
  const currentImage = images[selectedIndex] ?? images[0] ?? null

  const scrollBy = (direction) => {
    scrollerRef.current?.scrollBy({ left: direction * 238, behavior: 'smooth' })
  }

  return (
    <section className="image-strip flex shrink-0 flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-panel">
      <div className="flex h-[50px] shrink-0 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <Images size={15} strokeWidth={1.9} />
          </span>
          <h2 className="text-[12.5px] font-semibold tracking-[0.01em] text-ink-900">
            检查图像 <span className="ml-0.5 text-accent-600">({images.length})</span>
          </h2>
          <span className="hidden h-3 w-px bg-slate-200 sm:block" />
          <span className="hidden truncate text-[10.5px] text-ink-400 sm:block">
            {currentImage ? `当前：${currentImage.label} · ${currentImage.time}` : '暂无图像'}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={images.length === 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 transition hover:bg-slate-100 hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="向左滚动图像"
            title="向左滚动"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={images.length === 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 transition hover:bg-slate-100 hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="向右滚动图像"
            title="向右滚动"
          >
            <ChevronRight size={15} />
          </button>
          <span className="mx-1.5 h-3 w-px bg-slate-200" />
          <button
            type="button"
            onClick={onToggle}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[10.5px] font-medium text-ink-500 transition hover:bg-slate-100 hover:text-ink-800"
            aria-expanded={!collapsed}
            aria-label={collapsed ? '展开检查图像' : '收起检查图像'}
          >
            <span className="hidden sm:inline">{collapsed ? '展开' : '收起'}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${collapsed ? '-rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {images.length === 0 ? (
            <div className="mx-4 mb-3.5 flex h-[74px] items-center justify-center gap-2 rounded-[11px] border border-dashed border-[var(--panel-border)] bg-[var(--panel-soft)] text-[10.5px] text-ink-400">
              <ImagePlus size={15} strokeWidth={1.8} className="text-ink-300" />
              暂无检查图像
            </div>
          ) : (
            <div
              ref={scrollerRef}
              className="flex gap-2.5 overflow-x-auto px-4 pb-3.5 pt-0.5 thin-scroll"
            >
              {images.map((image, index) => {
                const active = index === selectedIndex
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => onSelect(index)}
                    className={`group relative h-[74px] w-[98px] shrink-0 overflow-hidden rounded-[11px] border-2 transition-all duration-150 ${
                      active
                        ? 'thumbnail-selected border-accent-500'
                        : 'border-transparent hover:border-slate-200'
                    }`}
                    aria-label={`查看 ${image.label} 影像`}
                    aria-pressed={active}
                  >
                    <img
                      src={image.thumb}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      draggable="false"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1 py-0.5 text-[8px] font-semibold tabular-nums text-white/90">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="absolute bottom-1.5 left-0 right-0 truncate px-1.5 text-center text-[9.5px] font-medium text-white drop-shadow-sm">
                      {image.label}
                    </span>
                    {active ? (
                      <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-600 text-[var(--accent-on-color)] shadow">
                        <Check size={10} strokeWidth={2.8} />
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
