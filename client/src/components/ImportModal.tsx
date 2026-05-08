import { useEffect, useRef, useState } from 'react'
import { useImportContacts } from '../api/import'
import { parseCsv } from '../lib/parseCsv'
import type { ImportRow } from '../api/import'

interface Props {
  onClose: () => void
}

export default function ImportModal({ onClose }: Props) {
  const [rows, setRows] = useState<ImportRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const importContacts = useImportContacts()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function processFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseErrors(['Please upload a .csv file.'])
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { rows, errors } = parseCsv(text)
      setRows(rows)
      setParseErrors(errors)
    }
    reader.readAsText(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  async function handleImport() {
    await importContacts.mutateAsync(rows)
    setDone(true)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '520px', maxWidth: 'calc(100vw - 32px)', maxHeight: '80vh',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-md)',
          borderRadius: '14px',
          padding: '28px',
          display: 'flex', flexDirection: 'column', gap: '20px',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div>
          <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            Import contacts
          </h2>
          <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5' }}>
            Upload a CSV with columns: <code style={{ color: '#6b7280' }}>name</code>,{' '}
            <code style={{ color: '#6b7280' }}>email</code>,{' '}
            <code style={{ color: '#6b7280' }}>phone</code>,{' '}
            <code style={{ color: '#6b7280' }}>notes</code>,{' '}
            <code style={{ color: '#6b7280' }}>categories</code>{' '}
            (semicolon-separated, e.g. <code style={{ color: '#6b7280' }}>Work;College</code>).
            Only <code style={{ color: '#6b7280' }}>name</code> is required.
          </p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>✓</p>
            <p style={{ color: '#4ade80', fontSize: '15px', fontWeight: 600 }}>
              {importContacts.data?.imported} contact{importContacts.data?.imported !== 1 ? 's' : ''} imported
            </p>
            <button onClick={onClose} style={{ ...submitStyle, marginTop: '20px' }}>Done</button>
          </div>
        ) : (
          <>
            {/* Drop zone */}
            {rows.length === 0 && (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '10px',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragging ? 'rgba(59,130,246,0.05)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>📂</p>
                <p style={{ color: '#6b7280', fontSize: '13px' }}>
                  Drop a CSV file here, or click to browse
                </p>
                <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
            )}

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {parseErrors.map((e, i) => (
                  <p key={i} style={{ fontSize: '12px', color: '#f87171' }}>{e}</p>
                ))}
              </div>
            )}

            {/* Preview table */}
            {rows.length > 0 && (
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>
                    {rows.length} contact{rows.length !== 1 ? 's' : ''} ready to import
                  </p>
                  <button
                    onClick={() => { setRows([]); setParseErrors([]) }}
                    style={{ fontSize: '12px', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {rows.slice(0, 50).map((row, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr',
                      gap: '4px 12px', padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <span style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: 500 }}>{row.name}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280', textAlign: 'right' }}>
                        {row.category_names.length > 0 ? row.category_names.join(', ') : '—'}
                      </span>
                      {(row.email || row.phone) && (
                        <span style={{ fontSize: '11px', color: '#4b5563', gridColumn: '1 / -1' }}>
                          {[row.email, row.phone].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  ))}
                  {rows.length > 50 && (
                    <p style={{ fontSize: '12px', color: '#4b5563', textAlign: 'center', padding: '8px' }}>
                      + {rows.length - 50} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Import error */}
            {importContacts.error && (
              <p style={{ fontSize: '12px', color: '#f87171' }}>
                {(importContacts.error as Error).message}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={cancelStyle}>Cancel</button>
              {rows.length > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importContacts.isPending}
                  style={submitStyle}
                >
                  {importContacts.isPending ? 'Importing…' : `Import ${rows.length} contact${rows.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const cancelStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent', color: '#6b7280',
  fontSize: '13px', cursor: 'pointer',
}
const submitStyle: React.CSSProperties = {
  padding: '9px 20px', borderRadius: '8px',
  border: 'none', background: '#3b82f6',
  color: '#fff', fontSize: '13px',
  fontWeight: 600, cursor: 'pointer',
}
