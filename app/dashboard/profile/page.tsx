"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

type UserProfile = {
  id: string
  name: string
  email: string
  cpf: string
  phone: string
  gender: string
  role: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) throw error
        setProfile(data as UserProfile)
        setFormData(data as UserProfile)
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar seus dados.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: formData.name,
          phone: formData.phone,
          // Note: Some fields like CPF shouldn't be editable after registration
        })
        .eq("id", user.id)

      if (error) throw error

      setProfile((prev) => ({ ...prev!, ...formData }))
      setIsEditing(false)
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível salvar suas alterações.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(profile as UserProfile)
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-gray-500">Visualize e edite suas informações pessoais.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Seus dados cadastrados no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            {isEditing ? (
              <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} />
            ) : (
              <div className="rounded-md border p-2">{profile?.name}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="rounded-md border p-2">{profile?.email}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <div className="rounded-md border p-2">{profile?.cpf}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            {isEditing ? (
              <Input id="phone" name="phone" value={formData.phone || ""} onChange={handleChange} />
            ) : (
              <div className="rounded-md border p-2">{profile?.phone}</div>
            )}
          </div>

          {profile?.role !== "athletic" && (
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <div className="rounded-md border p-2">
                {profile?.gender === "male" && "Masculino"}
                {profile?.gender === "female" && "Feminino"}
                {profile?.gender === "other" && "Outro"}
                {profile?.gender === "prefer_not_to_say" && "Prefiro não informar"}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuário</Label>
            <div className="rounded-md border p-2">
              {profile?.role === "buyer" && "Comprador de Ingressos"}
              {profile?.role === "athlete" && "Atleta"}
              {profile?.role === "athletic" && "Representante de Atlética"}
              {profile?.role === "admin" && "Administrador"}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
          )}
        </CardFooter>
      </Card>

      {/* Additional sections based on user role */}
      {profile?.role === "athlete" && (
        <Card>
          <CardHeader>
            <CardTitle>Informações de Atleta</CardTitle>
            <CardDescription>Seus dados como atleta no JISC.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Athlete-specific information would go here */}
            <p>Informações específicas do atleta seriam exibidas aqui.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

