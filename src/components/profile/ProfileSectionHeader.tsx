import type { ReactNode } from "react";
import { IoSearch } from "react-icons/io5";
import FilterChips from "@/components/ui/FilterChips";

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
    <FilterChips
      items={filters.map((tab) => ({ key: tab.id, label: tab.label, count: tab.count }))}
      activeKey={activeFilterId}
      onChange={onFilterChange}
      ariaLabel="Filter rated albums"
      sticky={false}
    />
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
        className={`flex flex-col sm:flex-row sm:items-center sm:flex-wrap justify-between gap-4 ${
          headerClassName ?? (hasFilters ? "mb-4" : footer ? "mb-6" : "mb-8")
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-ink sm:text-2xl">
            {title}
          </h2>
          {count != null && (
            <span className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full bg-ink/[0.07] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink-2">
              {count}
            </span>
          )}
        </div>


        {(hasSearch || trailing) && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasSearch && (
              <div className="relative w-full sm:w-[220px]">
                <IoSearch
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
                />
                <input
                  type="search"
                  aria-label={`Search ${title.toLowerCase()}`}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 w-full rounded-full border border-line-strong bg-surface pl-8 pr-3 text-xs text-ink placeholder:text-ink-3"
                />
              </div>
            )}
            {trailing}
          </div>
        )}
      </div>

      {hasFilters && (
        <div className="mb-6">
          <ProfileFilterTabs filters={filters} activeFilterId={activeFilterId} onFilterChange={onFilterChange} />
        </div>
      )}
      {footer}
    </div>
  );
}
