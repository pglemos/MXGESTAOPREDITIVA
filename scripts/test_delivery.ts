import { Resend } from 'resend';
import * as dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testDelivery() {
    console.log('Disparando e-mail de teste real via Resend...');
    try {
        const data = await resend.emails.send({
            from: 'MX Performance <noreply@mx-performance.com>',
            to: ['synvollt@gmail.com'],
            subject: 'TESTE DE ENTREGA REAL - MX Performance',
            html: '<h1>Sistema Operacional</h1><p>A automação foi testada e está disparando.</p>'
        });
        console.log('E-mail disparado:', data);
    } catch (e) {
        console.error('Falha no envio:', e);
    }
}
testDelivery();
