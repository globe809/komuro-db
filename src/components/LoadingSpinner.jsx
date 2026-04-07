export default function LoadingSpinner({ text = '讀取中...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-900 rounded-full animate-spin mb-4" />
      <p className="text-sm">{text}</p>
    </div>
  )
}
