"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
}

interface SearchFilterProps {
  placeholder?: string;
  filters?: {
    key: string;
    label: string;
    options: FilterOption[];
  }[];
  onSearch: (query: string) => void;
  onFilter?: (filters: Record<string, string>) => void;
}

export default function SearchFilter({
  placeholder = "Search...",
  filters = [],
  onSearch,
  onFilter,
}: SearchFilterProps) {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  function handleSearch(value: string) {
    setQuery(value);
    onSearch(value);
  }

  function handleFilter(key: string, value: string) {
    const updated = { ...activeFilters, [key]: value };
    if (!value) delete updated[key];
    setActiveFilters(updated);
    onFilter?.(updated);
  }

  function clearAll() {
    setQuery("");
    setActiveFilters({});
    onSearch("");
    onFilter?.({});
  }

  const hasActive = query || Object.keys(activeFilters).length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={activeFilters[filter.key] || ""}
          onChange={(e) => handleFilter(filter.key, e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {hasActive && (
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
