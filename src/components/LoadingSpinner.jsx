export default function LoadingSpinner({ text = '讀取中...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <div className="w-10 h-10 border-4 border-zinc-700 border-t-rose-500 rounded-full animate-spin mb-4" />
      <p className="text-sm">{text}</p>
    </div>
  )
}
