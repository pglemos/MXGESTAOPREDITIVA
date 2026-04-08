import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailReport(to: string[], subject: string, html: string, attachment: Buffer) {
    await resend.emails.send({
        from: 'MX Performance <noreply@mx-performance.com>',
        to,
        subject,
        html,
        attachments: [{ filename: 'Relatorio.xlsx', content: attachment.toString('base64') }]
    });
}
