import { config as loadEnv } from 'dotenv'
import nodemailer from 'nodemailer'

loadEnv({ path: '.env.local' })
loadEnv()

async function main() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    console.error('Missing required SMTP environment variables. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD.')
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  })

  const to = process.argv[2]
  if (!to) {
    console.error('Usage: ts-node scripts/send-test-email.ts recipient@example.com')
    process.exit(1)
  }

  const from = SMTP_FROM || SMTP_USER

  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Racquetball League test email',
    text: 'This is a test email from your racquetball league application.',
    html: '<p>This is a <strong>test email</strong> from your racquetball league application.</p>'
  })

  console.log('Message sent:', info.messageId)
}

main().catch((error) => {
  console.error('Failed to send email', error)
  process.exit(1)
})
