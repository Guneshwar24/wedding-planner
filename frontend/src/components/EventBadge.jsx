export default function EventBadge({ event, size = 'sm' }) {
  if (!event) return null

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  }

  return (
    <span
      className={`inline-block rounded-full font-semibold uppercase tracking-wide ${sizeClasses[size]}`}
      style={{
        backgroundColor: event.color + '25',
        color: event.color,
        border: `1px solid ${event.color}40`,
      }}
    >
      {event.name}
    </span>
  )
}
