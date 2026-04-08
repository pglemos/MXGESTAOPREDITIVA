import 'dotenv/config';

async function testResend() {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_xxxxxxxxx') {
        console.error('❌ Erro: RESEND_API_KEY não configurada ou ainda usa o placeholder re_xxxxxxxxx.');
        console.log('👉 Por favor, edite o arquivo .env e coloque sua chave real.');
        process.exit(1);
    }

    console.log('🚀 Enviando e-mail de teste via Resend...');

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: 'synvollt@gmail.com',
                subject: 'Hello World - Teste MX Performance',
                html: '<p>Congrats on sending your <strong>first email</strong> via MX Performance integration!</p>'
            }),
        });

        const data = await res.json();

        if (res.ok) {
            console.log('✅ Sucesso! ID do e-mail:', data.id);
        } else {
            console.error('❌ Falha na API do Resend:', data);
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

testResend();
