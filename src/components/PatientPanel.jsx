import { ChevronLeft, ChevronRight, FileText, UserPlus, UserRound, UsersRound } from 'lucide-react'
import { useMemo } from 'react'

function displayValue(value) {
  return value === null || value === undefined || value === '' ? '—' : value
}

function InfoRow({ label, value, mono = false }) {
  const isEmpty = value === '—'
  return (
    <div className="flex min-h-[43px] items-center justify-between gap-4 border-b border-slate-100/90 py-[11px] last:border-b-0">
      <span className="shrink-0 text-[11.5px] text-ink-400">{label}</span>
      <span
        className={`truncate text-right text-[13px] font-semibold ${
          isEmpty ? 'text-ink-300' : 'text-ink-900'
        } ${mono ? 'font-mono text-[12px] tracking-[0.02em]' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

export default function PatientPanel({ patient, collapsed, onToggle, onOpenRecord, onOpenManager }) {
  const hasPatient = Boolean(patient?.name)
  const fields = useMemo(
    () => [
      { label: '姓名', value: displayValue(patient?.name) },
      { label: '性别', value: displayValue(patient?.gender) },
      { label: '年龄', value: displayValue(patient?.age) },
      { label: '病历号', value: displayValue(patient?.recordNo), mono: true },
      { label: '检查日期', value: displayValue(patient?.examDate) },
    ],
    [patient],
  )

  if (collapsed) {
    return (
      <aside className="panel flex h-full min-w-0 flex-col items-center overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-panel">
        <button
          type="button"
          onClick={onToggle}
          className="mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-slate-100 hover:text-ink-800"
          aria-label="展开患者信息"
          title="展开患者信息"
        >
          <ChevronRight size={17} />
        </button>

        <button
          type="button"
          onClick={onOpenManager}
          className="mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-100 to-accent-50 text-accent-600 ring-4 ring-[var(--panel-bg)]"
          aria-label="患者管理"
          title="患者管理"
        >
          {hasPatient ? (
            <span className="text-[14px] font-semibold text-accent-700">
              {patient.name.slice(0, 1)}
            </span>
          ) : (
            <UserRound size={17} strokeWidth={1.8} />
          )}
        </button>

        <div className="mt-5 flex min-h-0 flex-1 items-start justify-center">
          <span className="vertical-label text-[11px] font-semibold tracking-[0.22em] text-ink-500">
            患者信息
          </span>
        </div>

        <button
          type="button"
          onClick={hasPatient ? onOpenRecord : onOpenManager}
          className="mb-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 transition hover:bg-accent-100"
          aria-label={hasPatient ? '查看病历' : '选择患者'}
          title={hasPatient ? '查看病历' : '选择患者'}
        >
          <FileText size={17} strokeWidth={1.8} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="panel flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-panel">
      <div className="flex shrink-0 items-start justify-between px-5 pb-3 pt-5">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-ink-500">
            Patient
          </p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-[0.01em] text-ink-900">
            患者信息
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenManager}
            className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-slate-100 hover:text-accent-600"
            aria-label="患者管理"
            title="患者管理"
          >
            <UsersRound size={16} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-slate-100 hover:text-ink-800"
            aria-label="收起患者信息"
            title="收起患者信息"
          >
            <ChevronLeft size={17} />
          </button>
        </div>
      </div>

      <div className="shrink-0 px-4">
        <div className="patient-summary relative overflow-hidden rounded-[16px] border border-[var(--panel-border)] px-4 py-3.5">
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-accent-600 shadow-sm ring-1 ring-white">
              {hasPatient ? (
                <span className="text-[16px] font-semibold text-accent-700">
                  {patient.name.slice(0, 1)}
                </span>
              ) : (
                <UserRound size={19} strokeWidth={1.7} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`truncate text-[14.5px] font-semibold tracking-[0.01em] ${hasPatient ? 'text-ink-900' : 'text-ink-700'}`}>
                  {hasPatient ? patient.name : '未选择患者'}
                </p>
                {hasPatient ? (
                  <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-accent-600 ring-1 ring-accent-200">
                    已选择
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-ink-500">
                {hasPatient ? `${patient.gender || '—'} · ${patient.age || '—'} · 口腔检查` : '请选择患者'}
              </p>
            </div>
          </div>
        </div>
        {!hasPatient ? (
          <button
            type="button"
            onClick={onOpenManager}
            className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-accent-200 bg-accent-50/60 text-[10.5px] font-medium text-accent-700 transition hover:bg-accent-50"
          >
            <UserPlus size={13} />
            新建 / 选择患者
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 thin-scroll">
        <div>
          {fields.map((field) => (
            <InfoRow key={field.label} {...field} />
          ))}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={hasPatient ? onOpenRecord : onOpenManager}
          className="group flex h-11 w-full items-center justify-center gap-2 rounded-[13px] bg-accent-600 px-4 text-[12.5px] font-semibold text-[var(--accent-on-color)] shadow-blue-glow transition hover:bg-accent-700 active:scale-[0.99]"
        >
          {hasPatient ? <FileText size={16} strokeWidth={1.9} /> : <UserPlus size={16} strokeWidth={1.9} />}
          <span>{hasPatient ? '查看病历' : '选择患者'}</span>
          <ChevronRight
            size={15}
            className="ml-auto text-[var(--accent-on-color)] opacity-70 transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </div>
    </aside>
  )
}
