import React, { useState, useEffect, useCallback } from 'react';
import './StockPage.css'; // Mantém o mesmo arquivo de estilo

// --- Tipagens ---
interface StockItem {
  categoria: string;
  quantidade: number;
}

// --- URL da API ---
const API_URL = 'http://127.0.0.1:8000/api/v1/';

const StockPage: React.FC = () => {
  // --- Estados para dados da API ---
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);

  // --- Estados para os formulários ---
  const [addSelectedProduct, setAddSelectedProduct] = useState('');
  const [addQuantity, setAddQuantity] = useState('');

  const [updateSelectedProduct, setUpdateSelectedProduct] = useState('');
  const [updateQuantity, setUpdateQuantity] = useState('');

  // --- Estados de Feedback ---
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de loading para os botões
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Função para buscar o estoque atual (reutilizável) ---
  const fetchStock = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}estoque/estoque`);
      if (!response.ok) {
        throw new Error('Não foi possível recarregar os dados do estoque.');
      }
      const data = await response.json();
      setStockItems(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // --- Efeito para buscar dados iniciais ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [stockResponse, categoryResponse] = await Promise.all([
          fetch(`${API_URL}estoque/estoque`),
          fetch(`${API_URL}estoque/categorias_estoque/`)
        ]);

        if (!stockResponse.ok) throw new Error('Falha ao carregar o estoque.');
        if (!categoryResponse.ok) throw new Error('Falha ao carregar os tipos de produto.');
        
        const stockData = await stockResponse.json();
        const categoryData = await categoryResponse.json();

        setStockItems(stockData);
        setProductTypes(categoryData);
        
        if (categoryData.length > 0) {
            setAddSelectedProduct(categoryData[0]);
            setUpdateSelectedProduct(categoryData[0]);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // --- Limpa mensagens de feedback após um tempo ---
  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };
  
  // --- Função para Adicionar ao Estoque ---
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    try {
      const response = await fetch(`${API_URL}estoque/adicionar_ao_estoque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria: addSelectedProduct,
          quantidade: parseInt(addQuantity, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao adicionar item ao estoque.');
      }

      setSuccessMessage('Estoque adicionado com sucesso!');
      setAddQuantity(''); // Limpa o campo
      await fetchStock(); // Atualiza a lista de estoque

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Função para Atualizar Estoque ---
  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    try {
        const response = await fetch(`${API_URL}estoque/atualizar_estoque`, {
            method: 'POST', // ou 'PATCH', dependendo da sua API
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoria: updateSelectedProduct,
              quantidade: parseInt(updateQuantity, 10),
            }),
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao atualizar o estoque.');
          }
    
          setSuccessMessage('Estoque atualizado com sucesso!');
          setUpdateQuantity(''); // Limpa o campo
          await fetchStock(); // Atualiza a lista de estoque

    } catch (err: any) {
        setError(err.message)
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- Cálculo do Total ---
  const totalStock = stockItems.reduce((total, item) => total + item.quantidade, 0);

  if (loading) return <p>Carregando estoque...</p>;
  
  return (
    <div className="stock-page-container">
      {/* Mensagens de Feedback Globais para a página */}
      {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}
      {successMessage && <p className="success-message" style={{ marginBottom: '1rem' }}>{successMessage}</p>}

      {/* Seção 1: Adicionar ao Estoque */}
      <div className="stock-section">
        <h3 className="section-title">Adicionar ao Estoque</h3>
        <form onSubmit={handleAddStock} className="stock-form">
          <div>
            <label className="form-label">Tipo de Produto</label>
            <select value={addSelectedProduct} onChange={e => setAddSelectedProduct(e.target.value)} className="form-input" required disabled={isSubmitting}>
              {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Quantidade</label>
            <input type="number" value={addQuantity} onChange={e => setAddQuantity(e.target.value)} placeholder="Digite a quantidade" className="form-input" min="1" required disabled={isSubmitting}/>
          </div>
          <button type="submit" className="action-button" disabled={isSubmitting}>
            {isSubmitting ? 'Adicionando...' : 'Adicionar ao estoque'}
          </button>
        </form>
      </div>

      {/* Seção 2: Atualizar Estoque */}
      <div className="stock-section">
        <h3 className="section-title">Atualizar Estoque</h3>
        <form onSubmit={handleUpdateStock} className="stock-form">
          <div>
            <label className="form-label">Tipo de Produto</label>
            <select value={updateSelectedProduct} onChange={e => setUpdateSelectedProduct(e.target.value)} className="form-input" required disabled={isSubmitting}>
                {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Nova Quantidade</label>
            <input type="number" value={updateQuantity} onChange={e => setUpdateQuantity(e.target.value)} placeholder="Digite a quantidade" className="form-input" min="0" required disabled={isSubmitting}/>
          </div>
          <button type="submit" className="action-button" disabled={isSubmitting}>
            {isSubmitting ? 'Atualizando...' : 'Atualizar Estoque'}
          </button>
        </form>
      </div>

      {/* Seção 3: Estoque Atual */}
      <div className="stock-section">
        <h3 className="section-title">Estoque Atual</h3>
        <div className="stock-list">
          {stockItems.map(item => (
            <div key={item.categoria} className="stock-item">
              <div className="stock-item-info">
                <span className="stock-item-name">{item.categoria}</span>
                <span className="stock-item-type">Tipo de Produto</span>
              </div>
              <div className="stock-item-quantity">
                {item.quantidade} <span>unidades</span>
              </div>
            </div>
          ))}
        </div>
        <div className="total-stock-row">
            <span className="total-stock-label">Total Geral</span>
            <span className="total-stock-value">{totalStock} unidades</span>
        </div>
      </div>
    </div>
  );
};

export default StockPage;