import { useCallback, useEffect, useMemo, useState } from 'react'

const PATIENTS_KEY = ['dental', 'patients', 'v1'].join('.')
const SELECTED_PATIENT_KEY = ['dental', 'selectedPatient', 'v1'].join('.')

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function todayISO() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function normalizePatient(patient) {
  if (!patient || typeof patient !== 'object' || !patient.id) return null
  return {
    id: String(patient.id),
    recordNo: String(patient.recordNo || ''),
    name: String(patient.name || ''),
    gender: String(patient.gender || ''),
    age: String(patient.age ?? ''),
    phone: String(patient.phone || ''),
    examDate: String(patient.examDate || todayISO()),
    notes: String(patient.notes || ''),
    visits: Array.isArray(patient.visits)
      ? patient.visits
          .filter((visit) => visit && visit.id)
          .map((visit) => ({
            id: String(visit.id),
            date: String(visit.date || todayISO()),
            doctor: String(visit.doctor || ''),
            chiefComplaint: String(visit.chiefComplaint || ''),
            presentIllness: String(visit.presentIllness || ''),
            examination: String(visit.examination || ''),
            diagnosis: String(visit.diagnosis || ''),
            treatmentPlan: String(visit.treatmentPlan || ''),
            advice: String(visit.advice || ''),
            followUp: String(visit.followUp || ''),
            createdAt: String(visit.createdAt || ''),
          }))
      : [],
    createdAt: String(patient.createdAt || new Date().toISOString()),
    updatedAt: String(patient.updatedAt || new Date().toISOString()),
  }
}

function loadPatients() {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizePatient).filter(Boolean)
  } catch {
    return []
  }
}

function loadSelectedPatientId() {
  try {
    return localStorage.getItem(SELECTED_PATIENT_KEY) || null
  } catch {
    return null
  }
}

function generateRecordNo(patients) {
  const year = new Date().getFullYear()
  const prefix = `MR-${year}-`
  const max = patients.reduce((result, patient) => {
    if (!patient.recordNo?.startsWith(prefix)) return result
    const value = Number.parseInt(patient.recordNo.slice(prefix.length), 10)
    return Number.isFinite(value) ? Math.max(result, value) : result
  }, 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export default function usePatientStore() {
  const [patients, setPatients] = useState(loadPatients)
  const [selectedPatientId, setSelectedPatientId] = useState(loadSelectedPatientId)

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  )

  useEffect(() => {
    try {
      localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients))
    } catch {
      // Local persistence is optional; in-memory records still work.
    }
  }, [patients])

  useEffect(() => {
    try {
      if (selectedPatientId) localStorage.setItem(SELECTED_PATIENT_KEY, selectedPatientId)
      else localStorage.removeItem(SELECTED_PATIENT_KEY)
    } catch {
      // Ignore storage errors.
    }
  }, [selectedPatientId])

  useEffect(() => {
    if (selectedPatientId && !patients.some((patient) => patient.id === selectedPatientId)) {
      setSelectedPatientId(null)
    }
  }, [patients, selectedPatientId])

  const createPatient = useCallback(
    (payload) => {
      const now = new Date().toISOString()
      const patient = {
        id: makeId(),
        recordNo: payload.recordNo?.trim() || generateRecordNo(patients),
        name: payload.name?.trim() || '未命名患者',
        gender: payload.gender?.trim() || '',
        age: payload.age?.trim() || '',
        phone: payload.phone?.trim() || '',
        examDate: payload.examDate || todayISO(),
        notes: payload.notes?.trim() || '',
        visits: [],
        createdAt: now,
        updatedAt: now,
      }
      setPatients((current) => [patient, ...current])
      setSelectedPatientId(patient.id)
      return patient
    },
    [patients],
  )

  const updatePatient = useCallback((patientId, payload) => {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              ...payload,
              name: payload.name?.trim() || patient.name,
              recordNo: payload.recordNo?.trim() || patient.recordNo,
              age: String(payload.age ?? patient.age),
              updatedAt: new Date().toISOString(),
            }
          : patient,
      ),
    )
  }, [])

  const deletePatient = useCallback(
    (patientId) => {
      setPatients((current) => current.filter((patient) => patient.id !== patientId))
      if (selectedPatientId === patientId) setSelectedPatientId(null)
    },
    [selectedPatientId],
  )

  const addVisit = useCallback((patientId, payload) => {
    const visit = {
      id: makeId(),
      date: payload.date || todayISO(),
      doctor: payload.doctor?.trim() || '',
      chiefComplaint: payload.chiefComplaint?.trim() || '',
      presentIllness: payload.presentIllness?.trim() || '',
      examination: payload.examination?.trim() || '',
      diagnosis: payload.diagnosis?.trim() || '',
      treatmentPlan: payload.treatmentPlan?.trim() || '',
      advice: payload.advice?.trim() || '',
      followUp: payload.followUp || '',
      createdAt: new Date().toISOString(),
    }

    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              examDate: visit.date,
              visits: [visit, ...patient.visits],
              updatedAt: new Date().toISOString(),
            }
          : patient,
      ),
    )
    return visit
  }, [])

  const updateVisit = useCallback((patientId, visitId, payload) => {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              examDate: payload.date || patient.examDate,
              visits: patient.visits.map((visit) =>
                visit.id === visitId
                  ? {
                      ...visit,
                      ...payload,
                      date: payload.date || visit.date,
                    }
                  : visit,
              ),
              updatedAt: new Date().toISOString(),
            }
          : patient,
      ),
    )
  }, [])

  const deleteVisit = useCallback((patientId, visitId) => {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? {
              ...patient,
              visits: patient.visits.filter((visit) => visit.id !== visitId),
              updatedAt: new Date().toISOString(),
            }
          : patient,
      ),
    )
  }, [])

  return {
    patients,
    selectedPatient,
    selectedPatientId,
    setSelectedPatientId,
    createPatient,
    updatePatient,
    deletePatient,
    addVisit,
    updateVisit,
    deleteVisit,
  }
}

export { todayISO, makeId }
