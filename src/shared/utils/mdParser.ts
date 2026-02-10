/**
 * Parse Markdown table to leads array
 * Supports standard MD table format with | separators
 */
export function parseMDTable(mdContent: string) {
  const lines = mdContent.trim().split('\n')
  const leads: any[] = []

  // Find table start (line with | at start)
  let headerLine = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('|') && line.includes('|')) {
      headerLine = i
      break
    }
  }

  if (headerLine === -1) return []

  // Parse header
  const headers = parseMDRow(lines[headerLine])

  // Map common header variations
  const headerMap = {
    'company': 'name',
    'company name': 'name',
    'business': 'name',
    'contact': 'contactPerson',
    'contact person': 'contactPerson',
    'contact name': 'contactPerson',
    'person': 'contactPerson',
    'email': 'email',
    'email address': 'email',
    'phone': 'phone',
    'phone number': 'phone',
    'mobile': 'phone',
    'website': 'website',
    'url': 'website',
    'site': 'website',
    'industry': 'industry',
    'sector': 'industry',
    'category': 'industry',
    'source': 'source',
    'lead source': 'source',
    'notes': 'notes',
    'comments': 'notes',
    'description': 'notes'
  }

  const normalizedHeaders = headers.map(h => {
    const lower = h.toLowerCase().trim()
    return headerMap[lower] || lower
  })

  // Skip separator line (---) and parse data
  for (let i = headerLine + 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || !line.startsWith('|')) continue

    const values = parseMDRow(line)

    const lead = {
      id: crypto.randomUUID(),
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      website: '',
      industry: '',
      status: 'new',
      source: 'md-import',
      notes: '',
      websiteIssues: [],
      tags: [],
      createdAt: new Date().toISOString(),
      lastContactedAt: null,
      linkedBoardId: null
    }

    normalizedHeaders.forEach((header, index) => {
      if (lead.hasOwnProperty(header) && values[index]) {
        (lead as any)[header] = values[index].trim()
      }
    })

    // Only add if has email or name
    if (lead.email || lead.name) {
      leads.push(lead)
    }
  }

  return leads
}

/**
 * Parse a single MD table row
 */
function parseMDRow(row: string) {
  // Remove leading/trailing | and split
  const trimmed = row.trim()
  const withoutEdges = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed
  const final = withoutEdges.endsWith('|') ? withoutEdges.slice(0, -1) : withoutEdges

  return final.split('|').map(cell => cell.trim())
}

/**
 * Export leads to Markdown table
 */
export function leadsToMDTable(leads: any[]) {
  const headers = ['Name', 'Contact Person', 'Email', 'Phone', 'Industry', 'Status']
  const headerRow = `| ${headers.join(' | ')} |`
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`

  const dataRows = leads.map(lead => {
    return `| ${[
      lead.name || '',
      lead.contactPerson || '',
      lead.email || '',
      lead.phone || '',
      lead.industry || '',
      lead.status || ''
    ].join(' | ')} |`
  })

  return [headerRow, separatorRow, ...dataRows].join('\n')
}

/**
 * Parse leads from any text content (auto-detect format)
 */
export function parseLeadsFromText(content: string) {
  // Try MD table first
  if (content.includes('|')) {
    const mdLeads = parseMDTable(content)
    if (mdLeads.length > 0) return mdLeads
  }

  // Try CSV
  if (content.includes(',')) {
    const { parseCSV } = require('./csvParser')
    const csvLeads = parseCSV(content)
    if (csvLeads.length > 0) return csvLeads
  }

  return []
}

export default { parseMDTable, leadsToMDTable, parseLeadsFromText }
