import React, { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SmartSearchProps = {
  onSelectProperty?: (property: any) => void;
  onSelectNeighborhood?: (neighborhood: any) => void;
  placeholder?: string;
  className?: string;
};

export function SmartSearch({
  onSelectProperty,
  onSelectNeighborhood,
  placeholder = "Search for properties or neighborhoods...",
  className = "",
}: SmartSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const debouncedValue = useDebounce(inputValue, 300);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  // Don't query if input is empty
  const enabled = debouncedValue.length > 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/search", debouncedValue],
    queryFn: async () => {
      if (!enabled) return { neighborhoods: [], properties: [] };
      
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(debouncedValue)}&limit=5`
      );
      
      if (!res.ok) {
        throw new Error("Search failed");
      }
      
      const result = await res.json();
      return result.data;
    },
    enabled: enabled,
    staleTime: 10000, // Cache results for 10 seconds
  });

  // Handle selecting a property
  const handleSelectProperty = useCallback(
    (property: any) => {
      if (onSelectProperty) {
        onSelectProperty(property);
      }
      setInputValue(property.address || property.prop_id || property.geo_id);
      setOpen(false);
    },
    [onSelectProperty]
  );

  // Handle selecting a neighborhood
  const handleSelectNeighborhood = useCallback(
    (neighborhood: any) => {
      if (onSelectNeighborhood) {
        onSelectNeighborhood(neighborhood);
      }
      setInputValue(neighborhood.name);
      setOpen(false);
    },
    [onSelectNeighborhood]
  );

  // Clear the input
  const handleClear = useCallback(() => {
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Display error toast if search fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className={`relative flex-1 ${className}`}>
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (!open && e.target.value) setOpen(true);
                  if (open && !e.target.value) setOpen(false);
                }}
                onFocus={() => {
                  if (inputValue) setOpen(true);
                }}
                onClick={() => {
                  if (inputValue) setOpen(true);
                }}
                className="pl-8 pr-10 h-10 w-full"
              />
              {inputValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="absolute right-0 top-0 h-full px-3 py-2"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear</span>
                </Button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-full max-w-[500px]"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <Command ref={commandRef} className="w-full">
              <CommandInput
                value={inputValue}
                onValueChange={setInputValue}
                placeholder={placeholder}
                className="h-9"
              />
              {isLoading ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Searching...
                  </p>
                </div>
              ) : (
                <CommandList>
                  <CommandEmpty>No results found</CommandEmpty>
                  {data?.neighborhoods && data.neighborhoods.length > 0 && (
                    <CommandGroup heading="Neighborhoods">
                      {data.neighborhoods.map((neighborhood: any) => (
                        <CommandItem
                          key={neighborhood.hood_cd}
                          value={`neighborhood-${neighborhood.hood_cd}`}
                          onSelect={() => handleSelectNeighborhood(neighborhood)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {neighborhood.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {neighborhood.propertyCount} properties
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {data?.properties && data.properties.length > 0 && (
                    <CommandGroup heading="Properties">
                      {data.properties.map((property: any) => (
                        <CommandItem
                          key={property.id}
                          value={`property-${property.id}`}
                          onSelect={() => handleSelectProperty(property)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {property.address || "No address"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {property.prop_id} - {property.neighborhood || "No neighborhood"}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              )}
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}