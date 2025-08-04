"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setIsLoading(false)

    if (error) {
      console.error("Error sending password reset email:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar o e-mail de redefinição de senha. Verifique o e-mail digitado e tente novamente.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "E-mail de redefinição de senha enviado",
        description: "Se uma conta com este e-mail existir, um link para redefinir sua senha foi enviado.",
        variant: "success",
      })
      router.push("/login")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image src="/logo.svg" alt="JISC Logo" width={80} height={80} />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Esqueceu sua senha?</CardTitle>
          <CardDescription className="text-center">
            Digite seu e-mail para receber um link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#0456FC]" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Lembrou sua senha?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
