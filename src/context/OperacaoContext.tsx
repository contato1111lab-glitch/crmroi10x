import React, { createContext, useContext, useState, ReactNode } from 'react';

type OperacaoType = 'NUTRA' | 'INFO';

interface OperacaoContextType {
  operacao: OperacaoType;
  setOperacao: (op: OperacaoType) => void;
}

const OperacaoContext = createContext<OperacaoContextType | undefined>(undefined);

export function OperacaoProvider({ children }: { children: ReactNode }) {
  const [operacao, setOperacao] = useState<OperacaoType>('NUTRA');

  return (
    <OperacaoContext.Provider value={{ operacao, setOperacao }}>
      {children}
    </OperacaoContext.Provider>
  );
}

export function useOperacao() {
  const context = useContext(OperacaoContext);
  if (!context) throw new Error('useOperacao must be used within an OperacaoProvider');
  return context;
}
