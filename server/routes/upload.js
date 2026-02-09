import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Storage configuration - easy to swap for cloud storage (S3, GCS) in production
const UPLOADS_DIR = path.join(__dirname, '../uploads')

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `cv-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  // Only allow PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// ============================================
// CV FILES SERVICE - Abstract for easy migration
// Replace JSON Server calls with your DB of choice
// ============================================

const JSON_SERVER = 'http://localhost:3005'

async function getAllCvFiles() {
  const res = await fetch(`${JSON_SERVER}/cvFiles`)
  return res.json()
}

async function getCvFileById(id) {
  const res = await fetch(`${JSON_SERVER}/cvFiles/${id}`)
  return res.json()
}

async function createCvFile(data) {
  const res = await fetch(`${JSON_SERVER}/cvFiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

async function updateCvFile(id, data) {
  const res = await fetch(`${JSON_SERVER}/cvFiles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

async function deleteCvFile(id) {
  await fetch(`${JSON_SERVER}/cvFiles/${id}`, { method: 'DELETE' })
}

// ============================================
// ROUTES
// ============================================

// List all CVs
router.get('/cvs', async (req, res) => {
  try {
    const cvFiles = await getAllCvFiles()
    res.json(cvFiles)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get single CV
router.get('/cvs/:id', async (req, res) => {
  try {
    const cvFile = await getCvFileById(req.params.id)
    res.json(cvFile)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Upload CV file
router.post('/upload/cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const { name, isDefault } = req.body

    const cvData = {
      id: `cv-${Date.now()}`,
      name: name || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      type: 'uploaded',
      url: `/uploads/${req.file.filename}`,
      cloudUrl: null,
      size: req.file.size,
      isDefault: isDefault === 'true',
      createdAt: new Date().toISOString()
    }

    // If this is set as default, unset other defaults
    if (cvData.isDefault) {
      const allCvs = await getAllCvFiles()
      for (const cv of allCvs) {
        if (cv.isDefault) {
          await updateCvFile(cv.id, { isDefault: false })
        }
      }
    }

    const created = await createCvFile(cvData)
    res.json({ success: true, cv: created })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Add cloud link (Google Drive, Dropbox, etc.)
router.post('/cvs/link', async (req, res) => {
  try {
    const { name, cloudUrl, isDefault } = req.body

    if (!name || !cloudUrl) {
      return res.status(400).json({ success: false, error: 'Name and cloudUrl are required' })
    }

    const cvData = {
      id: `cv-${Date.now()}`,
      name,
      filename: null,
      originalName: null,
      type: 'cloud',
      url: null,
      cloudUrl,
      size: null,
      isDefault: isDefault || false,
      createdAt: new Date().toISOString()
    }

    // If this is set as default, unset other defaults
    if (cvData.isDefault) {
      const allCvs = await getAllCvFiles()
      for (const cv of allCvs) {
        if (cv.isDefault) {
          await updateCvFile(cv.id, { isDefault: false })
        }
      }
    }

    const created = await createCvFile(cvData)
    res.json({ success: true, cv: created })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Set CV as default
router.patch('/cvs/:id/default', async (req, res) => {
  try {
    // Unset all defaults first
    const allCvs = await getAllCvFiles()
    for (const cv of allCvs) {
      if (cv.isDefault) {
        await updateCvFile(cv.id, { isDefault: false })
      }
    }

    // Set this one as default
    const updated = await updateCvFile(req.params.id, { isDefault: true })
    res.json({ success: true, cv: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Update CV metadata
router.patch('/cvs/:id', async (req, res) => {
  try {
    const { name, cloudUrl } = req.body
    const updates = {}
    if (name) updates.name = name
    if (cloudUrl) updates.cloudUrl = cloudUrl

    const updated = await updateCvFile(req.params.id, updates)
    res.json({ success: true, cv: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete CV
router.delete('/cvs/:id', async (req, res) => {
  try {
    const cv = await getCvFileById(req.params.id)

    // Delete physical file if it exists
    if (cv.filename) {
      const filePath = path.join(UPLOADS_DIR, cv.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await deleteCvFile(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get CV file content (for attachments)
router.get('/cvs/:id/file', async (req, res) => {
  try {
    const cv = await getCvFileById(req.params.id)

    if (!cv.filename) {
      return res.status(400).json({ success: false, error: 'No file attached to this CV entry' })
    }

    const filePath = path.join(UPLOADS_DIR, cv.filename)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' })
    }

    res.sendFile(filePath)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
