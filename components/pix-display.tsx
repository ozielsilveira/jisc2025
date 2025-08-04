"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { detectPixKeyType, formatPixKey, getPixKeyTypeLabel } from "@/lib/pix-validator"
import { Check, Copy, QrCode } from "lucide-react"
import { useState } from "react"

interface PixDisplayProps {
    pixKey: string
    athleticName: string
    approved?: boolean | null
    showApprovalStatus?: boolean
    title?: string
    description?: string
    className?: string
    showQRCode?: boolean
}

export function PixDisplay({
    pixKey,
    athleticName,
    approved = null,
    showApprovalStatus = false,
    title = "Código PIX",
    description = "Utilize este código PIX para realizar o pagamento",
    className = "",
    showQRCode = true,
}: PixDisplayProps) {
    const { toast } = useToast()
    const [copied, setCopied] = useState(false)
    const [showQrCode, setShowQrCode] = useState(false)

    const keyType = detectPixKeyType(pixKey)
    const formattedKey = formatPixKey(pixKey, keyType)
    const keyTypeLabel = getPixKeyTypeLabel(keyType)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(pixKey)
        setCopied(true)
        toast({
            title: "Código PIX copiado!",
            description: "O código PIX foi copiado para a área de transferência.",
        })
        setTimeout(() => setCopied(false), 2000)
    }

    const toggleQRCode = () => {
        setShowQrCode(!showQrCode)
    }

    // Função para gerar um QR Code simples (placeholder)
    const getQRCodeUrl = () => {
        // Em uma implementação real, você usaria uma API de QR Code
        // Aqui estamos usando um placeholder
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixKey)}`
    }

    return (
        <Card
            className={`border ${approved === true ? "border-green-500" : approved === false ? "border-red-500" : ""} ${className}`}
        >
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{title}</CardTitle>
                    {showApprovalStatus && (
                        <Badge
                            variant={approved === true ? "default" : approved === false ? "destructive" : "outline"}
                            className={`${approved === true
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : approved === false
                                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                }`}
                        >
                            {approved === true ? "Aprovado" : approved === false ? "Rejeitado" : "Pendente"}
                        </Badge>
                    )}
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">Atlética: {athleticName}</div>
                    <div className="text-sm text-muted-foreground mb-1">Tipo de Chave: {keyTypeLabel}</div>
                    <div className="font-mono text-lg break-all">{formattedKey}</div>
                </div>

                {showQRCode && (
                    <div className="flex justify-center p-4">
                        <img src={getQRCodeUrl() || "/placeholder.svg"} alt="QR Code PIX" className="w-48 h-48" />
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button variant="outline" size="sm" onClick={toggleQRCode}>
                    <QrCode className="h-4 w-4 mr-2" />
                    {showQrCode ? "Ocultar QR Code" : "Mostrar QR Code"}
                </Button>
            </CardFooter>
        </Card>
    )
}
