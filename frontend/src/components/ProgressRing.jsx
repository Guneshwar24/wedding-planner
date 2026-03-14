export default function ProgressRing({ percentage = 0, size = 120, strokeWidth = 10, color = '#C05621' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E2D8D0"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {/* Text (counter-rotate so text reads normally) */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="rotate-90"
        style={{
          transform: `rotate(90deg)`,
          transformOrigin: `${size / 2}px ${size / 2}px`,
          fill: '#4A3A35',
          fontFamily: 'Manrope, sans-serif',
          fontWeight: '700',
          fontSize: size * 0.2,
        }}
      >
        {percentage}%
      </text>
    </svg>
  )
}
