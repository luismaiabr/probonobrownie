import React, { useState } from 'react';
import './DashboardLayout.css'; // <-- ADICIONE A IMPORTAÇÃO DO CSS

// --- Tipagens e Importações dos Subcomponentes ---
type TabName = 'Vender' | 'Histórico' | 'Estoque' | 'Cobranças';
import SellPage from '../../pages/SellPage';
import StockPage from '../../pages/StockPage';
import BillingPage from '../../pages/BillingPage';
import HistoryPage from '../../pages/HistoryPage';




// --- Componente de Botão da Guia (Refatorado) ---
interface TabButtonProps {
  label: TabName;
  isActive: boolean;
  onClick: (tab: TabName) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  // A lógica de classes agora é mais simples e direta
  const buttonClassName = `tab-button ${isActive ? 'active' : ''}`;

  return (
    <button
      className={buttonClassName}
      onClick={() => onClick(label)}
    >
      {/* Futuramente, adicione um ícone aqui se desejar */}
      <span>{label}</span>
    </button>
  );
};


// --- Componente de Layout Principal (Refatorado) ---
const DashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('Vender');

  const renderContent = () => {
    switch (activeTab) {
      case 'Vender':
        return <SellPage />;
      case 'Histórico':
        return <HistoryPage />;
      case 'Estoque':
        return <StockPage />;
      case 'Cobranças':
        return <BillingPage />;
      default:
        return <SellPage />;
    }
  };

  const tabs: TabName[] = ['Vender', 'Histórico', 'Estoque', 'Cobranças'];

  return (
    <div className="dashboard-layout">
      {/* 1. Cabeçalho (Topo da Tela) */}
      <header className="dashboard-header">
        <div className="header-title-section">
          <span className="header-main-title">Sistema de Gestão</span>
          <span className="header-subtitle">Brownies no Atacado</span>
        </div>
        <div className="header-stock-section">
          <span className="stock-label"></span>
          <span className="stock-value"></span>
        </div>
      </header>

      {/* 2. Barra de Navegação (Tabs) */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          {tabs.map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onClick={setActiveTab}
            />
          ))}
        </div>
      </nav>

      {/* 3. Área de Conteúdo */}
      <main className="dashboard-main">
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;