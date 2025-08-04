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
                <Image src={existingFileUrl} alt="Preview" width={40} height={40} className="rounded-md object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                  PDF
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                {existingFileUrl.split("/").pop()?.split("?")[0]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (existingFileUrl) {
                      const url = new URL(existingFileUrl);
                    if (url) {
                      window.open(url, '_blank', 'noopener,noreferrer');
                      } else {
                      console.error('Não foi possível extrair o caminho do documento da URL');
                    }
                  }
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
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
