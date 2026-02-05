import { useState } from "react";
import DropdownFilter from "@/components/ui/DropdownFilter";
import SearchInput from "@/components/search/SearchInput";

interface FilterOption {
  label: string;
  value: string;
}

interface ContentFiltersProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  searchPlaceholder?: string;

  options: FilterOption[];
  activeOption: string;
  setActiveOption: (val: any) => void;

  label?: string;
}

export default function ContentFilters({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "search...",
  options,
  activeOption,
  setActiveOption,
  label = "sort:",
}: ContentFiltersProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
      {/* Filters - Left */}
      <div className="flex items-center gap-2">
        <DropdownFilter
          label={label}
          options={options}
          value={activeOption}
          onChange={setActiveOption}
        />
      </div>

      {/* Search Bar - Right */}
      {setSearchQuery && (
        <div className="w-full md:w-64">
          <SearchInput
            value={searchQuery || ""}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery("")}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            isFocused={isFocused}
            placeholder={searchPlaceholder}
            size="compact"
          />
        </div>
      )}
    </div>
  );
}
