import React, { useState, useEffect } from 'react';
import '../pages/SellPage.css';

// --- Tipagens para os dados da API ---
interface Client {
  id: number;
  name: string;
  status: boolean;
}

interface VendaPayload {
  data_venda: string;
  status_pagamento: boolean;
  cliente: string;
  categoria_produto: string;
  qtd_unidades: number;
  data_vencimento: string;
  valor_unitario: number | null;
  valor_total: number;
}

const SellPage: React.FC = () => {
  // --- Estados para os dados dos selects ---
  const [clients, setClients] = useState<Client[]>([]);
  const [brownieTypes, setBrownieTypes] = useState<string[]>([]);

  // --- Estados para os campos do formulário ---
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedBrownie, setSelectedBrownie] = useState<string>('');
  const [units, setUnits] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [deadlineDays, setDeadlineDays] = useState<number>(7);
  const [status, setStatus] = useState<'A receber' | 'Pago'>('A receber');
  
  // --- Estado para o valor calculado ---
  const [totalValue, setTotalValue] = useState<number>(0);
  
  // --- Estados para feedback e controle de submissão ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // URL base da API
  const API_URL ='http://127.0.0.1:8000/api/v1/';

  // --- Efeito para buscar dados iniciais (clientes e tipos de brownie) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientResponse = await fetch(`${API_URL}clientes/listar_clientes`);
        if (!clientResponse.ok) throw new Error('Falha ao buscar clientes.');
        const clientData = await clientResponse.json();
        setClients(clientData);

        const categoryResponse = await fetch(`${API_URL}estoque/categorias_estoque`);
        if (!categoryResponse.ok) throw new Error('Falha ao buscar tipos de brownie.');
        const categoryData = await categoryResponse.json();
        setBrownieTypes(categoryData);

      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
  }, [API_URL]);

  // --- Efeito para calcular o valor total sempre que unidades ou valor unitário mudarem ---
  useEffect(() => {
    const calculatedTotal = (units || 0) * (unitPrice || 0);
    setTotalValue(calculatedTotal);
  }, [units, unitPrice]);

  // --- NOVO EFEITO: Buscar o preço unitário quando o tipo de brownie é selecionado ---
  useEffect(() => {
    // Se nenhum brownie foi selecionado, não faz nada e limpa o preço.
    if (!selectedBrownie) {
      setUnitPrice(null);
      return;
    }

    const fetchUnitPrice = async () => {
      try {
        const response = await fetch(`${API_URL}estoque/preco_unitario`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ categoria: selectedBrownie }),
        });

        if (!response.ok) {
          // Se a API retornar um erro (ex: 404 Categoria não encontrada), exibe a mensagem.
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Preço para esta categoria não encontrado.');
        }

        const price = await response.json(); // A API retorna o preço como um float
        setUnitPrice(price);
        setError(null); // Limpa erros anteriores se a busca for bem-sucedida

      } catch (err: any) {
        setError(err.message);
        setUnitPrice(null); // Limpa o preço em caso de erro
      }
    };

    fetchUnitPrice();
    
  }, [selectedBrownie, API_URL]); // Dependências: Roda quando selectedBrownie ou API_URL mudam
  // --- FIM DO NOVO EFEITO ---


  // --- Função para lidar com a submissão do formulário ---
  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!selectedClient || !selectedBrownie || units <= 0 || unitPrice === null || unitPrice <= 0) {
      setError('Por favor, preencha todos os campos obrigatórios, incluindo um valor unitário válido.');
      setIsLoading(false);
      return;
    }

    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(now.getDate() + deadlineDays);

    const salePayload: VendaPayload = {
      cliente: selectedClient,
      categoria_produto: selectedBrownie,
      qtd_unidades: units,
      valor_unitario: unitPrice,
      valor_total: totalValue,
      status_pagamento: status === 'Pago',
      data_venda: now.toISOString(),
      data_vencimento: expirationDate.toISOString(),
    };

    try {
      const response = await fetch(`${API_URL}vendas/vender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ocorreu um erro ao registrar a venda.');
      }

      setSuccessMessage('Venda registrada com sucesso!');
      setSelectedClient('');
      setSelectedBrownie('');
      setUnits(0);
      setUnitPrice(null);
      setDeadlineDays(7);
      setStatus('A receber');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="sell-page-container">
      <h2 className="sell-page-title">
        <span>+</span> Nova Venda
      </h2>

      <form onSubmit={handleRegisterSale} className="sell-form">
        <div className="form-grid">
          {/* Cliente */}
          <div>
            <label htmlFor="cliente" className="form-label">Cliente</label>
            <select id="cliente" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="form-input" required>
              <option value="" disabled>Selecione o cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.name}>{client.name}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Brownie */}
          <div>
            <label htmlFor="brownie-type" className="form-label">Tipo de Brownie</label>
            <select 
              id="brownie-type" 
              value={selectedBrownie} 
              onChange={(e) => setSelectedBrownie(e.target.value)} // Este onChange dispara o novo useEffect
              className="form-input" 
              required
            >
              <option value="" disabled>Selecione o tipo de brownie</option>
              {brownieTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Unidades */}
          <div>
            <label htmlFor="unidades" className="form-label">Unidades</label>
            <input 
              type="number" 
              id="unidades" 
              value={units}
              onChange={(e) => setUnits(parseInt(e.target.value, 10) || 0)}
              className="form-input"
              min="0"
              required
            />
          </div>

          {/* Valor Unitário */}
          <div>
            <label htmlFor="valor-unitario" className="form-label">Valor Unitário (R$)</label>
            <input 
              type="number" 
              id="valor-unitario" 
              value={unitPrice ?? ''} // Exibe o valor do estado
              onChange={(e) => setUnitPrice(e.target.value ? parseFloat(e.target.value) : null)} // Permite edição manual
              className="form-input"
              placeholder="Automático" // Alterado para indicar que é preenchido
              step="0.01"
              min="0"
            />
          </div>

          {/* Prazo */}
          <div>
            <label htmlFor="prazo" className="form-label">Prazo (dias)</label>
            <select 
              id="prazo" 
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(parseInt(e.target.value, 10) || 0)}
              className="form-input"
              required
            >
                <option value="7">7 dias</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="form-label">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'A receber' | 'Pago')} className="form-input">
              <option value="A receber">A receber</option>
              <option value="Pago">Pago</option>
            </select>
          </div>
        </div>
        
        <div className="total-value-section">
          <p className="total-value-label">Valor Total</p>
          <p className="total-value-amount">
            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? 'Registrando...' : '+ Registrar Venda'}
        </button>
      </form>
    </div>
  );
};

export default SellPage;
