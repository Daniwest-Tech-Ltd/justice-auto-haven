import { useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AvailableColorsMultiSelectProps {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  helperText?: string;
}

export function AvailableColorsMultiSelect({
  label = "Other Colors Available (Optional)",
  options,
  selected,
  onChange,
  placeholder = "Select other available colors…",
  helperText = "Optional: select other colors this same car model is available in",
}: AvailableColorsMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => a.localeCompare(b));
  }, [options]);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clear = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        {selected.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={clear} className="h-8">
            <X className="h-4 w-4" />
            <span className="ml-2">Clear</span>
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{helperText}</p>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between",
              selected.length === 0 && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selected.length === 0 ? placeholder : `${selected.length} selected`}
            </span>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
          <Command>
            <CommandInput placeholder="Search colors…" />
            <CommandList>
              <CommandEmpty>No colors found.</CommandEmpty>
              <CommandGroup>
                {sortedOptions.map((opt) => {
                  const isSelected = selected.includes(opt);
                  return (
                    <CommandItem
                      key={opt}
                      value={opt}
                      onSelect={() => toggle(opt)}
                      className="flex items-center justify-between"
                    >
                      <span>{opt}</span>
                      <span
                        className={cn(
                          "ml-3 inline-flex h-5 w-5 items-center justify-center rounded-sm border",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border"
                        )}
                        aria-hidden="true"
                      >
                        {isSelected && <Check className="h-4 w-4" />}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selected.map((c) => (
            <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => toggle(c)}>
              {c}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
