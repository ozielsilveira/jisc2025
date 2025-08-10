export default function Loading() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='flex flex-col items-center space-y-4'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600'></div>
        <p className='text-gray-600'>Carregando...</p>
      </div>
    </div>
  )
}
