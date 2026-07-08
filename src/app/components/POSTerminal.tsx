import { useState, useMemo, useCallback } from 'react';
import { useOrders, OrderItem, Order } from './OrderContext';
import { MENU_ITEMS, CATEGORIES } from './menuData';
import {
  ArrowLeft, ShoppingCart, Trash2, Send, X, Banknote,
  Plus, CheckCircle, Receipt, Droplets, User
} from 'lucide-react';
import { useNavigate } from 'react-router';
import logoImg from '../../imports/image-1.png';

const KITCHEN_CATS = new Set(['Desayunos', 'Golosinas', 'Platos Fuertes']);
const AUTO_CATS    = new Set(['Bebidas', 'Chucherías', 'Helados']);
const DRINKS       = MENU_ITEMS.filter(i => i.category === 'Bebidas');

const AVATARS = ['🍕','🌮','🍔','🍜','🌯','🥗','🍱','🧆','🥙','🍛','🌶️','🍖','🥩','🍟','🧇'];

const USERS = [
  { username: 'Quedadito1', password: 'eliaselmejor' },
  { username: 'Quedadito2', password: 'eliaselmejor' },
  { username: 'WASHO',      password: 'goku000' },
  { username: 'WATA',       password: 'goku000' },
  { username: 'elias',      password: 'elias123' },
  { username: 'tias',       password: 'tranquila' },
];

function getAvatar(u: string) { try { return localStorage.getItem(`av_${u}`) || AVATARS[0]; } catch { return AVATARS[0]; } }
function setAvatar(u: string, e: string) { try { localStorage.setItem(`av_${u}`, e); } catch {} }

