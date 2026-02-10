import jobRepository from '../repositories/jobRepository.js'

export const jobService = {
    async getAll(userId) {
        return jobRepository.findAllByUserId(userId)
    },

    async getById(id, userId) {
        const job = await jobRepository.findById(id, userId)
        if (!job) throw new Error('Job not found')
        return job
    },

    async create(userId, data) {
        return jobRepository.create({
            ...data,
            userId
        })
    },

    async update(id, userId, data) {
        return jobRepository.update(id, userId, data)
    },

    async delete(id, userId) {
        return jobRepository.delete(id, userId)
    }
}

export default jobService
