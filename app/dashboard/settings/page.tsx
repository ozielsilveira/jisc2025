"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Moon, Save } from "lucide-react"
import { useEffect, useState } from "react"

type UserSettings = {
  id: string
  theme_preference: "light" | "dark" | "system"
  notification_email: boolean
  notification_push: boolean
  language: string
}

type AthleticSettings = {
  university: string
  logo_url: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [tableExists, setTableExists] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const [settings, setSettings] = useState<UserSettings>({
    id: "",
    theme_preference: "system",
    notification_email: true,
    notification_push: true,
    language: "pt-BR",
  })

  const [athleticSettings, setAthleticSettings] = useState<AthleticSettings>({
    university: "",
    logo_url: "",
  })
  const [hasAthleticChanges, setHasAthleticChanges] = useState(false)
  const [isAthleticSaved, setIsAthleticSaved] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        // Get user role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (userError) throw userError
        setUserRole(userData.role)

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("name, email, phone")
          .eq("id", user.id)
          .single()

        if (profileError) throw profileError

        setProfile({
          name: profileData.name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
        })

        // If user is athletic, fetch athletic settings
        if (userData.role === "athletic") {
          const { data: athleticData, error: athleticError } = await supabase
            .from("athletics")
            .select("university, logo_url")
            .eq("representative_id", user.id)
            .maybeSingle()

          if (athleticError) {
            console.error("Error fetching athletic data:", athleticError)
            toast({
              title: "Erro ao carregar dados da atlética",
              description: "Não foi possível carregar as informações da sua atlética.",
              variant: "destructive",
            })
          } else if (athleticData) {
            setAthleticSettings({
              university: athleticData.university || "",
              logo_url: athleticData.logo_url || "",
            })
            setIsAthleticSaved(true)
            setHasAthleticChanges(false)
          }
        }

        // Check if user_settings table exists
        const { error: tableCheckError } = await supabase.from("user_settings").select("count").limit(1)

        // If table doesn't exist yet, just use default settings
        if (tableCheckError) {
          console.log("User settings table may not exist yet:", tableCheckError)
          setTableExists(false)
          setIsLoading(false)
          return
        }

        setTableExists(true)

        // Fetch or create user settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()

        if (settingsError) {
          if (settingsError.code === "PGRST116") {
            // Settings don't exist yet, create default settings
            const defaultSettings = {
              user_id: user.id,
              theme_preference: "system",
              notification_email: true,
              notification_push: true,
              language: "pt-BR",
            }

            const { data: newSettings, error: createError } = await supabase
              .from("user_settings")
              .insert(defaultSettings)
              .select()
              .single()

            if (createError) throw createError

            if (newSettings) {
              setSettings({
                id: newSettings.id,
                theme_preference: newSettings.theme_preference,
                notification_email: newSettings.notification_email,
                notification_push: newSettings.notification_push,
                language: newSettings.language,
              })
            }
          } else {
            throw settingsError
          }
        } else if (settingsData) {
          setSettings({
            id: settingsData.id,
            theme_preference: settingsData.theme_preference,
            notification_email: settingsData.notification_email,
            notification_push: settingsData.notification_push,
            language: settingsData.language,
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar suas configurações.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user, toast])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSettingChange = (name: string, value: any) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    setIsSaving(true)

    try {
      // Upload logo to storage
      const fileName = `athletic-logo-${Date.now()}`
      const { data: fileData, error: fileError } = await supabase.storage
        .from("athletic-logos")
        .upload(fileName, file)

      if (fileError) throw fileError

      // Get logo URL
      const { data: urlData } = supabase.storage.from("athletic-logos").getPublicUrl(fileName)

      // Update athletic logo URL
      const { error: updateError } = await supabase
        .from("athletics")
        .update({ logo_url: urlData.publicUrl })
        .eq("id", user?.id)

      if (updateError) throw updateError

      setAthleticSettings((prev) => ({ ...prev, logo_url: urlData.publicUrl }))

      toast({
        title: "Logo atualizada",
        description: "A logo da sua atlética foi atualizada com sucesso.",
      })
    } catch (error) {
      console.error("Error updating logo:", error)
      toast({
        title: "Erro ao atualizar logo",
        description: "Não foi possível atualizar a logo da sua atlética.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const saveProfile = async () => {
    if (!user) return

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: profile.name,
          phone: profile.phone,
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Perfil atualizado",
        description: "Suas informações de perfil foram atualizadas com sucesso.",
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

  const saveSettings = async () => {
    if (!user) return

    setIsSaving(true)

    try {
      // Check if user_settings table exists
      if (!tableExists) {
        toast({
          title: "Configuração não disponível",
          description: "A tabela de configurações ainda não foi criada. Execute o setup completo primeiro.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      // Check if settings.id exists
      if (!settings.id) {
        // Create new settings
        const newSettings = {
          user_id: user.id,
          theme_preference: settings.theme_preference,
          notification_email: settings.notification_email,
          notification_push: settings.notification_push,
          language: settings.language,
        }

        const { data, error } = await supabase.from("user_settings").insert(newSettings).select().single()

        if (error) throw error

        if (data) {
          setSettings((prev) => ({
            ...prev,
            id: data.id,
          }))
        }
      } else {
        // Update existing settings
        const { error } = await supabase
          .from("user_settings")
          .update({
            theme_preference: settings.theme_preference,
            notification_email: settings.notification_email,
            notification_push: settings.notification_push,
            language: settings.language,
          })
          .eq("id", settings.id)

        if (error) throw error
      }

      toast({
        title: "Configurações atualizadas",
        description: "Suas preferências foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Erro ao atualizar configurações",
        description: "Não foi possível salvar suas alterações.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAthleticSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { error } = await supabase
        .from("athletics")
        .update({
          university: athleticSettings.university,
          logo_url: athleticSettings.logo_url,
          status: "active",
        })
        .eq("representative_id", user.id)

      if (error) throw error

      setIsAthleticSaved(true)
      setHasAthleticChanges(false)
      toast({
        title: "Configurações salvas",
        description: "As informações da sua atlética foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("Error saving athletic settings:", error)
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as informações da sua atlética.",
        variant: "destructive",
      })
    }
  }

  const handleAthleticSettingsChange = (field: keyof AthleticSettings, value: string) => {
    setAthleticSettings(prev => ({ ...prev, [field]: value }))
    setHasAthleticChanges(true)
    setIsAthleticSaved(false)
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
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-500">Gerencie suas preferências e informações pessoais.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {userRole === "athletic" && <TabsTrigger value="athletic">Atlética</TabsTrigger>}
          {tableExists && <TabsTrigger value="preferences">Preferências</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais. Seu e-mail não pode ser alterado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" value={profile.email} disabled className="bg-gray-100" />
                <p className="text-xs text-gray-500">O e-mail não pode ser alterado.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveProfile} disabled={isSaving} className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {userRole === "athletic" && (
          <TabsContent value="athletic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Atlética</CardTitle>
                <CardDescription>
                  Complete o cadastro da sua atlética para começar a usar o sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAthleticSettingsSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="university">Universidade</Label>
                    <Input
                      id="university"
                      value={athleticSettings.university}
                      onChange={(e) => handleAthleticSettingsChange("university", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo da Atlética</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                        {athleticSettings.logo_url ? (
                          <img
                            src={athleticSettings.logo_url}
                            alt="Logo da Atlética"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-xs text-center p-2">
                            Sem logo
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          disabled={isSaving}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Recomendado: imagem quadrada com pelo menos 200x200 pixels.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSaving || (!hasAthleticChanges && isAthleticSaved)}
                    className={!hasAthleticChanges && isAthleticSaved ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Salvando..." : (!hasAthleticChanges && isAthleticSaved ? "Salvo" : "Salvar alterações")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {tableExists && (
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Aparência</CardTitle>
                <CardDescription>Personalize a aparência e o idioma da plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={settings.theme_preference}
                    onValueChange={(value) => handleSettingChange("theme_preference", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema (Automático)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings} disabled={isSaving || !tableExists} className="flex items-center">
                  <Moon className="h-4 w-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar Preferências"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

