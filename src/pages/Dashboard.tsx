import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, TrendingUp, TrendingDown, Activity, BarChart3, Radio } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  
  // Totals
  const [fatPendente, setFatPendente] = useState(0);
  const [fatRealizado, setFatRealizado] = useState(0);
  const [gastoTrafego, setGastoTrafego] = useState(0);
  
  // Traffic
  const [campanhasAtivasCount, setCampanhasAtivasCount] = useState(0);
  const [orcamentoAtivoHoje, setOrcamentoAtivoHoje] = useState(0);

  // Chart Data
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const getBrazilDateString = (dateObj: Date = new Date()) => {
      const d = new Date(dateObj.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const today = getBrazilDateString();

    try {
      // 1. Fetch Traffic Today
      const { data: campanhasData } = await supabase
        .from('campanhas_diarias')
        .select('*')
        .eq('data_registro', today)
        .eq('status', 'Ativa');
        
      if (campanhasData) {
        setCampanhasAtivasCount(campanhasData.length);
        const orcamentoTotal = campanhasData.reduce((acc, curr) => acc + Number(curr.orcamento), 0);
        setOrcamentoAtivoHoje(Math.round(orcamentoTotal * 100) / 100);
      }

      // 2. Fetch Leads joined with Produtos
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_crm')
        .select(`
          fase_funil,
          data_entrada,
          produtos (
            faturamento_bruto_operacao
          )
        `);

      if (leadsError) throw leadsError;

      // 3. Fetch Fechamento Diario (Gastos em tráfego)
      const { data: fechamentoData, error: fechamentoError } = await supabase
        .from('fechamento_diario')
        .select('*');

      if (fechamentoError) throw fechamentoError;

      let tempPendente = 0;
      let tempRealizado = 0;
      let tempGasto = 0;

      const dailyProfit: Record<string, number> = {};
      const dailyInvest: Record<string, number> = {};

      // Process Leads
      leadsData?.forEach((lead: any) => {
        const fat = Number(lead.produtos?.faturamento_bruto_operacao || 0);
        
        if (lead.fase_funil === 'Agendado') {
          tempPendente += fat;
        } else if (lead.fase_funil === 'Pagou' || lead.fase_funil === 'Concluido') {
          tempRealizado += fat;
          // Agrupar por data para o gráfico (convertendo data_entrada para o fuso do Brasil)
          const dateObj = new Date(lead.data_entrada);
          const dateStr = getBrazilDateString(dateObj);
          dailyProfit[dateStr] = (dailyProfit[dateStr] || 0) + fat;
        }
      });

      // Process Fechamentos
      fechamentoData?.forEach((fechamento: any) => {
        const gasto = Number(fechamento.gasto_trafego_total || 0);
        tempGasto += gasto;
        
        const dateStr = fechamento.data_referencia;
        dailyInvest[dateStr] = (dailyInvest[dateStr] || 0) + gasto;
      });

      setFatPendente(Math.round(tempPendente * 100) / 100);
      setFatRealizado(Math.round(tempRealizado * 100) / 100);
      setGastoTrafego(Math.round(tempGasto * 100) / 100);

      // Mount Chart Data
      const allDates = Array.from(new Set([...Object.keys(dailyProfit), ...Object.keys(dailyInvest)])).sort();
      
      const formattedChartData = allDates.map(date => {
        const investimento = Math.round((dailyInvest[date] || 0) * 100) / 100;
        const realizado = Math.round((dailyProfit[date] || 0) * 100) / 100;
        const lucro = Math.round((realizado - investimento) * 100) / 100;
        
        // Format Date to DD/MM
        const [yyyy, mm, dd] = date.split('-');
        
        return {
          date: `${dd}/${mm}`,
          'Investimento': investimento,
          'Faturamento': realizado,
          'Lucro Líquido': lucro
        };
      });

      setChartData(formattedChartData);
    } catch (error: any) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const lucroLiquido = Math.round((fatRealizado - gastoTrafego) * 100) / 100;
  const isProfit = lucroLiquido >= 0;
  
  // Safe ROI Calculation
  const roiValue = gastoTrafego > 0 ? (lucroLiquido / gastoTrafego) * 100 : (fatRealizado > 0 ? 100 : 0);
  const roiStr = Math.round(roiValue).toString();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh]">
        <div className="text-gray-500 animate-pulse flex items-center gap-2">
          <Activity className="w-5 h-5" /> Calculando métricas da operação...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          Visão Geral da Operação
        </h1>
        <p className="text-gray-400 mt-2">Matemática financeira, faturamento e ROI em tempo real.</p>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Tráfego Ativo Hoje */}
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Tráfego Rodando (Hoje)</h3>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Radio className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Orçamento Ativo</p>
            <p className="text-3xl font-bold text-white">R$ {orcamentoAtivoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800/50 space-y-1">
            <p className="text-xs text-blue-400/80 uppercase font-semibold tracking-wider">Campanhas On</p>
            <p className="text-lg font-medium text-blue-400">{campanhasAtivasCount} campanhas</p>
          </div>
        </div>

        {/* Card 2: Faturamento Operação */}
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Faturamento da Operação</h3>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Realizado (Pago)</p>
            <p className="text-3xl font-bold text-white">R$ {fatRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800/50 space-y-1">
            <p className="text-xs text-yellow-500/80 uppercase font-semibold tracking-wider">Pendente (Agendado)</p>
            <p className="text-lg font-medium text-yellow-400">R$ {fatPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Card 3: Lucro Líquido */}
        <div className={`bg-[#111] border rounded-2xl p-6 shadow-lg relative overflow-hidden transition-colors ${isProfit ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          <div className={`absolute inset-0 opacity-5 ${isProfit ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-medium font-bold">Lucro Líquido Realizado</h3>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isProfit ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <TrendingUp className={`w-5 h-5 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Livre no Bolso</p>
              <p className={`text-4xl font-black tracking-tight ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800/50 flex justify-between items-center">
              <p className="text-xs text-gray-400">Faturamento Realizado (-) Gasto Total</p>
              <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                ROI: {roiStr}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-6">Investimento vs Faturamento por Dia</h3>
        
        {chartData.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
            Ainda não há dados financeiros suficientes para o gráfico.
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888" 
                  tick={{fill: '#888'}} 
                  axisLine={{stroke: '#444'}}
                />
                <YAxis 
                  stroke="#888" 
                  tick={{fill: '#888'}} 
                  axisLine={{stroke: '#444'}}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  cursor={{fill: '#222'}}
                  contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <ReferenceLine y={0} stroke="#555" />
                <Bar dataKey="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Investimento" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro Líquido" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
