import { useCallback, useEffect, useRef, useState } from 'react'

const USB_CAMERA_PATTERN = /supereyes|usb\s*(video|camera)|uvc|intraoral|dental|endoscope|microscope/i
const VIRTUAL_CAMERA_PATTERN =
  /obs virtual|amd privacy|privacy view|manycam|snap camera|xsplit|droidcam|virtual camera/i

function createCameraError(name, message) {
  const error = new Error(message)
  error.name = name
  return error
}

function describeCameraError(error) {
  const isMac =
    typeof navigator !== 'undefined' &&
    (/Mac/i.test(navigator.userAgent) || window.electronAPI?.platform === 'darwin')

  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return isMac
        ? '摄像头权限被拒绝，请在「系统设置 → 隐私与安全性 → 摄像头」中允许访问。'
        : '摄像头权限被拒绝，请在 Windows 设置中允许相机访问。'
    case 'NotFoundError':
      return '未检测到可用的摄像头，请检查 USB 连接。'
    case 'NotReadableError':
      return '摄像头正被其他程序占用，请关闭其他相机软件后重试。'
    case 'OverconstrainedError':
      return '摄像头不支持请求的采集格式。'
    default:
      return error?.message || '相机连接失败，请重新插拔 USB 摄像头后重试。'
  }
}

function pickCamera(devices, requestedDeviceId) {
  if (requestedDeviceId) {
    return devices.find((device) => device.deviceId === requestedDeviceId) ?? null
  }

  const physicalDevices = devices.filter((device) => !VIRTUAL_CAMERA_PATTERN.test(device.label))
  return (
    physicalDevices.find((device) => USB_CAMERA_PATTERN.test(device.label)) ??
    physicalDevices[0] ??
    // A virtual/privacy camera is still better than showing no preview at all
    // when it is the only video input on the machine.
    devices.find((device) => device.kind === 'videoinput') ??
    null
  )
}

async function listVideoDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'videoinput')
}

async function openStream(deviceId) {
  const video = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
  }
  if (deviceId) video.deviceId = { exact: deviceId }

  return navigator.mediaDevices.getUserMedia({ audio: false, video })
}

function isValidExposureRange(range) {
  return Boolean(
    range &&
      Number.isFinite(range.min) &&
      Number.isFinite(range.max) &&
      range.min > 0 &&
      range.max > range.min,
  )
}

function exposurePercentFromTime(exposureTime, range) {
  if (!isValidExposureRange(range) || !Number.isFinite(exposureTime)) return null
  const clamped = Math.min(range.max, Math.max(range.min, exposureTime))
  const percent = (Math.log(clamped / range.min) / Math.log(range.max / range.min)) * 100
  return Math.round(Math.min(100, Math.max(0, percent)))
}

function exposureTimeFromPercent(percent, range) {
  if (!isValidExposureRange(range)) return null
  const value = range.min * Math.pow(range.max / range.min, Math.min(100, Math.max(0, percent)) / 100)
  if (!range.step) return value
  return Math.min(range.max, Math.max(range.min, Math.round(value / range.step) * range.step))
}

