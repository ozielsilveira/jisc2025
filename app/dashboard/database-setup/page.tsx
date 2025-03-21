"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Database, Package, CheckCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

export default function DatabaseSetupPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isCreatingProcedures, setIsCreatingProcedures] = useState(false)
  const [isProceduresCreated, setIsProceduresCreated] = useState(false)
  const [isUpdatingTable, setIsUpdatingTable] = useState(false)
  const [isTableUpdated, setIsTableUpdated] = useState(false)

  const handleCreateProcedures = async () => {
    setIsCreatingProcedures(true)

    try {
      const response = await fetch("/api/create-packages-procedures", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create database procedures")
      }

      setIsProceduresCreated(true)
      toast({
        title: "Procedimentos criados com sucesso",
        description: "Os procedimentos do banco de dados foram criados com sucesso.",
      })
    } catch (error) {
      console.error("Error creating procedures:", error)
      toast({
        title: "Erro ao criar procedimentos",
        description: "Ocorreu um erro ao criar os procedimentos do banco de dados.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingProcedures(false)
    }
  }

  const handleUpdateTable = async () => {
    setIsUpdatingTable(true)

    try {
      const response = await fetch("/api/update-packages-table", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update packages table")
      }

      setIsTableUpdated(true)
      toast({
        title: "Tabela atualizada com sucesso",
        description: "A estrutura da tabela de pacotes foi atualizada com sucesso.",
      })
    } catch (error) {
      console.error("Error updating table:", error)
      toast({
        title: "Erro ao atualizar tabela",
        description: "Ocorreu um erro ao atualizar a estrutura da tabela de pacotes.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingTable(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuração do Banco de Dados</h1>
        <p className="text-gray-500">Configure a estrutura do banco de dados para o sistema de pacotes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Procedimentos do Banco de Dados</CardTitle>
          <CardDescription>
            Crie os procedimentos necessários para gerenciar a estrutura da tabela de pacotes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Este passo criará os procedimentos armazenados no banco de dados que serão usados para criar e atualizar a
            estrutura da tabela de pacotes.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCreateProcedures}
            disabled={isCreatingProcedures || isProceduresCreated}
            className="w-full"
          >
            {isCreatingProcedures ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando Procedimentos...
              </>
            ) : isProceduresCreated ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Procedimentos Criados
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Criar Procedimentos
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atualizar Tabela de Pacotes</CardTitle>
          <CardDescription>
            Atualize a estrutura da tabela de pacotes para suportar as novas funcionalidades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Este passo verificará se a tabela de pacotes existe e, se necessário, criará ou atualizará sua estrutura
            para incluir os novos campos necessários.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUpdateTable}
            disabled={isUpdatingTable || isTableUpdated || !isProceduresCreated}
            className="w-full"
          >
            {isUpdatingTable ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando Tabela...
              </>
            ) : isTableUpdated ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Tabela Atualizada
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Atualizar Tabela
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {isProceduresCreated && isTableUpdated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Configuração Concluída</CardTitle>
            <CardDescription>
              A configuração do banco de dados foi concluída com sucesso. Você já pode usar o sistema de pacotes.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/dashboard/packages")} className="w-full bg-[#0456FC]">
              Ir para Gerenciamento de Pacotes
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

