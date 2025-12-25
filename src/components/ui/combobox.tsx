"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, FolderOpen } from "lucide-react"

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

export interface ComboboxItem {
  value: string
  label: string
  image?: string
}

interface ComboboxProps {
  items: ComboboxItem[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  showAddButton?: boolean
  onAddNew?: () => void
  addButtonLabel?: string
}

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "Select item...",
  emptyText = "No item found.",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  showAddButton = false,
  onAddNew,
  addButtonLabel = "Add new",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedItem = items.find((item) => item.value === value)

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 truncate">
              {selectedItem?.image ? (
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.label}
                  className="h-5 w-5 rounded object-cover flex-shrink-0"
                />
              ) : selectedItem ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              ) : null}
              <span className="truncate">
                {selectedItem ? selectedItem.label : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    onSelect={() => {
                      onValueChange?.(item.value === value ? "" : item.value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 flex-shrink-0",
                        value === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.label}
                        className="mr-2 h-5 w-5 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <FolderOpen className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showAddButton && onAddNew && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onAddNew}
          disabled={disabled}
          title={addButtonLabel}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
