'use server'

import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Certifique-se de que estas variáveis de ambiente estão configuradas no seu ambiente Vercel
// CLOUDFLARE_ACCOUNT_ID: Seu ID de conta da Cloudflare
// CLOUDFLARE_ACCESS_KEY_ID: Sua chave de acesso R2 (gerada no Cloudflare)
// CLOUDFLARE_SECRET_ACCESS_KEY: Sua chave secreta R2 (gerada no Cloudflare)
// CLOUDFLARE_BUCKET_NAME: O nome do seu bucket R2
// CLOUDFLARE_PUBLIC_BUCKET_URL: A URL pública do seu bucket (ex: https://pub-<RANDOM_ID>.r2.dev/<BUCKET_NAME>)

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME
const R2_PUBLIC_BUCKET_URL = process.env.CLOUDFLARE_PUBLIC_BUCKET_URL

// Definir o limite de tamanho de arquivo em MB
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024 // Convertendo para bytes

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_BUCKET_URL) {
  throw new Error('Cloudflare R2 environment variables are not configured.')
}

const S3 = new S3Client({
  region: 'auto', // Cloudflare R2 usa 'auto'
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
})

// Helper function to determine file extension safely
const getFileExtension = (file: { name: string; type: string }): string => {
  const filename = file.name || ''
  const filenameExt = filename.split('.').pop()?.toLowerCase()

  // Prioritize extension from filename if it seems valid
  if (filenameExt && filename.includes('.')) {
    return filenameExt
  }

  // Fallback to inferring from MIME type
  const mimeType = file.type

  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/pjpeg': 'jpg',
    'application/pdf': 'pdf',
    'image/webp': 'webp',
    'image/gif': 'gif'
  }

  const extFromMime = mimeToExt[mimeType]
  if (extFromMime) {
    return extFromMime
  }

  return 'bin'
}

// Função principal para upload de arquivos
export async function uploadFileToR2(
  formData: FormData,
  userId: string,
  fileType: 'document' | 'enrollment',
  existingFileUrl?: string
) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, message: 'Nenhum arquivo fornecido.' }
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { success: false, message: `O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.` }
    }

    // Se existe um arquivo antigo, removê-lo primeiro
    if (existingFileUrl) {
      try {
        await deleteFileFromR2(existingFileUrl)
      } catch (error) {
        console.warn('Erro ao remover arquivo antigo:', error)
        // Continua mesmo se falhar ao remover o arquivo antigo
      }
    }

    // Gerar chave única para o arquivo
    const fileExt = getFileExtension(file)
    const key = `${userId}/${fileType}_${Date.now()}.${fileExt}`

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload do arquivo
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size
    })

    await S3.send(putCommand)

    // Retornar URL pública do arquivo
    const publicUrl = `${R2_PUBLIC_BUCKET_URL}/${key}`

    return {
      success: true,
      url: publicUrl,
      message: 'Arquivo enviado com sucesso!'
    }
  } catch (error: any) {
    console.error('Error uploading file to R2:', error)
    return {
      success: false,
      message: error.message || 'Erro ao fazer upload do arquivo.'
    }
  }
}

// Função para deletar arquivos
export async function deleteFileFromR2(fileUrl: string) {
  if (!fileUrl) {
    return { success: false, message: 'Nenhuma URL de arquivo fornecida.' }
  }

  const fileKey = fileUrl.replace(`${R2_PUBLIC_BUCKET_URL}/`, '')
  if (!fileKey || fileKey === fileUrl) {
    console.warn(`Could not extract key from file URL: ${fileUrl}`)
    return { success: false, message: 'URL de arquivo inválida.' }
  }

  const deleteCommand = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey
  })

  try {
    await S3.send(deleteCommand)
    return { success: true }
  } catch (error: any) {
    console.error(`Error deleting file from R2: ${fileKey}`, error)
    return { success: false, message: 'Erro ao deletar arquivo antigo.' }
  }
}

// Função para obter URL pré-assinada (mantida para compatibilidade)
export async function getPresignedUrl(
  userId: string,
  fileType: 'document' | 'enrollment',
  file: { name: string; type: string; size: number }
) {
  if (!file) {
    return { success: false, message: 'Nenhum arquivo fornecido.' }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, message: `O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.` }
  }

  const fileExt = getFileExtension(file)
  const key = `${userId}/${fileType}_${Date.now()}.${fileExt}`

  const putCommand = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: file.type,
    ContentLength: file.size
  })

  try {
    const signedUrl = await getSignedUrl(S3, putCommand, { expiresIn: 60 * 5 }) // 5 minutes
    const publicUrl = `${R2_PUBLIC_BUCKET_URL}/${key}`

    return {
      success: true,
      data: {
        uploadUrl: signedUrl,
        publicUrl: publicUrl
      }
    }
  } catch (error: any) {
    console.error('Error creating presigned URL:', error)
    return { success: false, message: 'Erro ao criar URL de upload.' }
  }
}
