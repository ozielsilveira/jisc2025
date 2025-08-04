"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Eye, Trash2, Upload } from "lucide-react"

interface FileUploadProps {
  id: string
  label: string
  description: string
  existingFileUrl?: string | null
  onFileChange: (file: File | null) => void
  required?: boolean
}

export function FileUpload({ id, label, description, existingFileUrl, onFileChange, required }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isReplacing, setIsReplacing] = useState(!existingFileUrl)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    onFileChange(file)
  }

  const handleRemoveExistingFile = () => {
    setIsReplacing(true)
    onFileChange(null) // Signal that the file should be removed/replaced
  }

  const isImage = existingFileUrl && /\.(jpg|jpeg|png|gif)$/i.test(existingFileUrl)

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{label}</h3>
      <div className="space-y-2">
        <Label htmlFor={id}>Arquivo do Documento</Label>
        {existingFileUrl && !isReplacing ? (
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div className="flex items-center gap-3">
              {isImage ? (
                <div className="w-full">
                  <Image
                    src={existingFileUrl}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="rounded-md object-contain"
                  />
                </div>
              ) : (
                <div className="w-full">
                  <iframe src={existingFileUrl} className="h-96 w-full rounded-md border" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <a href={existingFileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </a>
              <Button variant="destructive" size="sm" onClick={handleRemoveExistingFile}>
                <Trash2 className="h-4 w-4 mr-1" />
                Remover
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Input id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} required={required} />
              {selectedFile && (
                <div className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Novo arquivo selecionado
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">{description}</p>
          </>
        )}
      </div>
    </div>
  )
}
