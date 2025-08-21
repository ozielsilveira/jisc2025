'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AthleteCard from '@/ui/athletes/components/athlete-card'
import { WhatsAppApproveDialog } from '@/ui/athletes/dialogs/whatsapp-approve-dialog'
import { WhatsAppRejectDialog } from '@/ui/athletes/dialogs/whatsapp-reject-dialog'
import { DocumentModal } from '@/components/document-modal'
import { RefreshCw, Search, Share2, Sparkles, TrendingUp, Users } from 'lucide-react'
import { AthleteServiceSupabase } from '@/infrastructure/athletes/athleteService.supabase'
import { useAthletesController } from '@/application/athletes/use-athletes-controller'
import { formatApproveMessage } from '@/application/athletes/whatsapp'
import { useState } from 'react'
import { SortField, SortOrder } from '@/domain/athletes/entities'
import { toast } from '@/hooks/use-toast'

export default function AthletesPage() {
  const c = useAthletesController(AthleteServiceSupabase)

  // dialogs/document
  const [docOpen, setDocOpen] = useState(false)
  const [docUrl, setDocUrl] = useState('')
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [loadingApprove, setLoadingApprove] = useState(false)
  const [loadingReject, setLoadingReject] = useState(false)

  function viewDocument(url: string) {
    if (!url) return
    setDocUrl(url)
    setDocOpen(true)
  }

  function openWhatsAppApprove(a: any) {
    setSelected(a)
    setApproveOpen(true)
  }

  async function confirmWhatsAppApprove() {
    if (!selected) return
    setLoadingApprove(true)
    await c.confirmApproveWhatsApp(selected)
    setLoadingApprove(false)
    setSelected(null)
    setApproveOpen(false)
  }

  function openReject(a: any) {
    setSelected(a)
    setRejectOpen(true)
  }
  async function confirmReject(custom?: string) {
    if (!selected) return
    setLoadingReject(true)
    await c.rejectAndNotify(selected, custom)
    setLoadingReject(false)
    setSelected(null)
    setRejectOpen(false)
  }

  const approveMessage = selected?.athlete_packages?.length
    ? formatApproveMessage(
        selected.user.name,
        selected.athlete_packages[0].package.name,
        selected.athlete_packages[0].package.price
      )
    : null

  if (c.loading)
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='w-8 h-8 border-2 border-blue-200 rounded-full animate-spin border-t-blue-600' />
      </div>
    )

  if (c.error)
    return (
      <div className='text-center py-20'>
        <div className='inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6'>
          <span>!</span>
        </div>
        <h3 className='text-xl font-semibold mb-2'>Erro ao carregar dados</h3>
        <p className='text-gray-600 max-w-md mx-auto mb-6'>{String(c.error)}</p>
        <Button onClick={c.refetch}>
          <RefreshCw className='h-4 w-4 mr-2' />
          Tentar novamente
        </Button>
      </div>
    )

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <header className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold'>Atletas</h1>
          <p className='text-sm text-gray-600'>
            {c.userRole === 'admin'
              ? 'Gerencie todos os atletas'
              : c.userRole === 'athletic'
                ? 'Gerencie os atletas da sua atlética'
                : 'Acompanhe seu status'}
          </p>
        </div>

        <div className='flex gap-2'>
          {c.userRole === 'athletic' && (
            <Button
              onClick={async () => {
                const link = `${window.location.origin}/register?type=athlete&athletic=${c.filters.athleticId}`
                await navigator.clipboard.writeText(link)
                toast({
                  title: "Link copiado",
                  description: "Link de cadastro copiado para a área de transferência",
                  variant: "success",
                })
              }}
              className='bg-blue-600 hover:bg-blue-700'
            >
              <Share2 className='h-4 w-4 mr-2' /> Copiar link de cadastro
            </Button>
          )}
          <Button variant='outline' onClick={c.refetch}>
            <RefreshCw className='h-4 w-4 mr-2' />
            Atualizar
          </Button>
        </div>
      </header>

      {/* Filtros */}
      {(c.userRole === 'admin' || c.userRole === 'athletic') && (
        <Card className='mb-6'>
          <CardContent className='p-4 space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold'>Filtros</h3>
              <Button variant='ghost' size='sm' onClick={c.clearFilters}>
                Limpar filtros
              </Button>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3'>
              {c.userRole === 'admin' && (
                <Select
                  value={c.filters.athleticId}
                  onValueChange={(v) => c.setFilters((p) => ({ ...p, athleticId: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Atlética' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Todas as Atléticas</SelectItem>
                    {c.athletics.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={c.filters.status} onValueChange={(v) => c.setFilters((p) => ({ ...p, status: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos os Status</SelectItem>
                  <SelectItem value='sent'>Em análise</SelectItem>
                  <SelectItem value='approved'>Aprovado</SelectItem>
                  <SelectItem value='rejected'>Rejeitado</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={c.filters.sportId}
                onValueChange={(v) => c.setFilters((p) => ({ ...p, sportId: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Modalidade' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas as Modalidades</SelectItem>
                  {c.sports.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={`${c.sortField}-${c.sortOrder}`}
                onValueChange={(v) => {
                  const [f, o] = v.split('-') as [SortField, SortOrder]
                  c.setSortField(f)
                  c.setSortOrder(o)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Ordenar por' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='name-asc'>Nome (A-Z)</SelectItem>
                  <SelectItem value='name-desc'>Nome (Z-A)</SelectItem>
                  <SelectItem value='created_at-desc'>Cadastro (recente)</SelectItem>
                  <SelectItem value='created_at-asc'>Cadastro (antigo)</SelectItem>
                  <SelectItem value='status-asc'>Status</SelectItem>
                  <SelectItem value='athletic-asc'>Atlética</SelectItem>
                </SelectContent>
              </Select>

              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  value={c.filters.searchTerm}
                  onChange={(e) => c.setFilters((p) => ({ ...p, searchTerm: e.target.value }))}
                  placeholder='Buscar...'
                  className='pl-10'
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* contagem/filtros ativos */}
      {c.athletesFiltered.length > 0 && (
        <div className='flex items-center justify-between gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6'>
          <div className='flex items-center gap-2'>
            <TrendingUp className='h-4 w-4 text-blue-600' />
            <span className='font-medium text-blue-900'>{c.athletesFiltered.length} atleta(s) encontrados</span>
          </div>
          {c.hasActiveFilters && (
            <div className='flex items-center gap-2'>
              <Sparkles className='h-4 w-4 text-blue-600' />
              <span className='text-sm text-blue-700 font-medium'>Filtros ativos</span>
            </div>
          )}
        </div>
      )}

      {/* lista */}
      <div className='space-y-4'>
        {c.athletesFiltered.length === 0 ? (
          <Card>
            <CardContent className='p-12 text-center'>
              <Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-semibold'>Nenhum atleta encontrado</h3>
              <p className='text-sm text-gray-600'>Ajuste filtros ou o termo de busca.</p>
            </CardContent>
          </Card>
        ) : (
          c.athletesFiltered.map((a) => (
            <AthleteCard
              key={a.id}
              athlete={a}
              userRole={c.userRole}
              onViewDoc={viewDocument}
              onApprove={c.approve}
              onReject={() => openReject(a)}
              onWhatsApp={openWhatsAppApprove}
            />
          ))
        )}
      </div>

      <DocumentModal
        isOpen={docOpen}
        onClose={() => setDocOpen(false)}
        documentUrl={docUrl}
        title='Documento do Atleta'
      />

      <WhatsAppApproveDialog
        athlete={selected}
        isOpen={approveOpen}
        isLoading={loadingApprove}
        preview={(custom) => formatApproveMessage(
          selected.user.name,
          selected.athlete_packages[0].package.name,
          selected.athlete_packages[0].package.price
        )}
        onConfirm={confirmWhatsAppApprove}
        onClose={() => {
          setApproveOpen(false)
          setSelected(null)
        }}
      />

      <WhatsAppRejectDialog
        athlete={selected}
        isOpen={rejectOpen}
        isLoading={loadingReject}
        preview={(custom) => c.buildRejectPreview(selected, custom)}
        onConfirm={confirmReject}
        onClose={() => {
          setRejectOpen(false)
          setSelected(null)
        }}
      />
    </div>
  )
}
