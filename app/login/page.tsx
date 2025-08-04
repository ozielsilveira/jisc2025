"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)

      // Check if user is an athletic representative and needs to complete registration
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, id")
        .eq("email", email)
        .single()

      if (userError) throw userError

      if (userData.role === "athletic") {
        const { data: athleticData, error: athleticError } = await supabase
          .from("athletics")
          .select("university, logo_url")
          .eq("representative_id", userData.id)
          .single()

        if (athleticError) throw athleticError

        if (!athleticData.university || !athleticData.logo_url) {
          toast({
            title: "Login bem-sucedido!",
            description: "Por favor, complete o cadastro da sua atlética nas configurações.",
            variant: "success",
          })
          router.push("/dashboard/settings")
          return
        }
      }

      toast({
        title: "Login bem-sucedido!",
        description: "Você será redirecionado para o painel.",
        variant: "success",
      })
      router.push("/dashboard")
    } catch (error) {
      console.warn("Error signing in:", error)
      if (error instanceof Error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Credenciais inválidas",
            description: "E-mail ou senha incorretos. Por favor, verifique e tente novamente.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Erro ao fazer login",
            description: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image src="/logo.svg" alt="JISC Logo" width={80} height={80} />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Entrar no JISC</CardTitle>
          <CardDescription className="text-center">Entre com seu e-mail e senha para acessar sua conta</CardDescription>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#0456FC]" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-500">
              Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

