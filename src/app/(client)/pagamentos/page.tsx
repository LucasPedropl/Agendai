import { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  ShieldCheck, 
  ChevronRight, 
  Trash2, 
  Star,
  Lock,
  Wallet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';

interface Card {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  holder: string;
  isDefault: boolean;
}

export default function ClientPagamentosPage() {
  // Mock de cartões (API não possui endpoint para salvar cartões no momento)
  const [cards, setCards] = useState<Card[]>([
    {
      id: '1',
      last4: '4589',
      brand: 'Visa',
      expiry: '08/28',
      holder: 'PEDRO L MOTA',
      isDefault: true
    },
    {
      id: '2',
      last4: '1234',
      brand: 'Mastercard',
      expiry: '12/26',
      holder: 'PEDRO L MOTA',
      isDefault: false
    }
  ]);

  const removeCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          Carteira Digital
        </h1>
        <p className="text-muted-foreground">Gerencie seus métodos de pagamento para agendamentos rápidos.</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {cards.map((card) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={card.id}
              className={`
                relative overflow-hidden rounded-[2rem] p-8 border-2 transition-all duration-300
                ${card.isDefault 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                  : 'bg-card text-foreground border-border hover:border-primary/30'
                }
              `}
            >
              <div className="relative z-10 h-full flex flex-col justify-between space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Bank Name</p>
                    <h3 className="font-bold text-lg">{card.brand}</h3>
                  </div>
                  <CreditCard className={`h-8 w-8 ${card.isDefault ? 'text-white/20' : 'text-primary/20'}`} />
                </div>

                <div className="space-y-1">
                  <p className="text-xl font-medium tracking-[0.15em]">
                    •••• •••• •••• {card.last4}
                  </p>
                </div>

                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Card Holder</p>
                    <p className="text-sm font-bold truncate max-w-[150px]">{card.holder}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Expires</p>
                    <p className="text-sm font-bold">{card.expiry}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  {card.isDefault ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Padrão
                    </div>
                  ) : (
                    <button className="text-[10px] font-bold uppercase text-primary hover:underline">
                      Definir como padrão
                    </button>
                  )}
                  <button 
                    onClick={() => removeCard(card.id)}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Background Decoration */}
              <div className={`absolute right-[-20px] bottom-[-20px] w-48 h-48 rounded-full opacity-5 pointer-events-none ${card.isDefault ? 'bg-white' : 'bg-primary'}`} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add New Card Button */}
        <button className="group flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/[0.02] transition-all min-h-[220px] space-y-4">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">Adicionar Cartão</p>
            <p className="text-xs text-muted-foreground mt-1">Crédito ou Débito</p>
          </div>
        </button>
      </div>

      {/* Security Info */}
      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <h4 className="font-bold text-emerald-900">Pagamento Seguro</h4>
          <p className="text-sm text-emerald-700/80">
            Seus dados são criptografados e protegidos. Nunca armazenamos o código de segurança (CVV) do seu cartão.
          </p>
        </div>
        <Lock className="h-10 w-10 text-emerald-500/20" />
      </div>

      {/* Feature Warning (API Missing) */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 flex items-center gap-4">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <p className="text-sm text-amber-800">
          <strong>Nota técnica:</strong> A funcionalidade de persistência de cartões no banco de dados está aguardando implementação na API. Os dados acima são demonstrativos.
        </p>
      </div>
    </div>
  );
}
