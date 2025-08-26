'use client'

import type React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface FileUploadProps {
  id: string
  label: string
  description: string
  existingFileUrl?: string
  onFileChange: (file: File | null) => void
  required?: boolean
  accept?: string
  maxSize?: number // in MB
}

export function FileUpload({
  id,
  label,
  description,
  existingFileUrl,
  onFileChange,
  required = false,
  accept = 'image/*,.pdf',
  maxSize = 5,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        return `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`
      }

      // Check file type
      const acceptedTypes = accept.split(',').map((type) => type.trim())
      const isValidType = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        if (type.includes('*')) {
          const baseType = type.split('/')[0]
          return file.type.startsWith(baseType)
        }
        return file.type === type
      })

      if (!isValidType) {
        return 'Tipo de arquivo não suportado'
      }

      return null
    },
    [accept, maxSize]
  )

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setError('')
      setSelectedFile(file)
      onFileChange(file)
    },
    [validateFile, onFileChange]
  )

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setError('')
    onFileChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className='space-y-2'>
      <Label htmlFor={id} className='text-sm font-medium'>
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </Label>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Input
          ref={fileInputRef}
          id={id}
          type='file'
          accept={accept}
          onChange={handleInputChange}
          className='sr-only'
          aria-describedby={`${id}-description ${id}-error`}
        />

        {selectedFile ? (
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='flex-shrink-0'>
                <Check className='h-8 w-8 text-green-500' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-medium text-gray-900 break-all'>{selectedFile.name}</p>
                <p className='text-sm text-gray-500'>{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleRemoveFile}
              className='flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50'
              aria-label='Remover arquivo'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        ) : existingFileUrl ? (
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-2 mb-2'>
              <Check className='h-5 w-5 text-green-500' />
              <span className='text-sm font-medium text-green-700'>Arquivo já enviado</span>
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleButtonClick}
              className='mt-2 bg-transparent'
            >
              <Upload className='h-4 w-4 mr-2' />
              Substituir arquivo
            </Button>
          </div>
        ) : (
          <div className='text-center'>
            <Upload className='mx-auto h-12 w-12 text-gray-400' />
            <div className='mt-4'>
              <Button type='button' variant='outline' onClick={handleButtonClick} className='focus-ring bg-transparent'>
                <Upload className='h-4 w-4 mr-2' />
                Selecionar arquivo
              </Button>
            </div>
            <p className='mt-2 text-sm text-gray-500'>ou arraste e solte aqui</p>
          </div>
        )}
      </div>

      <p id={`${id}-description`} className='text-sm text-gray-600'>
        {description}
      </p>

      {error && (
        <p id={`${id}-error`} className='text-sm text-red-600' role='alert'>
          {error}
        </p>
      )}

      <p className='text-xs text-gray-500'>
        Tamanho máximo: {maxSize}MB • Formatos aceitos: {accept.replace(/,/g, ', ')}
      </p>
    </div>
  )
}
