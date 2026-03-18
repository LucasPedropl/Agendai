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
      className="bg-white border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="h-40 bg-slate-700 flex items-center justify-center p-4">
        <h3 className="text-white text-2xl font-bold text-center">{name}</h3>
      </div>
      <div className="p-4 space-y-2">
        <h4 className="font-bold text-slate-900">{name}</h4>
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <MapPin className="h-4 w-4" />
          <span>{address}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-yellow-500">
          <Star className="h-4 w-4 fill-current" />
          <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
          <span className="text-slate-500">({reviews} avaliações)</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <Clock className="h-4 w-4" />
          <span>{hours}</span>
        </div>
      </div>
    </div>
  );
};
