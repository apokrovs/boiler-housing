import emailjs from "@emailjs/browser"

export const sendOTPNotification = async (
  toEmail: string,
  toName: string,
  otpCode: string,
) => {
  const serviceId = "service_gfuw117"
  const templateId = "template_27ry8xj"
  const publicKey = "JX0eMIJuCopVpmlBi"

  const templateParams = {
    to_email: toEmail,
    to_name: toName,
    otp_code: otpCode,
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
