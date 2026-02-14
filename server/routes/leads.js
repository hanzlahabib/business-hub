import express from 'express'
import leadService from '../services/leadService.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
    try {
        const leads = await leadService.getAll(req.user.id)
        res.json(leads)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/', async (req, res) => {
    try {
        const { name, status } = req.body || {}
        if (!name || !status) {
            return res.status(422).json({ error: 'Validation failed', fields: { name: !name ? 'Name is required' : undefined, status: !status ? 'Status is required' : undefined } })
        }
        const lead = await leadService.create(req.user.id, req.body)
        res.status(201).json(lead)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const lead = await leadService.getById(req.params.id, req.user.id)
        res.json(lead)
    } catch (error) {
        const status = error.message === 'Lead not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.put('/:id', async (req, res) => {
    try {
        const lead = await leadService.update(req.params.id, req.user.id, req.body)
        res.json(lead)
    } catch (error) {
        const status = error.message === 'Lead not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.patch('/:id', async (req, res) => {
    try {
        const lead = await leadService.update(req.params.id, req.user.id, req.body)
        res.json(lead)
    } catch (error) {
        const status = error.message === 'Lead not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        await leadService.delete(req.params.id, req.user.id)
        res.status(204).send()
    } catch (error) {
        const status = error.message === 'Lead not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

export default router
