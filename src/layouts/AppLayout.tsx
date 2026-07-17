import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import FechamentoModal from '../components/FechamentoModal';
import AlertaEntrega from '../components/AlertaEntrega';
import Toaster from '../components/Toaster';
import { useOperacao } from '../context/OperacaoContext';

export default function AppLayout() {
  const { operacao, setOperacao } = useOperacao();

  return (
    <div className="flex min-h-screen bg-[#121212] text-gray-200 font-sans">
      <Toaster />
      <FechamentoModal />
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Global Header */}
        <header className="h-16 border-b border-gray-800 bg-[#0A0A0A] flex items-center justify-end px-8 shrink-0">
          <div className="flex items-center gap-2 bg-[#111] p-1 rounded-lg border border-gray-800 shadow-inner">
            <span className="text-xs font-semibold text-gray-500 uppercase px-3">Operação Atual:</span>
            <button
              onClick={() => setOperacao('NUTRA')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                operacao === 'NUTRA' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              NUTRA
            </button>
            <button
              onClick={() => setOperacao('INFO')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                operacao === 'INFO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm' : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              INFO
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <AlertaEntrega />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
