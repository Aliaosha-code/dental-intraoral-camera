import {
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Minus,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
} from 'lucide-react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

const PreviewStage = forwardRef(function PreviewStage(
  {
    camera,
    image,
    brightness,
    contrast,
    enhance,
    sharpen,
    annotationActive,
    measurementActive,
    isLiveView = true,
    onShowLive,
    onCapture,
  },
  ref,
) {
  const stageRef = useRef(null)
  const {
    videoRef,
    status,
    error,
    deviceName,
    activeDeviceId,
    devices,
    settings,
    retry,
    selectDevice,
  } = camera
  const [zoom, setZoom] = useState(1)
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false)
  const [markers, setMarkers] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [pendingPoint, setPendingPoint] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    setMarkers([])
    setMeasurements([])
    setPendingPoint(null)
  }, [image?.id, isLiveView])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === stageRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await stageRef.current?.requestFullscreen?.()
      } else {
        await document.exitFullscreen?.()
      }
    } catch {
      // The browser may block fullscreen in embedded previews; the UI remains usable.
    }
  }, [])

  useImperativeHandle(ref, () => ({ toggleFullscreen }), [toggleFullscreen])

  const adjustmentsActive = brightness !== 50 || contrast !== 50 || enhance || sharpen
  const filter = adjustmentsActive
    ? [
        `brightness(${(0.75 + brightness * 0.005).toFixed(3)})`,
        `contrast(${(0.75 + contrast * 0.005).toFixed(3)})`,
        enhance ? 'saturate(1.12)' : '',
        enhance ? 'brightness(1.015)' : '',
        sharpen ? 'contrast(1.035)' : '',
        sharpen ? 'saturate(1.025)' : '',
      ]
        .filter(Boolean)
        .join(' ')
    : 'none'
  const mediaTransform = zoom === 1 ? 'translateZ(0)' : `translateZ(0) scale(${zoom})`

  const streaming = status === 'connected'
  const showingSnapshot = Boolean(image) && !isLiveView
  const liveVisible = !showingSnapshot && streaming
  const statusText =
    status === 'connected'
      ? '相机已连接'
      : status === 'connecting'
        ? '正在连接相机'
        : '相机未连接'
  const dotClass = streaming
    ? 'bg-emerald-500'
    : status === 'connecting'
      ? 'bg-amber-400'
      : 'bg-rose-500'
  const pingClass = streaming
    ? 'bg-emerald-400'
    : status === 'connecting'
      ? 'bg-amber-300'
      : 'bg-rose-400'
  const resolutionText =
    streaming && settings?.width && settings?.height
      ? `${settings.width} × ${settings.height}${settings.frameRate ? ` · ${Math.round(settings.frameRate)} FPS` : ''}`
      : '1280 × 720 · 30 FPS'

  const makeId = () =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

  const handleStageClick = (event) => {
    if (!annotationActive && !measurementActive) return
    if (event.target.closest('[data-preview-control]')) return

    const rect = stageRef.current.getBoundingClientRect()
    const visibleX = ((event.clientX - rect.left) / rect.width) * 100
    const visibleY = ((event.clientY - rect.top) / rect.height) * 100
    // The media and annotation layer are scaled around the center when the
    // user zooms; convert the click back into unscaled media coordinates.
    const point = {
      x: Math.min(100, Math.max(0, 50 + (visibleX - 50) / zoom)),
      y: Math.min(100, Math.max(0, 50 + (visibleY - 50) / zoom)),
    }

    if (annotationActive) {
      setMarkers((current) => [...current, { ...point, id: makeId() }])
      return
    }

    if (!pendingPoint) {
      setPendingPoint(point)
      return
    }

    const pixelDistance = Math.hypot(
      ((point.x - pendingPoint.x) / 100) * rect.width,
      ((point.y - pendingPoint.y) / 100) * rect.height,
    )
    const millimetres = Math.max(0.1, pixelDistance / 13.5)
    setMeasurements((current) => [
      ...current,
      {
        id: makeId(),
        start: pendingPoint,
        end: point,
        value: `≈ ${millimetres.toFixed(1)}`,
      },
    ])
    setPendingPoint(null)
  }

  const clearOverlays = () => {
    setMarkers([])
    setMeasurements([])
    setPendingPoint(null)
  }

  const zoomOut = () => setZoom((current) => Math.max(0.8, Number((current - 0.1).toFixed(1))))
  const zoomIn = () => setZoom((current) => Math.min(2, Number((current + 0.1).toFixed(1))))

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video || !streaming || video.readyState < 2 || !video.videoWidth) return

    try {
      const width = video.videoWidth
      const height = video.videoHeight
      const scale = Math.min(1, 1600 / width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const context = canvas.getContext('2d')
      if (!context) return

      const computedFilter = window.getComputedStyle(video).filter
      context.filter = computedFilter && computedFilter !== 'none' ? computedFilter : 'none'
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const thumbCanvas = document.createElement('canvas')
      thumbCanvas.width = 320
      thumbCanvas.height = Math.round((height / width) * 320)
      const thumbContext = thumbCanvas.getContext('2d')
      if (!thumbContext) return
      thumbContext.drawImage(video, 0, 0, thumbCanvas.width, thumbCanvas.height)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.86)
      const thumb = thumbCanvas.toDataURL('image/jpeg', 0.76)
      setFlash(true)
      window.setTimeout(() => setFlash(false), 140)
      onCapture?.({ dataUrl, thumb, width, height })
    } catch {
      // Camera frames can disappear during device changes; ignore this frame.
    }
  }

  const modeActive = annotationActive || measurementActive
  const isVirtualDevice = (label) =>
    /obs virtual|amd privacy|privacy view|manycam|snap camera|xsplit|droidcam|virtual camera/i.test(
      label || '',
    )

  return (
    <section
      ref={stageRef}
      onClick={handleStageClick}
      className={`preview-stage group relative min-h-0 flex-1 overflow-hidden rounded-[22px] border border-white/70 bg-[#0d1728] shadow-panel ${
        modeActive ? 'cursor-crosshair' : ''
      } ${isFullscreen ? 'is-fullscreen' : ''}`}
      aria-label="实时预览画面"
    >
      <div className="absolute inset-0 overflow-hidden bg-[#0b1526]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,#1d304a_0%,#0b1526_58%,#07101d_100%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(148,184,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,184,255,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
        {/* Keep the video mounted while viewing a snapshot so the camera
            stream stays attached when the user returns to live view. */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label={`${deviceName} 摄像头实时画面`}
          disablePictureInPicture
          className="preview-image absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          style={{
            filter,
            transform: mediaTransform,
            opacity: liveVisible ? 1 : 0,
            backfaceVisibility: 'hidden',
          }}
        />
        {showingSnapshot ? (
          <img
            key={image.id}
            src={image.full}
            alt={`${image.label} 口腔内窥影像`}
            className="preview-image absolute inset-0 h-full w-full select-none object-cover"
            style={{ filter, transform: mediaTransform }}
            draggable="false"
          />
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0d1728]/25 via-[#0d1728]/5 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0d1728]/40 via-[#0d1728]/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10" />

      <div className="pointer-events-none absolute inset-5 z-10">
        <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-[8px] border-l border-t border-white/40" />
        <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-[8px] border-r border-t border-white/40" />
        <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-[8px] border-b border-l border-white/40" />
        <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-[8px] border-b border-r border-white/40" />
      </div>

      <div className="absolute left-5 right-5 top-5 z-20 flex items-start justify-between" data-preview-control>
        <button
          type="button"
          onClick={showingSnapshot ? onShowLive : undefined}
          className={`preview-pill flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/95 px-3 py-2 text-left shadow-[0_4px_18px_rgba(10,25,47,0.14)] transition ${
            showingSnapshot ? 'hover:bg-white' : 'cursor-default'
          }`}
          aria-label={showingSnapshot ? '返回实时预览' : '实时预览'}
        >
          {!showingSnapshot ? (
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${pingClass}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
            </span>
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-50 text-accent-600">
              <Play size={10} fill="currentColor" />
            </span>
          )}
          <span className="flex items-baseline gap-1.5">
            <span className="text-[11.5px] font-semibold tracking-[0.02em] text-ink-800">
              {showingSnapshot ? '返回实时预览' : '实时预览'}
            </span>
            {showingSnapshot ? (
              <span className="text-[9.5px] font-medium text-ink-400">{image.label}</span>
            ) : null}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-white/60 bg-[#101d30]/70 px-2.5 py-1.5 text-[10px] font-bold tracking-[0.12em] text-white shadow-sm">
            HD
          </div>
        </div>
      </div>

      {!showingSnapshot && status !== 'connected' ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center p-6"
          data-preview-control
          onClick={(event) => event.stopPropagation()}
        >
          <div className="w-full max-w-[330px] rounded-2xl border border-white/20 bg-[#0b1526]/95 px-6 py-6 text-center text-white shadow-[0_16px_50px_rgba(0,0,0,0.28)]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/90 ring-1 ring-white/20">
              {status === 'connecting' ? (
                <LoaderCircle size={21} className="animate-spin" />
              ) : (
                <CameraOff size={21} />
              )}
            </div>
            <h3 className="mt-3 text-[13px] font-semibold tracking-[0.02em]">
              {status === 'connecting' ? '正在连接 USB 摄像头' : '相机未连接'}
            </h3>
            <p className="mt-1.5 text-[10.5px] leading-[1.65] text-white/60">
              {status === 'connecting' ? '正在获取实时画面，请稍候…' : error}
            </p>
            {status === 'error' ? (
              <button
                type="button"
                onClick={retry}
                className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3.5 text-[10.5px] font-semibold text-ink-800 transition hover:bg-accent-50"
              >
                <RefreshCw size={12.5} />
                重新连接摄像头
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {modeActive ? (
        <div
          className="preview-pill absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/70 bg-white/95 py-1.5 pl-3 pr-1.5 text-[10.5px] shadow-[0_6px_22px_rgba(10,25,47,0.16)]"
          data-preview-control
          onClick={(event) => event.stopPropagation()}
        >
          <span className="font-semibold text-accent-700">
            {annotationActive ? '标注模式' : '测量模式'}
          </span>
          <span className="hidden text-ink-400 sm:inline">
            {annotationActive
              ? '单击画面添加标记'
              : pendingPoint
                ? '未标定参考 · 请选择终点'
                : '未标定参考 · 请选择起点'}
          </span>
          {(markers.length > 0 || measurements.length > 0 || pendingPoint) && (
            <button
              type="button"
              onClick={clearOverlays}
              className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-ink-500 transition hover:bg-slate-100 hover:text-ink-800"
            >
              <RotateCcw size={11.5} />
              清除
            </button>
          )}
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ transform: `translateZ(0) scale(${zoom})`, transformOrigin: 'center' }}
      >
        {markers.map((marker, index) => (
          <span
            key={marker.id}
            className="absolute flex h-[25px] w-[25px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-accent-600 text-[10px] font-bold text-[var(--accent-on-color)] shadow-[0_2px_10px_rgba(26,86,219,0.45)]"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            {index + 1}
          </span>
        ))}

        {pendingPoint ? (
          <span
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-400 shadow"
            style={{ left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%` }}
          />
        ) : null}

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {measurements.map((measurement) => (
            <g key={measurement.id}>
              <line
                x1={measurement.start.x}
                y1={measurement.start.y}
                x2={measurement.end.x}
                y2={measurement.end.y}
                stroke="rgba(255,255,255,.92)"
                strokeWidth="0.35"
                strokeDasharray="1.6 1.1"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={measurement.start.x} cy={measurement.start.y} r="0.65" fill="#fff" />
              <circle cx={measurement.end.x} cy={measurement.end.y} r="0.65" fill="#fff" />
            </g>
          ))}
        </svg>

        {measurements.map((measurement) => (
          <span
            key={`label-${measurement.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md bg-[#0f1d31]/90 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm"
            style={{
              left: `${(measurement.start.x + measurement.end.x) / 2}%`,
              top: `${(measurement.start.y + measurement.end.y) / 2}%`,
            }}
          >
            {measurement.value}
          </span>
        ))}
      </div>

      {cameraMenuOpen ? (
        <div
          className="preview-pill absolute bottom-[74px] left-5 z-30 w-[264px] rounded-xl border border-white/70 bg-white/95 p-2 shadow-float"
          data-preview-control
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              选择摄像头
            </span>
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium text-accent-600 transition hover:bg-accent-50"
            >
              <RefreshCw size={10} />
              重新连接
            </button>
          </div>
          <div className="mt-1 max-h-[176px] space-y-0.5 overflow-y-auto thin-scroll">
            {devices.length > 0 ? (
              devices.map((device, index) => {
                const selected = device.deviceId === activeDeviceId
                return (
                  <button
                    key={device.deviceId}
                    type="button"
                    onClick={() => {
                      if (!selected) selectDevice(device.deviceId)
                      setCameraMenuOpen(false)
                    }}
                    className={`flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[10.5px] transition ${
                      selected
                        ? 'bg-accent-50 text-accent-700'
                        : 'text-ink-700 hover:bg-slate-100'
                    }`}
                  >
                    <Camera size={13} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {device.label || `摄像头 ${index + 1}`}
                    </span>
                    {isVirtualDevice(device.label) ? (
                      <span className="shrink-0 rounded bg-slate-100 px-1 py-0.5 text-[8px] text-ink-400">
                        虚拟
                      </span>
                    ) : null}
                    {selected ? <Check size={12} className="shrink-0" /> : null}
                  </button>
                )
              })
            ) : (
              <p className="px-2 py-4 text-center text-[10px] text-ink-400">未检测到视频设备</p>
            )}
          </div>
        </div>
      ) : null}

      {flash ? <div className="pointer-events-none absolute inset-0 z-40 bg-white/75" /> : null}

      {streaming && !showingSnapshot ? (
        <button
          type="button"
          onClick={capturePhoto}
          className="group absolute bottom-[74px] left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-white/80 bg-white/20 shadow-[0_6px_22px_rgba(10,25,47,0.2)] transition hover:scale-105 hover:bg-white/30 active:scale-95"
          aria-label="拍照"
          title="拍照并保存当前画面"
        >
          <span className="h-9 w-9 rounded-full bg-accent-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition group-hover:bg-accent-500" />
          <span className="sr-only">拍照</span>
        </button>
      ) : null}

      <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between gap-3" data-preview-control>
        <button
          type="button"
          onClick={() => setCameraMenuOpen((value) => !value)}
          className="preview-pill flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/95 px-3 py-2 text-left shadow-[0_4px_18px_rgba(10,25,47,0.15)] transition hover:bg-white"
          title={deviceName}
          aria-label="选择摄像头"
          aria-expanded={cameraMenuOpen}
        >
          {status === 'connected' ? (
            <Camera size={14.5} className="text-accent-600" strokeWidth={1.9} />
          ) : status === 'connecting' ? (
            <LoaderCircle size={14.5} className="animate-spin text-amber-500" strokeWidth={1.9} />
          ) : (
            <CameraOff size={14.5} className="text-rose-500" strokeWidth={1.9} />
          )}
          <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-ink-700">
            <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
            {statusText}
          </span>
          {status === 'connected' ? (
            <span className="hidden max-w-[110px] truncate text-[9.5px] font-normal text-ink-400 sm:inline">
              {deviceName}
            </span>
          ) : null}
          {status === 'error' ? (
            <span className="text-[10px] font-medium text-accent-600 underline">重试</span>
          ) : null}
          <ChevronDown
            size={11}
            className={`shrink-0 text-ink-400 transition-transform ${cameraMenuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="hidden items-center rounded-lg bg-[#101d30]/50 px-2.5 py-1.5 text-[10px] font-medium tracking-[0.06em] text-white/90 sm:flex">
          {showingSnapshot ? `历史影像 · ${image.label}` : streaming ? resolutionText : '等待相机信号'}
        </div>

        <div className="preview-pill flex items-center gap-0.5 rounded-xl border border-white/70 bg-white/95 p-1 shadow-[0_4px_18px_rgba(10,25,47,0.15)]">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 0.8}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-500 transition hover:bg-slate-100 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="缩小画面"
          >
            <Minus size={13} />
          </button>
          <span className="min-w-[42px] text-center text-[10.5px] font-semibold tabular-nums text-ink-800">
            {zoom.toFixed(1)}x
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 2}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-500 transition hover:bg-slate-100 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="放大画面"
          >
            <Plus size={13} />
          </button>
          <span className="mx-0.5 h-4 w-px bg-slate-200" />
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-500 transition hover:bg-slate-100 hover:text-ink-900"
            aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
            title={isFullscreen ? '退出全屏' : '进入全屏'}
          >
            {isFullscreen ? <Minimize2 size={13.5} /> : <Maximize2 size={13.5} />}
          </button>
        </div>
      </div>
    </section>
  )
})

export default PreviewStage
