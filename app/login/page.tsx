"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { validateEmail, validatePassword, sanitizeInput, checkRateLimit, clearRateLimit } from "@/lib/security"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const { signIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(e.target.value)
    setEmail(value)

    if (value && !validateEmail(value)) {
      setEmailError("Por favor, insira um e-mail válido")
    } else {
      setEmailError("")
    }
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)

    if (value && !validatePassword(value)) {
      setPasswordError("A senha deve ter entre 8 e 128 caracteres")
    } else {
      setPasswordError("")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const sanitizedEmail = sanitizeInput(email)

    if (!validateEmail(sanitizedEmail)) {
      setEmailError("Por favor, insira um e-mail válido")
      return
    }

    if (!validatePassword(password)) {
      setPasswordError("A senha deve ter entre 8 e 128 caracteres")
      return
    }

    const clientIP = "user-session" // In production, use actual IP
    if (!checkRateLimit(clientIP)) {
      toast({
        title: "Muitas tentativas",
        description: "Você excedeu o limite de tentativas. Tente novamente em 15 minutos.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await signIn(sanitizedEmail, password)

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, id")
        .eq("email", sanitizedEmail)
        .single()

      if (userError) {
        console.error("Database error:", userError)
        throw new Error("Erro interno do servidor")
      }

      clearRateLimit(clientIP)

      if (userData.role === "athletic") {
        toast({
          title: "Login bem-sucedido!",
          description: "Você será redirecionado para a listagem de atletas.",
          variant: "success",
        })
        router.push("/dashboard/athletes")
      }

      if (userData.role === "athlete") {
        toast({
          title: "Login bem-sucedido!",
          description: "Por favor, complete o seu cadastro nas configurações.",
          variant: "success",
        })

        router.push("/dashboard/profile")
      }

      if (userData.role === "admin") {
        toast({
          title: "Login bem-sucedido!",
          description: "Você será redirecionado para o painel.",
          variant: "success",
        })

        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)

      if (error instanceof Error) {
        if (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) {
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
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={handleEmailChange}
                required
                maxLength={254}
                autoComplete="email"
                aria-describedby={emailError ? "email-error" : undefined}
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && (
                <p id="email-error" className="text-sm text-red-600" role="alert">
                  {emailError}
                </p>
              )}
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
                onChange={handlePasswordChange}
                required
                maxLength={128}
                autoComplete="current-password"
                aria-describedby={passwordError ? "password-error" : undefined}
                className={passwordError ? "border-red-500" : ""}
              />
              {passwordError && (
                <p id="password-error" className="text-sm text-red-600" role="alert">
                  {passwordError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#0456FC]"
              disabled={isLoading || !!emailError || !!passwordError || !email || !password}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
