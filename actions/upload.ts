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
  console.log(file.size)
  // Validação de tamanho de arquivo no lado do servidor
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, message: `O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.` }
  }

  const fileExt = file.name.split('.').pop()
  const filePath = `${userId}/${fileType}_${Date.now()}.${fileExt}` // Chave do objeto no bucket

  try {
    // 1. Remover o arquivo anterior, se um URL antigo for fornecido
    if (oldFileUrl) {
      // Extrair a chave do objeto (caminho dentro do bucket) a partir do URL público
      // Certifique-se de que R2_PUBLIC_BUCKET_URL termina com o nome do bucket,
      // ou ajuste a lógica para remover apenas a parte base da URL.
      const oldFileKey = oldFileUrl.replace(`${R2_PUBLIC_BUCKET_URL}/`, '')

      // Verificar se a chave foi extraída corretamente e não é o URL completo novamente
      if (oldFileKey && oldFileKey !== oldFileUrl) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: oldFileKey
        })
        await S3.send(deleteCommand)
        console.log(`Arquivo antigo ${oldFileKey} removido com sucesso.`)
      } else {
        console.warn(`Não foi possível extrair a chave do arquivo antigo do URL: ${oldFileUrl}`)
      }
    }

    // 2. Fazer upload do novo arquivo
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
    return { success: true, url: publicUrl }
  } catch (error: any) {
    console.error('Erro ao fazer upload para Cloudflare R2:', error)
    return { success: false, message: error.message || 'Erro desconhecido ao fazer upload.' }
  }
}
