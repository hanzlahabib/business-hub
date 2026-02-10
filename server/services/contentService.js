import contentRepository from '../repositories/contentRepository.js'

export const contentService = {
    async getAll(userId) {
        return contentRepository.findAllByUserId(userId)
    },

    async getById(id, userId) {
        const content = await contentRepository.findById(id, userId)
        if (!content) throw new Error('Content not found')
        return content
    },

    async create(userId, data) {
        return contentRepository.create({
            ...data,
            userId
        })
    },

    async update(id, userId, data) {
        return contentRepository.update(id, userId, data)
    },

    async delete(id, userId) {
        return contentRepository.delete(id, userId)
    }
}

export default contentService
