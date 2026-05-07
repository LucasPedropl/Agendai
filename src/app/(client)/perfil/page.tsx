import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Smartphone, 
  Calendar, 
  Save, 
  Loader2, 
  Check,
  Camera,
  IdCard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useToast } from '@/contexts/ToastContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { getPerfil, updatePerfil, isLoading } = useClientProfile();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadPerfil();
    }
  }, [user]);

  const loadPerfil = async () => {
    const data = await getPerfil(user!.id);
    if (data) {
      setFormData({
        nome: data.nome || '',
        sobrenome: data.sobrenome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        cpf: data.cpf || '',
        dataNascimento: data.dataNascimento ? data.dataNascimento.split('T')[0] : '',
      });
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    const success = await updatePerfil(user.id, formData);
    if (success) {
      toast.success('Perfil atualizado com sucesso!');
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      {/* Header with Avatar */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-card border border-border p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="relative group">
          <div className="w-32 h-32 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary text-4xl font-black border-4 border-background shadow-xl">
            {formData.nome.charAt(0) || user?.name?.charAt(0) || 'U'}
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-white rounded-xl shadow-lg border border-border text-slate-600 hover:text-primary transition-colors">
            <Camera className="h-5 w-5" />
          </button>
        </div>
        
        <div className="text-center md:text-left space-y-1 z-10">
          <h1 className="text-3xl font-black text-foreground">
            {formData.nome} {formData.sobrenome}
          </h1>
          <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
            <Mail className="h-4 w-4" /> {formData.email}
          </p>
          <div className="pt-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
              Cliente Agendai
            </span>
          </div>
        </div>
        
        <User className="absolute right-[-20px] top-[-20px] w-48 h-48 text-primary/5 -rotate-12 pointer-events-none" />
      </div>

      {/* Main Form Card */}
      <Card className="p-0 border-border shadow-sm rounded-[2.5rem] overflow-hidden bg-card">
        <div className="p-8 border-b border-border bg-accent/30">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <IdCard className="h-6 w-6 text-primary" />
            Meus Dados
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Mantenha seus dados atualizados para facilitar seus agendamentos.</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">Nome</label>
              <input 
                type="text" 
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">Sobrenome</label>
              <input 
                type="text" 
                value={formData.sobrenome}
                onChange={(e) => setFormData({...formData, sobrenome: e.target.value})}
                className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">CPF</label>
              <input 
                type="text" 
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">WhatsApp / Celular</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 pl-11 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={formData.email}
                  disabled
                  className="w-full h-12 rounded-2xl border border-border bg-slate-100 px-4 pl-11 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">Nascimento</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                  className="w-full h-12 rounded-2xl border border-border bg-accent/20 px-4 pl-11 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="h-12 px-10 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-4 text-muted-foreground text-xs font-medium">
        <Check className="h-4 w-4 text-emerald-500" />
        Suas informações estão seguras e criptografadas.
      </div>
    </div>
  );
}
