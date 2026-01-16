import nodemailer from 'nodemailer'

// Create transporter based on provider
function createTransporter(settings) {
  const { provider } = settings

  switch (provider) {
    case 'gmail':
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: settings.gmail.user,
          pass: settings.gmail.appPassword
        }
      })

    case 'sendgrid':
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: settings.sendgrid.apiKey
        }
      })

    case 'ses':
      return nodemailer.createTransport({
        host: `email-smtp.${settings.ses.region}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: settings.ses.accessKeyId,
          pass: settings.ses.secretAccessKey
        }
      })

    case 'resend':
      return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        auth: {
          user: 'resend',
          pass: settings.resend.apiKey
        }
      })

    case 'custom':
      return nodemailer.createTransport({
        host: settings.custom.host,
        port: settings.custom.port,
        secure: settings.custom.secure,
        auth: {
          user: settings.custom.user,
          pass: settings.custom.pass
        }
      })

    default:
      throw new Error(`Unknown email provider: ${provider}`)
  }
}

// Send email with optional attachments
export async function sendEmail(settings, { to, subject, body, attachments = [] }) {
  try {
    const transporter = createTransporter(settings)

    const mailOptions = {
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    }

    // Add attachments if provided
    // Attachments format: [{ filename: 'cv.pdf', path: '/path/to/file.pdf' }]
    // or: [{ filename: 'cv.pdf', content: Buffer }]
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments
    }

    const info = await transporter.sendMail(mailOptions)

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Test connection
export async function testConnection(settings) {
  try {
    const transporter = createTransporter(settings)
    await transporter.verify()

    return {
      success: true,
      message: `Connected to ${settings.provider} successfully`
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Send bulk emails with delay
export async function sendBulkEmails(settings, emails, delayMs = 30000) {
  const results = []

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i]

    // Check daily limit
    if (i >= settings.dailyLimit) {
      results.push({
        to: email.to,
        success: false,
        error: 'Daily limit reached'
      })
      continue
    }

    const result = await sendEmail(settings, email)
    results.push({ to: email.to, ...result })

    // Delay between emails (except for last one)
    if (i < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return results
}
