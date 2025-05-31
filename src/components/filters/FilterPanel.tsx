"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  CalendarIcon,
  Tag as TagIcon,
  Filter as FilterIcon,
  X,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Tag } from "@/services/project";
import { useTranslations } from "next-intl";

interface FilterPanelProps {
  tags?: Tag[];
  statusOptions?: string[];
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedDateRange?: DateRange;
  onDateChange: (range?: DateRange) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function FilterPanel({
  tags = [],
  statusOptions = [],
  selectedTags,
  onTagChange,
  selectedStatus,
  onStatusChange,
  selectedDateRange,
  onDateChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
}: FilterPanelProps) {
  const [tagPopoverOpen, setTagPopoverOpen] = React.useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = React.useState(false);

  const handleTagSelect = (tagId: string) => {
    const isSelected = selectedTags.includes(tagId);
    const newTags = isSelected
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    onTagChange(newTags);
  };

  const handleStatusChange = (value: string) => {
    onStatusChange(value === "all" ? "" : value);
  };

  const t = useTranslations("filters");

  const hasActiveFilters =
    selectedTags.length > 0 ||
    !!selectedStatus ||
    !!selectedDateRange ||
    !!searchQuery;

  return (
    // Reduced padding and gap
    <div className="p-3 border rounded-lg bg-card shadow-sm space-y-3">
      {/* Filter Controls Row - Reduced gap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {/* Tag Filter */}
        {tags.length > 0 && (
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              {/* Reduced button height and text size */}
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={tagPopoverOpen}
                className="w-full justify-between text-muted-foreground hover:text-foreground h-9 text-xs px-2"
              >
                <span className="flex items-center gap-1.5">
                  <TagIcon className="h-3.5 w-3.5" /> {/* Smaller icon */}
                  {selectedTags.length > 0
                    ? `${selectedTags.length} ${t("tags.selected")}` // Shorter text
                    : t("tags.label")}
                </span>
                <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />{" "}
                {/* Smaller icon */}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput
                  placeholder={t("tags.searchPlaceholder")}
                  className="h-8 text-xs"
                />{" "}
                {/* Smaller input */}
                <CommandList>
                  <CommandEmpty>{t("tags.empty")}</CommandEmpty>
                  <CommandGroup>
                    {tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => handleTagSelect(tag.id)}
                          className="cursor-pointer text-xs py-1 px-2" // Smaller text/padding
                        >
                          <Check
                            className={cn(
                              "mr-1.5 h-3.5 w-3.5", // Smaller icon
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full mr-1.5 flex-shrink-0"
                            style={{ backgroundColor: tag.color }}
                          ></span>{" "}
                          {/* Smaller color dot */}
                          {tag.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Status Filter */}
        {statusOptions.length > 0 && (
          // Reduced trigger height and text size
          <Select
            value={selectedStatus || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full text-muted-foreground hover:text-foreground h-9 text-xs px-2">
              <span className="flex items-center gap-1 flex-none">
                <FilterIcon className="h-4 w-4 flex-shrink-0" />

                {/* placeholder como string, sem children */}
                <SelectValue
                  placeholder={t("status.placeholder")}
                  className="truncate text-left"
                />
              </span>
              {/* Update placeholder */}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {t("status.all")}
              </SelectItem>
              {statusOptions.map((status) =>
                status ? (
                  <SelectItem key={status} value={status} className="text-xs">
                    {status}
                  </SelectItem>
                ) : null
              )}
            </SelectContent>
          </Select>
        )}

        {/* Date Range Filter */}
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            {/* Reduced button height and text size */}
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal text-muted-foreground hover:text-foreground h-9 text-xs px-2",
                !selectedDateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />{" "}
              {/* Smaller icon */}
              {selectedDateRange?.from ? (
                selectedDateRange.to ? (
                  <>
                    {format(selectedDateRange.from, "LLL dd, yy")} -{" "}
                    {format(selectedDateRange.to, "LLL dd, yy")}
                  </>
                ) : (
                  format(selectedDateRange.from, "LLL dd, yy")
                )
              ) : (
                <span>{t("date.label")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={selectedDateRange?.from}
              selected={selectedDateRange}
              onSelect={(range) => {
                onDateChange(range);
              }}
              numberOfMonths={1}
            />
            {selectedDateRange && (
              <div className="p-1 border-t text-center">
                {/* Smaller button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDateChange(undefined)}
                  className="h-7 text-xs"
                >
                  {t("date.clear")}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Search Bar - Reduced input height and text size */}
        <div className="relative flex-grow lg:col-span-1">
          {" "}
          {/* Take remaining space on large screens */}
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />{" "}
          {/* Smaller icon */}
          <Input
            type="search"
            placeholder={t("search.placeholder")} // Shorter placeholder
            className="pl-8 w-full h-9 text-xs" // Smaller padding/height/text
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Clear Filters Button - Moved to end, reduced size */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="w-full sm:w-auto h-9 text-xs px-2"
          >
            <X className="mr-1.5 h-3.5 w-3.5" /> {t("clear.button")}{" "}
            {/* Smaller icon */}
          </Button>
        )}
      </div>

      {/* Display Selected Tags as Badges (Optional Visualization) - Reduced size */}
      {selectedTags.length > 0 && (
        <div className="pt-1 flex flex-wrap gap-1">
          <span className="text-[11px] text-muted-foreground mr-1 self-center">
            {t("badges.label")}
          </span>
          {selectedTags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <Badge
                key={tag.id}
                variant="secondary"
                className="cursor-pointer text-[10px] px-1.5 py-0" // Smaller badge
                onClick={() => handleTagSelect(tag.id)}
                title={`${t("badges.removeTitle")} ${tag.name}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mr-1"
                  style={{ backgroundColor: tag.color }}
                ></span>{" "}
                {/* Smaller color dot */}
                {tag.name}
                <X className="ml-1 h-2.5 w-2.5" /> {/* Smaller icon */}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
