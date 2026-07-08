import '../polyfills';
import { HashRouter, Routes, Route } from 'react-router';
import { Component, ReactNode } from 'react';
import AdminDashboard from './components/AdminDashboard';
import POSTerminal from './components/POSTerminal';
import KitchenDisplay from './components/KitchenDisplay';
import HomePage from './components/HomePage';
import { OrderProvider } from './components/OrderContext';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fff1f2', minHeight: '100vh' }}>
          <h2 style={{ color: '#b91c1c', marginBottom: 12 }}>Error de renderizado</h2>
          <pre style={{ fontSize: 13, color: '#7f1d1d', whiteSpace: 'pre-wrap' }}>{err.message}</pre>
          <pre style={{ fontSize: 11, color: '#aaa', marginTop: 8, whiteSpace: 'pre-wrap' }}>{err.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <OrderProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/pos" element={<POSTerminal />} />
            <Route path="/kitchen" element={<KitchenDisplay />} />
          </Routes>
        </HashRouter>
      </OrderProvider>
    </ErrorBoundary>
  );
}
