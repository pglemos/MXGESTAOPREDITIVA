import type { Resend } from "https://esm.sh/resend@3";

type SendReportParams = {
  resend: Resend | null;
  to: string[];
  subject: string;
  html: string;
  attachments: Array<{ filename: string; content: string }>;
  logPrefix: string;
  storeName: string;
};

export async function sendReportEmail({
  resend,
  to,
  subject,
  html,
  attachments,
  logPrefix,
  storeName,
}: SendReportParams): Promise<{ status: "sent" | "failed" | "not_sent"; warnings: string[] }> {
  if (!resend) {
    return { status: "not_sent", warnings: ["RESEND_API_KEY nao configurada"] };
  }

  if (to.length === 0) {
    return { status: "not_sent", warnings: ["Nenhum destinatario configurado"] };
  }

  try {
    const { error } = await resend.emails.send({
      from: "MX Relatorios <relatorios@mxperformance.com.br>",
      to,
      subject,
      html,
      attachments,
    });

    if (error) {
      console.error(`${logPrefix} Error sending email for ${storeName}:`, error?.message || "Unknown error");
      return { status: "failed", warnings: ["Falha no disparo do e-mail"] };
    }

    return { status: "sent", warnings: [] };
  } catch (err) {
    console.error(`${logPrefix} Critical error sending email for ${storeName}:`, (err as Error)?.message || "Unknown error");
    return { status: "failed", warnings: ["Erro critico no disparo do e-mail"] };
  }
}