const S = {
  // layout
  screen:  { display:'flex', flexDirection:'column' as const, height:'100vh', overflow:'hidden', backgroundColor:'#0A0A0A', fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif' },
  // header
  header:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', backgroundColor:'#141414', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 },
  // buttons
  btn:     (active?: boolean) => ({ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', WebkitAppearance:'none' as const, fontWeight:700, fontSize:13, transition:'all 0.15s', backgroundColor: active ? '#FF6B35' : 'rgba(255,255,255,0.04)', color: active ? '#FFF' : '#AAAAAA' }),
  iconBtn: { width:38, height:38, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', cursor:'pointer', WebkitAppearance:'none' as const, color:'#AAAAAA' },
  card:    { backgroundColor:'#1A1A1A', borderRadius:14, border:'1px solid rgba(255,255,255,0.06)' },
};

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ total, items, extraItems, onConfirm, onCancel, onAddDrink }: {
  total: number; items: OrderItem[]; extraItems: OrderItem[];
  onConfirm: () => void; onCancel: () => void;
  onAddDrink: (d: { name: string; price: number; category: string }) => void;
}) {
  const [bill, setBill] = useState('');
  const grand  = total + extraItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const paid   = parseFloat(bill) || 0;
  const change = paid - grand;

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200, padding:'0 0 0 0' }}>
      <div style={{ width:'100%', maxWidth:420, backgroundColor:'#141414', borderRadius:'20px 20px 0 0', border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        <div style={{ width:40, height:4, borderRadius:2, backgroundColor:'rgba(255,255,255,0.12)', margin:'12px auto 0' }}/>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Banknote style={{ width:18, height:18, color:'#FF6B35' }}/>
            <span style={{ fontWeight:800, fontSize:17, color:'#FFF' }}>Cobrar</span>
          </div>
          <button onClick={onCancel} style={S.iconBtn}><X style={{ width:16, height:16 }}/></button>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'0 18px 18px' }}>
          {/* Items summary */}
          <div style={{ ...S.card, padding:'12px 14px', marginBottom:14 }}>
            {items.map(i => (
              <div key={i.id} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, color:'#888' }}>{i.quantity}× {i.name}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#EAEAEA' }}>L.{(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            {extraItems.map(i => (
              <div key={i.id} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, color:'#3B82F6' }}>+{i.quantity}× {i.name}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#3B82F6' }}>L.{(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Add drink */}
          <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Agregar bebida</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
            {DRINKS.slice(0, 6).map(d => (
              <button key={d.name} onClick={() => onAddDrink(d)} style={{ padding:'6px 12px', borderRadius:100, border:'1px solid rgba(59,130,246,0.3)', backgroundColor:'rgba(59,130,246,0.08)', color:'#60A5FA', fontSize:12, fontWeight:700, cursor:'pointer', WebkitAppearance:'none' }}>
                +{d.name} L.{d.price}
              </button>
            ))}
          </div>

          {/* Total */}
          <div style={{ backgroundColor:'rgba(255,107,53,0.1)', border:'1px solid rgba(255,107,53,0.2)', borderRadius:14, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontWeight:700, color:'#EAEAEA', fontSize:15 }}>Total</span>
            <span style={{ fontSize:28, fontWeight:900, color:'#FF6B35' }}>L.{grand.toFixed(2)}</span>
          </div>

          {/* Bill input */}
          <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Billete recibido</p>
          <input
            type="number" inputMode="numeric" value={bill} onChange={e => setBill(e.target.value)}
            placeholder="0.00" autoFocus
            style={{ width:'100%', padding:'14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', backgroundColor:'rgba(255,255,255,0.04)', color:'#FFF', fontSize:28, fontWeight:900, textAlign:'center', outline:'none', boxSizing:'border-box', marginBottom:10 }}
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
            {[50, 100, 200, 500].map(v => (
              <button key={v} onClick={() => setBill(String(v))} style={{ height:44, borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', backgroundColor: parseFloat(bill) === v ? '#FF6B35' : 'rgba(255,255,255,0.04)', color: parseFloat(bill) === v ? '#FFF' : '#AAAAAA', fontWeight:800, fontSize:13, cursor:'pointer', WebkitAppearance:'none' }}>
                L.{v}
              </button>
            ))}
          </div>

          {/* Change */}
          <div style={{ borderRadius:14, padding:'14px', textAlign:'center', backgroundColor: change >= 0 && paid > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', border:`1px solid ${change >= 0 && paid > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <p style={{ fontSize:11, color:'#555', marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>Vuelto</p>
            <p style={{ fontSize:36, fontWeight:900, color: change >= 0 && paid > 0 ? '#22C55E' : '#333' }}>
              {paid > 0 ? (change >= 0 ? `L.${change.toFixed(2)}` : '❌') : '—'}
            </p>
          </div>
        </div>

        <div style={{ padding:'14px 18px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:10, flexShrink:0 }}>
          <button onClick={onCancel} style={{ flex:1, height:52, borderRadius:12, backgroundColor:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', color:'#888', fontWeight:700, fontSize:15, cursor:'pointer', WebkitAppearance:'none' }}>Cancelar</button>
          <button onClick={onConfirm} disabled={change < 0 || paid === 0} style={{ flex:2, height:52, borderRadius:12, backgroundColor: change >= 0 && paid > 0 ? '#22C55E' : 'rgba(34,197,94,0.15)', color: change >= 0 && paid > 0 ? '#FFF' : '#333', fontWeight:800, fontSize:15, cursor: change >= 0 && paid > 0 ? 'pointer' : 'not-allowed', border:'none', WebkitAppearance:'none', transition:'all 0.15s' }}>
            ✓ Entregar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order, onDeliver, onPay, onMarkItem }: {
  order: Order; onDeliver: () => void; onPay: () => void; onMarkItem: (id: string) => void;
}) {
  const statusColors: Record<string, string> = { pending:'#F59E0B', preparing:'#3B82F6', ready:'#22C55E', delivered:'#444' };
  const color = statusColors[order.status] || '#F59E0B';
  const statusLabels: Record<string, string> = { pending:'Pendiente', preparing:'Preparando', ready:'Listo ✓', delivered:'Entregado' };

  return (
    <div style={{ backgroundColor:'#1A1A1A', borderRadius:16, overflow:'hidden', border:`1.5px solid ${color}30` }}>
      <div style={{ backgroundColor:`${color}15`, borderBottom:`1px solid ${color}20`, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontWeight:900, fontSize:17, color:'#FFF', lineHeight:1 }}>{order.id}</p>
          <p style={{ fontSize:11, color:'#555', marginTop:3 }}>
            {order.avatarEmoji} {order.sentBy} · {new Date(order.timestamp).toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'})}
          </p>
        </div>
        <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:100, backgroundColor:`${color}20`, color }}>
          {statusLabels[order.status]}
        </span>
      </div>

      <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:4 }}>
        {order.items.map(item => {
          const done = order.deliveredItems.includes(item.id);
          return (
            <button key={item.id} onClick={() => onMarkItem(item.id)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
              borderRadius:8, border:`1px solid ${done ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.05)'}`,
              backgroundColor: done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
              cursor:'pointer', WebkitAppearance:'none', textAlign:'left',
            }}>
              <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, backgroundColor: done ? '#22C55E' : 'transparent', border:`1.5px solid ${done ? '#22C55E' : 'rgba(255,255,255,0.15)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {done && <span style={{ color:'#FFF', fontSize:10, fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ flex:1, fontSize:13, fontWeight:600, color: done ? '#444' : '#EAEAEA', textDecoration: done ? 'line-through' : 'none' }}>
                {item.quantity}× {item.name}
              </span>
              <span style={{ fontSize:12, fontWeight:800, color:'#FF6B35' }}>L.{(item.price*item.quantity).toFixed(2)}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding:'10px 14px 14px', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:16, fontWeight:900, color:'#FF6B35' }}>L.{order.total.toFixed(2)}</span>
        {order.status !== 'delivered' && (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onDeliver} style={{ padding:'8px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', color:'#AAAAAA', fontWeight:700, fontSize:12, cursor:'pointer', WebkitAppearance:'none' }}>
              Entregar
            </button>
            <button onClick={onPay} style={{ padding:'8px 16px', borderRadius:8, border:'none', backgroundColor:'#FF6B35', color:'#FFF', fontWeight:800, fontSize:12, cursor:'pointer', WebkitAppearance:'none' }}>
              Cobrar
            </button>
          </div>
        )}
        {order.status === 'delivered' && (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <CheckCircle style={{ width:14, height:14, color:'#22C55E' }}/>
            <span style={{ fontSize:12, color:'#444', fontWeight:600 }}>Completado</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Custom Item Modal ─────────────────────────────────────────────────────────
function CustomItemModal({ onAdd, onClose }: { onAdd: (i: { name:string; price:number; category:string }) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cat, setCat] = useState('Golosinas');

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div style={{ width:'100%', maxWidth:360, backgroundColor:'#141414', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontWeight:800, fontSize:16, color:'#FFF' }}>Producto personalizado</span>
          <button onClick={onClose} style={S.iconBtn}><X style={{ width:16, height:16 }}/></button>
        </div>
        <div style={{ padding:'18px', display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { label:'Nombre', value:name, onChange:(v:string)=>setName(v), type:'text', placeholder:'Ej: Elote con chile' },
            { label:'Precio (L.)', value:price, onChange:(v:string)=>setPrice(v), type:'number', placeholder:'0.00' },
          ].map(f => (
            <div key={f.label}>
              <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{f.label}</p>
              <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder}
                style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', color:'#FFF', fontSize:15, outline:'none', boxSizing:'border-box' }}/>
            </div>
          ))}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Categoría</p>
            <select value={cat} onChange={e => setCat(e.target.value)} style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'#141414', color:'#FFF', fontSize:15, outline:'none', WebkitAppearance:'none' }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={() => { const p=parseFloat(price); if(name.trim()&&p>0){onAdd({name:name.trim(),price:p,category:cat});onClose();}}}
            style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', backgroundColor:'#FF6B35', color:'#FFF', fontWeight:800, fontSize:15, cursor:'pointer', WebkitAppearance:'none' }}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Item ─────────────────────────────────────────────────────────────────
function CartItem({ item, onRemove, onQty }: { item: OrderItem; onRemove:(id:string)=>void; onQty:(id:string,q:number)=>void }) {
  return (
    <div style={{ backgroundColor:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#EAEAEA', flex:1, lineHeight:1.3 }}>{item.name}</p>
        <button onClick={() => onRemove(item.id)} style={{ width:28, height:28, borderRadius:7, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitAppearance:'none' }}>
          <Trash2 style={{ width:13, height:13 }}/>
        </button>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, overflow:'hidden' }}>
          <button onClick={() => onQty(item.id, item.quantity - 1)} style={{ width:32, height:32, backgroundColor:'rgba(255,255,255,0.04)', border:'none', color:'#EAEAEA', fontWeight:900, fontSize:16, cursor:'pointer', WebkitAppearance:'none' }}>−</button>
          <span style={{ width:28, textAlign:'center', fontSize:14, fontWeight:800, color:'#FFF' }}>{item.quantity}</span>
          <button onClick={() => onQty(item.id, item.quantity + 1)} style={{ width:32, height:32, backgroundColor:'rgba(255,255,255,0.04)', border:'none', color:'#EAEAEA', fontWeight:900, fontSize:16, cursor:'pointer', WebkitAppearance:'none' }}>+</button>
        </div>
        <span style={{ fontSize:14, fontWeight:900, color:'#FF6B35' }}>L.{(item.price * item.quantity).toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Main POS ─────────────────────────────────────────────────────────────────
export default function POSTerminal() {
  const navigate = useNavigate();
  const { addOrder, addItemsToOrder, addTransaction, orders, updateOrderStatus, markItemReady } = useOrders();

  const [loggedIn, setLoggedIn]   = useState(false);
  const [user, setUser]           = useState('');
  const [password, setPassword]   = useState('');
  const [currentUser, setCurrent] = useState('');
  const [avatar, setAvatarState]  = useState('');
  const [view, setView]           = useState<'menu'|'orders'>('menu');
  const [selectedCat, setSelectedCat] = useState('Desayunos');
  const [cart, setCart]           = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen]   = useState(false);
  const [invoice, setInvoice]     = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string|null>(null);
  const [payExtras, setPayExtras] = useState<OrderItem[]>([]);
  const [notif, setNotif]         = useState<string|null>(null);

  const filtered = useMemo(() => MENU_ITEMS.filter(i => i.category === selectedCat), [selectedCat]);
  const activeOrders = orders.filter(o => o.status !== 'delivered');
  const payingOrder  = payingOrderId ? orders.find(o => o.id === payingOrderId) : null;
  const cartTotal    = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const kitchenItems = cart.filter(i => KITCHEN_CATS.has(i.category));

  const showNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 2000);
  };

  const handleLogin = () => {
    const u = USERS.find(u => u.username === user && u.password === password);
    if (u) {
      setLoggedIn(true);
      setCurrent(u.username);
      setAvatarState(getAvatar(u.username));
    } else {
      setPassword('');
      showNotif('Usuario o contraseña incorrectos');
    }
  };

  const addToCart = useCallback((item: { name: string; price: number; category: string }) => {
    if (AUTO_CATS.has(item.category)) {
      addTransaction({ amount: item.price, type: 'sale', description: `Directo: ${item.name}` });
      showNotif(`✓ ${item.name} — L.${item.price}`);
      return;
    }
    setCart(prev => {
      const ex = prev.find(c => c.name === item.name);
      if (ex) return prev.map(c => c.name === item.name ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: crypto.randomUUID(), name: item.name, price: item.price, quantity: 1, category: item.category }];
    });
  }, [addTransaction]);

  const chargeDrink = (d: { name: string; price: number; category: string }) => {
    addTransaction({ amount: d.price, type: 'drink-log', description: `Bebida: ${d.name}` });
    showNotif(`💧 ${d.name} — L.${d.price}`);
  };

  const removeFromCart = (id: string) => setCart(p => p.filter(i => i.id !== id));
  const updateQty = (id: string, q: number) => { if (q <= 0) removeFromCart(id); else setCart(p => p.map(i => i.id === id ? { ...i, quantity: q } : i)); };

  const sendToKitchen = () => {
    if (cart.length === 0) return;
    const orderId = invoice.trim() ? `#${invoice.trim()}` : `#${Date.now().toString().slice(-5)}`;
    if (kitchenItems.length > 0) {
      addOrder({
        id: orderId, items: kitchenItems,
        total: kitchenItems.reduce((s, i) => s + i.price * i.quantity, 0),
        timestamp: new Date().toISOString(), status: 'pending',
        sentBy: currentUser, avatarEmoji: avatar,
      });
    }
    setCart([]); setInvoice(''); setCartOpen(false);
  };

  const confirmPayment = () => {
    if (!payingOrderId) return;
    if (payExtras.length > 0) addItemsToOrder(payingOrderId, payExtras);
    updateOrderStatus(payingOrderId, 'delivered');
    setPayingOrderId(null); setPayExtras([]);
  };

  const addPayDrink = (d: { name: string; price: number; category: string }) => {
    setPayExtras(prev => {
      const ex = prev.find(i => i.name === d.name);
      if (ex) return prev.map(i => i.name === d.name ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: crypto.randomUUID(), name: d.name, price: d.price, quantity: 1, category: d.category }];
    });
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div style={{ minHeight:'100vh', backgroundColor:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif' }}>
        {notif && (
          <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', backgroundColor:'#EF4444', color:'#FFF', padding:'10px 20px', borderRadius:12, fontWeight:700, zIndex:999 }}>{notif}</div>
        )}
        <div style={{ width:'100%', maxWidth:380 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:32 }}>
            <div style={{ width:80, height:80, borderRadius:20, overflow:'hidden', border:'2px solid rgba(255,107,53,0.3)', marginBottom:16 }}>
              <img src={logoImg} alt="Don de Chuy" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            </div>
            <h1 style={{ fontSize:26, fontWeight:900, color:'#FFF', marginBottom:4 }}>Don de Chuy</h1>
            <p style={{ fontSize:13, color:'#555' }}>Terminal de venta · VENTANA</p>
          </div>

          <div style={{ backgroundColor:'#141414', borderRadius:20, border:'1px solid rgba(255,255,255,0.06)', padding:'24px 22px' }}>
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Usuario</p>
              <input type="text" value={user} onChange={e => setUser(e.target.value)} placeholder="Tu nombre de usuario"
                style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', color:'#FFF', fontSize:15, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Contraseña</p>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••"
                style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', color:'#FFF', fontSize:15, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <button onClick={handleLogin} style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', backgroundColor:'#FF6B35', color:'#FFF', fontWeight:800, fontSize:16, cursor:'pointer', WebkitAppearance:'none' }}>
              Entrar
            </button>
          </div>

          <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, margin:'20px auto 0', color:'#555', fontSize:13, fontWeight:600, background:'none', border:'none', cursor:'pointer', WebkitAppearance:'none' }}>
            <ArrowLeft style={{ width:14, height:14 }}/> Regresar
          </button>
        </div>
      </div>
    );
  }

  // ── Cart Panel ─────────────────────────────────────────────────────────────
  const CartPanel = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', backgroundColor:'#0F0F0F' }}>
      <div style={{ padding:'14px 14px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ShoppingCart style={{ width:16, height:16, color:'#FF6B35' }}/>
            <span style={{ fontWeight:800, fontSize:15, color:'#FFF' }}>Pedido</span>
            {cart.length > 0 && <span style={{ backgroundColor:'#FF6B35', color:'#FFF', fontSize:11, fontWeight:900, borderRadius:100, padding:'2px 7px' }}>{cart.length}</span>}
          </div>
          <button onClick={() => setCartOpen(false)} style={{ ...S.iconBtn, display:'flex' }} className="lg:hidden">
            <X style={{ width:16, height:16 }}/>
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Receipt style={{ width:13, height:13, color:'#444' }}/>
          <input type="text" value={invoice} onChange={e => setInvoice(e.target.value)} placeholder="# Factura (opcional)"
            style={{ flex:1, padding:'7px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', backgroundColor:'rgba(255,255,255,0.03)', color:'#FFF', fontSize:13, outline:'none' }}/>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
        {cart.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:10 }}>
            <ShoppingCart style={{ width:36, height:36, color:'#222' }}/>
            <p style={{ color:'#333', fontSize:13, fontWeight:600 }}>Carrito vacío</p>
          </div>
        ) : cart.map(i => <CartItem key={i.id} item={i} onRemove={removeFromCart} onQty={updateQty}/>)}
      </div>

      <div style={{ padding:'12px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, padding:'10px 14px', backgroundColor:'rgba(255,107,53,0.08)', borderRadius:10, border:'1px solid rgba(255,107,53,0.15)' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#888' }}>Total</span>
          <span style={{ fontSize:22, fontWeight:900, color:'#FF6B35' }}>L.{cartTotal.toFixed(2)}</span>
        </div>
        <button onClick={sendToKitchen} disabled={cart.length === 0} style={{
          width:'100%', padding:'14px', borderRadius:12, border:'none',
          backgroundColor: cart.length > 0 ? '#FF6B35' : 'rgba(255,107,53,0.15)',
          color: cart.length > 0 ? '#FFF' : '#444',
          fontWeight:800, fontSize:15, cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
          WebkitAppearance:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          <Send style={{ width:16, height:16 }}/> Enviar a Cocina
        </button>
      </div>
    </div>
  );

  // ── Main Layout ───────────────────────────────────────────────────────────
  return (
    <div style={S.screen}>
      {/* Avatar picker */}
      {showAvatarPicker && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.8)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ backgroundColor:'#141414', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)', padding:20, width:'100%', maxWidth:320 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontWeight:800, fontSize:16, color:'#FFF' }}>Tu avatar</span>
              <button onClick={() => setShowAvatarPicker(false)} style={S.iconBtn}><X style={{ width:16, height:16 }}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
              {AVATARS.map(e => (
                <button key={e} onClick={() => { setAvatar(currentUser, e); setAvatarState(e); setShowAvatarPicker(false); }}
                  style={{ fontSize:26, padding:'8px', borderRadius:10, border:`2px solid ${avatar===e ? '#FF6B35' : 'rgba(255,255,255,0.08)'}`, backgroundColor: avatar===e ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.03)', cursor:'pointer', WebkitAppearance:'none' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notification toast */}
      {notif && (
        <div style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)', backgroundColor:'rgba(34,197,94,0.95)', color:'#FFF', padding:'10px 20px', borderRadius:12, fontWeight:700, fontSize:14, zIndex:999, whiteSpace:'nowrap' }}>
          {notif}
        </div>
      )}

      {/* Header */}
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => navigate('/')} style={S.iconBtn}><ArrowLeft style={{ width:16, height:16 }}/></button>
          <img src={logoImg} alt="Don de Chuy" style={{ height:34, width:'auto', borderRadius:8 }}/>
          <div>
            <p style={{ fontWeight:800, fontSize:15, color:'#FFF', lineHeight:1 }}>VENTANA</p>
            <p style={{ fontSize:11, color:'#555', marginTop:2 }}>Punto de venta</p>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' }}>
            <button onClick={() => setView('menu')} style={{ padding:'7px 14px', backgroundColor: view==='menu' ? '#FF6B35' : 'transparent', color: view==='menu' ? '#FFF' : '#666', fontWeight:700, fontSize:12, border:'none', cursor:'pointer', WebkitAppearance:'none' }}>Menú</button>
            <button onClick={() => setView('orders')} style={{ padding:'7px 14px', backgroundColor: view==='orders' ? '#FF6B35' : 'transparent', color: view==='orders' ? '#FFF' : '#666', fontWeight:700, fontSize:12, border:'none', cursor:'pointer', WebkitAppearance:'none', position:'relative' }}>
              Pedidos
              {activeOrders.length > 0 && <span style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', backgroundColor:'#EF4444', color:'#FFF', fontSize:9, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{activeOrders.length}</span>}
            </button>
          </div>

          <button onClick={() => setCartOpen(true)} style={{ ...S.iconBtn, position:'relative' }}>
            <ShoppingCart style={{ width:16, height:16 }}/>
            {cart.length > 0 && <span style={{ position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:'50%', backgroundColor:'#FF6B35', color:'#FFF', fontSize:9, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{cart.length}</span>}
          </button>

          <button onClick={() => { setShowAvatarPicker(true); }} style={{ width:38, height:38, borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitAppearance:'none' }}>
            {avatar || <User style={{ width:16, height:16, color:'#666' }}/>}
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Menu area */}
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          {view === 'menu' ? (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* Category tabs */}
              <div style={{ padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)', backgroundColor:'#0F0F0F', flexShrink:0, overflowX:'auto' }}>
                <div style={{ display:'flex', gap:8, minWidth:'max-content' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setSelectedCat(cat)} style={{
                      padding:'8px 16px', borderRadius:100, border:'1px solid rgba(255,255,255,0.06)',
                      backgroundColor: selectedCat===cat ? '#FF6B35' : 'rgba(255,255,255,0.04)',
                      color: selectedCat===cat ? '#FFF' : '#666',
                      fontWeight:700, fontSize:12, cursor:'pointer', WebkitAppearance:'none', whiteSpace:'nowrap',
                    }}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Menu items grid */}
              <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
                  {filtered.map((item, i) => (
                    <button key={i} onClick={() => addToCart(item)} style={{
                      backgroundColor:'#1A1A1A', border:'1px solid rgba(255,255,255,0.06)',
                      borderRadius:12, padding:'14px 12px', cursor:'pointer',
                      WebkitAppearance:'none', textAlign:'left', minHeight:72,
                      display:'flex', flexDirection:'column', justifyContent:'space-between',
                    }}>
                      <p style={{ fontSize:12, fontWeight:700, color:'#EAEAEA', lineHeight:1.3, marginBottom:8 }}>{item.name}</p>
                      <p style={{ fontSize:15, fontWeight:900, color:'#FF6B35' }}>L.{item.price}</p>
                    </button>
                  ))}
                  <button onClick={() => setShowCustom(true)} style={{ backgroundColor:'rgba(255,107,53,0.06)', border:'1px dashed rgba(255,107,53,0.25)', borderRadius:12, padding:'14px 12px', cursor:'pointer', WebkitAppearance:'none', minHeight:72, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <Plus style={{ width:20, height:20, color:'#FF6B35' }}/>
                    <p style={{ fontSize:11, fontWeight:700, color:'#FF6B35' }}>Otro</p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex:1, overflowY:'auto', padding:'14px' }}>
              {activeOrders.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:12 }}>
                  <CheckCircle style={{ width:48, height:48, color:'#222' }}/>
                  <p style={{ fontSize:16, fontWeight:700, color:'#333' }}>Sin pedidos activos</p>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
                  {activeOrders.map(order => (
                    <OrderCard key={order.id} order={order}
                      onDeliver={() => updateOrderStatus(order.id, 'delivered')}
                      onPay={() => { setPayingOrderId(order.id); setPayExtras([]); }}
                      onMarkItem={id => markItemReady(order.id, id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drinks panel — always visible in menu view */}
        {view === 'menu' && (
          <div style={{ width:200, borderLeft:'1px solid rgba(255,255,255,0.06)', backgroundColor:'#0D0D0D', display:'flex', flexDirection:'column', flexShrink:0 }}>
            <div style={{ padding:'8px 6px', borderBottom:'1px solid rgba(255,255,255,0.05)', textAlign:'center' }}>
              <Droplets style={{ width:13, height:13, color:'#3B82F6', margin:'0 auto 3px' }}/>
              <p style={{ fontSize:10, fontWeight:800, color:'#3B82F6', lineHeight:1 }}>BEBIDAS</p>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'6px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
              {DRINKS.map((d, i) => (
                <button key={i} onClick={() => chargeDrink(d)} style={{ backgroundColor:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:7, padding:'6px 4px', cursor:'pointer', WebkitAppearance:'none', textAlign:'center' }}>
                  <p style={{ fontSize:8, fontWeight:700, color:'#EAEAEA', lineHeight:1.2, marginBottom:2 }}>{d.name}</p>
                  <p style={{ fontSize:11, fontWeight:900, color:'#3B82F6' }}>L.{d.price}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cart panel — always visible on right */}
        <div style={{ width:260, borderLeft:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          {CartPanel}
        </div>
      </div>

      {/* Cart drawer mobile */}
      {cartOpen && (
        <>
          <div onClick={() => setCartOpen(false)} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', zIndex:100 }}/>
          <div style={{ position:'fixed', right:0, top:0, bottom:0, width:300, maxWidth:'90vw', zIndex:101, backgroundColor:'#0F0F0F', boxShadow:'-4px 0 24px rgba(0,0,0,0.5)' }}>
            {CartPanel}
          </div>
        </>
      )}

      {/* Modals */}
      {showCustom && <CustomItemModal onAdd={addToCart} onClose={() => setShowCustom(false)}/>}
      {payingOrder && (
        <PaymentModal
          total={payingOrder.total} items={payingOrder.items} extraItems={payExtras}
          onConfirm={confirmPayment}
          onCancel={() => { setPayingOrderId(null); setPayExtras([]); }}
          onAddDrink={addPayDrink}
        />
      )}
    </div>
  );
}
