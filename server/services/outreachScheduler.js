import prisma from '../config/prisma.js'
import { sendEmail } from './emailService.js'
import { emailSettingsRepository } from '../repositories/extraRepositories.js'

// Execute an outreach campaign — send emails in batch with delays
export async function executeCampaign({ userId, leadIds, templateId, delayMs = 30000 }) {
    const results = []

    // Get user's email settings
    const settingsRecord = await emailSettingsRepository.findByUserId(userId)
    if (!settingsRecord || !settingsRecord.config) {
        throw new Error('Email not configured. Please set up email provider in settings.')
    }
    const settings = settingsRecord.config

    // Get template
    let template = null
    if (templateId) {
        template = await prisma.emailTemplate.findFirst({
            where: { id: templateId, userId }
        })
        if (!template) {
            // Try general templates too
            template = await prisma.template.findFirst({
                where: { id: templateId, userId }
            })
        }
    }

    if (!template) {
        throw new Error('Template not found')
    }

    // Get leads
    const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds }, userId }
    })

    // Check daily limit
    const dailyLimit = settings.dailyLimit || 50
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sentToday = await prisma.message.count({
        where: {
            userId,
            type: 'sent',
            channel: 'email',
            createdAt: { gte: today }
        }
    })

    const remainingQuota = Math.max(0, dailyLimit - sentToday)

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i]

        if (i >= remainingQuota) {
            results.push({
                leadId: lead.id,
                leadName: lead.name,
                success: false,
                error: 'Daily email limit reached'
            })
            continue
        }

        if (!lead.email) {
            results.push({
                leadId: lead.id,
                leadName: lead.name,
                success: false,
                error: 'No email address'
            })
            continue
        }

        try {
            // Personalize template
            let subject = template.subject || template.name || ''
            let body = template.body || template.content || ''
            if (typeof body === 'object') body = JSON.stringify(body)

            const variables = {
                company: lead.name || '',
                name: lead.name || '',
                contactPerson: lead.contactPerson || '',
                email: lead.email || '',
                industry: lead.industry || '',
                website: lead.website || ''
            }

            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`{{${key}}}`, 'g')
                subject = subject.replace(regex, value)
                body = body.replace(regex, value)
            }

            // Send the email
            const result = await sendEmail(settings, {
                to: lead.email,
                subject,
                body,
                attachments: []
            })

            // Log the message
            await prisma.message.create({
                data: {
                    leadId: lead.id,
                    type: 'sent',
                    channel: 'email',
                    subject,
                    body,
                    templateId: template.id,
                    status: result.success ? 'sent' : 'failed',
                    userId
                }
            })

            // Update lead status
            if (result.success) {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: {
                        status: 'contacted',
                        lastContactedAt: new Date()
                    }
                })
            }

            results.push({
                leadId: lead.id,
                leadName: lead.name,
                success: result.success,
                messageId: result.messageId,
                error: result.error
            })

            // Delay between emails (except last)
            if (i < leads.length - 1) {
                await new Promise(r => setTimeout(r, delayMs))
            }
        } catch (err) {
            results.push({
                leadId: lead.id,
                leadName: lead.name,
                success: false,
                error: err.message
            })
        }
    }

    return {
        totalLeads: leads.length,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        dailyUsed: sentToday + results.filter(r => r.success).length,
        dailyLimit,
        results
    }
}
