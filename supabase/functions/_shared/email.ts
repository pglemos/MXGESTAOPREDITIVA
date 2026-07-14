import type { Resend } from "https://esm.sh/resend@3";

type EmailAttachment = { filename: string; content: string; mimeType?: string };

type SendReportParams = {
  resend: Resend | null;
  to: string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  logPrefix: string;
  storeName: string;
  fromName?: string;
};

type EmailResult = { status: "sent" | "failed" | "not_sent"; warnings: string[] };

function buildFromAddress(fromName = "MX PERFORMANCE"): string {
  const fromEmail =
    Deno.env.get("GMAIL_FROM_EMAIL") ??
    Deno.env.get("RESEND_FROM_EMAIL") ??
    "noreply@mxperformance.com.br";
  return `${fromName} <${fromEmail}>`;
}

function getEmailProvider(resend: Resend | null): "gmail" | "resend" | "none" {
  const configured = Deno.env.get("EMAIL_PROVIDER")?.toLowerCase();
  if (configured === "gmail") return "gmail";
  if (configured === "resend") return resend ? "resend" : "none";
  if (Deno.env.get("GMAIL_REFRESH_TOKEN")) return "gmail";
  return resend ? "resend" : "none";
}

function missingGmailConfig(): string[] {
  return ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"]
    .filter((name) => !Deno.env.get(name));
}

function encodeBase64Url(value: string): string {
  return encodeBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function wrapBase64(value: string): string {
  return value.replace(/.{1,76}/g, "$&\r\n").trimEnd();
}

function encodeMimeWord(value: string): string {
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  return `=?UTF-8?B?${encodeBase64(value)}?=`;
}

function buildGmailRawMessage({
  from,
  to,
  subject,
  html,
  attachments,
}: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  attachments: EmailAttachment[];
}): string {
  const headers = [
    `From: ${from}`,
    `To: ${to.join(", ")}`,
    `Subject: ${encodeMimeWord(subject)}`,
    "MIME-Version: 1.0",
  ];

  if (attachments.length === 0) {
    const body = [
      ...headers,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      wrapBase64(encodeBase64(html)),
    ];
    return encodeBase64Url(body.join("\r\n"));
  }

  const boundary = `mx_${crypto.randomUUID()}`;
  const parts = [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(encodeBase64(html)),
  ];

  for (const attachment of attachments) {
    const mimeType = attachment.mimeType || "application/octet-stream";
    parts.push(
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.filename.replace(/"/g, "")}"`,
      "",
      wrapBase64(attachment.content),
    );
  }

  parts.push(`--${boundary}--`);
  return encodeBase64Url(parts.join("\r\n"));
}

async function fetchGmailAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET ou GMAIL_REFRESH_TOKEN nao configurado");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Falha ao obter access token Gmail");
  }

  return payload.access_token;
}

async function sendWithGmail(params: Omit<SendReportParams, "resend"> & { attachments: EmailAttachment[] }): Promise<EmailResult> {
  const accessToken = await fetchGmailAccessToken();
  const raw = buildGmailRawMessage({
    from: buildFromAddress(params.fromName),
    to: params.to,
    subject: params.subject,
    html: params.html,
    attachments: params.attachments,
  });

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Gmail API Error: ${payload.slice(0, 500)}`);
  }

  return { status: "sent", warnings: [] };
}

export async function sendReportEmail({
  resend,
  to,
  subject,
  html,
  attachments = [],
  logPrefix,
  storeName,
  fromName,
}: SendReportParams): Promise<{ status: "sent" | "failed" | "not_sent"; warnings: string[] }> {
  if (to.length === 0) {
    return { status: "not_sent", warnings: ["Nenhum destinatario configurado"] };
  }

  const provider = getEmailProvider(resend);
  if (provider === "none") {
    return { status: "not_sent", warnings: ["Nenhum provedor de e-mail configurado"] };
  }
  if (provider === "resend" && !resend) {
    return { status: "not_sent", warnings: ["Resend nao configurado"] };
  }

  try {
    if (provider === "gmail") {
      const missing = missingGmailConfig();
      if (missing.length > 0) {
        return { status: "not_sent", warnings: [`Gmail API nao configurado: ${missing.join(", ")}`] };
      }
      return await sendWithGmail({ to, subject, html, attachments, logPrefix, storeName, fromName });
    }

    if (!resend) {
      return { status: "not_sent", warnings: ["Resend nao configurado"] };
    }

    const message = {
      from: buildFromAddress(fromName),
      to,
      subject,
      html,
      ...(attachments.length > 0 ? { attachments } : {}),
    };
    const { error } = await resend.emails.send(message);

    if (error) {
      console.error(`${logPrefix} Error sending email for ${storeName}:`, error?.message || "Unknown error");
      return { status: "failed", warnings: [`Falha no disparo do e-mail: ${error?.message || "erro desconhecido"}`] };
    }

    return { status: "sent", warnings: [] };
  } catch (err) {
    const message = (err as Error)?.message || "Unknown error";
    console.error(`${logPrefix} Critical error sending email for ${storeName}:`, message);
    return { status: "failed", warnings: [`Erro critico no disparo do e-mail: ${message}`] };
  }
}
