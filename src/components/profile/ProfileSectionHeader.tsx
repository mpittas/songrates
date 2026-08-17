import type { ReactNode } from "react";
import { IoSearch } from "react-icons/io5";

export interface ProfileFilterTab {
  id: string;
  label: string;
  count?: number;
}

interface ProfileSectionHeaderProps {
  title: string;
  /** Shown inline to the right of the title */
  count?: number;
  filters?: ProfileFilterTab[];
  activeFilterId?: string;
  onFilterChange?: (id: string) => void;
  trailing?: ReactNode;
  footer?: ReactNode;
  headerClassName?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

function ProfileFilterTabs({
  filters,
  activeFilterId,
  onFilterChange,
}: {
  filters: ProfileFilterTab[];
  activeFilterId: string;
  onFilterChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
      {filters.map((tab) => {
        const isActive = activeFilterId === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:text-neutral-900 hover:ring-neutral-300"
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                  isActive
                    ? "bg-white text-neutral-900"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function ProfileSectionHeader({
  title,
  count,
  filters,
  activeFilterId,
  onFilterChange,
  trailing,
  footer,
  headerClassName,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
}: ProfileSectionHeaderProps) {
  const hasFilters =
    filters != null &&
    filters.length > 0 &&
    activeFilterId != null &&
    onFilterChange != null;

  const hasSearch = searchValue != null && onSearchChange != null;

  return (
    <div>
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          headerClassName ?? (footer ? "mb-6" : "mb-8")
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
            {title}
          </h2>
          {count != null && (
            <span className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-neutral-700">
              {count}
            </span>
          )}
        </div>

        {hasFilters && (
          <ProfileFilterTabs
            filters={filters}
            activeFilterId={activeFilterId}
            onFilterChange={onFilterChange}
          />
        )}

        {(hasSearch || trailing) && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasSearch && (
              <div className="relative w-full sm:w-[220px]">
                <IoSearch
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 w-full rounded-full border border-neutral-200 bg-white pl-8 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400"
                />
              </div>
            )}
            {trailing}
          </div>
        )}
      </div>

      {footer}
    </div>
  );
}
