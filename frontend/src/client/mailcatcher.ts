import type { APIRequestContext } from "@playwright/test"

type Email = {
  id: number
  recipients: string[]
  subject: string
}

async function findEmail({
  request,
  filter,
}: { request: APIRequestContext; filter?: (email: Email) => boolean }) {
  const response = await request.get(`${process.env.MAILCATCHER_HOST}/messages`)

  let emails = await response.json()

  if (filter) {
    emails = emails.filter(filter)
  }

  const email = emails[emails.length - 1]

  if (email) {
    return email as Email
  }

  return null
}

export function findLastEmail({
  request,
  filter,
  timeout = 5000,
}: {
  request: APIRequestContext
  filter?: (email: Email) => boolean
  timeout?: number
}) {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Timeout while trying to get latest email")),
      timeout,
    ),
  )

  const checkEmails = async () => {
    while (true) {
      const emailData = await findEmail({ request, filter })

      if (emailData) {
        return emailData
      }
      // Wait for 100ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return Promise.race([timeoutPromise, checkEmails()])
}

export async function sendEmail(toEmail: string | null | undefined,
  fromName: string,
  messageContent: string,){
  try {
  const response = await fetch(`${process.env.MAILCATCHER_HOST}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: `${fromName} <no-reply@example.com>`,
      to: [toEmail],
      subject: "New Chat Message",
      body: messageContent
    })
  });

  if (!response.ok){
    throw new Error(`Failed to send enail about new message Mailcatcher: ${response.statusText}`);
  }

   console.log(`Email sent to ${toEmail} via Mailcatcher`);
    } catch (error) {
        console.error("Mailcatcher email send error:", error);
    }
}
