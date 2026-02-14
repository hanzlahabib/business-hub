import express from 'express'
import jobService from '../services/jobService.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
    try {
        const jobs = await jobService.getAll(req.user.id)
        res.json(jobs)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/', async (req, res) => {
    try {
        const { title, company } = req.body || {}
        if (!title || !company) {
            return res.status(422).json({ error: 'Validation failed', fields: { title: !title ? 'Title is required' : undefined, company: !company ? 'Company is required' : undefined } })
        }
        const job = await jobService.create(req.user.id, req.body)
        res.status(201).json(job)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const job = await jobService.getById(req.params.id, req.user.id)
        res.json(job)
    } catch (error) {
        const status = error.message === 'Job not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.put('/:id', async (req, res) => {
    try {
        const job = await jobService.update(req.params.id, req.user.id, req.body)
        res.json(job)
    } catch (error) {
        const status = error.message === 'Job not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.patch('/:id', async (req, res) => {
    try {
        const job = await jobService.update(req.params.id, req.user.id, req.body)
        res.json(job)
    } catch (error) {
        const status = error.message === 'Job not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        await jobService.delete(req.params.id, req.user.id)
        res.status(204).send()
    } catch (error) {
        const status = error.message === 'Job not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

export default router
