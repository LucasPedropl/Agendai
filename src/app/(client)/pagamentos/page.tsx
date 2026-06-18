import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  ShieldCheck,
  Trash2,
  Lock,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { motion, AnimatePresence } from 'motion/react';
import { fetchApi } from '@/lib/api';
import { normalizeApiList } from '@/lib/apiHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface SavedCard {
  id: number;
  nome: string;
  numero: string;
  validade: string;
}

export default function ClientPagamentosPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  const [validade, setValidade] = useState('');
  const [ccv, setCcv] = useState('');
  const [cpf, setCpf] = useState('');

  const loadCards = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await fetchApi(`/api/Cartoes/Todos/${user.id}`, {
        skipToast: true,
      } as RequestInit);
      const list = normalizeApiList<SavedCard>(data, ['Nenhum cartão']);
      setCards(list);
    } catch {
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const removeCard = async (id: number) => {
    try {
      await fetchApi(`/api/Cartoes/${id}`, { method: 'DELETE' });
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover cartão');
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const [mes, ano] = validade.split('/');
      const validadeIso = `${ano}-${mes.padStart(2, '0')}-01`;

      await fetchApi('/api/Cartoes', {
        method: 'POST',
        body: {
          Nome: nome,
          Numero: numero.replace(/\s/g, ''),
          Validade: validadeIso,
          CCV: ccv,
          CPF: cpf.replace(/\D/g, ''),
          UsuarioId: user.id,
        },
      });

      setIsModalOpen(false);
      setNome('');
      setNumero('');
      setValidade('');
      setCcv('');
      setCpf('');
      await loadCards();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar cartão');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          Carteira Digital
        </h1>
        <p className="text-muted-foreground">Gerencie seus métodos de pagamento para agendamentos rápidos.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {cards.map((card, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={card.id}
                className={`relative overflow-hidden rounded-[2rem] p-8 border-2 transition-all duration-300 ${
                  index === 0
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                    : 'bg-card text-foreground border-border hover:border-primary/30'
                }`}
              >
                <div className="relative z-10 h-full flex flex-col justify-between space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Titular</p>
                      <h3 className="font-bold text-lg">{card.nome}</h3>
                    </div>
                    <CreditCard className={`h-8 w-8 ${index === 0 ? 'text-white/20' : 'text-primary/20'}`} />
                  </div>
                  <p className="text-xl font-medium tracking-[0.15em]">{card.numero}</p>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Validade</p>
                      <p className="text-sm font-bold">{card.validade}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCard(card.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {index === 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Principal
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="group flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/[0.02] transition-all min-h-[220px] space-y-4"
          >
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">Adicionar Cartão</p>
              <p className="text-xs text-muted-foreground mt-1">Crédito ou Débito</p>
            </div>
          </button>
        </div>
      )}

      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <h4 className="font-bold text-emerald-900">Pagamento Seguro</h4>
          <p className="text-sm text-emerald-700/80">
            Seus dados são criptografados. O CVV não é armazenado após o processamento.
          </p>
        </div>
        <Lock className="h-10 w-10 text-emerald-500/20" />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Cartão">
        <form onSubmit={handleAddCard} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="nome">Nome no cartão</label>
            <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="numero">Número</label>
            <Input id="numero" required value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="0000 0000 0000 0000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="validade">Validade (MM/AA)</label>
              <Input id="validade" required value={validade} onChange={(e) => setValidade(e.target.value)} placeholder="08/28" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="ccv">CVV</label>
              <Input id="ccv" required value={ccv} onChange={(e) => setCcv(e.target.value)} maxLength={4} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="cpf">CPF do titular</label>
            <Input id="cpf" required value={cpf} onChange={(e) => setCpf(e.target.value)} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Cartão'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
