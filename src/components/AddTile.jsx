export default function AddTile({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[160px] w-full hover:border-opacity-60 transition-colors group"
      style={{ borderColor: 'var(--color-border)', background: 'transparent' }}
    >
      <span
        className="text-3xl font-light transition-colors"
        style={{ color: 'var(--color-cardinals-red)' }}
      >
        +
      </span>
      <span
        className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </span>
    </button>
  )
}
