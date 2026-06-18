'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  RefreshCw, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Unlink,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { mapWhatsAppStatus } from '@/lib/apiHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { useComercioId } from '@/hooks/useComercioId';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function AdminWhatsAppPage() {
  const { token } = useAuth();
  const toast = useToast();
  const { comercioId, isLoading: isLoadingComercio } = useComercioId();
  const [status, setStatus] = useState<string>('checking');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const commerceId = comercioId;

  const checkStatus = useCallback(async function(silent = false) {
    if (!commerceId) return;
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchApi(`/api/WhatsApp/Status/${commerceId}`, {
        skipToast: true,
      } as RequestInit);

      setStatus(mapWhatsAppStatus(data?.status));
      setPhoneNumber(data?.phone_number || data?.ntelefone || null);
      
      if (data.status === 'CONNECTED') {
        setQrCode(null);
      }
    } catch (err) {
      console.error("Erro ao verificar status do WhatsApp:", err);
      setStatus('ERROR');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [commerceId]);

  const generateQrCode = async () => {
    if (!commerceId) return;
    setIsActionLoading(true);
    try {
      const data = await fetchApi(`/api/WhatsApp/Obter-QrCode/${commerceId}`, {
        skipToast: true,
      } as RequestInit);
      
      if (data?.qrCode) {
        setQrCode(data.qrCode);
        setStatus('QRCODE_READY');
        toast.success('QR Code gerado com sucesso!');
      } else {
        setStatus('ERROR');
        toast.error('Integração WhatsApp indisponível no momento. Tente novamente mais tarde.');
      }
    } catch (err: unknown) {
      console.error('Erro ao obter QR Code:', err);
      setStatus('ERROR');
      const message = err instanceof Error ? err.message : 'Falha na comunicação com o servidor.';
      toast.error(
        message.includes('QR') || message.includes('Falha')
          ? 'Integração WhatsApp indisponível. A geração de QR Code depende de correção no backend.'
          : message
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const disconnect = async () => {
    setIsActionLoading(true);
    try {
      await fetchApi(`/api/WhatsApp/Desconectar/${commerceId}`, {
        method: 'DELETE',
      });
      
      setStatus('DISCONNECTED');
      setQrCode(null);
      setPhoneNumber(null);
      toast.success('WhatsApp desconectado com sucesso.');
    } catch (err) {
      console.error('Erro ao desconectar:', err);
      toast.error('Erro ao processar desconexão.');
    } finally {
      setIsActionLoading(false);
      setShowDisconnectDialog(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'QRCODE_READY' || status === 'PENDING') {
      interval = setInterval(() => {
        checkStatus(true);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [status, checkStatus]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const statusConfig = {
    CONNECTED: {
      icon: CheckCircle2,
      title: 'Conexão Ativa',
      description: 'Sua conta está sincronizada e pronta para automações.',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      badge: 'Conectado'
    },
    QRCODE_READY: {
      icon: QrCode,
      title: 'Aguardando Escaneamento',
      description: 'Siga os passos abaixo para autenticar sua conta.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      badge: 'QR Code Pronto'
    },
    DISCONNECTED: {
      icon: XCircle,
      title: 'WhatsApp Desconectado',
      description: 'Conecte seu WhatsApp para habilitar notificações automáticas.',
      color: 'text-slate-400',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      badge: 'Inativo'
    },
    checking: {
      icon: Loader2,
      title: 'Verificando Status',
      description: 'Aguarde enquanto consultamos sua conexão.',
      color: 'text-indigo-600',
      bgColor: 'bg-white',
      borderColor: 'border-slate-100',
      badge: 'Verificando...'
    },
    ERROR: {
      icon: AlertCircle,
      title: 'Integração indisponível',
      description:
        'O serviço de WhatsApp não está respondendo no momento (falha de comunicação com o provedor externo). ' +
        'Os lembretes automáticos ficam desativados até a equipe de backend restabelecer a integração.',
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      badge: 'Indisponível'
    }
  };

  const currentStatus = (statusConfig[status as keyof typeof statusConfig] || statusConfig.ERROR) as any;

  if (isLoading && status === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-indigo-600" />
        </motion.div>
        <p className="text-slate-500 font-medium animate-pulse">Sincronizando com WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 px-4">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              status === 'CONNECTED'
                ? 'bg-emerald-100 text-emerald-700'
                : status === 'ERROR'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Zap className="h-3 w-3" />
            {status === 'CONNECTED' ? 'Automação ativa' : status === 'ERROR' ? 'Integração pausada' : 'Automação'}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            WhatsApp <span className="text-indigo-600">Business</span>
          </h1>
          <p className="text-slate-500 text-lg">Gerencie sua conexão e automatize o atendimento ao cliente.</p>
        </div>
        
        <Button 
          variant="outline" 
          className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
          onClick={() => checkStatus()}
          disabled={isActionLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isActionLoading ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      </header>

      {status === 'ERROR' && (
        <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <div className="space-y-1">
            <p className="font-semibold">WhatsApp temporariamente indisponível</p>
            <p className="text-rose-800/90 leading-relaxed">
              A API não consegue se comunicar com o provedor externo (erro TLS/handshake). Conectar ou gerar QR Code
              não funcionará até a equipe de backend corrigir a integração. Seus agendamentos continuam normais.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Status Panel */}
        <div className="lg:col-span-8 space-y-8">
          <Card className={`overflow-hidden border-none shadow-2xl shadow-slate-200/50 transition-all duration-500`}>
            <div className={`h-2 ${currentStatus.bgColor.replace('bg-', 'bg-')}`} style={{ backgroundColor: `var(--${currentStatus.color.split('-')[1]}-500)` }} />
            <CardContent className="p-0">
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="relative group">
                    <div className={`absolute -inset-4 rounded-[2.5rem] ${currentStatus.bgColor} opacity-50 blur-xl group-hover:opacity-75 transition duration-500`} />
                    <div className="relative p-6 bg-white rounded-3xl shadow-xl ring-1 ring-slate-100">
                      <currentStatus.icon className={`h-16 w-16 ${currentStatus.color} ${status === 'checking' ? 'animate-spin' : ''}`} />
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-3">
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                      <h2 className="text-3xl font-bold text-slate-900">{currentStatus.title}</h2>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentStatus.bgColor} ${currentStatus.color} border ${currentStatus.borderColor}`}>
                        {currentStatus.badge}
                      </span>
                    </div>
                    <p className="text-slate-500 text-lg leading-relaxed">{currentStatus.description}</p>
                    
                    {phoneNumber && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 text-slate-900 font-bold text-sm">
                        <Smartphone className="h-4 w-4 text-indigo-500" />
                        {phoneNumber}
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {status === 'QRCODE_READY' && qrCode ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mt-12 space-y-10"
                    >
                      <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] border-2 border-white shadow-inner">
                          <div className="p-4 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-100">
                            <img src={qrCode} alt="WhatsApp QR Code" className="h-56 w-56 object-contain" />
                          </div>
                          <div className="mt-6 flex items-center gap-2 text-indigo-600 font-bold text-sm animate-pulse">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Escaneie para conectar
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h4 className="text-slate-900 font-bold flex items-center gap-2">
                            Passo a passo rápido
                            <ArrowRight className="h-4 w-4 text-indigo-500" />
                          </h4>
                          <div className="space-y-4">
                            {[
                              { step: 1, text: 'Abra o WhatsApp no seu celular' },
                              { step: 2, text: 'Vá em Menu ou Configurações' },
                              { step: 3, text: 'Selecione Dispositivos Conectados' },
                              { step: 4, text: 'Aponte a câmera para o código' }
                            ].map((item) => (
                              <div key={item.step} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <span className="flex-shrink-0 h-6 w-6 rounded-lg bg-white shadow-sm border border-slate-100 text-indigo-600 text-xs font-black flex items-center justify-center">
                                  {item.step}
                                </span>
                                <p className="text-sm text-slate-600 font-medium pt-0.5">{item.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div className="mt-12 flex flex-wrap items-center justify-center md:justify-start gap-4 pt-8 border-t border-slate-50">
                  {status === 'CONNECTED' ? (
                    <Button 
                      variant="destructive" 
                      className="rounded-2xl px-10 h-14 font-bold shadow-xl shadow-rose-100 hover:shadow-rose-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                      onClick={() => setShowDisconnectDialog(true)}
                      disabled={isActionLoading}
                    >
                      <Unlink className="mr-2 h-5 w-5" />
                      Desconectar Conta
                    </Button>
                  ) : (
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-12 h-14 font-bold shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                      onClick={generateQrCode}
                      disabled={isActionLoading || status === 'QRCODE_READY' || status === 'ERROR'}
                    >
                      {isActionLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <QrCode className="mr-2 h-5 w-5" />
                      )}
                      {status === 'QRCODE_READY' ? 'QR Code Gerado' : 'Conectar agora'}
                    </Button>
                  )}
                  
                  <p className="text-xs text-slate-400 font-medium max-w-[240px] text-center md:text-left leading-relaxed">
                    Ao conectar, você concorda em enviar mensagens automáticas para seus clientes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition duration-500" />
            <div className="relative space-y-4">
              <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold">Segurança Máxima</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Utilizamos a API oficial para garantir que sua conta permaneça segura e dentro das diretrizes do WhatsApp.
              </p>
            </div>
          </div>

          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Vantagens
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Redução de Faltas', value: '60%', desc: 'com lembretes automáticos' },
                { label: 'Retenção', value: '2x', desc: 'maior engajamento do cliente' },
                { label: 'Agilidade', value: 'Instantânea', desc: 'confirmação via chat' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <span className="text-sm font-black text-indigo-600">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-none bg-indigo-50/50 rounded-[2.5rem] p-8 space-y-4">
            <h4 className="font-bold text-indigo-900">Precisa de ajuda?</h4>
            <p className="text-sm text-indigo-700/80 leading-relaxed">
              Caso encontre dificuldades para conectar, nossa equipe de suporte está disponível 24h.
            </p>
            <Button variant="link" className="p-0 h-auto text-indigo-600 font-bold flex items-center gap-1 hover:no-underline hover:text-indigo-700 group">
              Acesse o Centro de Ajuda
              <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDisconnectDialog}
        onClose={() => setShowDisconnectDialog(false)}
        onConfirm={disconnect}
        title="Desconectar WhatsApp"
        description="Deseja realmente desconectar? Os lembretes automáticos por WhatsApp serão interrompidos até uma nova conexão."
        confirmLabel="Desconectar"
        variant="destructive"
        isLoading={isActionLoading}
      />
    </div>
  );
}
