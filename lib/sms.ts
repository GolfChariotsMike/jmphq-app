// JMPHQ SMS service via Twilio

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const FROM_NUMBER = process.env.TWILIO_JMPHQ_NUMBER!

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    const formatted = to.startsWith('+') ? to : `+61${to.replace(/^0/, '')}`
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: FROM_NUMBER, To: formatted, Body: message }),
      }
    )
    const data = await res.json()
    if (data.error_code) {
      console.error('Twilio SMS error:', data.message)
      return false
    }
    return true
  } catch (err) {
    console.error('SMS send failed:', err)
    return false
  }
}

// ---- Journey SMS templates ----

export async function smsJourneySubmitted(supervisorPhone: string, driverName: string, destination: string) {
  return sendSMS(supervisorPhone,
    `JMPHQ: ${driverName} has submitted a journey to ${destination} for your approval. Log in to review.`
  )
}

export async function smsJourneyApproved(driverPhone: string, destination: string) {
  return sendSMS(driverPhone,
    `JMPHQ: Your journey to ${destination} has been approved. Scan the vehicle QR to start when ready.`
  )
}

export async function smsJourneyStarted(supervisorPhone: string, driverName: string, destination: string) {
  return sendSMS(supervisorPhone,
    `JMPHQ: ${driverName} has started their journey to ${destination}.`
  )
}

export async function smsCheckpointOverdue(supervisorPhone: string, driverName: string, checkpointName: string, minutesOverdue: number) {
  return sendSMS(supervisorPhone,
    `⚠️ JMPHQ ALERT: ${driverName} is ${minutesOverdue} minutes overdue at checkpoint "${checkpointName}". Last known status: In Progress.`
  )
}

export async function smsJourneyOverdue(supervisorPhone: string, driverName: string, destination: string, minutesOverdue: number) {
  return sendSMS(supervisorPhone,
    `🚨 JMPHQ ALERT: ${driverName}'s journey to ${destination} is ${minutesOverdue} minutes overdue. Please make contact immediately.`
  )
}

export async function smsJourneyCompleted(supervisorPhone: string, driverName: string, destination: string) {
  return sendSMS(supervisorPhone,
    `JMPHQ: ${driverName} has safely completed their journey to ${destination}.`
  )
}
