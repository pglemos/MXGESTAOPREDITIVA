export const getWeeklyFeedbackEmailTemplate = (storeName: string, dateRange: string, feedbackData: any[]) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1d20; background-color: #f8fafc; margin: 0; padding: 40px 20px; }
        .container { max-width: 700px; margin: auto; background: #ffffff; border-radius: 32px; overflow: hidden; shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #0c343d; color: #ffffff; padding: 50px 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
        .header p { margin: 15px 0 0; font-size: 14px; opacity: 0.6; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
        
        .main-btn-container { padding: 40px; text-align: center; background: #fdfdfd; border-bottom: 1px solid #f1f5f9; }
        .main-btn { background-color: #25d366; color: white; padding: 20px 50px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px; display: inline-block; text-transform: uppercase; shadow: 0 10px 15px -3px rgba(37, 211, 102, 0.3); }
        
        .section-title { font-size: 18px; font-weight: 900; color: #0c343d; padding: 40px 40px 10px; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
        
        .feedback-block { margin: 20px 40px 40px; padding: 30px; background: #f9fafb; border-left: 6px solid #134f5c; border-radius: 0 20px 20px 0; }
        .seller-name { font-size: 16px; font-weight: 900; color: #134f5c; margin-bottom: 15px; display: block; text-transform: uppercase; }
        .zap-text { font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #334155; white-space: pre-wrap; background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        
        .footer { padding: 40px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 12px; color: #94a3b8; font-weight: 600; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Devolutiva Semanal: ${storeName}</h1>
            <p>Período: ${dateRange}</p>
        </div>

        <div class="main-btn-container">
            <a href="#" class="main-btn">📂 ABRIR RELATÓRIO COMPLETO</a>
        </div>

        <h2 class="section-title">📝 Sugestões de Mensagem (Copiar e Colar)</h2>

        ${feedbackData.map(f => `
        <div class="feedback-block">
            <span class="seller-name">👤 ${f.seller_name}</span>
            <div class="zap-text">${f.whatsapp_text}</div>
        </div>
        `).join('')}

        <div class="footer">
            <p>MX PERFORMANCE © 2026 • CONSULTORIA DE ALTA PERFORMANCE</p>
        </div>
    </div>
</body>
</html>
    `;
};
