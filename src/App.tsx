import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Work from './components/Work';
import Health from './components/Health';
import Books from './components/Books';
import Journal from './components/Journal';
import InvestmentPage from './components/Investment';
import SchedulePage from './components/Schedule';
import GoalsPage from './components/Goals';
import LoginGate from './components/LoginGate';
import './index.css';

const SITE_PASSWORD = 'hayat2026';


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'work':
        return <Work />;
      case 'health':
        return <Health />;
      case 'books':
        return <Books />;
      case 'journal':
        return <Journal />;
      case 'investment':
        return <InvestmentPage />;
      case 'schedule':
        return <SchedulePage />;
      case 'goals':
        return <GoalsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <LoginGate password={SITE_PASSWORD}>
      <AppProvider>
        <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
          {renderPage()}
        </Layout>
      </AppProvider>
    </LoginGate>
  );
};

export default App;
