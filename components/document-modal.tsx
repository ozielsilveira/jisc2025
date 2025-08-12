"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentModalProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string | null
  title?: string
}

export function DocumentModal({ isOpen, onClose, documentUrl, title = "Visualizar Documento" }: DocumentModalProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  const handleZoomIn = () => {
    if (!isMobile) return
    setZoom((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    if (!isMobile) return
    setZoom((prev) => Math.max(prev - 0.5, 0.5))
  }

  const handleResetZoom = () => {
    if (!isMobile) return
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile || zoom <= 1) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isMobile) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || zoom <= 1) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return
    e.preventDefault()
    const touch = e.touches[0]
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-h-[90vh] p-0", isMobile ? "max-w-[95vw] w-[95vw]" : "max-w-4xl")}>
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">{title}</DialogTitle>
        </DialogHeader>

        {isMobile && documentUrl && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center space-x-2 bg-gray-100 rounded-lg p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="h-10 w-10 p-0 bg-transparent"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3} className="h-10 w-10 p-0">
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={handleResetZoom} className="h-10 w-10 p-0 bg-transparent">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 px-6 pb-6">
          {documentUrl ? (
            <div
              ref={containerRef}
              className={cn(
                "w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50",
                isMobile ? "h-[60vh] relative" : "h-[70vh]",
              )}
            >
              {isMobile ? (
                <div
                  className="w-full h-full overflow-hidden cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img
                    ref={imageRef}
                    src={documentUrl || "/placeholder.svg"}
                    alt="Documento"
                    className="w-full h-full object-contain transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                      transformOrigin: "center center",
                    }}
                    draggable={false}
                  />
                </div>
              ) : (
                <iframe src={documentUrl} className="w-full h-full" title="Documento" />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Documento não encontrado.</p>
              </div>
            </div>
          )}
        </div>

        {isMobile && documentUrl && zoom > 1 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-500 text-center bg-blue-50 rounded-lg p-2 border border-blue-200">
              💡 Arraste para mover a imagem quando ampliada
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
