'use server'

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
  console.warn('Cloudflare R2 environment variables are not fully configured. Uploads might fail.')
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
const getFileExtension = (file: File): string => {
  const filename = file.name || ''
  const filenameExt = filename.split('.').pop()?.toLowerCase()

  // Prioritize extension from filename if it seems valid
  if (filenameExt && filename.includes('.')) {
    console.log(`[Upload Action] Extracted extension '${filenameExt}' from filename: '${filename}'`)
    return filenameExt
  }

  // Fallback to inferring from MIME type
  const mimeType = file.type
  console.log(`[Upload Action] No valid extension in filename. Inferring from MIME type: '${mimeType}'`)

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
    console.log(`[Upload Action] Inferred extension '${extFromMime}' from MIME type.`)
    return extFromMime
  }

  // Final fallback if MIME type is unknown
  console.warn(`[Upload Action] Could not infer extension from MIME type '${mimeType}'. Using fallback 'bin'.`)
  return 'bin' // Use a generic extension if all else fails
}

export async function uploadFileToR2(
  formData: FormData,
  userId: string,
  fileType: 'document' | 'enrollment',
  oldFileUrl?: string
) {
  const file = formData.get('file') as File | null
  if (!file) {
    return { success: false, message: 'Nenhum arquivo fornecido.' }
  }

  // Server-side file size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, message: `O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.` }
  }

  // Use the robust helper function to get the file extension
  const fileExt = getFileExtension(file)
  const filePath = `${userId}/${fileType}_${Date.now()}.${fileExt}`

  console.log(`[Upload Action] Uploading file. Details:
    - User ID: ${userId}
    - File Type: ${fileType}
    - Original Filename: ${file.name}
    - MIME Type: ${file.type}
    - Determined Extension: ${fileExt}
    - Final Path: ${filePath}`)

  try {
    // 1. Delete the previous file, if an old URL is provided
    if (oldFileUrl) {
      const oldFileKey = oldFileUrl.replace(`${R2_PUBLIC_BUCKET_URL}/`, '')
      if (oldFileKey && oldFileKey !== oldFileUrl) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: oldFileKey
        })
        await S3.send(deleteCommand)
        console.log(`[Upload Action] Old file ${oldFileKey} removed successfully.`)
      } else {
        console.warn(`[Upload Action] Could not extract key from old file URL: ${oldFileUrl}`)
      }
    }

    // 2. Upload the new file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
      Body: buffer,
      ContentType: file.type
    })

    await S3.send(command)

    const publicUrl = `${R2_PUBLIC_BUCKET_URL}/${filePath}`
    console.log(`[Upload Action] File uploaded successfully. Public URL: ${publicUrl}`)
    return { success: true, url: publicUrl }
  } catch (error: any) {
    console.error('[Upload Action] Error uploading to Cloudflare R2:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao fazer upload.' }
  }
}
