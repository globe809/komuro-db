export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mb-4" />
      <p className="text-xs" style={{ letterSpacing: '0.08em' }}>{text}</p>
    </div>
  )
}
