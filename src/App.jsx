import { CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import ImageStrip from './components/ImageStrip'
import PatientPanel from './components/PatientPanel'
import PreviewStage from './components/PreviewStage'
import TitleBar from './components/TitleBar'
import ToolsPanel from './components/ToolsPanel'
import { examImages, patient as initialPatient } from './data/images'
import useCamera from './hooks/useCamera'
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  DEFAULT_CUSTOM_BG,
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  createThemeStyle,
  isKnownThemeId,
  normalizeHexColor,
  resolveTheme,
} from './theme'

const initialTools = {
  enhance: false,
  sharpen: false,
  annotate: false,
  measure: false,
}

export default function App() {
  const [patientCollapsed, setPatientCollapsed] = useState(false)
  const [toolsCollapsed, setToolsCollapsed] = useState(false)
  const [imagesCollapsed, setImagesCollapsed] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLiveView, setIsLiveView] = useState(true)
  const [brightness, setBrightness] = useState(50)
  const [contrast, setContrast] = useState(50)
  const [activeTools, setActiveTools] = useState(initialTools)
  const [patient] = useState(initialPatient)
  const [themeId, setThemeId] = useState(() => {
    try {
      const storedThemeId = localStorage.getItem('dental.themeId')
      return isKnownThemeId(storedThemeId) ? storedThemeId : DEFAULT_THEME_ID
    } catch {
      return DEFAULT_THEME_ID
    }
  })
  const [customBg, setCustomBg] = useState(() => {
    try {
      return normalizeHexColor(localStorage.getItem('dental.customBg'), DEFAULT_CUSTOM_BG)
    } catch {
      return DEFAULT_CUSTOM_BG
    }
  })
  const [accent, setAccent] = useState(() => {
    try {
      return normalizeHexColor(localStorage.getItem('dental.accent'), DEFAULT_ACCENT)
    } catch {
      return DEFAULT_ACCENT
    }
  })
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const previewRef = useRef(null)
  const camera = useCamera()
  const themePreset = useMemo(() => resolveTheme(themeId, customBg), [themeId, customBg])
  const themeStyle = useMemo(() => createThemeStyle(themePreset, accent), [themePreset, accent])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1179px)')
    const applyLayout = (isCompact) => {
      setPatientCollapsed(isCompact)
      setToolsCollapsed(isCompact)
    }

    if (mediaQuery.matches) applyLayout(true)
    const handleChange = (event) => applyLayout(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    return () => window.clearTimeout(toastTimer.current)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('dental.themeId', themeId)
      localStorage.setItem('dental.customBg', customBg)
      localStorage.setItem('dental.accent', accent)
    } catch {
      // Local persistence is a convenience; theme still applies in memory.
    }
  }, [themeId, customBg, accent])

  useEffect(() => {
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', themePreset.appBg)
    document.documentElement.style.backgroundColor = themePreset.appBg
  }, [themePreset.appBg])

  const showToast = (message) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }

  const handleToolAction = (toolId) => {
    if (toolId === 'fullscreen') {
      previewRef.current?.toggleFullscreen()
      return
    }

    if (toolId === 'brightness' || toolId === 'contrast' || toolId === 'exposure') {
      if (toolsCollapsed) setToolsCollapsed(false)
      return
    }

    if (toolsCollapsed) {
      setToolsCollapsed(false)
      return
    }

    setActiveTools((current) => {
      if (toolId === 'annotate') {
        return { ...current, annotate: !current.annotate, measure: false }
      }
      if (toolId === 'measure') {
        return { ...current, measure: !current.measure, annotate: false }
      }
      return { ...current, [toolId]: !current[toolId] }
    })
  }

  const handleOpenRecord = () => {
    if (!patient.name) {
      showToast('请先选择患者')
      return
    }
    showToast(`正在打开 ${patient.name} 的电子病历…`)
  }

  const handleSelectImage = (index) => {
    setSelectedIndex(index)
    setIsLiveView(false)
  }

  return (
    <div
      className="app-shell flex h-screen min-h-[640px] flex-col overflow-hidden"
      data-theme={themePreset.isDark ? 'dark' : 'light'}
      style={themeStyle}
    >
      <TitleBar />

      <div
        className="workspace grid min-h-0 flex-1 gap-3.5 p-4"
        style={{
          gridTemplateColumns: `${patientCollapsed ? 66 : 248}px minmax(0, 1fr) ${
            toolsCollapsed ? 66 : 272
          }px`,
        }}
      >
        <PatientPanel
          patient={patient}
          collapsed={patientCollapsed}
          onToggle={() => setPatientCollapsed((value) => !value)}
          onOpenRecord={handleOpenRecord}
        />

        <main className="flex min-w-0 flex-col gap-3.5">
          <ErrorBoundary>
            <PreviewStage
              ref={previewRef}
              camera={camera}
              image={examImages[selectedIndex] ?? null}
              brightness={brightness}
              contrast={contrast}
              enhance={activeTools.enhance}
              sharpen={activeTools.sharpen}
              annotationActive={activeTools.annotate}
              measurementActive={activeTools.measure}
              isLiveView={isLiveView}
              onShowLive={() => setIsLiveView(true)}
            />
          </ErrorBoundary>

          <ImageStrip
            images={examImages}
            selectedIndex={selectedIndex}
            onSelect={handleSelectImage}
            collapsed={imagesCollapsed}
            onToggle={() => setImagesCollapsed((value) => !value)}
          />
        </main>

        <ToolsPanel
          collapsed={toolsCollapsed}
          onToggle={() => setToolsCollapsed((value) => !value)}
          activeTools={activeTools}
          onToolAction={handleToolAction}
          brightness={brightness}
          contrast={contrast}
          onBrightnessChange={setBrightness}
          onContrastChange={setContrast}
          exposure={camera.exposurePercent}
          exposureMode={camera.exposureMode}
          exposureSupported={camera.exposureSupported}
          onExposureChange={camera.setExposure}
          onAutoExposure={camera.setAutoExposure}
          themePresets={THEME_PRESETS}
          accentPresets={ACCENT_PRESETS}
          themeId={themeId}
          customBg={customBg}
          accent={accent}
          onThemeChange={setThemeId}
          onCustomBgChange={(color) => {
            setCustomBg(color)
            setThemeId('custom')
          }}
          onAccentChange={setAccent}
          onResetAppearance={() => {
            setThemeId(DEFAULT_THEME_ID)
            setCustomBg(DEFAULT_CUSTOM_BG)
            setAccent(DEFAULT_ACCENT)
          }}
        />
      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-4 py-3 text-[12px] font-medium text-ink-800 shadow-float animate-fade-up"
        >
          <CheckCircle2 size={16} className="text-emerald-500" />
          {toast}
        </div>
      ) : null}
    </div>
  )
}
