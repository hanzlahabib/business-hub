import leadRepository from '../repositories/leadRepository.js'

const leadService = {
    async getAll(userId) {
        return leadRepository.findAll(userId)
    },

    async getById(id, userId) {
        const lead = await leadRepository.findById(id, userId)
        if (!lead) throw new Error('Lead not found')
        return lead
    },

    async create(userId, data) {
        return leadRepository.create({ ...data, userId })
    },

    async update(id, userId, data) {
        const existing = await leadRepository.findById(id, userId)
        if (!existing) throw new Error('Lead not found')
        return leadRepository.update(id, userId, data)
    },

    async delete(id, userId) {
        const existing = await leadRepository.findById(id, userId)
        if (!existing) throw new Error('Lead not found')
        return leadRepository.delete(id, userId)
    }
}

export default leadService
