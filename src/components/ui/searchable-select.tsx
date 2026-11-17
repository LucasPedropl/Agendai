import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, Plus, Settings } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  onAdd?: () => void;
  onSettings?: () => void;
}

export function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Selecione...", 
  emptyMessage = "Nenhum resultado encontrado.",
  onAdd,
  onSettings
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    (option.label || "").toLowerCase().includes((search || "").toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </div>

      {isOpen && (
        <div className="absolute z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background py-1 text-base shadow-lg ring-1 ring-border focus:outline-none sm:text-sm" style={{ top: '100%', left: 0 }}>
          <div className="sticky top-0 z-10 bg-background px-2 pb-2 pt-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                className="w-full rounded-sm border border-border bg-transparent pl-8 pr-16 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {onAdd && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd();
                    }}
                    className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                {onSettings && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSettings();
                    }}
                    className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-1">
            {filteredOptions.length === 0 ? (
              <div className="relative cursor-default select-none py-2 px-4 text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`relative cursor-pointer select-none rounded-sm py-2 pl-8 pr-4 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                    value === option.value ? 'bg-accent text-accent-foreground font-medium' : 'text-foreground'
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="block truncate">{option.label}</span>
                  {value === option.value && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
