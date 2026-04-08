const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
    console.log('Enviando e-mail de teste...');
    const result = await resend.emails.send({
        from: 'MX Performance <noreply@mx-performance.com>',
        to: 'synvollt@gmail.com',
        subject: 'TESTE: Relatório Matinal - MX Performance',
        html: '<h1>Teste de Disparo Realizado</h1><p>Sistema MX Performance operando.</p>'
    });
    console.log('Resultado:', result);
}
test().catch(console.error);
