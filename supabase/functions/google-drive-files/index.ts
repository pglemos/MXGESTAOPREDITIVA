import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/crypto.ts";
import {
  createSessionClient,
  getCentralDriveAccessToken,
  googleApiRequest,
  CENTRAL_DRIVE_ROOT_FOLDER_ID,
  CENTRAL_DRIVE_ROOT_FOLDER_NAME,
} from "../_shared/google.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const INTERNAL_ROLES = new Set(["administrador_geral", "administrador_mx", "consultor_mx"]);

type DriveAction = "ensure-folder" | "list" | "upload" | "delete";

type ConsultingClientRow = {
  id: string;
  name: string;
  slug?: string | null;
  store_id?: string | null;
  primary_store_id?: string | null;
};

type DriveFolderRow = {
  id: string;
  client_id: string;
  store_id: string | null;
  parent_folder_id: string;
  google_drive_folder_id: string;
  google_drive_folder_url: string;
  status: string;
};

type DriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseUuid(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} obrigatório`);
  const normalized = value.trim();
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(normalized)) throw new Error(`${label} inválido`);
  return normalized;
}

function normalizeFolderName(value: string): string {
  return value
    .replace(/[\\/:*?"<>|#%{}~&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140) || "Cliente MX";
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function folderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`;
}

async function driveJson(accessToken: string, path: string, init: RequestInit = {}) {
  const res = await googleApiRequest(accessToken, path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Google Drive API error (${res.status})`);
  return data;
}

async function createDriveFolder(accessToken: string, name: string, parentId?: string) {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: FOLDER_MIME_TYPE,
  };
  if (parentId) metadata.parents = [parentId];

  const data = await driveJson(
    accessToken,
    "/drive/v3/files?fields=id,name,webViewLink",
    {
      method: "POST",
      body: JSON.stringify(metadata),
    },
  );
  return {
    id: String(data.id),
    name: String(data.name || name),
    webViewLink: String(data.webViewLink || folderUrl(String(data.id))),
  };
}

async function findDriveFolder(accessToken: string, name: string, parentId: string) {
  const query = [
    `mimeType='${FOLDER_MIME_TYPE}'`,
    `name='${escapeDriveQueryValue(name)}'`,
    `'${escapeDriveQueryValue(parentId)}' in parents`,
    "trashed=false",
  ].join(" and ");
  const data = await driveJson(
    accessToken,
    `/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive&pageSize=1&fields=files(id,name,webViewLink)`,
  );
  const file = Array.isArray(data.files) ? data.files[0] : null;
  return file
    ? {
        id: String(file.id),
        name: String(file.name || name),
        webViewLink: String(file.webViewLink || folderUrl(String(file.id))),
      }
    : null;
}

async function getRootFolder(accessToken: string) {
  if (CENTRAL_DRIVE_ROOT_FOLDER_ID) {
    return {
      id: CENTRAL_DRIVE_ROOT_FOLDER_ID,
      name: CENTRAL_DRIVE_ROOT_FOLDER_NAME,
      webViewLink: folderUrl(CENTRAL_DRIVE_ROOT_FOLDER_ID),
    };
  }

  const existing = await findDriveFolder(accessToken, CENTRAL_DRIVE_ROOT_FOLDER_NAME, "root");
  if (existing) return existing;
  return createDriveFolder(accessToken, CENTRAL_DRIVE_ROOT_FOLDER_NAME, "root");
}

async function ensureClientFolder(adminClient: any, accessToken: string, client: ConsultingClientRow, userId: string): Promise<DriveFolderRow> {
  const { data: existing, error: existingError } = await adminClient
    .from("pastas_drive_consultoria")
    .select("*")
    .eq("client_id", client.id)
    .eq("status", "active")
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.google_drive_folder_id) return existing as DriveFolderRow;

  const root = await getRootFolder(accessToken);
  const folderName = normalizeFolderName(`${client.name} - ${client.slug || client.id.slice(0, 8)}`);
  const driveFolder = await findDriveFolder(accessToken, folderName, root.id) ?? await createDriveFolder(accessToken, folderName, root.id);
  const storeId = client.primary_store_id || client.store_id || null;

  const { data: row, error: upsertError } = await adminClient
    .from("pastas_drive_consultoria")
    .upsert({
      client_id: client.id,
      store_id: storeId,
      parent_folder_id: root.id,
      google_drive_folder_id: driveFolder.id,
      google_drive_folder_url: driveFolder.webViewLink || folderUrl(driveFolder.id),
      status: "active",
      created_by: userId,
      updated_by: userId,
    }, { onConflict: "client_id" })
    .select("*")
    .single();
  if (upsertError) throw upsertError;
  return row as DriveFolderRow;
}

async function listDriveFiles(accessToken: string, folderId: string): Promise<DriveFile[]> {
  const query = [
    `'${escapeDriveQueryValue(folderId)}' in parents`,
    "trashed=false",
    `mimeType!='${FOLDER_MIME_TYPE}'`,
  ].join(" and ");
  const data = await driveJson(
    accessToken,
    `/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive&pageSize=100&orderBy=modifiedTime desc&fields=files(id,name,mimeType,size,webViewLink,webContentLink,createdTime,modifiedTime)`,
  );
  return Array.isArray(data.files) ? data.files as DriveFile[] : [];
}

async function uploadDriveFile(accessToken: string, folderId: string, file: File): Promise<DriveFile> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Arquivo ${file.name} excede o limite de 25 MB`);
  }

  const metadata = {
    name: file.name,
    parents: [folderId],
  };
  const boundary = `mx-drive-${crypto.randomUUID()}`;
  const body = new Blob([
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify(metadata),
    "\r\n",
    `--${boundary}\r\n`,
    `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
    await file.arrayBuffer(),
    "\r\n",
    `--${boundary}--`,
  ], { type: `multipart/related; boundary=${boundary}` });

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Content-Type", `multipart/related; boundary=${boundary}`);
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,createdTime,modifiedTime",
    {
      method: "POST",
      headers,
      body,
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Upload falhou (${res.status})`);
  return data as DriveFile;
}

