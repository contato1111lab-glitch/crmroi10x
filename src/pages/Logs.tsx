import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ScrollText, ShieldAlert, Clock, Database, User } from 'lucide-react';

interface LogEntry {
  id: string;
  data_hora: string;
  acao: string;
  tabela_afetada: string;
  registro_id: string;
  usuario_responsavel: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('log_auditoria')
      .select('*')
      .order('data_hora', { ascending: false })
      .limit(100); // Trazendo os últimos 100 para não pesar a tela
    
    if (error) {
      console.error('Erro ao buscar logs:', error);
    } else {
      setLogs(data || []);
    }
    
    setLoading(false);
  };

  const getActionColor = (acao: string) => {
    if (acao === 'DELETE') return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (acao === 'UPDATE') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    if (acao === 'INSERT') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="border-b border-gray-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ScrollText className="w-8 h-8 text-red-500" />
            Sistema X9 - Logs de Auditoria
          </h1>
          <p className="text-gray-400 mt-2">Monitoramento contínuo. Todas as ações do banco de dados são rastreadas.</p>
        </div>
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg font-medium text-sm">
          <ShieldAlert className="w-4 h-4" />
          <span>Monitoramento Ativo</span>
        </div>
      </header>

      <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0A0A] text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Data / Hora</th>
                <th className="px-6 py-4 font-medium">Ação (Trigger)</th>
                <th className="px-6 py-4 font-medium">Tabela Afetada</th>
                <th className="px-6 py-4 font-medium">Usuário Responsável</th>
                <th className="px-6 py-4 font-medium text-right">Registro ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Buscando rastros no banco de dados...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Nenhum log registrado ainda. O sistema X9 está de olho.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span>{new Date(log.data_hora).toLocaleString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getActionColor(log.acao)}`}>
                        {log.acao}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Database className="w-3.5 h-3.5 text-gray-500" />
                        <span className="font-mono text-xs">{log.tabela_afetada}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        <span>{log.usuario_responsavel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-xs text-gray-600 bg-gray-900 px-2 py-1 rounded select-all" title={log.registro_id}>
                        {log.registro_id ? `${log.registro_id.substring(0, 8)}...` : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
