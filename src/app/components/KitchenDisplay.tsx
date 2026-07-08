import { useOrders } from './OrderContext';
import { Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useEffect, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router';

const USER_COLORS: Record<string, string> = {
  'Quedadito1': '#3B82F6',
  'Quedadito2': '#8B5CF6',
  'WASHO':      '#F97316',
  'WATA':       '#22C55E',
  'elias':      '#EF4444',
  'tias':       '#EC4899',
};
function userColor(u: string) { return USER_COLORS[u] || '#F97316'; }

const ItemRow = memo(({ name, qty, category, done, onToggle }: {
  name: string; qty: number; category: string; done: boolean; onToggle: () => void;
}) => (
  <button onClick={onToggle} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', borderRadius: 10, textAlign: 'left',
    cursor: 'pointer', WebkitAppearance: 'none', minHeight: 50,
    backgroundColor: done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${done ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
    transition: 'all 0.15s',
  }}>
    <div style={{
      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
      backgroundColor: done ? '#22C55E' : 'transparent',
      border: `2px solid ${done ? '#22C55E' : 'rgba(255,255,255,0.2)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {done && <span style={{ color: '#FFF', fontSize: 12, fontWeight: 900 }}>✓</span>}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontWeight: 700, fontSize: 15, color: done ? '#555' : '#EAEAEA', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.2 }}>
        {name}
      </p>
      <p style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{category}</p>
    </div>
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 15, fontWeight: 900, color: '#EAEAEA',
    }}>
      {qty}
    </div>
  </button>
));

const OrderCard = memo(({ order, onMarkItem }: {
  order: { id: string; items: any[]; status: string; timestamp: string; sentBy: string; deliveredItems: string[]; avatarEmoji?: string };
  onMarkItem: (itemId: string) => void;
}) => {
  const color = userColor(order.sentBy);
  const done  = order.deliveredItems.length;
  const total = order.items.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const mins  = Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 60000);
  const allDone = done === total;
  const urgent = mins >= 12;

  return (
    <div style={{
      backgroundColor: '#1A1A1A', borderRadius: 18, overflow: 'hidden',
      border: `2px solid ${allDone ? 'rgba(34,197,94,0.4)' : urgent ? 'rgba(239,68,68,0.4)' : `${color}40`}`,
    }}>
      {/* Header strip */}
      <div style={{ backgroundColor: color, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontSize: 26, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{order.id}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 100,
              backgroundColor: urgent ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.3)',
            }}>
              <Clock style={{ width: 10, height: 10, color: '#FFF' }}/>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{mins}m</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
              {new Date(order.timestamp).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '8px 12px' }}>
          <span style={{ fontSize: 22 }}>{order.avatarEmoji || '👤'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#FFF', lineHeight: 1 }}>{order.sentBy || 'Ventana'}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{done}/{total} listos</p>
          </div>
          <div style={{ width: 60, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#FFF', borderRadius: 3, transition: 'width 0.3s' }}/>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {order.items.map((item: any) => (
          <ItemRow
            key={item.id} name={item.name} qty={item.quantity} category={item.category}
            done={order.deliveredItems.includes(item.id)}
            onToggle={() => onMarkItem(item.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: allDone ? 'rgba(34,197,94,0.08)' : 'transparent',
      }}>
        <CheckCircle style={{ width: 15, height: 15, color: allDone ? '#22C55E' : '#333' }}/>
        <span style={{ fontSize: 13, fontWeight: 700, color: allDone ? '#22C55E' : '#444' }}>
          {allDone ? 'Listo — Entregar en Ventana' : done > 0 ? `En preparación · ${done}/${total}` : 'En espera'}
        </span>
      </div>
    </div>
  );
});

export default function KitchenDisplay() {
  const navigate = useNavigate();
  const { orders, markItemReady, connected } = useOrders();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const handleMark = useCallback((orderId: string, itemId: string) => {
    markItemReady(orderId, itemId);
  }, [markItemReady]);

  const active     = orders.filter(o => o.status !== 'delivered');
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const timeStr    = new Date(now).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0D0D0D',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#141414', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#EAEAEA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            WebkitAppearance: 'none',
          }}>
            <ArrowLeft style={{ width: 18, height: 18 }}/>
          </button>
          <div>
            <p style={{ fontWeight: 900, fontSize: 16, color: '#FFFFFF', lineHeight: 1 }}>COCINA</p>
            <p style={{ fontSize: 11, color: '#555', fontWeight: 500 }}>Display KDS</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            padding: '5px 12px', borderRadius: 100,
            backgroundColor: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F97316' }}>🔥 {active.length} activos</span>
          </div>
          {readyCount > 0 && (
            <div style={{
              padding: '5px 12px', borderRadius: 100,
              backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>✓ {readyCount} listos</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: connected ? '#22C55E' : '#EF4444' }}/>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#EAEAEA' }}>{timeStr}</span>
          </div>
        </div>
      </header>

      {/* Orders grid */}
      <div style={{ flex: 1, padding: 14, overflowY: 'auto' }}>
        {active.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
            }}>
              ✓
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#EAEAEA' }}>¡Todo al día!</p>
            <p style={{ fontSize: 13, color: '#444' }}>Los pedidos aparecerán aquí</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {active.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onMarkItem={itemId => handleMark(order.id, itemId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
