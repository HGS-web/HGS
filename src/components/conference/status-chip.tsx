"use client"

const STYLES: Record<string, string> = {
  pending:        "bg-amber-50 text-amber-700 border-amber-200",
  accepted:       "bg-green-50 text-green-700 border-green-200",
  declined:       "bg-red-50 text-red-600 border-red-200",
  approved:       "bg-green-50 text-green-700 border-green-200",
  rejected:       "bg-red-50 text-red-600 border-red-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  open:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  neutral:        "bg-black/5 text-black/50 border-black/10",
}

const LABELS: Record<string, string> = {
  pending:        "Pending review",
  accepted:       "Accepted",
  declined:       "Declined",
  approved:       "Approved",
  rejected:       "Not approved",
  pending_review: "Pending review",
}

export function StatusChip({
  status,
  label,
}: {
  status: keyof typeof STYLES | (string & {})
  label?: string
}) {
  const style = STYLES[status] ?? STYLES.neutral
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label ?? LABELS[status] ?? status}
    </span>
  )
}
