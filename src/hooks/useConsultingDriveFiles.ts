import { useCallback, useEffect, useState } from 'react'
import { getSupabaseFunctionUrl, supabase } from '@/lib/supabase'

export type ConsultingDriveFile = {
  id: string
  name: string
  mimeType?: string
  size?: string
  webViewLink?: string
  webContentLink?: string
  createdTime?: string
  modifiedTime?: string
}

type MutationResult = {
  error: string | null
}

type DriveResponse = {
  folderUrl?: string
  files?: ConsultingDriveFile[]
  error?: string
  code?: string
}

type CodedError = Error & { code?: string }

function getErrorCode(err: unknown): string | undefined {
  return err instanceof Error && 'code' in err && typeof err.code === 'string' ? err.code : undefined
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'object' && err && 'message' in err) {
    const message = err.message
    if (typeof message === 'string') return message
  }
  return fallback
}

function getDriveError(data: DriveResponse, fallback: string) {
  const err = new Error(data.error || fallback) as CodedError
  err.code = data.code
  return err
}

function needsDriveReconnect(err: unknown, message: string): boolean {
  return getErrorCode(err) === 'DRIVE_NOT_CONNECTED' || message.includes('Reconecte a conta central')
}

export function useConsultingDriveFiles(clientId?: string | null) {
  const [folderUrl, setFolderUrl] = useState<string | null>(null)
  const [files, setFiles] = useState<ConsultingDriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsReconnect, setNeedsReconnect] = useState(false)

  const invokeJson = useCallback(async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sessão autenticada obrigatória para acessar arquivos')

    const response = await fetch(getSupabaseFunctionUrl('google-drive-files'), {
      method: 'POST',
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({})) as DriveResponse
    if (!response.ok || data.error) throw getDriveError(data, 'Falha ao acessar Google Drive')
    return data
  }, [])

  const applyResponse = useCallback((data: DriveResponse) => {
    setFolderUrl(data.folderUrl || null)
    setFiles(data.files || [])
    setNeedsReconnect(false)
  }, [])

  const listFiles = useCallback(async (targetClientId = clientId) => {
    if (!targetClientId) return
    setLoading(true)
    setError(null)
    try {
      const data = await invokeJson({ action: 'list', clientId: targetClientId })
      applyResponse(data)
    } catch (err) {
      const message = getErrorMessage(err, 'Falha ao listar arquivos')
      setError(message)
      setNeedsReconnect(needsDriveReconnect(err, message))
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [applyResponse, clientId, invokeJson])

  const ensureFolder = useCallback(async (targetClientId = clientId) => {
    if (!targetClientId) return null
    setLoading(true)
    setError(null)
    try {
      const data = await invokeJson({ action: 'ensure-folder', clientId: targetClientId })
      setFolderUrl(data.folderUrl || null)
      setNeedsReconnect(false)
      return data.folderUrl || null
    } catch (err) {
      const message = getErrorMessage(err, 'Falha ao preparar pasta')
      setError(message)
      setNeedsReconnect(needsDriveReconnect(err, message))
      return null
    } finally {
      setLoading(false)
    }
  }, [clientId, invokeJson])

  const uploadFiles = useCallback(async (selectedFiles: File[], targetClientId = clientId): Promise<MutationResult> => {
    if (!targetClientId || selectedFiles.length === 0) return { error: null }
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('clientId', targetClientId)
      for (const file of selectedFiles) formData.append('files', file)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão autenticada obrigatória para enviar arquivos')

      const response = await fetch(getSupabaseFunctionUrl('google-drive-files'), {
        method: 'POST',
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      })
      const data = await response.json().catch(() => ({})) as DriveResponse
      if (!response.ok || data.error) throw getDriveError(data, 'Falha ao enviar arquivos')
      applyResponse(data)
      return { error: null }
    } catch (err) {
      const message = getErrorMessage(err, 'Falha ao enviar arquivos')
      setError(message)
      setNeedsReconnect(needsDriveReconnect(err, message))
      return { error: message }
    } finally {
      setUploading(false)
    }
  }, [applyResponse, clientId])

  const deleteFile = useCallback(async (fileId: string, targetClientId = clientId) => {
    if (!targetClientId || !fileId) return
    setLoading(true)
    setError(null)
    try {
      const data = await invokeJson({ action: 'delete', clientId: targetClientId, fileId })
      applyResponse(data)
    } catch (err) {
      const message = getErrorMessage(err, 'Falha ao remover arquivo')
      setError(message)
      setNeedsReconnect(needsDriveReconnect(err, message))
    } finally {
      setLoading(false)
    }
  }, [applyResponse, clientId, invokeJson])

  useEffect(() => {
    if (clientId) listFiles(clientId)
  }, [clientId, listFiles])

  return {
    folderUrl,
    files,
    loading,
    uploading,
    error,
    needsReconnect,
    listFiles,
    ensureFolder,
    uploadFiles,
    deleteFile,
  }
}
