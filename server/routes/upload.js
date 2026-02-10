import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import authMiddleware from '../middleware/auth.js'
import prisma from '../config/prisma.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Storage configuration
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
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

// All CV routes require auth
router.use(authMiddleware)

// List all CVs for the logged-in user
router.get('/cvs', async (req, res) => {
  try {
    const cvFiles = await prisma.cVFile.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json(cvFiles)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get single CV
router.get('/cvs/:id', async (req, res) => {
  try {
    const cvFile = await prisma.cVFile.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    })
    if (!cvFile) return res.status(404).json({ success: false, error: 'CV not found' })
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
    const setDefault = isDefault === 'true'

    // If this is set as default, unset other defaults
    if (setDefault) {
      await prisma.cVFile.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false }
      })
    }

    const cvFile = await prisma.cVFile.create({
      data: {
        name: name || req.file.originalname,
        filename: req.file.filename,
        originalName: req.file.originalname,
        type: 'uploaded',
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
        isDefault: setDefault,
        userId: req.user.id
      }
    })

    res.json({ success: true, cv: cvFile })
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

    if (isDefault) {
      await prisma.cVFile.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false }
      })
    }

    const cvFile = await prisma.cVFile.create({
      data: {
        name,
        type: 'cloud',
        cloudUrl,
        isDefault: isDefault || false,
        userId: req.user.id
      }
    })

    res.json({ success: true, cv: cvFile })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Set CV as default
router.patch('/cvs/:id/default', async (req, res) => {
  try {
    // Unset all defaults
    await prisma.cVFile.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data: { isDefault: false }
    })

    // Set this one as default
    const updated = await prisma.cVFile.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { isDefault: true }
    })
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

    const updated = await prisma.cVFile.update({
      where: { id: req.params.id, userId: req.user.id },
      data: updates
    })
    res.json({ success: true, cv: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete CV
router.delete('/cvs/:id', async (req, res) => {
  try {
    const cv = await prisma.cVFile.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!cv) return res.status(404).json({ success: false, error: 'CV not found' })

    // Delete physical file if it exists
    if (cv.filename) {
      const filePath = path.join(UPLOADS_DIR, cv.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await prisma.cVFile.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get CV file content (for attachments)
router.get('/cvs/:id/file', async (req, res) => {
  try {
    const cv = await prisma.cVFile.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!cv || !cv.filename) {
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
