import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, Table, CheckCircle, AlertCircle } from 'lucide-react'
import { parseCSV } from '../../../shared/utils/csvParser'
import { parseMDTable } from '../../../shared/utils/mdParser'

export function ImportLeadsModal({ isOpen, onClose, onImport }) {
  const [step, setStep] = useState('upload') // upload, preview, importing, done
  const [parsedLeads, setParsedLeads] = useState([])
  const [selectedLeads, setSelectedLeads] = useState([])
  const [importResult, setImportResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content !== 'string') return

      let leads = []
      setError(null)

      // Try CSV first
      if (file.name.endsWith('.csv')) {
        leads = parseCSV(content)
      }
      // Try MD
      else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
        leads = parseMDTable(content)
      }
      // Try auto-detect
      else {
        if (content.includes('|')) {
          leads = parseMDTable(content)
        }
        if (leads.length === 0 && content.includes(',')) {
          leads = parseCSV(content)
        }
      }

      if (leads.length === 0) {
        setError('No valid leads found in file. Make sure it\'s a CSV or Markdown table.')
        return
      }

      setParsedLeads(leads)
      setSelectedLeads(leads.map(l => l.id))
      setStep('preview')
    }

    reader.readAsText(file)
  }

  const handlePasteContent = (content) => {
    let leads = []
    setError(null)

    // Try MD table first (more specific)
    if (content.includes('|')) {
      leads = parseMDTable(content)
    }
    // Try CSV
    if (leads.length === 0 && content.includes(',')) {
      leads = parseCSV(content)
    }

    if (leads.length === 0) {
      setError('No valid leads found. Make sure it\'s a CSV or Markdown table format.')
      return
    }

    setParsedLeads(leads)
    setSelectedLeads(leads.map(l => l.id))
    setStep('preview')
  }

  const toggleLead = (id) => {
    setSelectedLeads(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedLeads.length === parsedLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(parsedLeads.map(l => l.id))
    }
  }

  const handleImport = async () => {
    setStep('importing')
    const leadsToImport = parsedLeads.filter(l => selectedLeads.includes(l.id))

    try {
      const result = await onImport(leadsToImport)
      setImportResult({
        success: true,
        count: result.length
      })
      setStep('done')
    } catch (err) {
      setImportResult({
        success: false,
        error: err.message
      })
      setStep('done')
    }
  }

  const handleClose = () => {
    setStep('upload')
    setParsedLeads([])
    setSelectedLeads([])
    setImportResult(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[85vh] overflow-hidden bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Import Leads</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 'upload' && (
              <div className="space-y-6">
                {/* File Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-colors"
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-white/40" />
                  <p className="text-white font-medium mb-2">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-sm text-white/50">
                    Supports CSV and Markdown table files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.md,.markdown,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Or Paste */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-[#1a1a2e] text-white/40 text-sm">
                      or paste content
                    </span>
                  </div>
                </div>

                <textarea
                  placeholder="Paste your CSV or Markdown table here..."
                  onPaste={(e) => {
                    const content = e.clipboardData.getData('text')
                    if (content) handlePasteContent(content)
                  }}
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none font-mono text-sm"
                />

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Format Help */}
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Expected Format</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-white/60 mb-1 flex items-center gap-1">
                        <Table className="w-3 h-3" /> CSV
                      </p>
                      <pre className="bg-black/20 p-2 rounded text-white/50 overflow-x-auto">
{`name,email,phone,industry
Acme Corp,info@acme.com,+971...,restaurant`}
                      </pre>
                    </div>
                    <div>
                      <p className="text-white/60 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Markdown
                      </p>
                      <pre className="bg-black/20 p-2 rounded text-white/50 overflow-x-auto">
{`| Name | Email | Industry |
| ---- | ----- | -------- |
| Acme | a@b.c | salon    |`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/60">
                    Found <span className="text-white font-medium">{parsedLeads.length}</span> leads
                  </p>
                  <button
                    onClick={toggleAll}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    {selectedLeads.length === parsedLeads.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="w-10 p-3"></th>
                        <th className="p-3 text-left text-white/60 font-medium">Company</th>
                        <th className="p-3 text-left text-white/60 font-medium">Email</th>
                        <th className="p-3 text-left text-white/60 font-medium">Industry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedLeads.map(lead => (
                        <tr
                          key={lead.id}
                          onClick={() => toggleLead(lead.id)}
                          className="border-t border-white/5 cursor-pointer hover:bg-white/5"
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-white/30 bg-white/5"
                            />
                          </td>
                          <td className="p-3 text-white">{lead.name || '-'}</td>
                          <td className="p-3 text-white/70">{lead.email || '-'}</td>
                          <td className="p-3 text-white/50 capitalize">{lead.industry || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {step === 'importing' && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white">Importing {selectedLeads.length} leads...</p>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center py-12">
                {importResult?.success ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Import Complete!</h3>
                    <p className="text-white/60">
                      Successfully imported {importResult.count} leads
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Import Failed</h3>
                    <p className="text-red-400">{importResult?.error}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-white/10">
            <button
              onClick={step === 'preview' ? () => setStep('upload') : handleClose}
              className="px-6 py-2.5 text-white/60 hover:text-white transition-colors"
            >
              {step === 'preview' ? 'Back' : 'Cancel'}
            </button>

            {step === 'preview' && (
              <button
                onClick={handleImport}
                disabled={selectedLeads.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {selectedLeads.length} Leads
              </button>
            )}

            {step === 'done' && (
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ImportLeadsModal
