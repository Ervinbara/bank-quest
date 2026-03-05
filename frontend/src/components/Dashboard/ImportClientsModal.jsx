import { useMemo, useState } from 'react'
import { X, Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { importClientsBatch } from '@/services/clientService'
import { getPlanAccess, getRemainingClientSlots } from '@/lib/planAccess'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeHeader = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')

const detectDefaultMapping = (headers) => {
  const normalized = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header)
  }))

  const findByKeywords = (keywords) =>
    normalized.find((item) => keywords.some((keyword) => item.normalized.includes(keyword)))?.original || ''

  return {
    name: findByKeywords(['name', 'nom', 'client']),
    email: findByKeywords(['email', 'e-mail', 'mail'])
  }
}

const parseCsvLine = (line, delimiter) => {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

const parseCsvText = (text) => {
  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (rawLines.length < 2) return { headers: [], rows: [] }

  const delimiter =
    (rawLines[0].match(/;/g) || []).length > (rawLines[0].match(/,/g) || []).length ? ';' : ','

  const headers = parseCsvLine(rawLines[0], delimiter)
  const rows = rawLines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter)
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })
    return row
  })

  return { headers, rows }
}

export default function ImportClientsModal({
  isOpen,
  advisorId,
  advisorPlan,
  currentClientCount = 0,
  onClose,
  onImported,
  tr
}) {
  const [step, setStep] = useState('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [mapping, setMapping] = useState({ name: '', email: '' })
  const [importResult, setImportResult] = useState(null)
  const planAccess = getPlanAccess(advisorPlan)
  const remainingClientSlots = getRemainingClientSlots({
    plan: planAccess.code,
    clientCount: currentClientCount
  })
  const importLocked = remainingClientSlots !== null && remainingClientSlots <= 0

  const resetState = () => {
    setStep('upload')
    setLoading(false)
    setError(null)
    setFileName('')
    setHeaders([])
    setRows([])
    setMapping({ name: '', email: '' })
    setImportResult(null)
  }

  const closeAndReset = () => {
    resetState()
    onClose()
  }

  const handleFile = async (file) => {
    if (!file) return

    try {
      setLoading(true)
      setError(null)
      setImportResult(null)
      setFileName(file.name)

      let parsedHeaders = []
      let parsedRows = []
      const lowerName = file.name.toLowerCase()

      if (lowerName.endsWith('.csv')) {
        const text = await file.text()
        const parsed = parseCsvText(text)
        parsedHeaders = parsed.headers
        parsedRows = parsed.rows
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const XLSX = await import('xlsx')
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const firstSheet = workbook.Sheets[firstSheetName]
        const json = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
        parsedRows = json
        parsedHeaders = Object.keys(json[0] || {})
      } else {
        throw new Error(tr('Format de fichier non supporte', 'Unsupported file format'))
      }

      if (parsedHeaders.length === 0 || parsedRows.length === 0) {
        throw new Error(tr('Aucune donnee exploitable dans le fichier', 'No usable data found in file'))
      }

      setHeaders(parsedHeaders)
      setRows(parsedRows)
      setMapping(detectDefaultMapping(parsedHeaders))
      setStep('mapping')
    } catch (err) {
      setError(err.message || tr("Impossible de lire le fichier", 'Unable to read file'))
    } finally {
      setLoading(false)
    }
  }

  const mappedPreviewRows = useMemo(() => {
    return rows.slice(0, 8).map((row) => ({
      name: String(row[mapping.name] || '').trim(),
      email: String(row[mapping.email] || '').trim()
    }))
  }, [rows, mapping.email, mapping.name])

  const mappedRows = useMemo(() => {
    return rows.map((row) => ({
      name: String(row[mapping.name] || '').trim(),
      email: String(row[mapping.email] || '').trim()
    }))
  }, [rows, mapping.email, mapping.name])

  const mappedStats = useMemo(() => {
    let invalid = 0
    const uniqueEmails = new Set()
    let duplicatesInFile = 0

    mappedRows.forEach((row) => {
      const normalizedEmail = row.email.toLowerCase()
      if (!row.name || !row.email || !EMAIL_REGEX.test(row.email)) {
        invalid += 1
        return
      }

      if (uniqueEmails.has(normalizedEmail)) {
        duplicatesInFile += 1
      } else {
        uniqueEmails.add(normalizedEmail)
      }
    })

    return {
      total: mappedRows.length,
      validUnique: uniqueEmails.size,
      invalid,
      duplicatesInFile
    }
  }, [mappedRows])

  const handleImport = async () => {
    if (!advisorId) return
    if (importLocked) {
      setError(
        `Limite atteinte pour le plan ${planAccess.label}: ${planAccess.maxClients} clients maximum.`
      )
      return
    }
    if (!mapping.name || !mapping.email) {
      setError(tr('Selectionnez les colonnes nom et email', 'Select name and email columns'))
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await importClientsBatch({ advisorId, clients: mappedRows })
      setImportResult({
        ...result,
        duplicatesInFile: mappedStats.duplicatesInFile
      })
      setStep('result')
      if (typeof onImported === 'function') onImported(result)
    } catch (err) {
      setError(err.message || tr("Echec de l'import", 'Import failed'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={closeAndReset}>
      <div
        className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-3xl rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-5 sm:p-6 sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">{tr('Importer des clients', 'Import clients')}</h3>
              <p className="text-emerald-100 text-sm mt-1">
                {tr(
                  'Formats supportes: CSV, XLSX. Vous pourrez mapper les colonnes avant import.',
                  'Supported formats: CSV, XLSX. You can map columns before import.'
                )}
              </p>
            </div>
            <button onClick={closeAndReset} className="p-2 rounded-lg hover:bg-white/15 transition" title="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {remainingClientSlots !== null ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {tr(
                `Plan ${planAccess.label}: ${remainingClientSlots} client(s) restant(s) sur ${planAccess.maxClients}.`,
                `Plan ${planAccess.label}: ${remainingClientSlots} client slot(s) left of ${planAccess.maxClients}.`
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {tr(`Plan ${planAccess.label}: clients illimites.`, `Plan ${planAccess.label}: unlimited clients.`)}
            </div>
          )}

          {step === 'upload' ? (
            <div className="space-y-4">
              <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-500 transition cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-700">{tr('Selectionner un fichier', 'Select a file')}</p>
                <p className="text-sm text-gray-500 mt-1">CSV / XLSX</p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  disabled={importLocked}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    void handleFile(file)
                  }}
                />
              </label>
              {fileName ? <p className="text-sm text-gray-600">{tr('Fichier', 'File')}: {fileName}</p> : null}
            </div>
          ) : null}

          {step === 'mapping' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{tr('Colonne nom', 'Name column')}</label>
                  <select
                    value={mapping.name}
                    onChange={(event) => setMapping((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{tr('Selectionner...', 'Select...')}</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{tr('Colonne email', 'Email column')}</label>
                  <select
                    value={mapping.email}
                    onChange={(event) => setMapping((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{tr('Selectionner...', 'Select...')}</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">{tr('Apercu', 'Preview')}</p>
                <div className="space-y-2">
                  {mappedPreviewRows.map((row, index) => (
                    <div key={`${row.email}-${index}`} className="text-sm text-gray-700 flex justify-between gap-3">
                      <span className="truncate">{row.name || '-'}</span>
                      <span className="truncate text-gray-500">{row.email || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <p>{tr('Lignes detectees', 'Detected rows')}: {mappedStats.total}</p>
                <p>{tr('Lignes valides uniques', 'Valid unique rows')}: {mappedStats.validUnique}</p>
                <p>{tr('Lignes invalides', 'Invalid rows')}: {mappedStats.invalid}</p>
                <p>{tr('Doublons dans le fichier', 'Duplicates in file')}: {mappedStats.duplicatesInFile}</p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAndReset}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  {tr('Annuler', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 transition disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {tr('Importer', 'Import')}
                </button>
              </div>
            </div>
          ) : null}

          {step === 'result' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900">{tr('Import termine', 'Import complete')}</h4>
                  <p className="text-sm text-gray-600">
                    {tr('Resume des operations effectuees', 'Summary of completed operations')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  {tr('Crees', 'Created')}: <span className="font-bold">{importResult?.created ?? 0}</span>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  {tr('Doublons existants ignores', 'Existing duplicates skipped')}:{' '}
                  <span className="font-bold">{importResult?.skippedExisting ?? 0}</span>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  {tr('Lignes invalides ignorees', 'Invalid rows skipped')}:{' '}
                  <span className="font-bold">{importResult?.invalid ?? 0}</span>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  {tr('Doublons internes au fichier', 'File-internal duplicates')}:{' '}
                  <span className="font-bold">{importResult?.duplicatesInFile ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <AlertTriangle className="w-4 h-4" />
                  {tr(
                    "Vous pouvez relancer un import avec le meme fichier, les clients deja existants seront ignores.",
                    'You can re-run import with the same file; existing clients will be skipped.'
                  )}
                </div>
                <button
                  type="button"
                  onClick={closeAndReset}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  {tr('Fermer', 'Close')}
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
