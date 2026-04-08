export async function sendEmailReport(to: string[], subject: string, html: string, attachment: Buffer) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
        throw new Error('Missing RESEND_API_KEY environment variable');
    }

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: 'MX PERFORMANCE <onboarding@resend.dev>',
            to,
            subject,
            html,
            attachments: [
                {
                    filename: 'Relatorio_Performance.xlsx',
                    content: attachment.toString('base64'),
                }
            ]
        }),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Resend API Error:', error);
        throw new Error(`Failed to send email via Resend: ${JSON.stringify(error)}`);
    }

    const data = await res.json();
    console.log('Email sent successfully via Resend:', data.id);
    return data;
}
