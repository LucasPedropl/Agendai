import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstablishments } from '@/features/booking/hooks/useEstablishments';
import { EstablishmentCard } from '@/components/EstablishmentCard';
import {
  LocationFilterPopover,
  LocationFilterType,
} from '@/features/booking/components/LocationFilterPopover';
import { Search, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'motion/react';

export default function AgendarPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationType, setLocationType] = useState<LocationFilterType>('all');
  const [locationCity, setLocationCity] = useState('');
  const navigate = useNavigate();

  const { estabelecimentos, isLoading } = useEstablishments(searchTerm, locationCity);

  const handleSelectEstabelecimento = (comercioId: number) => {
    navigate(`/app/estabelecimento/${comercioId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Banner com Busca e Filtro de Localização */}
        <div className="relative rounded-3xl bg-primary/10 p-6 sm:p-8 border border-primary/20 overflow-hidden">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 tracking-tight">
            Onde vamos hoje?
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl relative z-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar barbearia, salão, spa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 h-14 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-sm"
              />
            </div>
            <div className="shrink-0 flex items-center">
              <LocationFilterPopover
                activeType={locationType}
                activeCity={locationCity}
                onChange={(type, city) => {
                  setLocationType(type);
                  setLocationCity(city);
                }}
              />
            </div>
          </div>
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            <Sparkles className="absolute right-0 top-0 w-48 h-48 text-primary/5 -rotate-12 pointer-events-none" />
          </div>
        </div>

        {/* Lista de Estabelecimentos Agendáveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-3xl" />
            ))
          ) : estabelecimentos.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted-foreground bg-card border border-border rounded-3xl p-8">
              <p className="text-lg font-medium">
                Nenhum estabelecimento encontrado com horários disponíveis para esta busca.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Tente ajustar os termos da pesquisa ou alterar o filtro de localização.
              </p>
            </div>
          ) : (
            estabelecimentos.map((est) => (
              <EstablishmentCard
                key={est.id}
                name={est.nome}
                address={est.endereco}
                rating={est.mediaAvalicoes || 0}
                reviews={est.totalAvalicoes || 0}
                onClick={() => handleSelectEstabelecimento(est.id)}
              />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
