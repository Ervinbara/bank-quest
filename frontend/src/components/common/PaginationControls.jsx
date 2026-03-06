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

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
        <label className="flex items-center gap-2">
          <span className="font-medium">{text.itemsPerPage}</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
            className="rounded-md border border-gray-300 px-2 py-1 bg-white"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <span>
          {text.showing} <strong>{start}-{end}</strong> {text.of} <strong>{totalItems}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2 justify-between sm:justify-end">
        <button
          type="button"
          onClick={() => canPrev && onPageChange?.(page - 1)}
          disabled={!canPrev}
          className="inline-flex min-h-[40px] items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          {text.prev}
        </button>

        <span className="text-sm text-gray-700 min-w-[84px] text-center">
          {text.page} {page}/{totalPages}
        </span>

        <button
          type="button"
          onClick={() => canNext && onPageChange?.(page + 1)}
          disabled={!canNext}
          className="inline-flex min-h-[40px] items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {text.next}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
