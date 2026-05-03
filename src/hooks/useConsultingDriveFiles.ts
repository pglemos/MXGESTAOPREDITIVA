import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

type DriveResponse = {
  folderUrl?: string
  files?: ConsultingDriveFile[]
  error?: string
  code?: string
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'object' && err && 'message' in err && typeof (err as any).message === 'string') return (err as any).message
  return fallback
}

export function useConsultingDriveFiles(clientId?: string | null) {
  const [folderUrl, setFolderUrl] = useState<string | null>(null)
  const [files, setFiles] = useState<ConsultingDriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsReconnect, setNeedsReconnect] = useState(false)

  const invokeJson = useCallback(async (body: Record<string, unknown>) => {
    const { data, error: invokeError } = await supabase.functions.invoke<DriveResponse>('google-drive-files', { body })
    if (invokeError) throw invokeError
    if (data?.error) {
      const err = new Error(data.error) as Error & { code?: string }
      err.code = data.code
      throw err
    }
    return data || {}
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
      setNeedsReconnect((err as any)?.code === 'DRIVE_NOT_CONNECTED' || message.includes('Reconecte a conta central'))
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
      setNeedsReconnect((err as any)?.code === 'DRIVE_NOT_CONNECTED' || message.includes('Reconecte a conta central'))
      return null
    } finally {
      setLoading(false)
    }
  }, [clientId, invokeJson])

  const uploadFiles = useCallback(async (selectedFiles: File[], targetClientId = clientId) => {
    if (!targetClientId || selectedFiles.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('clientId', targetClientId)
      for (const file of selectedFiles) formData.append('files', file)

      const { data, error: invokeError } = await supabase.functions.invoke<DriveResponse>('google-drive-files', {
        body: formData,
      })
      if (invokeError) throw invokeError
      if (data?.error) {
        const err = new Error(data.error) as Error & { code?: string }
        err.code = data.code
        throw err
      }
      applyResponse(data || {})
    } catch (err) {
      const message = getErrorMessage(err, 'Falha ao enviar arquivos')
      setError(message)
      setNeedsReconnect((err as any)?.code === 'DRIVE_NOT_CONNECTED' || message.includes('Reconecte a conta central'))
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
      setNeedsReconnect((err as any)?.code === 'DRIVE_NOT_CONNECTED' || message.includes('Reconecte a conta central'))
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
