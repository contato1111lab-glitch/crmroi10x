import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock } from 'lucide-react';
import { toast } from '../lib/toast';
import { useOperacao } from '../context/OperacaoContext';

export default function FechamentoModal() {
  const { operacao } = useOperacao();
  const dbOperacao = operacao === 'NUTRA' ? 'Nutra' : 'Info';
  const [isOpen, setIsOpen] = useState(false);
  const [gasto, setGasto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ontemStr, setOntemStr] = useState('');
  const [ontemDate, setOntemDate] = useState('');
  const [orcamentoPlanejado, setOrcamentoPlanejado] = useState(0);

  useEffect(() => {
    checkFechamento();
  }, [operacao]);

  const checkFechamento = async () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const yesterdayISO = date.toISOString().split('T')[0];
    
    // Format for display (DD/MM/YYYY)
    const displayDate = date.toLocaleDateString('pt-BR');
    
    setOntemStr(displayDate);
    setOntemDate(yesterdayISO);

    try {
      const { data, error } = await supabase
        .from('fechamento_diario')
        .select('*')
        .eq('data_referencia', yesterdayISO)
        .eq('operacao', dbOperacao)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0 || data[0].status_fechamento !== 'Fechado') {
        // Calculate planejado
        const { data: campanhas, error: campError } = await supabase
          .from('campanhas_diarias')
          .select('orcamento')
          .eq('data_registro', yesterdayISO)
          .eq('operacao', dbOperacao);
          
        if (campError) throw campError;

        if (campanhas) {
          const total = campanhas.reduce((acc, curr) => acc + Number(curr.orcamento), 0);
          setOrcamentoPlanejado(total);
        }

        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } catch (error: any) {
      console.error('Erro ao verificar fechamento:', error.message);
    }
  };

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gasto) return toast.error('Informe o gasto real total.');
    
    setSubmitting(true);
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('fechamento_diario')
        .select('id')
        .eq('data_referencia', ontemDate)
        .eq('operacao', dbOperacao)
        .limit(1);

      if (fetchError) throw fetchError;

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from('fechamento_diario')
          .update({ gasto_trafego_total: Number(gasto), status_fechamento: 'Fechado' })
          .eq('id', existing[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fechamento_diario')
          .insert([{ data_referencia: ontemDate, gasto_trafego_total: Number(gasto), status_fechamento: 'Fechado', operacao: dbOperacao }]);
        if (error) throw error;
      }

      toast.success('Fechamento concluído!');
      setIsOpen(false);
    } catch (error: any) {
      toast.error('Erro ao confirmar fechamento: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Caixa Fechado</h2>
            <p className="text-gray-400 mt-2 leading-relaxed">
              Atenção! O caixa de ontem ({ontemStr}) não foi fechado.
            </p>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400 mb-1">Orçamento Planejado no Tráfego:</p>
          <p className="text-xl font-mono text-white">R$ {orcamentoPlanejado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <form onSubmit={handleConfirmar} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Insira o Gasto REAL total em tráfego (R$):
            </label>
            <input 
              required
              type="number"
              step="0.01"
              value={gasto}
              onChange={(e) => setGasto(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-center"
              placeholder="0.00"
            />
          </div>
          
          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Confirmando...' : 'Confirmar Fechamento'}
          </button>
        </form>
      </div>
    </div>
  );
}
