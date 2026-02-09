/**
 * Parse CSV content to leads array
 * Expected columns: name, contactPerson, email, phone, website, industry, source, notes
 */
export function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

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

  const normalizedHeaders = headers.map(h => headerMap[h] || h)

  // Parse data rows
  const leads = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle quoted values with commas
    const values = parseCSVLine(line)

    const lead = {
      id: crypto.randomUUID(),
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      website: '',
      industry: '',
      status: 'new',
      source: 'csv-import',
      notes: '',
      websiteIssues: [],
      tags: [],
      createdAt: new Date().toISOString(),
      lastContactedAt: null,
      linkedBoardId: null
    }

    normalizedHeaders.forEach((header, index) => {
      if (lead.hasOwnProperty(header) && values[index]) {
        lead[header] = values[index].trim().replace(/^"|"$/g, '')
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
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)

  return values
}

/**
 * Export leads to CSV string
 */
export function leadsToCSV(leads) {
  const headers = ['name', 'contactPerson', 'email', 'phone', 'website', 'industry', 'status', 'source', 'notes']
  const headerRow = headers.join(',')

  const rows = leads.map(lead => {
    return headers.map(h => {
      const value = lead[h] || ''
      // Escape quotes and wrap in quotes if contains comma
      if (value.includes(',') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  })

  return [headerRow, ...rows].join('\n')
}

export default { parseCSV, leadsToCSV }
