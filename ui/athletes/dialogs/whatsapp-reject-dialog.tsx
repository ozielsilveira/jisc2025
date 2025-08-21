"use client"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, UserX, MessageCircle, XCircle, Building2 } from "lucide-react"
import type { Athlete } from "@/domain/athletes/entities"
import { useState, useEffect, useRef } from "react"

type Props = {
  athlete: Athlete | null
  isOpen: boolean
  isLoading: boolean
  preview: (custom?: string) => string
  onConfirm: (custom?: string) => void
  onClose: () => void
}

export function WhatsAppRejectDialog({ athlete, isOpen, isLoading, preview, onConfirm, onClose }: Props) {
  const [msg, setMsg] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setMsg("")
    } else {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  if (!athlete) return null
  const text = preview(msg)
  const isNearLimit = msg.length > 400
  const characterCountColor = isNearLimit ? "text-amber-700" : "text-gray-700"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl lg:max-w-3xl p-0 rounded-2xl sm:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="bg-gradient-to-br from-red-500 to-rose-600 px-4 sm:px-6 py-6 sm:py-8 text-center text-white flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <XCircle className="h-8 w-8 sm:h-10 sm:w-10  text-red-700" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-red-700">Rejeitar Cadastro</DialogTitle>
          <p className="text-black text-xs sm:text-sm font-medium mt-1">O atleta será notificado via WhatsApp</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border text-center">
              <h3 className="text-lg sm:text-xl font-bold break-words text-gray-900">{athlete.user.name}</h3>
              <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2 sm:px-3 py-1 rounded-full break-words">
                {athlete.athletic.name}
              </span>
            </div>

            <div className="space-y-2">
              <label htmlFor="rejection-reason" className="block text-sm text-amber-800 font-medium">
                Motivo da Rejeição (opcional)
              </label>
              <Textarea
                id="rejection-reason"
                ref={textareaRef}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                maxLength={500}
                className="h-24 sm:h-28 resize-none text-gray-900 placeholder:text-gray-500"
                placeholder="Ex: Documento ilegível, informações incompletas..."
                aria-describedby="char-count rejection-help"
              />
              <div className="flex justify-between items-center text-xs">
                <span id="rejection-help" className="text-gray-700">
                  Descreva o motivo para ajudar o atleta a corrigir
                </span>
                <span id="char-count" className={`font-medium ${characterCountColor}`}>
                  {msg.length}/500
                </span>
              </div>
            </div>

            <div className="bg-rose-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 flex-shrink-0" />
                <p className="font-semibold text-rose-800 text-sm sm:text-base">Prévia da Mensagem WhatsApp</p>
              </div>
              <div className="bg-white rounded-lg sm:rounded-xl p-3 border h-20 sm:h-24 overflow-auto text-sm leading-relaxed">
                <div className="whitespace-pre-line break-words text-gray-900" aria-live="polite">
                  {text || "A mensagem aparecerá aqui..."}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 flex-shrink-0 bg-white border-t border-gray-100">
          <Button
            onClick={() => onConfirm(msg)}
            disabled={isLoading}
            className="w-full h-11 sm:h-12 bg-rose-700 hover:bg-rose-700 disabled:opacity-50 text-sm sm:text-base font-medium text-black"
            aria-describedby="confirm-action-desc"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                <span>Rejeitando...</span>
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span>Rejeitar e Enviar WhatsApp</span>
              </>
            )}
          </Button>
          <span id="confirm-action-desc" className="sr-only">
            Esta ação rejeitará o cadastro do atleta e enviará uma notificação via WhatsApp
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
