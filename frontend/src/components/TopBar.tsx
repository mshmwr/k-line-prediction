interface Props {
  n: number
  onNChange: (n: number) => void
  onFileUpload: (file: File) => void
}

export function TopBar({ n, onNChange, onFileUpload }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-gray-900 border-b border-gray-700">
      <label className="flex-1 border-2 border-dashed border-gray-600 rounded text-gray-400 text-sm text-center py-2 cursor-pointer hover:border-orange-400 transition-colors">
        Drop image/CSV or click to upload
        <input type="file" accept=".csv,image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) onFileUpload(e.target.files[0]) }} />
      </label>
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-sm">N bars:</label>
        <input
          type="number" min={5} max={50} value={n}
          onChange={e => onNChange(Number(e.target.value))}
          className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
        />
      </div>
    </div>
  )
}
