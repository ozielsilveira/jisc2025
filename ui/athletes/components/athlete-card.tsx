'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, FileCheck, MessageCircle, UserCheck, UserX, Mail, Phone, Calendar, Trophy } from 'lucide-react'
import { Athlete } from '@/domain/athletes/entities'
import { StatusBadge } from './status-badge'
import { WhatsAppStatusBadge } from './whatsapp-badges'

type Props = {
  athlete: Athlete
  userRole: string | null
  onViewDoc: (url: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onWhatsApp: (a: Athlete) => void
  onAdminApprove: (id: string, isApproved: boolean) => void
}

export default function AthleteCard({
  athlete,
  userRole,
  onViewDoc,
  onApprove,
  onReject,
  onWhatsApp,
  onAdminApprove
}: Props) {
  const hasPackage = !!athlete.athlete_packages?.length
  return (
    <Card className='hover:shadow-lg transition-all border border-gray-200 bg-white'>
      <CardContent className='p-6 space-y-6'>
        <div className='flex items-start justify-between gap-4'>
          <div className='min-w-0'>
            <h3 className='font-bold text-gray-900 text-2xl leading-tight truncate'>{athlete.user.name}</h3>
            <p className='text-gray-600 font-medium truncate'>{athlete.athletic.name}</p>
            <div className='mt-2 flex items-center gap-2'>
              <StatusBadge status={athlete.status} />
              {userRole === 'athletic' && athlete.status === 'approved' && (
                <WhatsAppStatusBadge sent={athlete.wpp_sent} />
              )}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
          <Info icon={<Mail className='h-4 w-4 text-gray-400' />} text={athlete.user.email} />
          <Info icon={<Phone className='h-4 w-4 text-gray-400' />} text={athlete.user.phone} />
          <Info
            icon={<Calendar className='h-4 w-4 text-gray-400' />}
            text={new Date(athlete.created_at).toLocaleDateString('pt-BR')}
          />
          <Info icon={<Trophy className='h-4 w-4 text-gray-400' />} text={`${athlete.sports.length} modalidades`} />
        </div>

        {hasPackage && (
          <div className='bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center justify-between'>
            <div className='flex flex-col'>
              {/* <p className='text-xs font-semibold text-blue-600 uppercase mb-1'>Pacote</p> */}
              <p className='font-bold text-blue-900 text-lg'>{athlete.athlete_packages![0].package.name}</p>
            </div>
            <div className='flex flex-col'>
              <p className='text-2 font-bold text-blue-700'>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  athlete.athlete_packages![0].package.price
                )}
              </p>
            </div>
          </div>
        )}

        {userRole === 'admin' && athlete.status === 'approved' && (
          <div className='bg-yellow-50 rounded-lg p-4 border border-yellow-200 space-y-3'>
            <h4 className='font-semibold text-yellow-800'>Aprovação Final do Administrador</h4>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-yellow-700'>
                  {athlete.admin_approved === null && 'Aguardando avaliação.'}
                  {athlete.admin_approved === true && 'O cadastro do atleta foi APROVADO.'}
                  {athlete.admin_approved === false && 'O cadastro do atleta foi REJEITADO.'}
                </p>
              </div>
              <div className='flex gap-3'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onAdminApprove(athlete.id, false)}
                  className='border-red-300 text-red-700'
                  disabled={athlete.admin_approved === false}
                >
                  <UserX className='h-4 w-4 mr-2' /> Rejeitar
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='border-green-300 text-green-700'
                  onClick={() => onAdminApprove(athlete.id, true)}
                  disabled={athlete.admin_approved === true}
                >
                  <UserCheck className='h-4 w-4 mr-2' /> Aprovar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className='flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100'>
          <div className='flex flex-wrap gap-3'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onViewDoc(athlete.cnh_cpf_document_url)}
              disabled={!athlete.cnh_cpf_document_url}
            >
              <Eye className='h-4 w-4 mr-2' /> Documento
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onViewDoc(athlete.enrollment_document_url)}
              disabled={!athlete.enrollment_document_url}
            >
              <FileCheck className='h-4 w-4 mr-2' /> Matrícula
            </Button>
            {userRole === 'athletic' && athlete.status === 'approved' && hasPackage && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => onWhatsApp(athlete)}
                className={athlete.wpp_sent ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700'}
              >
                <MessageCircle className='h-4 w-4 mr-2' /> {athlete.wpp_sent ? 'Reenviar mensagem' : 'Enviar mensagem'}
              </Button>
            )}
          </div>

          {(userRole === 'admin' || userRole === 'athletic') && (athlete.status === 'sent' || athlete.status === 'rejected') && (
            <div className='flex gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onReject(athlete.id)}
                className='border-red-300 text-red-700'
              >
                <UserX className='h-4 w-4 mr-2' /> Rejeitar
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='border-green-300 hover:bg-green-700 text-black'
                onClick={() => onApprove(athlete.id)}
              >
                <UserCheck className='h-4 w-4 mr-2' /> Aprovar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className='flex items-center gap-2 text-gray-600'>
      <span>{icon}</span>
      <span className='text-sm font-medium truncate'>{text}</span>
    </div>
  )
}
