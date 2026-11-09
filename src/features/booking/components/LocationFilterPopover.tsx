import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Building2, Globe2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';

export type LocationFilterType = 'all' | 'geo' | 'city';

interface LocationFilterPopoverProps {
  activeType: LocationFilterType;
  activeCity: string;
  onChange: (type: LocationFilterType, city: string) => void;
}

export function LocationFilterPopover({
  activeType,
  activeCity,
  onChange,
}: LocationFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [typedCity, setTypedCity] = useState(activeType === 'city' ? activeCity : '');
  const [isLocating, setIsLocating] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Fecha no clique fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Fecha no ESC
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Sincroniza estado digitado se mudar externamente
  useEffect(() => {
    if (activeType === 'city') {
      setTypedCity(activeCity);
    }
  }, [activeType, activeCity]);

  const handleSelectAll = () => {
    onChange('all', '');
    setTypedCity('');
    setIsOpen(false);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não é suportada pelo seu navegador.');
      onChange('all', '');
      setIsOpen(false);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`;
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error('Falha no reverse geocode');
          }
          const data = (await res.json()) as { city?: string; locality?: string };
          const detectedCity = data.city || data.locality || '';

          if (detectedCity) {
            onChange('geo', detectedCity);
            toast.success(`Filtrando por ${detectedCity}`);
          } else {
            toast.error('Não foi possível identificar sua cidade.');
            onChange('all', '');
          }
        } catch {
          toast.error('Erro ao identificar sua cidade. Mostrando todos os estabelecimentos.');
          onChange('all', '');
        } finally {
          setIsLocating(false);
          setIsOpen(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Permissão de localização negada ou indisponível.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Permissão de localização negada. Mostrando todos os estabelecimentos.';
        }
        toast.error(msg);
        onChange('all', '');
        setIsOpen(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const handleApplyCity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = typedCity.trim();
    if (!trimmed) {
      onChange('all', '');
    } else {
      onChange('city', trimmed);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('all', '');
    setTypedCity('');
  };

  const isFilterActive = activeType !== 'all' && Boolean(activeCity);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Botão de Localização */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Filtrar por localização"
        title="Filtrar por localização"
        className={`
          h-14 px-4 rounded-2xl border flex items-center justify-center gap-2 transition-all shadow-sm
          ${
            isFilterActive
              ? 'bg-primary text-primary-foreground border-primary font-medium'
              : 'bg-background hover:bg-accent border-border text-foreground hover:text-primary'
          }
        `}
      >
        <MapPin className="h-5 w-5 shrink-0" />
        {isFilterActive && (
          <>
            <span className="text-xs font-bold max-w-[100px] sm:max-w-[140px] truncate">
              {activeCity}
            </span>
            <span
              onClick={handleClear}
              className="p-1 hover:bg-primary-foreground/20 rounded-full transition-colors ml-1"
              role="button"
              aria-label="Limpar filtro"
            >
              <X className="h-3 w-3" />
            </span>
          </>
        )}
      </button>

      {/* Popover / Dropdown */}
      {isOpen && (
        <div
          className={`
            absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50
            w-[calc(100vw-2.5rem)] max-w-[320px] sm:w-80
            bg-card border border-border rounded-2xl shadow-xl p-4 space-y-4
            animate-in fade-in zoom-in-95 duration-150
          `}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Localização
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground text-xs p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* 1. Todos */}
            <button
              type="button"
              onClick={handleSelectAll}
              className={`
                w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left transition-all
                ${
                  activeType === 'all'
                    ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                    : 'hover:bg-accent text-foreground'
                }
              `}
            >
              <Globe2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Todos (sem filtro)</span>
            </button>

            {/* 2. Minha localização */}
            <button
              type="button"
              disabled={isLocating}
              onClick={handleGeolocation}
              className={`
                w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left transition-all
                ${
                  activeType === 'geo'
                    ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                    : 'hover:bg-accent text-foreground'
                }
              `}
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <Navigation className="h-4 w-4 shrink-0 text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <span className="block truncate">Minha localização</span>
                {activeType === 'geo' && activeCity && (
                  <span className="text-[11px] text-muted-foreground truncate block">
                    {activeCity}
                  </span>
                )}
              </div>
            </button>

            {/* 3. Cidade específica */}
            <div className="pt-2 border-t border-border/60">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Cidade específica
              </label>
              <form onSubmit={handleApplyCity} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Vitória, Serra..."
                  value={typedCity}
                  onChange={(e) => setTypedCity(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="submit" size="sm" className="rounded-xl text-xs px-3 shrink-0">
                  Filtrar
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
