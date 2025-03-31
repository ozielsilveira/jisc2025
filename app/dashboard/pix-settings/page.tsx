"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { PixDisplay } from "@/components/pix-display"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { detectPixKeyType, getPixKeyTypeLabel, validatePixKey, type PixKeyType } from "@/lib/pix-validator"
import { supabase } from "@/lib/supabase"
import { AlertCircle, Save } from "lucide-react"
import { useEffect, useState } from "react"

export default function PixSettingsPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [athleticId, setAthleticId] = useState<string | null>(null)
    const [pixCode, setPixCode] = useState("")
    const [pixApproved, setPixApproved] = useState<boolean | null>(null)
    const [selectedKeyType, setSelectedKeyType] = useState<PixKeyType>("cpf")
    const [isValid, setIsValid] = useState(false)

    useEffect(() => {
        const fetchAthleticData = async () => {
            if (!user) return

            try {
                // Verificar se o usuário é uma atlética
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", user.id)
                    .single()

                if (userError) throw userError

                if (userData.role !== "athletic") {
                    toast({
                        title: "Acesso restrito",
                        description: "Apenas atléticas podem configurar códigos PIX.",
                        variant: "destructive",
                    })
                    setIsLoading(false)
                    return
                }

                // Buscar o ID da atlética associada ao usuário
                const { data: athleticData, error: athleticError } = await supabase
                    .from("athletics")
                    .select("id, pix_code, pix_approved")
                    .eq("id", user.user_metadata.athletic_id)
                    .maybeSingle()

                if (athleticError) throw athleticError

                if (athleticData) {
                    setAthleticId(athleticData.id)
                    if (athleticData.pix_code) {
                        setPixCode(athleticData.pix_code)
                        setSelectedKeyType(detectPixKeyType(athleticData.pix_code))
                        setIsValid(true)
                    }
                    setPixApproved(athleticData.pix_approved)
                } else {
                    toast({
                        title: "Atlética não encontrada",
                        description: "Não foi possível encontrar os dados da sua atlética.",
                        variant: "destructive",
                    })
                }
            } catch (error) {
                console.error("Erro ao buscar dados da atlética:", error)
                toast({
                    title: "Erro ao carregar dados",
                    description: "Não foi possível carregar os dados da sua atlética.",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchAthleticData()
    }, [user, toast])

    const validateInput = (value: string) => {
        const isValidKey = validatePixKey(value, selectedKeyType)
        setIsValid(isValidKey)
        return isValidKey
    }

    const handlePixCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setPixCode(value)
        validateInput(value)
    }

    const handleKeyTypeChange = (value: string) => {
        setSelectedKeyType(value as PixKeyType)
        setIsValid(validatePixKey(pixCode, value as PixKeyType))
    }

    const savePixCode = async () => {
        if (!athleticId || !isValid) return

        setIsSaving(true)

        try {
            const { error } = await supabase
                .from("athletics")
                .update({
                    pix_code: pixCode,
                    pix_approved: null, // Resetar para pendente quando atualizar
                })
                .eq("id", athleticId)

            if (error) throw error

            setPixApproved(null) // Atualizar o estado local para pendente

            toast({
                title: "Código PIX salvo",
                description: "Seu código PIX foi salvo e está aguardando aprovação.",
            })
        } catch (error) {
            console.error("Erro ao salvar código PIX:", error)
            toast({
                title: "Erro ao salvar código PIX",
                description: "Não foi possível salvar seu código PIX.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]"></div>
            </div>
        )
    }

    if (!athleticId) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Configurar PIX</h1>
                    <p className="text-muted-foreground">
                        Você não tem permissão para acessar esta página ou não está associado a uma atlética.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Configurar PIX</h1>
                <p className="text-muted-foreground">
                    Configure o código PIX da sua atlética para receber pagamentos de atletas e compradores de ingressos.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Cadastrar Código PIX</CardTitle>
                        <CardDescription>
                            Insira o código PIX que será utilizado para receber pagamentos. O código será verificado pela comissão
                            organizadora antes de ser disponibilizado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pixKeyType">Tipo de Chave PIX</Label>
                            <Select value={selectedKeyType} onValueChange={handleKeyTypeChange}>
                                <SelectTrigger id="pixKeyType">
                                    <SelectValue placeholder="Selecione o tipo de chave" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cpf">CPF</SelectItem>
                                    <SelectItem value="cnpj">CNPJ</SelectItem>
                                    <SelectItem value="email">E-mail</SelectItem>
                                    <SelectItem value="phone">Telefone</SelectItem>
                                    <SelectItem value="random">Chave Aleatória</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pixCode">Chave PIX ({getPixKeyTypeLabel(selectedKeyType)})</Label>
                            <Input
                                id="pixCode"
                                value={pixCode}
                                onChange={handlePixCodeChange}
                                placeholder={
                                    selectedKeyType === "cpf"
                                        ? "000.000.000-00"
                                        : selectedKeyType === "cnpj"
                                            ? "00.000.000/0000-00"
                                            : selectedKeyType === "email"
                                                ? "exemplo@atletica.com"
                                                : selectedKeyType === "phone"
                                                    ? "(00) 00000-0000"
                                                    : "32 caracteres alfanuméricos"
                                }
                                className={!isValid && pixCode ? "border-red-500" : ""}
                            />
                            {!isValid && pixCode && (
                                <p className="text-xs text-red-500">
                                    Chave PIX inválida. Verifique se o formato está correto para o tipo selecionado.
                                </p>
                            )}
                        </div>

                        {pixApproved === false && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Código PIX Rejeitado</AlertTitle>
                                <AlertDescription>
                                    Seu código PIX foi rejeitado pela comissão organizadora. Por favor, verifique os dados e tente
                                    novamente.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={savePixCode}
                            disabled={isSaving || !isValid}
                            className="w-full flex items-center justify-center"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Salvando..." : "Salvar Chave PIX"}
                        </Button>
                    </CardFooter>
                </Card>

                {pixCode && isValid && (
                    <PixDisplay
                        pixKey={pixCode}
                        athleticName={user?.user_metadata?.athletic_name || "Atlética"}
                        approved={pixApproved}
                        showApprovalStatus={true}
                        title="Prévia do Código PIX"
                        description="Assim é como seu código PIX será exibido para atletas e compradores."
                    />
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informações Importantes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-semibold">Processo de Aprovação</h3>
                        <p className="text-sm text-muted-foreground">
                            Após cadastrar seu código PIX, ele será analisado pela comissão organizadora para garantir sua validade.
                            Você receberá uma notificação quando o código for aprovado ou rejeitado.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">Visibilidade do Código PIX</h3>
                        <p className="text-sm text-muted-foreground">
                            Seu código PIX será visível apenas para atletas vinculados à sua atlética e para compradores de ingressos
                            que selecionarem sua atlética no momento da compra.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">Segurança</h3>
                        <p className="text-sm text-muted-foreground">
                            Certifique-se de que o código PIX inserido está correto e pertence à sua atlética. A plataforma não se
                            responsabiliza por pagamentos enviados para códigos PIX incorretos.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
