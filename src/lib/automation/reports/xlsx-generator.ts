import { DailyCheckin } from '@/types/database';
import ExcelJS from 'exceljs';

export async function generateMorningReportXlsx(data: DailyCheckin[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Matinal');
    
    worksheet.columns = [
        { header: 'Vendedor', key: 'vendedor', width: 20 },
        { header: 'Leads', key: 'leads', width: 10 },
        { header: 'Vendas', key: 'vendas', width: 10 }
    ];

    data.forEach(item => {
        worksheet.addRow({ 
            vendedor: item.seller_user_id, 
            leads: item.leads_prev_day,
            vendas: (item.vnd_porta_prev_day || 0) + (item.vnd_cart_prev_day || 0) + (item.vnd_net_prev_day || 0)
        });
    });

    return await workbook.xlsx.writeBuffer() as any;
}
