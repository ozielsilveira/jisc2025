"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Database, Loader2, Play, RefreshCw, Settings, Shield, Zap } from "lucide-react"

export default function SetupPage() {
  const { toast } = useToast()
  const [isCreatingTables, setIsCreatingTables] = useState(false)
  const [isTablesCreated, setIsTablesCreated] = useState(false)
  const [isSeedingData, setIsSeedingData] = useState(false)
  const [isDataSeeded, setIsDataSeeded] = useState(false)
  const [seedResults, setSeedResults] = useState<any>(null)
  const [isFixingPermissions, setIsFixingPermissions] = useState(false)
  const [isPermissionsFixed, setIsPermissionsFixed] = useState(false)
  const [isCreatingTrigger, setIsCreatingTrigger] = useState(false)
  const [isTriggerCreated, setIsTriggerCreated] = useState(false)
  const [isCreatingSettingsTable, setIsCreatingSettingsTable] = useState(false)
  const [isSettingsTableCreated, setIsSettingsTableCreated] = useState(false)

  const handleCreateTables = async () => {
    setIsCreatingTables(true)

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create database tables")
      }

      setIsTablesCreated(true)
      toast({
        title: "Tabelas criadas com sucesso",
        description: "As tabelas do banco de dados foram criadas com sucesso.",
      })
    } catch (error) {
      console.warn("Error creating tables:", error)
      toast({
        title: "Erro ao criar tabelas",
        description: "Ocorreu um erro ao criar as tabelas do banco de dados.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTables(false)
    }
  }

  const handleSeedData = async () => {
    setIsSeedingData(true)

    try {
      const response = await fetch("/api/seed-database", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed database")
      }

      setIsDataSeeded(true)
      setSeedResults(data.data)
      toast({
        title: "Dados inseridos com sucesso",
        description: "Os dados de exemplo foram inseridos no banco de dados.",
      })
    } catch (error) {
      console.warn("Error seeding data:", error)
      toast({
        title: "Erro ao inserir dados",
        description: "Ocorreu um erro ao inserir os dados de exemplo.",
        variant: "destructive",
      })
    } finally {
      setIsSeedingData(false)
    }
  }

  const handleFixPermissions = async () => {
    setIsFixingPermissions(true)

    try {
      const response = await fetch("/api/fix-permissions", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao configurar permissões")
      }

      setIsPermissionsFixed(true)
      toast({
        title: "Permissões configuradas com sucesso",
        description: "As permissões do banco de dados foram configuradas corretamente.",
      })
    } catch (error) {
      console.warn("Erro ao configurar permissões:", error)
      toast({
        title: "Erro ao configurar permissões",
        description: "Ocorreu um erro ao configurar as permissões do banco de dados.",
        variant: "destructive",
      })
    } finally {
      setIsFixingPermissions(false)
    }
  }

  const handleCreateTrigger = async () => {
    setIsCreatingTrigger(true)

    try {
      const response = await fetch("/api/create-user-trigger", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao criar trigger de usuário")
      }

      setIsTriggerCreated(true)
      toast({
        title: "Trigger criado com sucesso",
        description: "O trigger para sincronização de usuários foi criado com sucesso.",
      })
    } catch (error) {
      console.warn("Erro ao criar trigger:", error)
      toast({
        title: "Erro ao criar trigger",
        description: "Ocorreu um erro ao criar o trigger de sincronização de usuários.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTrigger(false)
    }
  }

  const handleCreateSettingsTable = async () => {
    setIsCreatingSettingsTable(true)

    try {
      const response = await fetch("/api/create-settings-table", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao criar tabela de configurações")
      }

      setIsSettingsTableCreated(true)
      toast({
        title: "Tabela de configurações criada com sucesso",
        description: "A tabela de configurações do usuário foi criada com sucesso.",
      })
    } catch (error) {
      console.warn("Erro ao criar tabela de configurações:", error)
      toast({
        title: "Erro ao criar tabela de configurações",
        description: "Ocorreu um erro ao criar a tabela de configurações do usuário.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingSettingsTable(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Configuração do JISC</CardTitle>
          <CardDescription>
            Configure o banco de dados para a plataforma do campeonato universitário JISC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">1. Criar Tabelas do Banco de Dados</h3>
              {isTablesCreated && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <p className="text-sm text-gray-500">
              Este passo criará todas as tabelas necessárias no banco de dados Supabase.
            </p>
            <Button onClick={handleCreateTables} disabled={isCreatingTables || isTablesCreated} className="w-full">
              {isCreatingTables ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Tabelas...
                </>
              ) : isTablesCreated ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tabelas Criadas
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Criar Tabelas
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">2. Inserir Dados de Exemplo</h3>
              {isDataSeeded && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <p className="text-sm text-gray-500">Este passo inserirá dados de exemplo para testar a plataforma.</p>
            <Button
              onClick={handleSeedData}
              disabled={isSeedingData || !isTablesCreated || isDataSeeded}
              className="w-full"
            >
              {isSeedingData ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Inserindo Dados...
                </>
              ) : isDataSeeded ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Dados Inseridos
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Inserir Dados de Exemplo
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">3. Configurar Permissões</h3>
              {isPermissionsFixed && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <p className="text-sm text-gray-500">
              Este passo configurará as permissões necessárias para o funcionamento correto do sistema.
            </p>
            <Button
              onClick={handleFixPermissions}
              disabled={isFixingPermissions || !isTablesCreated || isPermissionsFixed}
              className="w-full"
            >
              {isFixingPermissions ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Configurando Permissões...
                </>
              ) : isPermissionsFixed ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Permissões Configuradas
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Configurar Permissões
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">4. Criar Trigger de Usuário</h3>
              {isTriggerCreated && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <p className="text-sm text-gray-500">
              Este passo criará um trigger para sincronizar automaticamente os usuários entre as tabelas.
            </p>
            <Button
              onClick={handleCreateTrigger}
              disabled={isCreatingTrigger || !isPermissionsFixed || isTriggerCreated}
              className="w-full"
            >
              {isCreatingTrigger ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Trigger...
                </>
              ) : isTriggerCreated ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Trigger Criado
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Criar Trigger de Usuário
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">5. Criar Tabela de Configurações</h3>
              {isSettingsTableCreated && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <p className="text-sm text-gray-500">
              Este passo criará a tabela de configurações do usuário para personalização da plataforma.
            </p>
            <Button
              onClick={handleCreateSettingsTable}
              disabled={isCreatingSettingsTable || !isTriggerCreated || isSettingsTableCreated}
              className="w-full"
            >
              {isCreatingSettingsTable ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Tabela...
                </>
              ) : isSettingsTableCreated ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tabela Criada
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Criar Tabela de Configurações
                </>
              )}
            </Button>
          </div>

          {seedResults && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Dados Inseridos:</h4>
              <ul className="text-sm space-y-1">
                <li>Atléticas: {seedResults.athletics}</li>
                <li>Modalidades: {seedResults.sports}</li>
                <li>Pacotes: {seedResults.packages}</li>
                <li>Ingressos: {seedResults.tickets}</li>
                <li>Jogos: {seedResults.games}</li>
                <li>Participantes: {seedResults.gameParticipants}</li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {isTablesCreated && isDataSeeded && isPermissionsFixed && isTriggerCreated && isSettingsTableCreated ? (
            <Button className="w-full bg-[#0456FC]" onClick={() => (window.location.href = "/")}>
              Ir para a Plataforma
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Página
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

