"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const defaultType = searchParams.get("type") || "buyer"
  const restricted = searchParams.get("restricted") === "true"
  const athleticReferral = searchParams.get("athletic")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    phone: "",
    role: defaultType as "buyer" | "athlete" | "athletic",
    athletic_id: athleticReferral || "",
    package_id: "",
  })

  const [athletics, setAthletics] = useState<Array<{ id: string; name: string; university: string }>>([])
  const [packages, setPackages] = useState<Array<{ id: string; name: string; description: string; price: number; category: "games" | "party" | "combined" }>>([])
  const [selectedPackage, setSelectedPackage] = useState<{ category: "games" | "party" | "combined" } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  // const { signUp } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Fetch athletics and packages on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Não busca dados se o usuário for do tipo athletic
      if (formData.role === "athletic") return;

      try {
        // Fetch athletics
        const { data: athleticsData, error: athleticsError } = await supabase
          .from("athletics")
          .select("id, name, university")
          .order("name")

        if (athleticsError) throw athleticsError
        setAthletics(athleticsData || [])

        // Fetch packages
        const { data: packagesData, error: packagesError } = await supabase
          .from("packages")
          .select("id, name, description, price, category")
          .order("price")

        if (packagesError) throw packagesError
        setPackages(packagesData || [])
      } catch (error) {
        console.warn("Error fetching data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as atléticas e pacotes.",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [toast, formData.role])

  // Atualizar o role e athletic_id quando os parâmetros mudam
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      role: defaultType as "buyer" | "athlete" | "athletic",
      athletic_id: athleticReferral || prev.athletic_id,
    }))
  }, [defaultType, athleticReferral])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "package_id") {
      const selectedPackage = packages.find(pkg => pkg.id === value)
      setSelectedPackage(selectedPackage || null)
    }
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

    if ((formData.role === "athlete" || formData.role === "buyer") && !formData.athletic_id) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione sua atlética.",
        variant: "destructive",
      })
      return false
    }

    if (formData.role !== "athletic" && !formData.package_id) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione um pacote.",
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
      // First, check if user already exists in auth
      const { data: existingAuth } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (existingAuth.user) {
        toast({
          title: "Usuário já existe",
          description: "Este e-mail já está cadastrado. Por favor, faça login.",
          variant: "destructive",
        })
        router.push('/login')
        return
      }

      // Create new user in auth
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

      // Create user profile in users table
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          cpf: formData.cpf,
          phone: formData.phone,
          role: formData.role,
          gender: null, // Default value, can be updated later
        })

      if (userError) {
        // If there's an error creating the user profile, we should delete the auth user
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Erro ao criar perfil de usuário: ${userError.message}`)
      }

      // If user is an athletic representative, create pre-registration in athletics table
      if (formData.role === "athletic") {
        const { error: athleticError } = await supabase
          .from("athletics")
          .insert({
            id: authData.user.id,
            name: formData.name,
            university: "",
            logo_url: "",
            status: "pending",
            representative_id: authData.user.id,
          })

        if (athleticError) {
          throw new Error(`Erro ao criar pré-registro da atlética: ${athleticError.message}`)
        }

        toast({
          title: "Cadastro realizado com sucesso",
          description: "Por favor, complete o cadastro da sua atlética nas configurações após fazer login.",
        })
        router.push("/login")
        return
      }

      // If user is an athlete, create athlete record
      if (formData.role === "athlete") {
        const { error: athleteError } = await supabase
          .from("athletes")
          .insert({
            user_id: authData.user.id,
            athletic_id: formData.athletic_id,
            photo_url: "",
            enrollment_document_url: "",
            status: "pending",
          })

        if (athleteError) {
          throw new Error(`Erro ao criar perfil de atleta: ${athleteError.message}`)
        }

        // Create athlete package record if a package was selected
        if (formData.package_id) {
          const { error: packageError } = await supabase
            .from("athlete_packages")
            .insert({
              athlete_id: authData.user.id,
              package_id: formData.package_id,
              payment_status: "pending",
            })

          if (packageError) {
            throw new Error(`Erro ao criar pacote: ${packageError.message}`)
          }
        }
      }

      toast({
        title: "Cadastro realizado com sucesso",
        description: selectedPackage?.category === "games" || selectedPackage?.category === "combined"
          ? "Sua solicitação será analisada pela atlética antes de prosseguir com o pagamento."
          : "Você pode fazer login agora.",
      })

      router.push("/login")
    } catch (error) {
      console.warn("Error signing up:", error)
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
          <CardTitle className="text-2xl font-bold text-center">
            {formData.role === "athletic" ? "Cadastro de Atlética" : "Criar uma conta"}
          </CardTitle>
          <CardDescription className="text-center">
            {formData.role === "athletic"
              ? "Preencha os dados abaixo para cadastrar sua atlética"
              : restricted
                ? "Preencha os dados abaixo para se cadastrar como comprador de ingressos"
                : "Preencha os dados abaixo para se cadastrar no JISC"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {formData.role === "athletic" ? "Nome da Atlética" : "Nome completo"}
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={formData.role === "athletic" ? "Nome da sua atlética" : "Seu nome completo"}
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

            {!restricted && !searchParams.get("type") && (
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

            {(formData.role === "athlete" || formData.role === "buyer") && (
              <div className="space-y-2">
                <Label htmlFor="athletic">Atlética</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("athletic_id", value)}
                  value={formData.athletic_id || undefined}
                  disabled={!!athleticReferral}
                >
                  <SelectTrigger id="athletic">
                    <SelectValue placeholder="Selecione sua atlética" />
                  </SelectTrigger>
                  <SelectContent>
                    {athletics.map((athletic) => (
                      <SelectItem key={athletic.id} value={athletic.id}>
                        {athletic.name} - {athletic.university}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {athleticReferral && (
                  <p className="text-sm text-green-600 mt-1">
                    Você está se cadastrando para a atlética {athletics.find(a => a.id === athleticReferral)?.name}
                  </p>
                )}
              </div>
            )}

            {formData.role !== "athletic" && (
              <div className="space-y-2">
                <Label htmlFor="package">Pacote</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("package_id", value)}
                  value={formData.package_id || undefined}
                >
                  <SelectTrigger id="package">
                    <SelectValue placeholder="Selecione um pacote" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - R$ {pkg.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPackage && (selectedPackage.category === "games" || selectedPackage.category === "combined") && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Este pacote requer aprovação da atlética antes do pagamento.
                  </p>
                )}
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

