import nodemailer from "nodemailer"

type Mail = { to: string; subject: string; text: string }

let transporter: nodemailer.Transporter | null = null

function ensureTransport() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  return transporter
}

export async function sendEmail(mail: Mail) {
  const from = process.env.FROM_EMAIL || "no-reply@localhost"
  const tx = ensureTransport()
  if (!tx) {
    console.log("[mailer] SMTP not configured. Would send:", { from, ...mail })
    return
  }
  await tx.sendMail({ from, to: mail.to, subject: mail.subject, text: mail.text })
}
