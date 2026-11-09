import { useParams, useLocation, Outlet, Navigate } from 'react-router-dom';
import { BookingStepIndicator } from './BookingStepIndicator';
import {
  useEstablishmentDetails,
  useComercioServices,
  useComercioProfessionals,
} from '../hooks/useBookingData';
import { Estabelecimento, Servico, Profissional } from '../types';

export interface BookingOutletContext {
  comercioId: number;
  estabelecimento: Estabelecimento | null;
  servicos: Servico[];
  profissionais: Profissional[];
  isLoading: boolean;
}

export function BookingLayout() {
  const { comercioId } = useParams<{ comercioId: string }>();
  const location = useLocation();

  const idNum = Number(comercioId);
  if (!comercioId || isNaN(idNum) || idNum <= 0) {
    return <Navigate to="/app" replace />;
  }

  const { data: estabelecimento = null, isLoading: isLoadingEst } = useEstablishmentDetails(idNum);
  const { data: servicos = [], isLoading: isLoadingServ } = useComercioServices(idNum);
  const { data: profissionais = [], isLoading: isLoadingProf } = useComercioProfessionals(idNum);

  // Calcula o número da etapa a partir da URL
  let currentStep = 2; // Default: Serviço
  if (location.pathname.endsWith('/confirmar')) {
    currentStep = 5;
  } else if (location.pathname.endsWith('/horario')) {
    currentStep = 4;
  } else if (location.pathname.endsWith('/profissional')) {
    currentStep = 3;
  }

  const contextValue: BookingOutletContext = {
    comercioId: idNum,
    estabelecimento,
    servicos,
    profissionais,
    isLoading: isLoadingEst || isLoadingServ || isLoadingProf,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <BookingStepIndicator currentStep={currentStep} />
      <Outlet context={contextValue} />
    </div>
  );
}
