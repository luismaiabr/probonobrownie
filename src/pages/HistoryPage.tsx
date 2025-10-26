import React, { useState, useEffect, useMemo } from 'react';
import './HistoryPage.css';

// Interface da API (sem mudanças)
interface CobrancaPagaResponse {
  cliente: string;
  vencimento: string;
  valor: number;
  status: string;
}

const API_URL = "http://127.0.0.1:8000/api/v1/cobranca/cobrancas_pagas";
const ITEMS_PER_PAGE = 8; // Quantos itens queremos mostrar por página

// Função utilitária (sem mudanças)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const HistoryPage: React.FC = () => {
  // Estado para a lista COMPLETA de cobranças
  const [allCobrancas, setAllCobrancas] = useState<CobrancaPagaResponse[]>([]);
  
  // Novo estado para controlar a página atual
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Estados de loading e erro (sem mudanças)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Hook de busca de dados (sem mudanças na lógica de fetch)
  useEffect(() => {
    const fetchCobrancasPagas = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        const data: CobrancaPagaResponse[] = await response.json();
        setAllCobrancas(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Ocorreu um erro desconhecido.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCobrancasPagas();
  }, []);

  // --- LÓGICA DA PAGINAÇÃO ---

  // 1. Calcula o total de páginas
  const totalPages = Math.ceil(allCobrancas.length / ITEMS_PER_PAGE);

  // 2. Calcula quais itens devem ser exibidos na página atual
  //    Usamos useMemo para evitar recalcular isso em cada renderização
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    // O slice() extrai a fatia correta do array
    return allCobrancas.slice(startIndex, endIndex);
  }, [allCobrancas, currentPage]);

  // 3. Funções para mudar de página
  const handleNextPage = () => {
    // Só avança se não estiver na última página
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    // Só retorna se não estiver na primeira página
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  // --- RENDERIZAÇÃO ---

  if (loading) {
    return <div>Carregando histórico...</div>;
  }

  if (error) {
    return <div className="history-error">Erro ao carregar dados: {error}</div>;
  }

  return (
    <div className="history-page-container">
      <h2 className="history-title">Histórico de Cobranças Pagas</h2>

      {allCobrancas.length === 0 ? (
        <p>Nenhuma cobrança paga encontrada.</p>
      ) : (
        <>
          {/* A lista agora renderiza 'currentItems', não 'allCobrancas' */}
          <div className="history-list">
            {currentItems.map((cobranca, index) => (
              <div 
                className="history-item" 
                key={`${cobranca.cliente}-${cobranca.vencimento}-${index}`}
              >
                <div className="item-column-left">
                  <span className="item-cliente">{cobranca.cliente}</span>
                  <span className="item-meta item-status">
                    Status: {cobranca.status}
                  </span>
                </div>
                <div className="item-column-right">
                  <span className="item-valor">
                    {formatCurrency(cobranca.valor)}
                  </span>
                  <span className="item-meta item-vencimento">
                    Vencimento: {cobranca.vencimento}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Controles da Paginação */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                className="pagination-button"
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              <button 
                className="pagination-button"
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
              >
                Próximo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPage;