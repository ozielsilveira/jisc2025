"use client"

import { useAuth } from "@/components/auth-provider"
import { PixDisplay } from "@/components/pix-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useEffect, useState } from "react"

type Athletic = {
    id: string
    name: string
    university: string
    logo_url: string
    pix_code: string | null
    pix_approved: boolean | null
}

export default function ApprovePixPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [athletics, setAthletics] = useState<Athletic[]>([])

    useEffect(() => {
        const fetchAthletics = async () => {
            if (!user) return

            try {
                // Verificar se o usuário é um administrador
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", user.id)
                    .single()

                if (userError) throw userError

                if (userData.role !== "admin") {
                    toast({
                        title: "Acesso restrito",
                        description: "Apenas administradores podem aprovar códigos PIX.",
                        variant: "destructive",
                    })
                    setIsLoading(false)
                    return
                }

                // Buscar todas as atléticas com código PIX cadastrado
                const { data, error } = await supabase
                    .from("athletics")
                    .select("id, name, university, logo_url, pix_code, pix_approved")
                    .not("pix_code", "is", null)
                    .order("name")

                if (error) throw error

                setAthletics(data || [])
            } catch (error) {
                console.error("Erro ao buscar atléticas:", error)
                toast({
                    title: "Erro ao carregar dados",
                    description: "Não foi possível carregar as atléticas.",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchAthletics()
    }, [user, toast])

    const approvePixCode = async (athleticId: string) => {
        setIsProcessing(true)
        try {
            const { error } = await supabase.from("athletics").update({ pix_approved: true }).eq("id", athleticId)

            if (error) throw error

            // Atualizar o estado local
            setAthletics((prev) =>
                prev.map((athletic) => (athletic.id === athleticId ? { ...athletic, pix_approved: true } : athletic)),
            )

            toast({
                title: "Código PIX aprovado",
                description: "O código PIX foi aprovado com sucesso.",
            })
        } catch (error) {
            console.error("Erro ao aprovar código PIX:", error)
            toast({
                title: "Erro ao aprovar código PIX",
                description: "Não foi possível aprovar o código PIX.",
                variant: "destructive",
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const rejectPixCode = async (athleticId: string) => {
        setIsProcessing(true)
        try {
            const { error } = await supabase.from("athletics").update({ pix_approved: false }).eq("id", athleticId)

            if (error) throw error

            // Atualizar o estado local
            setAthletics((prev) =>
                prev.map((athletic) => (athletic.id === athleticId ? { ...athletic, pix_approved: false } : athletic)),
            )

            toast({
                title: "Código PIX rejeitado",
                description: "O código PIX foi rejeitado com sucesso.",
            })
        } catch (error) {
            console.error("Erro ao rejeitar código PIX:", error)
            toast({
                title: "Erro ao rejeitar código PIX",
                description: "Não foi possível rejeitar o código PIX.",
                variant: "destructive",
            })
        } finally {
            setIsProcessing(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]"></div>
            </div>
        )
    }

    // Verificar se o usuário não é um administrador
    if (user?.user_metadata?.role !== "admin") {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Aprovar Códigos PIX</h1>
                    <p className="text-muted-foreground">
                        Você não tem permissão para acessar esta página. Apenas administradores podem aprovar códigos PIX.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Aprovar Códigos PIX</h1>
                <p className="text-muted-foreground">Verifique e aprove os códigos PIX cadastrados pelas atléticas.</p>
            </div>

            {athletics.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Nenhum código PIX para aprovar</h2>
                        <p className="text-center text-muted-foreground">
                            Não há códigos PIX cadastrados pelas atléticas que precisem de aprovação.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {athletics.map((athletic) => (
                        <Card
                            key={athletic.id}
                            className={`border ${athletic.pix_approved === true
                                ? "border-green-500"
                                : athletic.pix_approved === false
                                    ? "border-red-500"
                                    : "border-yellow-500"
                                }`}
                        >
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="truncate">{athletic.name}</CardTitle>
                                    <Badge
                                        variant={
                                            athletic.pix_approved === true
                                                ? "secondary"
                                                : athletic.pix_approved === false
                                                    ? "destructive"
                                                    : "outline"
                                        }
                                        className={`${athletic.pix_approved === true
                                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                                            : athletic.pix_approved === false
                                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                            }`}
                                    >
                                        {athletic.pix_approved === true
                                            ? "Aprovado"
                                            : athletic.pix_approved === false
                                                ? "Rejeitado"
                                                : "Pendente"}
                                    </Badge>
                                </div>
                                <CardDescription>{athletic.university}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {athletic.pix_code && (
                                    <PixDisplay
                                        pixKey={athletic.pix_code}
                                        athleticName={athletic.name}
                                        approved={athletic.pix_approved}
                                        showApprovalStatus={true}
                                        title="Código PIX"
                                        description="Verifique se o código PIX é válido antes de aprovar."
                                        className=""
                                        showQRCode={true}
                                    />
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button
                                    variant="outline"
                                    className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                                    onClick={() => approvePixCode(athletic.id)}
                                    disabled={isProcessing || athletic.pix_approved === true}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprovar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => rejectPixCode(athletic.id)}
                                    disabled={isProcessing || athletic.pix_approved === false}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rejeitar
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