export default function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const exposureRangeRef = useRef(null)
  const requestIdRef = useRef(0)
  const exposureRequestRef = useRef(0)
  const exposureQueueRef = useRef(Promise.resolve())
  const mountedRef = useRef(true)
  const [status, setStatus] = useState('connecting')
  const [error, setError] = useState('')
  const [deviceName, setDeviceName] = useState('USB Camera')
  const [devices, setDevices] = useState([])
  const [settings, setSettings] = useState(null)
  const [exposureSupported, setExposureSupported] = useState(false)
  const [exposureMode, setExposureMode] = useState('auto')
  const [exposurePercent, setExposurePercent] = useState(50)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const attachStream = useCallback((stream) => {
    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    streamRef.current = stream

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      const playPromise = videoRef.current.play()
      playPromise?.catch(() => {})
    }

    const track = stream.getVideoTracks()[0]
    const trackSettings = track?.getSettings?.() ?? {}
    const capabilities = track?.getCapabilities?.() ?? {}
    const exposureRange = capabilities.exposureTime
    const supportsManualExposure =
      isValidExposureRange(exposureRange) &&
      Array.isArray(capabilities.exposureMode) &&
      capabilities.exposureMode.includes('manual')

    setSettings({
      width: trackSettings.width ?? 0,
      height: trackSettings.height ?? 0,
      frameRate: trackSettings.frameRate ?? 0,
    })
    setDeviceName(track?.label?.replace(/\s*\([^)]*\)\s*$/, '').trim() || 'USB Camera')
    setStatus('connected')
    setError('')

    exposureRangeRef.current = supportsManualExposure ? exposureRange : null
    setExposureSupported(supportsManualExposure)
    const initialExposureMode = trackSettings.exposureMode === 'manual' ? 'manual' : 'auto'
    setExposureMode(initialExposureMode)
    const initialExposurePercent = exposurePercentFromTime(trackSettings.exposureTime, exposureRange)
    if (initialExposurePercent !== null) setExposurePercent(initialExposurePercent)

    // A previous app session may have left the UVC camera in manual mode.
    // Prefer auto exposure on launch, but keep the UI truthful if the device
    // rejects the switch back to continuous mode.
    if (supportsManualExposure && initialExposureMode === 'manual') {
      const requestId = ++exposureRequestRef.current
      exposureQueueRef.current = exposureQueueRef.current.then(async () => {
        if (requestId !== exposureRequestRef.current) return
        try {
          await track.applyConstraints({ advanced: [{ exposureMode: 'continuous' }] })
          if (requestId !== exposureRequestRef.current) return
          setExposureMode('auto')
          const actualPercent = exposurePercentFromTime(
            track.getSettings().exposureTime,
            exposureRange,
          )
          if (actualPercent !== null) setExposurePercent(actualPercent)
        } catch {
          if (requestId === exposureRequestRef.current) setExposureMode('manual')
        }
      })
    }

    track?.addEventListener('ended', () => {
      if (streamRef.current !== stream) return
      streamRef.current = null
      exposureRangeRef.current = null
      setExposureSupported(false)
      setStatus('error')
      setError('相机连接已断开，请检查 USB 摄像头连接。')
    })
  }, [])

  const setExposure = useCallback((percent) => {
    const track = streamRef.current?.getVideoTracks?.()[0]
    const range = exposureRangeRef.current
    if (!track || !isValidExposureRange(range)) return

    const nextPercent = Math.min(100, Math.max(0, Math.round(percent)))
    const nextExposureTime = exposureTimeFromPercent(nextPercent, range)
    if (nextExposureTime === null) return

    const requestId = ++exposureRequestRef.current
    setExposurePercent(nextPercent)
    setExposureMode('manual')

    exposureQueueRef.current = exposureQueueRef.current
      .then(async () => {
        if (requestId !== exposureRequestRef.current) return
        if (streamRef.current?.getVideoTracks?.()[0] !== track) return

        try {
          await track.applyConstraints({
            advanced: [{ exposureMode: 'manual', exposureTime: nextExposureTime }],
          })
          if (requestId !== exposureRequestRef.current) return
          const actualPercent = exposurePercentFromTime(track.getSettings().exposureTime, range)
          if (actualPercent !== null) setExposurePercent(actualPercent)
        } catch {
          if (requestId === exposureRequestRef.current) {
            setExposureMode(track.getSettings().exposureMode === 'manual' ? 'manual' : 'auto')
          }
        }
      })
      .catch(() => {})
  }, [])

  const setAutoExposure = useCallback(() => {
    const track = streamRef.current?.getVideoTracks?.()[0]
    const range = exposureRangeRef.current
    if (!track || !isValidExposureRange(range)) return

    const requestId = ++exposureRequestRef.current
    exposureQueueRef.current = exposureQueueRef.current
      .then(async () => {
        if (requestId !== exposureRequestRef.current) return
        if (streamRef.current?.getVideoTracks?.()[0] !== track) return

        try {
          await track.applyConstraints({ advanced: [{ exposureMode: 'continuous' }] })
          if (requestId !== exposureRequestRef.current) return
          setExposureMode('auto')
          const actualPercent = exposurePercentFromTime(track.getSettings().exposureTime, range)
          if (actualPercent !== null) setExposurePercent(actualPercent)
        } catch {
          // Keep the existing exposure if the device rejects auto exposure.
        }
      })
      .catch(() => {})
  }, [])

  const connect = useCallback(
    async (requestedDeviceId) => {
      const requestId = ++requestIdRef.current
      stopStream()
      exposureRangeRef.current = null
      setExposureSupported(false)
      setExposureMode('auto')
      setStatus('connecting')
      setError('')

      let pendingStream = null
      const cleanupPendingStream = () => {
        if (!pendingStream) return
        if (streamRef.current === pendingStream) {
          stopStream()
        } else {
          pendingStream.getTracks().forEach((track) => track.stop())
        }
        pendingStream = null
      }

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('当前运行环境不支持摄像头访问。')
        }

        const initialDevices = await listVideoDevices()
        if (!mountedRef.current || requestId !== requestIdRef.current) return

        setDevices(initialDevices)
        let selectedDevice = pickCamera(initialDevices, requestedDeviceId)
        const hasVisibleDeviceLabels = initialDevices.some((device) => Boolean(device.label))

        if (!selectedDevice && hasVisibleDeviceLabels && !requestedDeviceId) {
          throw createCameraError('NotFoundError', 'No physical camera available')
        }

        try {
          pendingStream = await openStream(selectedDevice?.deviceId)
        } catch (openError) {
          if (openError.name === 'OverconstrainedError') {
            pendingStream = await openStream()
            selectedDevice = null
          } else {
            throw openError
          }
        }

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          cleanupPendingStream()
          return
        }

        // Chrome/Electron may only reveal device labels after the first
        // permission grant. Re-check and switch to the USB camera if needed.
        const refreshedDevices = await listVideoDevices()
        if (!mountedRef.current || requestId !== requestIdRef.current) {
          cleanupPendingStream()
          return
        }

        setDevices(refreshedDevices)
        const preferredDevice = pickCamera(refreshedDevices, requestedDeviceId)
        const currentTrack = pendingStream.getVideoTracks()[0]
        const currentDeviceId = currentTrack?.getSettings?.().deviceId
        const currentLabel = currentTrack?.label ?? ''

        if (
          !requestedDeviceId &&
          VIRTUAL_CAMERA_PATTERN.test(currentLabel) &&
          !preferredDevice
        ) {
          throw createCameraError('NotFoundError', 'No physical camera available')
        }

        if (!requestedDeviceId && preferredDevice?.deviceId && preferredDevice.deviceId !== currentDeviceId) {
          cleanupPendingStream()
          pendingStream = await openStream(preferredDevice.deviceId)
          if (!mountedRef.current || requestId !== requestIdRef.current) {
            cleanupPendingStream()
            return
          }
        }

        attachStream(pendingStream)
        pendingStream = null
      } catch (cameraError) {
        cleanupPendingStream()
        if (!mountedRef.current || requestId !== requestIdRef.current) return
        setStatus('error')
        setError(describeCameraError(cameraError))
      }
    },
    [attachStream, stopStream],
  )

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
      stopStream()
    }
  }, [connect, stopStream])

  useEffect(() => {
    const mediaDevices = navigator.mediaDevices
    if (!mediaDevices?.addEventListener) return undefined

    const handleDeviceChange = async () => {
      if (!mountedRef.current) return
      const availableDevices = await listVideoDevices().catch(() => [])
      if (!mountedRef.current) return

      const preferredDevice = pickCamera(availableDevices)
      const currentTrack = streamRef.current?.getVideoTracks?.()[0]
      const currentLabel = currentTrack?.label ?? ''
      const currentDeviceId = currentTrack?.getSettings?.().deviceId

      if (!streamRef.current) {
        connect()
        return
      }

      // If a dedicated USB/endoscope camera is plugged in after the app
      // started on a built-in or virtual camera, switch to it automatically.
      if (
        preferredDevice?.deviceId &&
        preferredDevice.deviceId !== currentDeviceId &&
        (VIRTUAL_CAMERA_PATTERN.test(currentLabel) ||
          (USB_CAMERA_PATTERN.test(preferredDevice.label) &&
            !USB_CAMERA_PATTERN.test(currentLabel)))
      ) {
        connect(preferredDevice.deviceId)
      }
    }

    mediaDevices.addEventListener('devicechange', handleDeviceChange)
    return () => mediaDevices.removeEventListener('devicechange', handleDeviceChange)
  }, [connect])

  return {
    videoRef,
    status,
    error,
    deviceName,
    devices,
    settings,
    exposureSupported: exposureSupported && status === 'connected',
    exposureMode,
    exposurePercent,
    setExposure,
    setAutoExposure,
    retry: () => connect(),
  }
}
