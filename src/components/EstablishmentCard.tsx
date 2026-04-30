import React from 'react';
import { MapPin, Clock, Star } from 'lucide-react';

interface EstablishmentCardProps {
  name: string;
  address: string;
  rating: number;
  reviews: number;
  hours: string;
  onClick: () => void;
}

export const EstablishmentCard: React.FC<EstablishmentCardProps> = ({
  name,
  address,
  rating,
  reviews,
  hours,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="card-pro overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
    >
      <div className="h-40 bg-secondary/50 flex items-center justify-center p-4 border-b border-border">
        <h3 className="text-foreground text-2xl font-black text-center tracking-tighter uppercase opacity-30">{name}</h3>
      </div>
      <div className="p-5 space-y-3">
        <h4 className="font-bold text-foreground text-lg tracking-tight">{name}</h4>
        <div className="flex items-center gap-2 text-xs font-medium text-foreground/50">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="truncate">{address}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 w-fit px-2 py-1 rounded-lg">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span>{rating.toFixed(1)}</span>
          <span className="opacity-60 text-[10px] ml-1">({reviews} reviews)</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-foreground/40 italic">
          <Clock className="h-3.5 w-3.5" />
          <span>{hours}</span>
        </div>
      </div>
    </div>
  );
};
