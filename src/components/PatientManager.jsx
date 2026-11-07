import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FilePlus2,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { todayISO } from '../hooks/usePatientStore'

const inputClass =
  'h-9 w-full rounded-lg border border-[var(--line-soft)] bg-[var(--panel-soft)] px-3 text-[12px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20'

const textareaClass =
  'min-h-[78px] w-full resize-y rounded-lg border border-[var(--line-soft)] bg-[var(--panel-soft)] px-3 py-2 text-[12px] leading-[1.6] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-500/20'

const emptyPatientForm = {
  name: '',
  gender: '女',
  age: '',
  phone: '',
  recordNo: '',
  examDate: todayISO(),
  notes: '',
}

const emptyVisitForm = {
  id: null,
  date: todayISO(),
  doctor: '',
  chiefComplaint: '',
  presentIllness: '',
  examination: '',
  diagnosis: '',
  treatmentPlan: '',
  advice: '',
  followUp: '',
}

function Field({ label, required = false, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1 text-[10.5px] font-medium text-ink-500">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  )
}

function patientToForm(patient) {
  return {
    name: patient?.name || '',
    gender: patient?.gender || '女',
    age: patient?.age || '',
    phone: patient?.phone || '',
    recordNo: patient?.recordNo || '',
    examDate: patient?.examDate || todayISO(),
    notes: patient?.notes || '',
  }
}

function visitToForm(visit) {
  return {
    ...emptyVisitForm,
    ...visit,
  }
}

export default function PatientManager({
  open,
  initialTab = 'profile',
  patients,
  selectedPatient,
  selectedPatientId,
  onClose,
  onSelectPatient,
  onCreatePatient,
  onUpdatePatient,
  onDeletePatient,
  onAddVisit,
  onUpdateVisit,
  onDeleteVisit,
  onNotify,
}) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState(initialTab)
  const [creating, setCreating] = useState(false)
  const [patientForm, setPatientForm] = useState(emptyPatientForm)
  const [visitForm, setVisitForm] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setActiveTab(initialTab)
    setSearch('')
    setCreating(false)
    setVisitForm(null)
    setError('')
  }, [open, initialTab])

  useEffect(() => {
    if (!open || creating) return
    setPatientForm(patientToForm(selectedPatient))
    setVisitForm(null)
    setError('')
  }, [open, creating, selectedPatient])

  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return patients
    return patients.filter((patient) =>
      [patient.name, patient.recordNo, patient.phone].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query),
      ),
    )
  }, [patients, search])

  if (!open) return null

  const hasPatient = Boolean(selectedPatient)
  const showPatientForm = creating || !hasPatient
  const selectedVisits = selectedPatient?.visits ?? []

  const updatePatientField = (key, value) => {
    setPatientForm((current) => ({ ...current, [key]: value }))
  }

  const updateVisitField = (key, value) => {
    setVisitForm((current) => ({ ...current, [key]: value }))
  }

  const startCreate = () => {
    setCreating(true)
    setActiveTab('profile')
    setVisitForm(null)
    setPatientForm({ ...emptyPatientForm, examDate: todayISO() })
    setError('')
  }

  const handleSelectPatient = (patientId) => {
    setCreating(false)
    setVisitForm(null)
    setError('')
    onSelectPatient(patientId)
  }

  const handleSavePatient = () => {
    if (!patientForm.name.trim()) {
      setError('请填写患者姓名')
      return
    }

    if (creating || !selectedPatient) {
      onCreatePatient(patientForm)
      setCreating(false)
      setError('')
      onNotify?.('患者档案已创建')
    } else {
      onUpdatePatient(selectedPatient.id, patientForm)
      setError('')
      onNotify?.('患者资料已保存')
    }
  }

  const handleDeletePatient = () => {
    if (!selectedPatient) return
    if (!window.confirm(`确认删除患者「${selectedPatient.name}」及其全部病例记录吗？`)) return
    onDeletePatient(selectedPatient.id)
    setCreating(false)
    onNotify?.('患者档案已删除')
  }

  const startNewVisit = () => {
    setVisitForm({ ...emptyVisitForm, date: todayISO() })
    setActiveTab('records')
  }

  const startEditVisit = (visit) => {
    setVisitForm(visitToForm(visit))
    setActiveTab('records')
  }

  const handleSaveVisit = () => {
    if (!selectedPatient || !visitForm) return
    if (!visitForm.date) {
      setError('请选择就诊日期')
      return
    }
    if (visitForm.id) {
      onUpdateVisit(selectedPatient.id, visitForm.id, visitForm)
      onNotify?.('病例记录已更新')
    } else {
      onAddVisit(selectedPatient.id, visitForm)
      onNotify?.('病例记录已保存')
    }
    setVisitForm(null)
    setError('')
  }

  const handleDeleteVisit = (visit) => {
    if (!selectedPatient) return
    if (!window.confirm(`确认删除 ${visit.date} 的病例记录吗？`)) return
    onDeleteVisit(selectedPatient.id, visit.id)
    onNotify?.('病例记录已删除')
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0b1526]/50 p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="flex h-[min(820px,calc(100vh_-_48px))] w-[min(1120px,calc(100vw_-_48px))] flex-col overflow-hidden rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-float"
        role="dialog"
        aria-modal="true"
        aria-label="患者管理"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--line-soft)] px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              <UserRound size={18} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Patient Records
              </p>
              <h2 className="mt-0.5 text-[15px] font-semibold text-ink-900">患者管理</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-slate-100 hover:text-ink-800"
            aria-label="关闭患者管理"
          >
            <X size={17} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-[286px] shrink-0 flex-col border-r border-[var(--line-soft)] bg-[var(--panel-soft)]">
            <div className="space-y-2 p-3">
              <button
                type="button"
                onClick={startCreate}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-accent-600 text-[11.5px] font-semibold text-[var(--accent-on-color)] shadow-blue-glow transition hover:bg-accent-700"
              >
                <Plus size={14} />
                新建患者档案
              </button>
              <div className="relative">
                <Search
                  size={13.5}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="搜索姓名 / 病历号 / 电话"
                  className="h-9 w-full rounded-[10px] border border-[var(--line-soft)] bg-[var(--panel-bg)] pl-8 pr-3 text-[11px] text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-accent-400"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 thin-scroll">
              {filteredPatients.length > 0 ? (
                <div className="space-y-1">
                  {filteredPatients.map((patient) => {
                    const selected = patient.id === selectedPatientId && !creating
                    return (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handleSelectPatient(patient.id)}
                        className={`flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left transition ${
                          selected ? 'bg-accent-50 ring-1 ring-accent-200' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-[12px] font-semibold text-accent-700">
                          {patient.name.slice(0, 1) || '?'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[12px] font-semibold text-ink-900">
                              {patient.name}
                            </span>
                            <span className="shrink-0 text-[9px] text-ink-400">
                              {patient.gender || '—'} · {patient.age || '—'}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[9px] text-ink-400">
                            {patient.recordNo || '未分配病历号'}
                          </span>
                        </span>
                        <ChevronRight size={13} className="shrink-0 text-ink-300" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-3 py-10 text-center">
                  <UserRound size={23} className="mx-auto text-ink-300" strokeWidth={1.5} />
                  <p className="mt-7 text-[10.5px] text-ink-400">
                    {patients.length === 0 ? '还没有患者档案' : '没有匹配的患者'}
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-[var(--line-soft)] px-3 py-2 text-[9.5px] text-ink-400">
              共 {patients.length} 位患者 · 数据保存在本机
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            {showPatientForm ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto thin-scroll">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-6 py-5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                      {creating ? 'New Patient' : 'Patient Profile'}
                    </p>
                    <h3 className="mt-1 text-[18px] font-semibold text-ink-900">
                      {creating ? '新建患者档案' : '选择或新建患者'}
                    </h3>
                    <p className="mt-1 text-[10.5px] text-ink-400">
                      建立档案后即可录入初诊与后续病例记录。
                    </p>
                  </div>
                  {!creating && patients.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleSelectPatient(patients[0].id)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10.5px] font-medium text-accent-600 hover:bg-accent-50"
                    >
                      <ArrowLeft size={12} />
                      选择已有患者
                    </button>
                  ) : null}
                </div>

                <div className="grid content-start gap-4 px-6 py-5 md:grid-cols-2">
                  <Field label="姓名" required>
                    <input
                      autoFocus
                      value={patientForm.name}
                      onChange={(event) => updatePatientField('name', event.target.value)}
                      placeholder="请输入患者姓名"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="性别">
                    <select
                      value={patientForm.gender}
                      onChange={(event) => updatePatientField('gender', event.target.value)}
                      className={inputClass}
                    >
                      <option value="女">女</option>
                      <option value="男">男</option>
                      <option value="其他">其他</option>
                    </select>
                  </Field>
                  <Field label="年龄">
                    <input
                      value={patientForm.age}
                      onChange={(event) => updatePatientField('age', event.target.value)}
                      placeholder="例如 32 岁"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="联系电话">
                    <input
                      value={patientForm.phone}
                      onChange={(event) => updatePatientField('phone', event.target.value)}
                      placeholder="用于回访联系"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="病历号">
                    <input
                      value={patientForm.recordNo}
                      onChange={(event) => updatePatientField('recordNo', event.target.value)}
                      placeholder="留空则自动生成"
                      className={`${inputClass} font-mono`}
                    />
                  </Field>
                  <Field label="检查日期">
                    <input
                      type="date"
                      value={patientForm.examDate}
                      onChange={(event) => updatePatientField('examDate', event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="备注" className="md:col-span-2">
                    <textarea
                      value={patientForm.notes}
                      onChange={(event) => updatePatientField('notes', event.target.value)}
                      placeholder="记录过敏史、全身疾病、特殊注意事项等"
                      className={textareaClass}
                    />
                  </Field>
                  {error ? (
                    <p className="text-[10.5px] text-rose-500 md:col-span-2">{error}</p>
                  ) : null}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-[var(--line-soft)] px-6 py-4">
                  <div>
                    {!creating && selectedPatient ? (
                      <button
                        type="button"
                        onClick={handleDeletePatient}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10.5px] font-medium text-rose-500 transition hover:bg-rose-50"
                      >
                        <Trash2 size={12} />
                        删除患者
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {creating ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCreating(false)
                          setError('')
                        }}
                        className="h-9 rounded-lg px-3 text-[11px] font-medium text-ink-500 hover:bg-slate-100"
                      >
                        取消
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleSavePatient}
                      className="h-9 rounded-lg bg-accent-600 px-4 text-[11px] font-semibold text-[var(--accent-on-color)] shadow-blue-glow transition hover:bg-accent-700"
                    >
                      {creating || !selectedPatient ? '创建患者档案' : '保存资料'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="shrink-0 border-b border-[var(--line-soft)] px-6 pb-0 pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-50 text-[16px] font-semibold text-accent-700">
                        {selectedPatient.name.slice(0, 1)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[17px] font-semibold text-ink-900">
                            {selectedPatient.name}
                          </h3>
                          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600">
                            已建档
                          </span>
                        </div>
                        <p className="mt-0.5 font-mono text-[9.5px] text-ink-400">
                          {selectedPatient.recordNo || '未分配病历号'} · {selectedPatient.gender || '—'} ·{' '}
                          {selectedPatient.age || '—'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startNewVisit}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-accent-600 px-3 text-[10.5px] font-semibold text-[var(--accent-on-color)] shadow-blue-glow transition hover:bg-accent-700"
                    >
                      <FilePlus2 size={13} />
                      新增病例
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className={`border-b-2 pb-2.5 text-[11px] font-medium transition ${
                        activeTab === 'profile'
                          ? 'border-accent-600 text-accent-700'
                          : 'border-transparent text-ink-400 hover:text-ink-700'
                      }`}
                    >
                      基本资料
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('records')}
                      className={`border-b-2 pb-2.5 text-[11px] font-medium transition ${
                        activeTab === 'records'
                          ? 'border-accent-600 text-accent-700'
                          : 'border-transparent text-ink-400 hover:text-ink-700'
                      }`}
                    >
                      病例记录 <span className="ml-0.5 text-[9.5px]">({selectedVisits.length})</span>
                    </button>
                  </div>
                </div>

                {activeTab === 'records' ? (
                  visitForm ? (
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto thin-scroll">
                      <div className="flex items-start justify-between border-b border-[var(--line-soft)] px-6 py-4">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                            Clinical Note
                          </p>
                          <h3 className="mt-1 text-[15px] font-semibold text-ink-900">
                            {visitForm.id ? '编辑病例记录' : '新增病例记录'}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVisitForm(null)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-ink-400 hover:bg-slate-100 hover:text-ink-700"
                        >
                          <ArrowLeft size={12} />
                          返回记录
                        </button>
                      </div>
                      <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
                        <Field label="就诊日期" required>
                          <input
                            type="date"
                            value={visitForm.date}
                            onChange={(event) => updateVisitField('date', event.target.value)}
                            className={inputClass}
                          />
                        </Field>
                        <Field label="接诊医生">
                          <input
                            value={visitForm.doctor}
                            onChange={(event) => updateVisitField('doctor', event.target.value)}
                            placeholder="医生姓名"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="主诉" className="md:col-span-2">
                          <textarea
                            value={visitForm.chiefComplaint}
                            onChange={(event) => updateVisitField('chiefComplaint', event.target.value)}
                            placeholder="患者本次就诊的主要诉求"
                            className={textareaClass}
                          />
                        </Field>
                        <Field label="现病史" className="md:col-span-2">
                          <textarea
                            value={visitForm.presentIllness}
                            onChange={(event) => updateVisitField('presentIllness', event.target.value)}
                            placeholder="症状、持续时间、既往处理等"
                            className={textareaClass}
                          />
                        </Field>
                        <Field label="检查所见" className="md:col-span-2">
                          <textarea
                            value={visitForm.examination}
                            onChange={(event) => updateVisitField('examination', event.target.value)}
                            placeholder="口内检查、影像学检查等"
                            className={textareaClass}
                          />
                        </Field>
                        <Field label="诊断" className="md:col-span-2">
                          <textarea
                            value={visitForm.diagnosis}
                            onChange={(event) => updateVisitField('diagnosis', event.target.value)}
                            placeholder="临床诊断"
                            className={textareaClass}
                          />
                        </Field>
                        <Field label="治疗计划" className="md:col-span-2">
                          <textarea
                            value={visitForm.treatmentPlan}
                            onChange={(event) => updateVisitField('treatmentPlan', event.target.value)}
                            placeholder="本次及后续治疗安排"
                            className={textareaClass}
                          />
                        </Field>
                        <Field label="医嘱">
                          <textarea
                            value={visitForm.advice}
                            onChange={(event) => updateVisitField('advice', event.target.value)}
                            placeholder="注意事项、用药等"
                            className={textareaClass}
                          />
                        </Field>
                        <Field label="复诊日期">
                          <input
                            type="date"
                            value={visitForm.followUp}
                            onChange={(event) => updateVisitField('followUp', event.target.value)}
                            className={inputClass}
                          />
                        </Field>
                        {error ? (
                          <p className="text-[10.5px] text-rose-500 md:col-span-2">{error}</p>
                        ) : null}
                      </div>
                      <div className="mt-auto flex justify-end gap-2 border-t border-[var(--line-soft)] px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setVisitForm(null)}
                          className="h-9 rounded-lg px-3 text-[11px] font-medium text-ink-500 hover:bg-slate-100"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveVisit}
                          className="h-9 rounded-lg bg-accent-600 px-4 text-[11px] font-semibold text-[var(--accent-on-color)] shadow-blue-glow transition hover:bg-accent-700"
                        >
                          保存病例
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5 thin-scroll">
                      {selectedVisits.length > 0 ? (
                        <div className="space-y-2.5">
                          {selectedVisits.map((visit) => (
                            <article
                              key={visit.id}
                              className="rounded-[13px] border border-[var(--line-soft)] bg-[var(--panel-soft)] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 text-[10.5px] text-ink-400">
                                  <CalendarDays size={13} className="text-accent-500" />
                                  {visit.date}
                                  {visit.doctor ? <span>· {visit.doctor}</span> : null}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEditVisit(visit)}
                                    className="rounded-md px-1.5 py-1 text-[9.5px] font-medium text-accent-600 hover:bg-accent-50"
                                  >
                                    编辑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVisit(visit)}
                                    className="rounded-md p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-500"
                                    aria-label="删除病例"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                              <p className="mt-2 text-[12px] font-semibold text-ink-800">
                                {visit.diagnosis || '未填写诊断'}
                              </p>
                              <p className="mt-1 truncate text-[10.5px] text-ink-500">
                                {visit.chiefComplaint || visit.presentIllness || '暂无主诉记录'}
                              </p>
                              {visit.followUp ? (
                                <p className="mt-2 text-[9.5px] text-ink-400">
                                  复诊：{visit.followUp}
                                </p>
                              ) : null}
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-1 flex-col items-center justify-center text-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-500">
                            <Stethoscope size={22} strokeWidth={1.6} />
                          </span>
                          <p className="mt-3 text-[12px] font-semibold text-ink-700">
                            暂无病例记录
                          </p>
                          <p className="mt-1 text-[10.5px] text-ink-400">
                            记录主诉、检查、诊断和治疗计划，形成完整病例档案。
                          </p>
                          <button
                            type="button"
                            onClick={startNewVisit}
                            className="mt-4 flex h-8 items-center gap-1.5 rounded-lg bg-accent-600 px-3 text-[10.5px] font-semibold text-[var(--accent-on-color)]"
                          >
                            <Plus size={13} />
                            新增第一份病例
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto thin-scroll">
                    <div className="grid content-start gap-4 px-6 py-5 md:grid-cols-2">
                      <Field label="姓名" required>
                        <input
                          value={patientForm.name}
                          onChange={(event) => updatePatientField('name', event.target.value)}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="性别">
                        <select
                          value={patientForm.gender}
                          onChange={(event) => updatePatientField('gender', event.target.value)}
                          className={inputClass}
                        >
                          <option value="女">女</option>
                          <option value="男">男</option>
                          <option value="其他">其他</option>
                        </select>
                      </Field>
                      <Field label="年龄">
                        <input
                          value={patientForm.age}
                          onChange={(event) => updatePatientField('age', event.target.value)}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="联系电话">
                        <input
                          value={patientForm.phone}
                          onChange={(event) => updatePatientField('phone', event.target.value)}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="病历号">
                        <input
                          value={patientForm.recordNo}
                          onChange={(event) => updatePatientField('recordNo', event.target.value)}
                          className={`${inputClass} font-mono`}
                        />
                      </Field>
                      <Field label="检查日期">
                        <input
                          type="date"
                          value={patientForm.examDate}
                          onChange={(event) => updatePatientField('examDate', event.target.value)}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="备注" className="md:col-span-2">
                        <textarea
                          value={patientForm.notes}
                          onChange={(event) => updatePatientField('notes', event.target.value)}
                          placeholder="过敏史、全身疾病、特殊注意事项等"
                          className={textareaClass}
                        />
                      </Field>
                      {error ? (
                        <p className="text-[10.5px] text-rose-500 md:col-span-2">{error}</p>
                      ) : null}
                    </div>
                    <div className="mt-auto flex justify-between border-t border-[var(--line-soft)] px-6 py-4">
                      <button
                        type="button"
                        onClick={handleDeletePatient}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10.5px] font-medium text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 size={12} />
                        删除患者
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePatient}
                        className="h-9 rounded-lg bg-accent-600 px-4 text-[11px] font-semibold text-[var(--accent-on-color)] shadow-blue-glow transition hover:bg-accent-700"
                      >
                        保存资料
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
