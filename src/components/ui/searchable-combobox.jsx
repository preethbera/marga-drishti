import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Custom filter function to search both code and name.
 * Shadcn Command uses cmdk which supports a custom filter.
 */
function customFilter(value, search, keywords) {
  const normalizedValue = value.toLowerCase();
  const normalizedSearch = search.toLowerCase();
  
  if (normalizedValue.includes(normalizedSearch)) return 1;
  if (keywords && keywords.some(k => k.toLowerCase().includes(normalizedSearch))) return 1;
  return 0;
}

export function SearchableCombobox({ items, value, onSelect, placeholder, emptyText }) {
  const [open, setOpen] = React.useState(false)

  const selectedItem = items.find((item) => String(item.code) === String(value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        />
      }>
        <span className="truncate">
          {selectedItem
            ? selectedItem.code === selectedItem.name
              ? selectedItem.name
              : `${selectedItem.code} - ${selectedItem.name}`
            : placeholder || "Select item..."}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command filter={customFilter}>
          <CommandInput placeholder={placeholder || "Search..."} />
          <CommandList>
            <CommandEmpty>{emptyText || "No item found."}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.code}
                  value={String(item.code)}
                  keywords={[item.name]}
                  onSelect={(currentValue) => {
                    onSelect(currentValue === String(value) ? "all" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(value) === String(item.code) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.code === item.name ? item.name : `${item.code} - ${item.name}`}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
