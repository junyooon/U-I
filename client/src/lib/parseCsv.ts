import type { ImportRow } from '../api/import'

// Minimal RFC 4180-compliant CSV parser
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else field += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { fields.push(field); field = '' }
      else field += ch
    }
  }
  fields.push(field)
  return fields
}

export function parseCsv(text: string): { rows: ImportRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { rows: [], errors: ['File must have a header row and at least one data row.'] }

  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase())
  const nameIdx = headers.indexOf('name')
  if (nameIdx === -1) return { rows: [], errors: ['CSV must have a "name" column.'] }

  const emailIdx = headers.indexOf('email')
  const phoneIdx = headers.indexOf('phone')
  const notesIdx = headers.indexOf('notes')
  const categoriesIdx = headers.findIndex(h => h === 'categories' || h === 'category')

  const rows: ImportRow[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    const name = cells[nameIdx]?.trim()
    if (!name) { errors.push(`Row ${i + 1}: missing name, skipped.`); continue }

    rows.push({
      name,
      email: emailIdx >= 0 ? (cells[emailIdx]?.trim() || null) : null,
      phone: phoneIdx >= 0 ? (cells[phoneIdx]?.trim() || null) : null,
      notes: notesIdx >= 0 ? (cells[notesIdx]?.trim() || null) : null,
      category_names: categoriesIdx >= 0
        ? (cells[categoriesIdx] ?? '').split(';').map(s => s.trim()).filter(Boolean)
        : [],
    })
  }

  return { rows, errors }
}
