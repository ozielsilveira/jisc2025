import { Wrench } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800'>
      <div className='max-w-md p-8 text-center'>
        <Wrench className='w-24 h-24 mx-auto text-gray-400' />
        <h1 className='mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl'>
          Em Manutenção
        </h1>
        <p className='mt-6 text-lg leading-7 text-gray-600'>
          Nosso site está passando por uma manutenção programada. Estaremos de volta em breve. Agradecemos a sua
          paciência.
        </p>
      </div>
    </div>
  )
}
