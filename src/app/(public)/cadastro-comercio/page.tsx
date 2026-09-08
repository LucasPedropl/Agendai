import { CadastroComercioWizard } from '@/features/cadastro-comercio/components/CadastroComercioWizard';

interface CadastroComercioPageProps {
  onSuccess?: () => void;
}

export default function CadastroComercioPage({ onSuccess }: CadastroComercioPageProps) {
  return <CadastroComercioWizard onSuccess={onSuccess} />;
}
