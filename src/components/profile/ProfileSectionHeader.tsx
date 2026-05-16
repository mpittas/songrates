import type { ReactNode } from "react";

export interface ProfileFilterTab {
  id: string;
  label: string;
  count?: number;
}

interface ProfileSectionHeaderProps {
  title: string;
  filters?: ProfileFilterTab[];
  activeFilterId?: string;
  onFilterChange?: (id: string) => void;
  trailing?: ReactNode;
  footer?: ReactNode;
  headerClassName?: string;
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
            className={`flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-neutral-900 text-white"
                : "bg-stone-300 text-neutral-900 hover:bg-neutral-300"
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={`inline-flex leading-2 items-center justify-center min-w-[1.25rem] p-1 rounded text-[11px] font-bold bg-neutral-900 text-white ${
                  isActive ? "bg-white !text-neutral-900" : ""
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
  filters,
  activeFilterId,
  onFilterChange,
  trailing,
  footer,
  headerClassName,
}: ProfileSectionHeaderProps) {
  const hasFilters =
    filters != null &&
    filters.length > 0 &&
    activeFilterId != null &&
    onFilterChange != null;

  return (
    <div>
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          headerClassName ?? (footer ? "mb-6" : "mb-8")
        }`}
      >
        <h2 className="text-2xl font-semibold text-neutral-900">{title}</h2>

        {hasFilters && (
          <ProfileFilterTabs
            filters={filters}
            activeFilterId={activeFilterId}
            onFilterChange={onFilterChange}
          />
        )}

        {trailing}
      </div>

      {footer}
    </div>
  );
}
