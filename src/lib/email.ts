
import { Resend } from 'resend';

// O usuário deve substituir re_xxxxxxxxx pela chave real dele nas variáveis de ambiente
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY || 're_xxxxxxxxx');

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'MX Performance <onboarding@resend.dev>', // Verifique o domínio verificado se for diferente
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Erro ao enviar email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('❌ Erro inesperado ao enviar email:', err);
    return { success: false, error: err };
  }
};
