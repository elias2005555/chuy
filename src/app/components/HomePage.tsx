import { useNavigate } from 'react-router';
import { ShoppingCart, ChefHat, Activity } from 'lucide-react';
import { useOrders } from './OrderContext';
import { useState } from 'react';
import logoImg from '../../imports/image-1.png';

export default function HomePage() {
  const navigate = useNavigate();
  const { connected, orders } = useOrders();
  const [taps, setTaps] = useState(0);

  const tap = () => {
    const n = taps + 1;
    setTaps(n);
    if (n >= 5) { navigate('/admin'); setTaps(0); return; }
    setTimeout(() => setTaps(0), 3000);
  };

  const ready  = orders.filter(o => o.status === 'ready').length;
  const active = orders.filter(o => o.status !== 'delivered').length;

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0D0D0D',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: '-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', backgroundColor: 'rgba(255,107,53,0.07)', pointerEvents: 'none' }}/>

      {/* Logo grande premium */}
      <div onClick={tap} style={{ marginBottom: 22, cursor: 'pointer', userSelect: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Golden gradient border */}
        <div style={{
          padding: 4, borderRadius: 34,
          background: 'linear-gradient(135deg, #FF6B35 0%, #FFB347 40%, #FF9A00 70%, #FF6B35 100%)',
          boxShadow: '0 0 90px rgba(255,107,53,0.45), 0 0 40px rgba(255,107,53,0.2), 0 28px 56px rgba(0,0,0,0.8)',
        }}>
          <div style={{ width: 220, height: 220, borderRadius: 31, overflow: 'hidden', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={logoImg}
              alt="Don de Chuy"
              style={{ width: '88%', height: '88%', objectFit: 'contain' }}
            />
          </div>
        </div>
        {/* Tap hint dots */}
        <div style={{ marginTop: 10, display: 'flex', gap: 5 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: i < taps ? '#FF6B35' : 'rgba(255,107,53,0.2)', transition: 'background-color 0.2s' }}/>
          ))}
        </div>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', marginBottom: 4, textAlign: 'center', letterSpacing: -0.5 }}>
        Don de Chuy
      </h1>
      <p style={{ fontSize: 13, color: '#555', fontWeight: 500, marginBottom: 24, textAlign: 'center' }}>
        Sistema de punto de venta
      </p>

      {/* Connection status */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 18px', borderRadius: 100,
          backgroundColor: connected ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: connected ? '#22C55E' : '#EF4444' }}/>
          <span style={{ fontSize: 13, fontWeight: 600, color: connected ? '#22C55E' : '#EF4444' }}>
            {connected ? 'Conectado' : 'Conectando...'}
          </span>
        </div>
      </div>

      {/* Main buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%', maxWidth: 380, marginBottom: 16 }}>
        <button onClick={() => navigate('/pos')} style={{
          backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '28px 16px', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          WebkitAppearance: 'none',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,107,53,0.15)',
            border: '1px solid rgba(255,107,53,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShoppingCart style={{ width: 28, height: 28, color: '#FF6B35' }}/>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 900, fontSize: 16, color: '#FFFFFF', lineHeight: 1 }}>VENTANA</p>
            <p style={{ fontSize: 11, color: '#555', fontWeight: 500, marginTop: 4 }}>Punto de venta</p>
          </div>
        </button>

        <button onClick={() => navigate('/kitchen')} style={{
          backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '28px 16px', cursor: 'pointer',
          position: 'relative',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          WebkitAppearance: 'none',
        }}>
          {ready > 0 && (
            <div style={{
              position: 'absolute', top: -8, right: -8,
              width: 26, height: 26, borderRadius: '50%',
              backgroundColor: '#22C55E', border: '2px solid #0D0D0D',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFF', fontWeight: 900, fontSize: 12,
            }}>{ready}</div>
          )}
          <div style={{
            width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChefHat style={{ width: 28, height: 28, color: '#FBBF24' }}/>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 900, fontSize: 16, color: '#FFFFFF', lineHeight: 1 }}>COCINA</p>
            <p style={{ fontSize: 11, color: '#555', fontWeight: 500, marginTop: 4 }}>Display KDS</p>
          </div>
        </button>
      </div>

      {active > 0 && (
        <button onClick={() => navigate('/pos')} style={{
          width: '100%', maxWidth: 380,
          backgroundColor: '#1A1A1A', border: '1px solid rgba(255,107,53,0.25)',
          borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          WebkitAppearance: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,107,53,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity style={{ width: 16, height: 16, color: '#FF6B35' }}/>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#FFFFFF' }}>{active} pedido{active !== 1 ? 's' : ''} activo{active !== 1 ? 's' : ''}</p>
              <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Tocar para gestionar</p>
            </div>
          </div>
          <span style={{ color: '#FF6B35', fontSize: 22 }}>›</span>
        </button>
      )}

      <p style={{ marginTop: 36, fontSize: 11, color: '#2A2A2A', fontWeight: 500 }}>
        Don de Chuy POS · v2025
      </p>
    </div>
  );
}
