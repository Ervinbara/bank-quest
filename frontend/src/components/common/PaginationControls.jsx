import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PaginationControls({
  page = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 30],
  labels = {}
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = totalItems === 0 ? 0 : Math.min(totalItems, page * pageSize)

  const text = {
    itemsPerPage: labels.itemsPerPage || 'Items/page',
    showing: labels.showing || 'Showing',
    of: labels.of || 'of',
    prev: labels.prev || 'Previous',
    next: labels.next || 'Next',
    page: labels.page || 'Page'
  }

  const btnBase = 'inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <label className="flex items-center gap-2">
          <span className="font-medium">{text.itemsPerPage}</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
            className="rounded-lg border border-slate-200 px-2 py-1 bg-white text-slate-700 transition-colors focus:outline-none focus:border-emerald-400"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <span className="tabular-nums">
          {text.showing} <strong>{start}–{end}</strong> {text.of} <strong>{totalItems}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2 justify-between sm:justify-end">
        <button
          type="button"
          onClick={() => canPrev && onPageChange?.(page - 1)}
          disabled={!canPrev}
          className={`${btnBase} ${canPrev ? 'hover:bg-slate-50 hover:border-slate-300' : ''}`}
        >
          <ChevronLeft className="w-4 h-4" />
          {text.prev}
        </button>

        <span className="text-sm text-slate-500 tabular-nums min-w-[72px] text-center">
          {text.page} {page}/{totalPages}
        </span>

        <button
          type="button"
          onClick={() => canNext && onPageChange?.(page + 1)}
          disabled={!canNext}
          className={`${btnBase} ${canNext ? 'hover:bg-slate-50 hover:border-slate-300' : ''}`}
        >
          {text.next}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
