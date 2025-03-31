"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, Database, RefreshCw } from "lucide-react"
import { useState } from "react"

export default function DatabaseSetupPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState({
    database: false,
    permissions: false,
    userTrigger: false,
    settingsTable: false,
    packagesTable: false,
    packagesProcedures: false,
    athleticsTable: false,
  })

  const setupDatabase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/setup-database")
      const data = await response.json()

      if (response.ok) {
        setSetupStatus((prev) => ({ ...prev, database: true }))
        toast({
          title: "Sucesso!",
          description: data.message,
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao configurar o banco de dados",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao configurar banco de dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao configurar o banco de dados",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fixPermissions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/fix-permissions")
      const data = await response.json()

      if (response.ok) {
        setSetupStatus((prev) => ({ ...prev, permissions: true }))
        toast({
          title: "Sucesso!",
          description: data.message,
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao configurar permissões",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao configurar permissões:", error)
      toast({
        title: "Erro",
        description: "Erro ao configurar permissões",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createUserTrigger = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/create-user-trigger")
      const data = await response.json()

      if (response.ok) {
        setSetupStatus((prev) => ({ ...prev, userTrigger: true }))
        toast({
          title: "Sucesso!",
          description: data.message,
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar trigger de usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar trigger de usuário:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar trigger de usuário",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createSettingsTable = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/create-settings-table")
      const data = await response.json()

      if (response.ok) {
        setSetupStatus((prev) => ({ ...prev, settingsTable: true }))
        toast({
          title: "Sucesso!",
          description: data.message,
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar tabela de configurações",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar tabela de configurações:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar tabela de configurações",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePackagesTable = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/update-packages-table")
      const data = await response.json()

      if (response.ok) {
        setSetupStatus((prev) => ({ ...prev, packagesTable: true }))
        toast({
          title: "Sucesso!",
          description: data.message,
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar tabela de pacotes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar tabela de pacotes:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar tabela de pacotes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createPackagesProcedures = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/create-packages-procedures")
      const data = await response.json()

      if (response.ok) {
        setSetupStatus((prev) => ({ ...prev, packagesProcedures: true }))
        toast({
          title: "Sucesso!",
          description: data.message,
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar procedimentos de pacotes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar procedimentos de pacotes:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar procedimentos de pacotes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateAthleticsTable = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/update-athletics-table")
      const data = await response.json()

      if (response.ok) {
        setSetupStatus((prev) => ({ ...prev, athleticsTable: true }))
        toast({
          title: "Sucesso!",
          description: data.message,
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar tabela de atléticas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar tabela de atléticas:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar tabela de atléticas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupAll = async () => {
    await setupDatabase()
    await fixPermissions()
    await createUserTrigger()
    await createSettingsTable()
    await updatePackagesTable()
    await createPackagesProcedures()
    await updateAthleticsTable()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Setup do Banco de Dados</h1>
        <p className="text-muted-foreground">Configure o banco de dados para o funcionamento correto da aplicação.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração Inicial</CardTitle>
          <CardDescription>Execute estas etapas na primeira vez que estiver configurando o sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border border-border">
              <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Criar Tabelas do Banco
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Cria todas as tabelas necessárias para o funcionamento do sistema.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Button onClick={setupDatabase} disabled={isLoading || setupStatus.database}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {setupStatus.database ? "Concluído" : "Executar"}
                </Button>
                {setupStatus.database && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardFooter>
            </Card>

            <Card className="border border-border">
              <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Configurar Permissões
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Configura as permissões de acesso às tabelas do banco de dados.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Button onClick={fixPermissions} disabled={isLoading || setupStatus.permissions}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {setupStatus.permissions ? "Concluído" : "Executar"}
                </Button>
                {setupStatus.permissions && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardFooter>
            </Card>

            <Card className="border border-border">
              <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Criar Trigger de Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Cria o trigger que sincroniza os dados de usuário entre o Auth e o banco de dados.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Button onClick={createUserTrigger} disabled={isLoading || setupStatus.userTrigger}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {setupStatus.userTrigger ? "Concluído" : "Executar"}
                </Button>
                {setupStatus.userTrigger && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardFooter>
            </Card>

            <Card className="border border-border">
              <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Criar Tabela de Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Cria a tabela para armazenar as configurações dos usuários, incluindo preferências de tema.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Button onClick={createSettingsTable} disabled={isLoading || setupStatus.settingsTable}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {setupStatus.settingsTable ? "Concluído" : "Executar"}
                </Button>
                {setupStatus.settingsTable && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardFooter>
            </Card>

            <Card className="border border-border">
              <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Atualizar Tabela de Pacotes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Atualiza a estrutura da tabela de pacotes para incluir novos campos.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Button onClick={updatePackagesTable} disabled={isLoading || setupStatus.packagesTable}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {setupStatus.packagesTable ? "Concluído" : "Executar"}
                </Button>
                {setupStatus.packagesTable && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardFooter>
            </Card>

            <Card className="border border-border">
              <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Criar Procedimentos de Pacotes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Cria os procedimentos armazenados para gerenciar pacotes.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Button onClick={createPackagesProcedures} disabled={isLoading || setupStatus.packagesProcedures}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {setupStatus.packagesProcedures ? "Concluído" : "Executar"}
                </Button>
                {setupStatus.packagesProcedures && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardFooter>
            </Card>

            <Card className="border border-border">
              <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Atualizar Tabela de Atléticas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Atualiza a tabela de atléticas para incluir campos de código PIX.
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Button onClick={updateAthleticsTable} disabled={isLoading || setupStatus.athleticsTable}>
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {setupStatus.athleticsTable ? "Concluído" : "Executar"}
                </Button>
                {setupStatus.athleticsTable && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardFooter>
            </Card>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={setupAll} disabled={isLoading} className="w-full">
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
            Executar Todas as Etapas
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
