"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Moon, Save } from "lucide-react"

type UserSettings = {
  id: string
  theme_preference: "light" | "dark" | "system"
  notification_email: boolean
  notification_push: boolean
  language: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [tableExists, setTableExists] = useState(false)

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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("name, email, phone")
          .eq("id", user.id)
          .single()

        if (userError) throw userError

        setProfile({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
        })

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
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
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

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como deseja receber notificações sobre eventos e atualizações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notification_email">Notificações por E-mail</Label>
                  <p className="text-sm text-gray-500">Receba atualizações sobre jogos e eventos por e-mail.</p>
                </div>
                <Switch
                  id="notification_email"
                  checked={settings.notification_email}
                  onCheckedChange={(checked) => handleSettingChange("notification_email", checked)}
                  disabled={!tableExists}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notification_push">Notificações Push</Label>
                  <p className="text-sm text-gray-500">
                    Receba notificações push no navegador sobre atualizações importantes.
                  </p>
                </div>
                <Switch
                  id="notification_push"
                  checked={settings.notification_push}
                  onCheckedChange={(checked) => handleSettingChange("notification_push", checked)}
                  disabled={!tableExists}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={isSaving || !tableExists} className="flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Notificações"}
              </Button>
              {!tableExists && (
                <p className="text-xs text-red-500 ml-4">
                  A tabela de configurações ainda não foi criada. Execute o setup completo primeiro.
                </p>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

