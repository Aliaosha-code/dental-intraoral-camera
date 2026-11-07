export const DEFAULT_THEME_ID = 'warm'
export const DEFAULT_ACCENT = '#3478f6'
export const DEFAULT_CUSTOM_BG = '#e5e0d6'

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export function normalizeHexColor(value, fallback = DEFAULT_ACCENT) {
  if (typeof value !== 'string') return fallback
  const candidate = value.trim().toLowerCase()
  return HEX_COLOR_PATTERN.test(candidate) ? candidate : fallback
}

export function isKnownThemeId(themeId) {
  return themeId === 'custom' || THEME_PRESETS.some((preset) => preset.id === themeId)
}

export const THEME_PRESETS = [
  {
    id: 'soft',
    name: '柔和灰',
    swatch: '#d9e0e8',
    appBg: '#e2e8ef',
    appBgTop: '#edf1f6',
    panel: '#f4f6f8',
    panelSoft: '#e9edf2',
    panelBorder: 'rgba(255, 255, 255, 0.7)',
    glow: 'rgba(255, 255, 255, 0.68)',
    isDark: false,
  },
  {
    id: 'warm',
    name: '暖米',
    swatch: '#e7ddce',
    appBg: '#e5ded2',
    appBgTop: '#f0e9de',
    panel: '#f4efe6',
    panelSoft: '#ebe3d7',
    panelBorder: 'rgba(255, 255, 255, 0.62)',
    glow: 'rgba(255, 249, 238, 0.58)',
    isDark: false,
  },
  {
    id: 'mist',
    name: '雾蓝',
    swatch: '#d7e3ef',
    appBg: '#dde7f1',
    appBgTop: '#e9f0f7',
    panel: '#f1f5f9',
    panelSoft: '#e5edf5',
    panelBorder: 'rgba(255, 255, 255, 0.7)',
    glow: 'rgba(235, 245, 255, 0.64)',
    isDark: false,
  },
  {
    id: 'dark',
    name: '深色',
    swatch: '#111b2a',
    appBg: '#0b1320',
    appBgTop: '#111d2d',
    panel: '#152131',
    panelSoft: '#1d2b3d',
    panelBorder: 'rgba(148, 184, 255, 0.09)',
    glow: 'rgba(47, 112, 240, 0.14)',
    isDark: true,
  },
]

export const ACCENT_PRESETS = [
  { id: 'blue', name: '医疗蓝', value: DEFAULT_ACCENT },
  { id: 'teal', name: '青绿', value: '#0e9f8e' },
  { id: 'sage', name: '鼠尾草', value: '#688b70' },
  { id: 'violet', name: '紫罗兰', value: '#796bdd' },
  { id: 'coral', name: '陶土', value: '#c56e55' },
  { id: 'rose', name: '玫瑰', value: '#c45d7b' },
]

const LIGHT_INK = {
  950: '11 21 38',
  900: '20 32 51',
  800: '29 43 64',
  700: '46 61 82',
  600: '64 80 102',
  500: '82 98 122',
  400: '92 107 128',
  300: '124 138 157',
}

const DARK_INK = {
  950: '248 250 252',
  900: '241 245 249',
  800: '226 232 240',
  700: '203 213 225',
  600: '168 181 200',
  500: '148 163 184',
  400: '132 148 170',
  300: '107 124 147',
}

function hexToRgb(hex) {
  const value = hex.replace('#', '').trim()
  const normalized =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value
  const number = Number.parseInt(normalized, 16)
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  }
}

