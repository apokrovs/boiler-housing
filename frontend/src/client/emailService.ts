import emailjs from "@emailjs/browser"

export const sendOTPNotification = async (
  toEmail: string,
  otpCode: string,
) => {
  const serviceId = "service_hyc6zjh"
  const templateId = "template_x0f6xh6"
  const publicKey = "UJ6nJR9dbyLdyg4h2"

  const templateParams = {
    toEmail: toEmail,
    otpCode: otpCode,
  }

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey,
    )
    console.log("Email sent:", response)
  } catch (error) {
    console.error("Email failed:", error)
  }
}