export async function sendSMS({ to, body }: { to: string; body: string }) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM

  if (!sid || !token || !from) {
    console.log("[sms] Twilio not configured. Would send:", { to, body })
    return
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const params = new URLSearchParams()
  params.append("To", to)
  params.append("From", from)
  params.append("Body", body)

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })
}
