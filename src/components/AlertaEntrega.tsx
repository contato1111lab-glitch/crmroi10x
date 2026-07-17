import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Check, X } from 'lucide-react';
import { toast } from '../lib/toast';

interface LeadPendente {
  id: string;
  nome_cliente: string;
}

export default function AlertaEntrega() {
  const [leadsPendentes, setLeadsPendentes] = useState<LeadPendente[]>([]);

  useEffect(() => {
    fetchPendentes();
  }, []);

  const fetchPendentes = async () => {
    try {
      const getLocalDateString = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
      };
      const today = getLocalDateString();
      const { data, error } = await supabase
        .from('leads_crm')
        .select('id, nome_cliente')
        .eq('fase_funil', 'Agendado')
        .lte('data_prevista_entrega', today);

      if (error) throw error;
      if (data) {
        setLeadsPendentes(data);
      }
    } catch (error: any) {
      toast.error('Erro ao buscar alertas de entrega: ' + error.message);
    }
  };

  const handleAction = async (id: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads_crm')
        .update({ fase_funil: novoStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Status atualizado com sucesso!');
      setLeadsPendentes(prev => prev.filter(l => l.id !== id));
      fetchPendentes();
    } catch (error: any) {
      toast.error('Erro ao atualizar status do alerta: ' + error.message);
    }
  };

  if (leadsPendentes.length === 0) return null;

  return (
    <div className="flex flex-col space-y-2 mb-6">
      {leadsPendentes.map(lead => (
        <div key={lead.id} className="bg-yellow-500 text-yellow-950 px-4 py-3 rounded-lg shadow-lg flex items-center justify-between font-medium">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 animate-bounce" />
            <span>
              <strong>ALERTA DE ENTREGA PENDENTE:</strong> O pedido de <strong>{lead.nome_cliente}</strong> chegou?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleAction(lead.id, 'Pagou')}
              className="flex items-center gap-1.5 bg-yellow-950 text-yellow-400 hover:bg-yellow-900 px-3 py-1.5 rounded-md text-sm transition-colors"
            >
              <Check className="w-4 h-4" /> Pagou
            </button>
            <button 
              onClick={() => handleAction(lead.id, 'Blacklist / Sumiu')}
              className="flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-md text-sm transition-colors"
            >
              <X className="w-4 h-4" /> Não Pagou
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
