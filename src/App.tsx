import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/Layout';
import POS from './pages/POS/POS';
import Stock from './pages/Stock/Stock';
import SalesHistory from './pages/SalesHistory/SalesHistory';
import Returns from './pages/Returns/Returns';

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/history" element={<SalesHistory />} />
          <Route path="/returns" element={<Returns />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;
