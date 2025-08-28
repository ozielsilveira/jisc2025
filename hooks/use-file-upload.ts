import { useState, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'
import { getPresignedUrl, deleteFileFromR2 } from '@/actions/upload'
import { invalidateCache } from '@/lib/cache'

interface UploadProgress {
  [key: string]: number
}

interface UploadStatus {
  [key: string]: 'idle' | 'uploading' | 'success' | 'error'
}

interface UseFileUploadOptions {
  onSuccess?: (url: string, type: string) => void
  onError?: (error: Error) => void
  maxFileSize?: number // in MB
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({})
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({})

  const uploadFile = useCallback(async (
    file: File,
    userId: string,
    fileType: 'document' | 'enrollment',
    uploadKey: string = 'default'
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    const maxFileSize = options.maxFileSize || 10
    
    if (file.size > maxFileSize * 1024 * 1024) {
      const error = `O arquivo excede o limite de ${maxFileSize}MB.`
      toast({
        title: 'Arquivo muito grande',
        description: error,
        variant: 'destructive'
      })
      return { success: false, error }
    }

    setIsUploading(true)
    setUploadStatus((prev) => ({ ...prev, [uploadKey]: 'uploading' }))
    setUploadProgress((prev) => ({ ...prev, [uploadKey]: 0 }))

    try {
      // 1. Get presigned URL
      setUploadProgress((prev) => ({ ...prev, [uploadKey]: 10 }))
      const presignedUrlResult = await getPresignedUrl(userId, fileType, {
        name: file.name,
        type: file.type,
        size: file.size
      })

      if (!presignedUrlResult.success || !presignedUrlResult.data) {
        throw new Error(presignedUrlResult.message || 'Falha ao obter URL de upload.')
      }

      const { uploadUrl, publicUrl } = presignedUrlResult.data

      // 2. Upload file to R2
      setUploadProgress((prev) => ({ ...prev, [uploadKey]: 30 }))
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload para o servidor de arquivos.')
      }

      setUploadProgress((prev) => ({ ...prev, [uploadKey]: 100 }))
      setUploadStatus((prev) => ({ ...prev, [uploadKey]: 'success' }))

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess(publicUrl, fileType)
      }

      return { success: true, url: publicUrl }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload'
      setUploadStatus((prev) => ({ ...prev, [uploadKey]: 'error' }))
      
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(errorMessage))
      }

      toast({
        title: 'Erro no upload',
        description: errorMessage,
        variant: 'destructive'
      })

      return { success: false, error: errorMessage }
    } finally {
      setIsUploading(false)
    }
  }, [options])

  const replaceFile = useCallback(async (
    file: File,
    userId: string,
    fileType: 'document' | 'enrollment',
    oldFileUrl: string | null,
    updateDatabase: (url: string) => Promise<{ success: boolean; message?: string }>,
    uploadKey: string = 'replacement'
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    const maxFileSize = options.maxFileSize || 10
    
    if (file.size > maxFileSize * 1024 * 1024) {
      const error = `O arquivo excede o limite de ${maxFileSize}MB.`
      toast({
        title: 'Arquivo muito grande',
        description: error,
        variant: 'destructive'
      })
      return { success: false, error }
    }

    setIsUploading(true)
    setUploadStatus((prev) => ({ ...prev, [uploadKey]: 'uploading' }))
    setUploadProgress((prev) => ({ ...prev, [uploadKey]: 0 }))

    try {
      // 1. Get presigned URL
      setUploadProgress((prev) => ({ ...prev, [uploadKey]: 10 }))
      const presignedUrlResult = await getPresignedUrl(userId, fileType, {
        name: file.name,
        type: file.type,
        size: file.size
      })

      if (!presignedUrlResult.success || !presignedUrlResult.data) {
        throw new Error(presignedUrlResult.message || 'Falha ao obter URL de upload.')
      }

      const { uploadUrl, publicUrl } = presignedUrlResult.data

      // 2. Upload file to R2
      setUploadProgress((prev) => ({ ...prev, [uploadKey]: 30 }))
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload para o servidor de arquivos.')
      }

      setUploadProgress((prev) => ({ ...prev, [uploadKey]: 70 }))

      // 3. Update database FIRST (before deleting old file)
      const dbUpdateResult = await updateDatabase(publicUrl)
      if (!dbUpdateResult.success) {
        throw new Error(dbUpdateResult.message || 'Erro ao atualizar o banco de dados.')
      }

      setUploadProgress((prev) => ({ ...prev, [uploadKey]: 90 }))

      // 4. Invalidate cache to ensure UI updates immediately
      try {
        // Invalidate athlete cache by user ID
        invalidateCache.athleteByUser(userId)
        // Also invalidate athletes list cache
        invalidateCache.athletesList()
      } catch (cacheError) {
        console.warn('Failed to invalidate cache:', cacheError)
        // Don't fail the operation if cache invalidation fails
      }

      // 5. Delete old file ONLY after successful database update
      if (oldFileUrl && oldFileUrl !== publicUrl) {
        try {
          await deleteFileFromR2(oldFileUrl)
        } catch (deleteError) {
          // Log the error but don't fail the operation - the new file is already saved
          console.warn('Failed to delete old file:', deleteError)
        }
      }

      setUploadProgress((prev) => ({ ...prev, [uploadKey]: 100 }))
      setUploadStatus((prev) => ({ ...prev, [uploadKey]: 'success' }))

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess(publicUrl, fileType)
      }

      return { success: true, url: publicUrl }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload'
      setUploadStatus((prev) => ({ ...prev, [uploadKey]: 'error' }))
      
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(errorMessage))
      }

      toast({
        title: 'Erro no upload',
        description: errorMessage,
        variant: 'destructive'
      })

      return { success: false, error: errorMessage }
    } finally {
      setIsUploading(false)
    }
  }, [options])

  const resetUpload = useCallback((uploadKey: string = 'default') => {
    setUploadProgress((prev) => ({ ...prev, [uploadKey]: 0 }))
    setUploadStatus((prev) => ({ ...prev, [uploadKey]: 'idle' }))
  }, [])

  return {
    isUploading,
    uploadProgress,
    uploadStatus,
    uploadFile,
    replaceFile,
    resetUpload
  }
}