async function trashDriveFile(accessToken: string, fileId: string): Promise<void> {
  await driveJson(
    accessToken,
    `/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,trashed`,
    {
      method: "PATCH",
      body: JSON.stringify({ trashed: true }),
    },
  );
}

async function authenticate(req: Request) {
  const sessionClient = createSessionClient(req.headers.get("Authorization"));
  const { data: authData, error: authError } = await sessionClient.auth.getUser();
  if (authError || !authData.user) throw new Error("Sessão inválida ou expirada");

  const adminClient = createClient(
    requireEnv("SUPABASE_URL", SUPABASE_URL),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
  );
  const { data: profile, error: profileError } = await adminClient
    .from("usuarios")
    .select("role")
    .eq("id", authData.user.id)
    .single();
  if (profileError) throw profileError;
  if (!INTERNAL_ROLES.has(profile?.role)) {
    return { error: jsonResponse({ error: "Apenas perfis internos MX podem acessar arquivos da consultoria" }, 403) };
  }

  return { sessionClient, adminClient, userId: authData.user.id };
}

async function getClient(adminClient: any, clientId: string): Promise<ConsultingClientRow> {
  const { data, error } = await adminClient
    .from("clientes_consultoria")
    .select("id,name,slug,store_id,primary_store_id")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cliente da consultoria não encontrado");
  return data as ConsultingClientRow;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await authenticate(req);
    if ("error" in auth) return auth.error;
    const { adminClient, userId } = auth;

    const contentType = req.headers.get("Content-Type") || "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");
    let action: DriveAction;
    let clientId: string;
    let deleteFileId: string | null = null;
    let files: File[] = [];

    if (isMultipart) {
      const form = await req.formData();
      action = "upload";
      clientId = parseUuid(form.get("clientId"), "clientId");
      files = form.getAll("files").filter((item): item is File => item instanceof File);
      if (files.length === 0) throw new Error("Nenhum arquivo enviado");
    } else {
      const body = await req.json().catch(() => ({}));
      action = body?.action;
      if (!["ensure-folder", "list", "delete"].includes(action)) {
        throw new Error("Ação inválida");
      }
      clientId = parseUuid(body?.clientId, "clientId");
      deleteFileId = typeof body?.fileId === "string" ? body.fileId : null;
    }

    const accessToken = await getCentralDriveAccessToken();
    if (!accessToken) {
      return jsonResponse({
        error: "Reconecte a conta central gestao@mxconsultoria.com.br com permissão de Google Drive.",
        code: "DRIVE_NOT_CONNECTED",
      }, 409);
    }

    const client = await getClient(adminClient, clientId);
    const folder = await ensureClientFolder(adminClient, accessToken, client, userId);

    if (action === "ensure-folder") {
      return jsonResponse({ folderUrl: folder.google_drive_folder_url, folder });
    }

    if (action === "list") {
      const driveFiles = await listDriveFiles(accessToken, folder.google_drive_folder_id);
      return jsonResponse({ folderUrl: folder.google_drive_folder_url, files: driveFiles });
    }

    if (action === "delete") {
      if (!deleteFileId) throw new Error("fileId obrigatório");
      const { data: fileRows, error: fileError } = await adminClient
        .from("arquivos_drive_consultoria")
        .select("id,google_drive_file_id,pasta_id,client_id")
        .eq("client_id", client.id)
        .eq("pasta_id", folder.id);
      if (fileError) throw fileError;
      const fileRow = (fileRows || []).find((row: any) => row.id === deleteFileId || row.google_drive_file_id === deleteFileId);
      const driveFileId = fileRow?.google_drive_file_id || deleteFileId;

      const currentFiles = await listDriveFiles(accessToken, folder.google_drive_folder_id);
      if (!currentFiles.some((file) => file.id === driveFileId)) {
        throw new Error("Arquivo não encontrado para este cliente");
      }

      await trashDriveFile(accessToken, driveFileId);
      if (fileRow?.id) {
        const { error: updateError } = await adminClient
          .from("arquivos_drive_consultoria")
          .update({ status: "trashed", deleted_by: userId, deleted_at: new Date().toISOString() })
          .eq("id", fileRow.id);
        if (updateError) throw updateError;
      }

      const driveFiles = await listDriveFiles(accessToken, folder.google_drive_folder_id);
      return jsonResponse({ folderUrl: folder.google_drive_folder_url, files: driveFiles });
    }

    const uploaded: DriveFile[] = [];
    for (const file of files) {
      const driveFile = await uploadDriveFile(accessToken, folder.google_drive_folder_id, file);
      uploaded.push(driveFile);
      const { error: upsertError } = await adminClient
        .from("arquivos_drive_consultoria")
        .upsert({
          pasta_id: folder.id,
          client_id: client.id,
          store_id: folder.store_id,
          google_drive_file_id: driveFile.id,
          name: driveFile.name || file.name,
          mime_type: driveFile.mimeType || file.type || "application/octet-stream",
          size_bytes: Number(driveFile.size || file.size || 0),
          web_view_link: driveFile.webViewLink || null,
          web_content_link: driveFile.webContentLink || null,
          status: "active",
          uploaded_by: userId,
        }, { onConflict: "google_drive_file_id" });
      if (upsertError) throw upsertError;
    }

    const driveFiles = await listDriveFiles(accessToken, folder.google_drive_folder_id);
    return jsonResponse({ folderUrl: folder.google_drive_folder_url, uploaded, files: driveFiles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no Google Drive";
    const status = message.includes("Sessão inválida") ? 401 : 400;
    return jsonResponse({ error: message }, status);
  }
});
