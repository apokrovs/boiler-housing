import emailjs from '@emailjs/browser';

export const sendEmailNotification = async (toEmail: string | null | undefined, fromName: string, messageContent: string) => {
    const serviceId = 'service_qwt1jm2';
    const templateId = 'template_n1d3ypg';
    const publicKey = '8oVFKK3QFokmkrOoN';

    const templateParams = {
        to_email: toEmail,
        from_name: fromName,
        message: messageContent,
    };

    try {
        const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log('Email sent:', response);
    } catch (error) {
        console.error('Email failed:', error);
    }
};
