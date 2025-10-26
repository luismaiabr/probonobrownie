import React, { useState, useEffect, useCallback } from 'react';
import './BillingPage.css';

// --- TypeScript Interfaces (sem alterações) ---

interface StatusSummary {
  quantidade: number;
  valor_total: number;
}

interface NonPaidBill {
  id: number;
  created_at: string | null;
  status_pagamento: boolean;
  cliente: string;
  vencimento: string; // ISO date string
  data_venda: string; // ISO date string
  valor: number;
}

interface FinancialSummaryResponse {
  pendentes: StatusSummary;
  vencidas: StatusSummary;
  total_a_receber: number;
  cobrancas_nao_pagas: NonPaidBill[];
}

// --- Funções Auxiliares (sem alterações) ---

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// --- O Componente Principal (com atualizações) ---

const BillingPage: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // URLs da API separadas para clareza
  const API_GET_URL = 'http://127.0.0.1:8000/api/v1/cobranca/pendentes';
  const API_POST_URL = 'http://127.0.0.1:8000/api/v1/cobranca/pagar_cobranca'; // <-- ROTA ATUALIZADA

  const fetchBillings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_GET_URL);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados de cobrança.');
      }
      const data: FinancialSummaryResponse = await response.json();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_GET_URL]);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const handleMarkAsPaid = async (bill: NonPaidBill) => {
    const paymentData = {
      cliente: bill.cliente,
      vencimento: new Date(bill.vencimento).toISOString().split('T')[0],
      valor: bill.valor,
    };

    try {
      // ✅ ATUALIZAÇÃO: Usando a nova URL para o POST
      const response = await fetch(API_POST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Falha ao marcar cobrança como paga.');
      }
      
      fetchBillings(); 

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocorreu um erro ao processar o pagamento.');
      console.error(err);
    }
  };

  const filteredBills = summary?.cobrancas_nao_pagas.filter(bill =>
    bill.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="billing-page-container">
      <div className="billing-header">
        <h1 className="billing-title">Controle de Cobranças</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="summary-container">
        {/* ... Seção de cards de resumo (sem alterações) ... */}
        <div className="summary-card">
          <span className="summary-card-title">Pendentes</span>
          <span className="summary-card-value">{formatCurrency(summary?.pendentes.valor_total ?? 0)}</span>
          <span className="summary-card-count">{summary?.pendentes.quantidade ?? 0} cobranças</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-title">Vencidas</span>
          <span className="summary-card-value overdue">{formatCurrency(summary?.vencidas.valor_total ?? 0)}</span>
           <span className="summary-card-count">{summary?.vencidas.quantidade ?? 0} cobranças</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-title">Total a Receber</span>
          <span className="summary-card-value total">{formatCurrency(summary?.total_a_receber ?? 0)}</span>
          <span className="summary-card-count">{((summary?.pendentes.quantidade ?? 0) + (summary?.vencidas.quantidade ?? 0))} cobranças</span>
        </div>
      </div>

      <div className="active-billings-container">
        <h2 className="active-billings-title">Cobranças Ativas</h2>
        {/* ✅ ATUALIZAÇÃO: Wrapper para a lista com scroll */}
        <div className="billing-list-wrapper">
          {filteredBills && filteredBills.length > 0 ? (
              filteredBills.map((bill) => {
                  const isOverdue = new Date(bill.vencimento) < new Date();
                  return (
                    <div key={bill.id} className="billing-item">
                        <div className="billing-item-info">
                            <span className="billing-item-client">{bill.cliente}</span>
                            <span className="billing-item-due-date">Vencimento: {formatDate(bill.vencimento)}</span>
                        </div>
                        <div className="billing-item-details">
                            <span className="billing-item-value">{formatCurrency(bill.valor)}</span>
                            <span className={`billing-status ${isOverdue ? 'status-overdue' : 'status-pending'}`}>
                                {isOverdue ? 'Vencido' : 'Pendente'}
                            </span>
                            <button 
                                className="pay-button"
                                onClick={() => handleMarkAsPaid(bill)}
                            >
                                Marcar como Pago
                            </button>
                        </div>
                    </div>
                  )
              })
          ) : (
              <p className="no-bills-message">Nenhuma cobrança ativa encontrada.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;