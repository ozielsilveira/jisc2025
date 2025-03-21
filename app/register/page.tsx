"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const defaultType = searchParams.get("type") || "buyer"
  const restricted = searchParams.get("restricted") === "true"

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    phone: "",
    gender: "",
    role: defaultType as "buyer" | "athlete" | "athletic",
  })

  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Atualizar o role quando o tipo padrão muda
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      role: defaultType as "buyer" | "athlete" | "athletic",
    }))
  }, [defaultType])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro de validação",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return false
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro de validação",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Primeiro, vamos criar o usuário na tabela de autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Falha ao criar usuário")

      // Agora, vamos inserir os dados do usuário na tabela personalizada
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: formData.email,
        name: formData.name,
        cpf: formData.cpf,
        phone: formData.phone,
        gender: formData.gender,
        role: formData.role,
      })

      if (profileError) {
        // Se houver erro ao inserir na tabela users, vamos tentar excluir o usuário da autenticação
        console.error("Erro ao criar perfil:", profileError)
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Erro ao criar perfil: ${profileError.message}`)
      }

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Você pode fazer login agora.",
      })

      router.push("/login")
    } catch (error) {
      console.error("Error signing up:", error)
      toast({
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar sua conta. Tente novamente.",
        variant: "destructive",
      })
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
          <CardTitle className="text-2xl font-bold text-center">Criar uma conta</CardTitle>
          <CardDescription className="text-center">
            {restricted
              ? "Preencha os dados abaixo para se cadastrar como comprador de ingressos"
              : "Preencha os dados abaixo para se cadastrar no JISC"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select
                onValueChange={(value) => handleSelectChange("gender", value)}
                value={formData.gender || "placeholder"}
                defaultValue="placeholder"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Selecione seu gênero
                  </SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefiro não informar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!restricted && (
              <div className="space-y-2">
                <Label>Tipo de cadastro</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange("role", value)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="buyer" id="buyer" />
                    <Label htmlFor="buyer">Comprador de ingressos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="athlete" id="athlete" />
                    <Label htmlFor="athlete">Atleta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="athletic" id="athletic" />
                    <Label htmlFor="athletic">Representante de Atlética</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-[#0456FC]" disabled={isLoading}>
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

