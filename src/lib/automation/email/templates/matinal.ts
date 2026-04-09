export const getMatinalEmailTemplate = (storeName: string, dateLabel: string, metrics: any, ranking: any[]) => {
    const statusColor = metrics.reaching >= 100 ? '#16a34a' : metrics.reaching >= 70 ? '#f59e0b' : '#dc2626';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1d20; background-color: #f8fafc; margin: 0; padding: 40px 20px; }
        .container { max-width: 650px; margin: auto; background: #ffffff; border-radius: 24px; overflow: hidden; shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #1e293b; color: #ffffff; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
        .header p { margin: 10px 0 0; font-size: 14px; opacity: 0.7; font-weight: 700; }
        
        .pacing-bar { background-color: #eff6ff; padding: 25px; text-align: center; border-bottom: 1px solid #e2e8f0; }
        .pacing-title { font-size: 18px; font-weight: 900; color: #1e293b; margin-bottom: 5px; }
        .pacing-projection { font-size: 14px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
        
        .seller-card { padding: 20px 40px; border-bottom: 1px solid #f1f5f9; }
        .seller-header { background: #334155; color: white; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 900; text-transform: uppercase; margin-bottom: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center; }
        .stat-item { background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .stat-label { font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .stat-value { font-size: 16px; font-weight: 900; color: #1e293b; }
        
        .summary-table { width: 100%; border-collapse: collapse; background: #1e293b; color: white; }
        .summary-table td { padding: 25px; text-align: center; border-right: 1px solid rgba(255,255,255,0.1); }
        .summary-table td:last-child { border-right: none; }
        .summary-label { font-size: 10px; font-weight: 900; opacity: 0.6; text-transform: uppercase; display: block; margin-bottom: 8px; }
        .summary-value { font-size: 24px; font-weight: 900; }
        .summary-value.highlight { color: #4ade80; }
        
        .footer { padding: 30px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .whatsapp-btn { background-color: #25d366; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: 900; font-size: 12px; display: inline-flex; align-items: center; text-transform: uppercase; letter-spacing: 1px; }
        .note { font-size: 11px; color: #94a3b8; font-style: italic; margin-bottom: 25px; display: block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 RELATÓRIO MATINAL</h1>
            <p>${storeName.toUpperCase()} | Ref: ${dateLabel}</p>
        </div>

        <div class="pacing-bar">
            <div class="pacing-title">🔎 FALTA POUCO: ${metrics.gap} CARROS</div>
            <div class="pacing-projection">🔮 PROJEÇÃO ATUAL: FECHAR COM ${metrics.projection} CARROS</div>
            ${metrics.pendingSellers?.length > 0 ? `<div style="color: #ef4444; font-size: 11px; font-weight: 900; margin-top: 10px; text-transform: uppercase;">⚠️ SEM REGISTRO HOJE: ${metrics.pendingSellers.join(', ')}</div>` : ''}
        </div>

        ${ranking.map(r => `
        <div class="seller-card">
            <div class="seller-header">${r.user_name}</div>
            <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td width="25%" align="center">
                        <div class="stat-item">
                            <span class="stat-label">LEADS</span>
                            <span class="stat-value">${r.leads || 0}</span>
                        </div>
                    </td>
                    <td width="25%" align="center">
                        <div class="stat-item">
                            <span class="stat-label">AGD (HOJE)</span>
                            <span class="stat-value">${r.agd_total || 0}</span>
                        </div>
                    </td>
                    <td width="25%" align="center">
                        <div class="stat-item">
                            <span class="stat-label">VND (ONTEM)</span>
                            <span class="stat-value">${r.vnd_yesterday || 0}</span>
                        </div>
                    </td>
                    <td width="25%" align="center">
                        <div class="stat-item">
                            <span class="stat-label">TOTAL (MÊS)</span>
                            <span class="stat-value">${r.vnd_total || 0}</span>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        `).join('')}

        <table class="summary-table">
            <tr>
                <td>
                    <span class="summary-label">VENDAS</span>
                    <span class="summary-value">${metrics.currentSales}</span>
                </td>
                <td>
                    <span class="summary-label">META</span>
                    <span class="summary-value">${metrics.teamGoal}</span>
                </td>
                <td>
                    <span class="summary-label">PROJEÇÃO</span>
                    <span class="summary-value highlight">${metrics.projection}</span>
                </td>
                <td>
                    <span class="summary-label">ATING</span>
                    <span class="summary-value" style="color: ${statusColor}">${metrics.reaching}%</span>
                </td>
            </tr>
        </table>

        <div class="footer">
            <span class="note">*O arquivo anexo contém duas abas: O Painel Visual e a Lista de Vendas Detalhada onde você pode aplicar filtros.</span>
            <a href="#" class="whatsapp-btn">📲 ENVIAR NO WHATSAPP</a>
        </div>
    </div>
</body>
</html>
    `;
};