function rgbString({ r, g, b }) {
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`
}

function mixHex(a, b, weightB) {
  const first = hexToRgb(a)
  const second = hexToRgb(b)
  return `#${[first.r, first.g, first.b]
    .map((value, index) => {
      const blended = value * (1 - weightB) + [second.r, second.g, second.b][index] * weightB
      return Math.round(blended).toString(16).padStart(2, '0')
    })
    .join('')}`
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const toLinear = (value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastRatio(a, b) {
  const first = relativeLuminance(a)
  const second = relativeLuminance(b)
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

function ensureContrast(hex, background, target = 4.5) {
  const darken = relativeLuminance(background) > 0.45
  let result = hex
  for (let index = 0; index < 20 && contrastRatio(result, background) < target; index += 1) {
    result = mixHex(result, darken ? '#000000' : '#ffffff', 0.08)
  }
  return result
}

function createCustomPreset(customBg) {
  const safeBg = normalizeHexColor(customBg, DEFAULT_CUSTOM_BG)
  const isDark = relativeLuminance(safeBg) < 0.18
  return {
    id: 'custom',
    name: '自定义',
    swatch: safeBg,
    appBg: safeBg,
    appBgTop: isDark ? mixHex(safeBg, '#ffffff', 0.05) : mixHex(safeBg, '#ffffff', 0.28),
    panel: isDark ? mixHex(safeBg, '#ffffff', 0.075) : mixHex(safeBg, '#ffffff', 0.74),
    panelSoft: isDark ? mixHex(safeBg, '#ffffff', 0.12) : mixHex(safeBg, '#ffffff', 0.58),
    panelBorder: isDark ? 'rgba(148, 184, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)',
    glow: isDark ? 'rgba(47, 112, 240, 0.12)' : 'rgba(255, 255, 255, 0.62)',
    isDark,
  }
}

export function resolveTheme(themeId, customBg = DEFAULT_CUSTOM_BG) {
  if (themeId === 'custom') return createCustomPreset(customBg)
  return THEME_PRESETS.find((preset) => preset.id === themeId) ?? THEME_PRESETS[1]
}

export function createThemeStyle(preset, accent = DEFAULT_ACCENT) {
  const isDark = preset.isDark
  const ink = isDark ? DARK_INK : LIGHT_INK
  const safeAccent = normalizeHexColor(accent, DEFAULT_ACCENT)
  const accentBase = isDark ? preset.panel : '#ffffff'
  const accentSoft = (weight) => rgbString(hexToRgb(mixHex(safeAccent, accentBase, weight)))
  const accentContrastTarget = isDark ? preset.panel : '#ffffff'
  const accent600 = ensureContrast(safeAccent, accentContrastTarget, 4.8)
  const accent700 = isDark
    ? mixHex(accent600, '#ffffff', 0.12)
    : mixHex(accent600, '#000000', 0.14)
  const onAccent =
    contrastRatio('#000000', accent600) >= contrastRatio('#ffffff', accent600)
      ? '#101828'
      : '#ffffff'

  return {
    '--app-bg': preset.appBg,
    '--app-bg-top': preset.appBgTop,
    '--app-glow': preset.glow,
    '--panel-bg': preset.panel,
    '--panel-soft': preset.panelSoft,
    '--panel-border': preset.panelBorder,
    '--glass-bg': isDark ? 'rgba(21, 33, 49, 0.94)' : 'rgba(255, 255, 255, 0.94)',
    '--line-soft': isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(226, 232, 240, 0.9)',
    '--ink-950': ink[950],
    '--ink-900': ink[900],
    '--ink-800': ink[800],
    '--ink-700': ink[700],
    '--ink-600': ink[600],
    '--ink-500': ink[500],
    '--ink-400': ink[400],
    '--ink-300': ink[300],
    '--accent-50': accentSoft(isDark ? 0.84 : 0.92),
    '--accent-100': accentSoft(isDark ? 0.73 : 0.84),
    '--accent-200': accentSoft(isDark ? 0.56 : 0.68),
    '--accent-300': accentSoft(isDark ? 0.35 : 0.42),
    '--accent-400': accentSoft(isDark ? 0.16 : 0.2),
    '--accent-500': rgbString(hexToRgb(safeAccent)),
    '--accent-600': rgbString(hexToRgb(accent600)),
    '--accent-700': rgbString(hexToRgb(accent700)),
    '--accent-on-color': onAccent,
    '--accent': safeAccent,
  }
}
