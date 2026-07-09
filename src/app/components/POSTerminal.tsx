import { useState, useMemo, useCallback } from 'react';
import { useOrders, OrderItem, Order } from './OrderContext';
import { MENU_ITEMS, CATEGORIES } from './menuData';
import { ArrowLeft, ShoppingCart, Trash2, Send, X, Banknote, Plus, CheckCircle, Receipt, Droplets, User, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router';
import logoImg from '../../imports/image-1.png';

const F    = "'Inter',-apple-system,sans-serif";
const MONO = "'JetBrains Mono',monospace";

const KITCHEN_CATS = new Set(['Desayunos','Golosinas','Platos Fuertes']);
const AUTO_CATS    = new Set(['Bebidas','Chucherías','Helados']);
const DRINKS       = MENU_ITEMS.filter(i => i.category === 'Bebidas');

const AVATARS = ['🍕','🌮','🍔','🍜','🌯','🥗','🍱','🧆','🥙','🍛','🌶️','🍖','🥩','🍟','🧇'];
const USERS = [
  { username:'Quedadito1', password:'eliaselmejor' },
  { username:'Quedadito2', password:'eliaselmejor' },
  { username:'WASHO',      password:'goku000' },
  { username:'WATA',       password:'goku000' },
  { username:'elias',      password:'elias123' },
  { username:'tias',       password:'tranquila' },
];

function getAvatar(u: string) { try { return localStorage.getItem(`av_${u}`) || AVATARS[0]; } catch { return AVATARS[0]; } }
function setAvatar(u: string, e: string) { try { localStorage.setItem(`av_${u}`, e); } catch {} }

// ─── Tokens ───────────────────────────────────────────────────────────────────
const BG   = '#07090D';
const CARD = '#0E1117';
const CARD2= '#111620';
const BORDER = '1px solid rgba(255,255,255,0.07)';
const ORANGE = '#F97316';

// ─── Shared components ────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize:10, fontWeight:700, color:'#4B5563', textTransform:'uppercase' as const, letterSpacing:1.5, marginBottom:7, fontFamily:MONO }}>{children}</p>;
}
function IBtn({ onClick, children, style }: { onClick?: ()=>void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{ width:36, height:36, borderRadius:9, border:BORDER, backgroundColor:CARD, cursor:'pointer', WebkitAppearance:'none', display:'flex', alignItems:'center', justifyContent:'center', color:'#6B7280', flexShrink:0, ...style }}>
      {children}
    </button>
  );
}

// ─── Calculator ───────────────────────────────────────────────────────────────
function CalcModal({ onClose }: { onClose: ()=>void }) {
  const [disp, setDisp] = useState('0');
  const [prev, setPrev] = useState('');
  const [op, setOp]     = useState('');
  const [rst, setRst]   = useState(false);

  const press = (v: string) => {
    if (v==='C')  { setDisp('0'); setPrev(''); setOp(''); setRst(false); return; }
    if (v==='←')  { setDisp(d => d.length>1 ? d.slice(0,-1) : '0'); return; }
    if ('+-×÷'.includes(v)) { setPrev(disp); setOp(v); setRst(true); return; }
    if (v==='=') {
      const a=parseFloat(prev), b=parseFloat(disp);
      const res = op==='+'?a+b : op==='-'?a-b : op==='×'?a*b : b!==0?a/b:0;
      setDisp(String(parseFloat(res.toFixed(6))));
      setPrev(''); setOp(''); setRst(false); return;
    }
    if (v==='.') { if(rst){setDisp('0.');setRst(false);return;} if(!disp.includes('.')) setDisp(d=>d+'.'); return; }
    if (rst) { setDisp(v); setRst(false); return; }
    setDisp(d => d==='0' ? v : d.length<12 ? d+v : d);
  };

  const opBg  = (v: string) => v==='='?ORANGE:v==='C'||v==='←'?'rgba(239,68,68,0.12)':'rgba(249,115,22,0.1)';
  const opClr = (v: string) => v==='='?'#FFF':v==='C'||v==='←'?'#EF4444':ORANGE;

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:400, padding:16 }}>
      <div style={{ width:300, backgroundColor:CARD, borderRadius:18, border:BORDER, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:BORDER }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Calculator style={{ width:14, height:14, color:ORANGE }}/>
            <span style={{ fontWeight:700, fontSize:14, color:'#EDF0F4', fontFamily:F }}>Calculadora</span>
          </div>
          <IBtn onClick={onClose}><X style={{ width:14, height:14 }}/></IBtn>
        </div>
        <div style={{ padding:'14px 16px 6px', textAlign:'right' }}>
          {op && <p style={{ fontSize:11, color:'#4B5563', marginBottom:2, fontFamily:MONO }}>{prev} {op}</p>}
          <p style={{ fontSize:34, fontWeight:700, color:'#EDF0F4', lineHeight:1, fontFamily:MONO, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{disp}</p>
        </div>
        <div style={{ padding:'8px 14px 16px', display:'flex', flexDirection:'column', gap:6 }}>
          {[['C','←','÷','×'],['7','8','9','-'],['4','5','6','+'],['1','2','3','=']].map((row,ri) => (
            <div key={ri} style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
              {row.map(v => (
                <button key={v} onClick={()=>press(v)} style={{ height:52, borderRadius:9, border:BORDER, backgroundColor:opBg(v), color:opClr(v), fontWeight:700, fontSize:16, cursor:'pointer', WebkitAppearance:'none', fontFamily:MONO }}>
                  {v}
                </button>
              ))}
            </div>
          ))}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:6 }}>
            <button onClick={()=>press('0')} style={{ height:52, borderRadius:9, border:BORDER, backgroundColor:CARD2, color:'#EDF0F4', fontWeight:700, fontSize:16, cursor:'pointer', WebkitAppearance:'none', fontFamily:MONO, textAlign:'left', paddingLeft:20 }}>0</button>
            <button onClick={()=>press('.')} style={{ height:52, borderRadius:9, border:BORDER, backgroundColor:CARD2, color:'#EDF0F4', fontWeight:700, fontSize:16, cursor:'pointer', WebkitAppearance:'none', fontFamily:MONO }}>.</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PayModal({ total, items, extras, onConfirm, onCancel, onAddDrink }: {
  total: number; items: OrderItem[]; extras: OrderItem[];
  onConfirm: ()=>void; onCancel: ()=>void;
  onAddDrink: (d:{name:string;price:number;category:string})=>void;
}) {
  const [bill, setBill] = useState('');
  const grand  = total + extras.reduce((s,i)=>s+i.price*i.quantity,0);
  const paid   = parseFloat(bill)||0;
  const change = paid-grand;

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:300 }}>
      <div style={{ width:'100%', maxWidth:440, backgroundColor:CARD, borderRadius:'18px 18px 0 0', border:BORDER, maxHeight:'92vh', display:'flex', flexDirection:'column' }}>
        <div style={{ width:36, height:3, borderRadius:2, backgroundColor:'rgba(255,255,255,0.1)', margin:'12px auto 0' }}/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Banknote style={{ width:16, height:16, color:ORANGE }}/>
            <span style={{ fontWeight:800, fontSize:16, color:'#EDF0F4', fontFamily:F }}>Cobrar pedido</span>
          </div>
          <IBtn onClick={onCancel}><X style={{ width:14, height:14 }}/></IBtn>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'0 18px 18px' }}>
          {/* Items */}
          <div style={{ backgroundColor:CARD2, borderRadius:10, padding:'12px 14px', marginBottom:14, border:BORDER }}>
            {[...items,...extras].map(i=>(
              <div key={i.id} style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:12, color:'#6B7280', fontFamily:F }}>{i.quantity}× {i.name}</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#EDF0F4', fontFamily:MONO }}>L.{(i.price*i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Add drink */}
          <Label>Agregar bebida</Label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:16 }}>
            {DRINKS.slice(0,8).map(d=>(
              <button key={d.name} onClick={()=>onAddDrink(d)} style={{ padding:'5px 10px', borderRadius:100, border:'1px solid rgba(59,130,246,0.25)', backgroundColor:'rgba(59,130,246,0.07)', color:'#60A5FA', fontSize:11, fontWeight:600, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>
                +{d.name} <span style={{ fontFamily:MONO }}>L.{d.price}</span>
              </button>
            ))}
          </div>

          {/* Total */}
          <div style={{ backgroundColor:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.18)', borderRadius:12, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontWeight:600, color:'#9AA3B0', fontSize:13, fontFamily:F }}>Total</span>
            <span style={{ fontSize:26, fontWeight:800, color:ORANGE, fontFamily:MONO }}>L.{grand.toFixed(2)}</span>
          </div>

          {/* Bill */}
          <Label>Billete recibido</Label>
          <input type="number" inputMode="numeric" value={bill} onChange={e=>setBill(e.target.value)}
            placeholder="0.00" autoFocus
            style={{ width:'100%', padding:'14px', borderRadius:10, border:BORDER, backgroundColor:CARD2, color:'#EDF0F4', fontSize:26, fontWeight:700, textAlign:'center', outline:'none', boxSizing:'border-box', marginBottom:10, fontFamily:MONO }}/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7, marginBottom:14 }}>
            {[50,100,200,500].map(v=>(
              <button key={v} onClick={()=>setBill(String(v))} style={{ height:42, borderRadius:9, border:BORDER, backgroundColor:parseFloat(bill)===v?ORANGE:CARD2, color:parseFloat(bill)===v?'#FFF':'#9AA3B0', fontWeight:700, fontSize:13, cursor:'pointer', WebkitAppearance:'none', fontFamily:MONO }}>
                {v}
              </button>
            ))}
          </div>

          {/* Change */}
          <div style={{ borderRadius:12, padding:'14px', textAlign:'center', backgroundColor:change>=0&&paid>0?'rgba(34,197,94,0.07)':'rgba(255,255,255,0.02)', border:`1px solid ${change>=0&&paid>0?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.06)'}` }}>
            <Label>Vuelto</Label>
            <p style={{ fontSize:32, fontWeight:800, color:change>=0&&paid>0?'#22C55E':'#374151', fontFamily:MONO }}>
              {paid>0?(change>=0?`L.${change.toFixed(2)}`:'❌'):'—'}
            </p>
          </div>
        </div>

        <div style={{ padding:'14px 18px', borderTop:BORDER, display:'flex', gap:9, flexShrink:0 }}>
          <button onClick={onCancel} style={{ flex:1, height:50, borderRadius:10, backgroundColor:CARD2, border:BORDER, color:'#6B7280', fontWeight:700, fontSize:14, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>Cancelar</button>
          <button onClick={onConfirm} disabled={change<0||paid===0} style={{ flex:2, height:50, borderRadius:10, backgroundColor:change>=0&&paid>0?'#22C55E':'rgba(34,197,94,0.1)', color:change>=0&&paid>0?'#FFF':'#374151', fontWeight:800, fontSize:14, cursor:change>=0&&paid>0?'pointer':'not-allowed', border:'none', WebkitAppearance:'none', fontFamily:F }}>
            ✓ Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onDeliver, onPay, onMarkItem }: { order:Order; onDeliver:()=>void; onPay:()=>void; onMarkItem:(id:string)=>void }) {
  const COLORS: Record<string,string> = { pending:'#F59E0B', preparing:'#3B82F6', ready:'#22C55E', delivered:'#374151' };
  const LABELS: Record<string,string> = { pending:'Pendiente', preparing:'Preparando', ready:'Listo ✓', delivered:'Entregado' };
  const c = COLORS[order.status]||'#F59E0B';

  return (
    <div style={{ backgroundColor:CARD, borderRadius:14, border:`1px solid ${c}25`, overflow:'hidden' }}>
      <div style={{ backgroundColor:`${c}10`, borderBottom:`1px solid ${c}18`, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <p style={{ fontWeight:800, fontSize:16, color:'#EDF0F4', fontFamily:MONO }}>{order.id}</p>
          <p style={{ fontSize:10, color:'#4B5563', marginTop:2, fontFamily:F }}>
            {order.avatarEmoji} {order.sentBy} · {new Date(order.timestamp).toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'})}
          </p>
        </div>
        <span style={{ fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:100, backgroundColor:`${c}18`, color:c, fontFamily:MONO, letterSpacing:0.5 }}>
          {LABELS[order.status]}
        </span>
      </div>
      <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:4 }}>
        {order.items.map(item => {
          const done = order.deliveredItems.includes(item.id);
          return (
            <button key={item.id} onClick={()=>onMarkItem(item.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'9px 11px', borderRadius:8, border:`1px solid ${done?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.04)'}`, backgroundColor:done?'rgba(34,197,94,0.05)':'rgba(255,255,255,0.02)', cursor:'pointer', WebkitAppearance:'none', textAlign:'left' }}>
              <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, backgroundColor:done?'#22C55E':'transparent', border:`1.5px solid ${done?'#22C55E':'rgba(255,255,255,0.12)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {done&&<span style={{ color:'#FFF', fontSize:10, fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ flex:1, fontSize:14, color:done?'#374151':'#EDF0F4', textDecoration:done?'line-through':'none', fontFamily:F }}>{item.quantity}× {item.name}</span>
              <span style={{ fontSize:13, fontWeight:700, color:ORANGE, fontFamily:MONO }}>L.{(item.price*item.quantity).toFixed(2)}</span>
            </button>
          );
        })}
      </div>
      <div style={{ padding:'11px 14px', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:17, fontWeight:800, color:ORANGE, fontFamily:MONO }}>L.{order.total.toFixed(2)}</span>
        {order.status!=='delivered' ? (
          <div style={{ display:'flex', gap:7 }}>
            <button onClick={onDeliver} style={{ padding:'9px 15px', borderRadius:8, border:BORDER, backgroundColor:CARD2, color:'#6B7280', fontWeight:600, fontSize:13, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>Entregar</button>
            <button onClick={onPay} style={{ padding:'9px 16px', borderRadius:8, border:'none', backgroundColor:ORANGE, color:'#FFF', fontWeight:700, fontSize:13, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>Cobrar</button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <CheckCircle style={{ width:14, height:14, color:'#22C55E' }}/>
            <span style={{ fontSize:13, color:'#374151', fontFamily:F }}>Completado</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Custom Item Modal ────────────────────────────────────────────────────────
function CustomModal({ onAdd, onClose }: { onAdd:(i:{name:string;price:number;category:string})=>void; onClose:()=>void }) {
  const [name,setName]   = useState('');
  const [price,setPrice] = useState('');
  const [cat,setCat]     = useState('Golosinas');
  const inp = { width:'100%', padding:'11px 13px', borderRadius:9, border:BORDER, backgroundColor:CARD2, color:'#EDF0F4', fontSize:14, outline:'none', boxSizing:'border-box' as const, fontFamily:F };

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16 }}>
      <div style={{ width:'100%', maxWidth:340, backgroundColor:CARD, borderRadius:16, border:BORDER, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:BORDER }}>
          <span style={{ fontWeight:700, fontSize:15, color:'#EDF0F4', fontFamily:F }}>Producto personalizado</span>
          <IBtn onClick={onClose}><X style={{ width:14, height:14 }}/></IBtn>
        </div>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
          <div><Label>Nombre</Label><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Elote con chile" style={inp}/></div>
          <div><Label>Precio (L.)</Label><input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" style={inp}/></div>
          <div>
            <Label>Categoría</Label>
            <select value={cat} onChange={e=>setCat(e.target.value)} style={{ ...inp, WebkitAppearance:'none' }}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={()=>{const p=parseFloat(price);if(name.trim()&&p>0){onAdd({name:name.trim(),price:p,category:cat});onClose();}}}
            style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', backgroundColor:ORANGE, color:'#FFF', fontWeight:700, fontSize:14, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>
            Agregar al pedido
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Item ────────────────────────────────────────────────────────────────
function CartItem({ item, onRemove, onQty }: { item:OrderItem; onRemove:(id:string)=>void; onQty:(id:string,q:number)=>void }) {
  return (
    <div style={{ backgroundColor:CARD2, border:BORDER, borderRadius:10, padding:'10px 11px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8, gap:8 }}>
        <p style={{ fontSize:14, fontWeight:600, color:'#EDF0F4', flex:1, lineHeight:1.4, fontFamily:F }}>{item.name}</p>
        <button onClick={()=>onRemove(item.id)} style={{ width:24, height:24, borderRadius:6, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.18)', color:'#EF4444', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitAppearance:'none', flexShrink:0 }}>
          <Trash2 style={{ width:11, height:11 }}/>
        </button>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', border:BORDER, borderRadius:7, overflow:'hidden' }}>
          <button onClick={()=>onQty(item.id,item.quantity-1)} style={{ width:28,height:28,backgroundColor:'rgba(255,255,255,0.03)',border:'none',color:'#EDF0F4',fontWeight:900,fontSize:15,cursor:'pointer',WebkitAppearance:'none' }}>−</button>
          <span style={{ width:28,textAlign:'center',fontSize:15,fontWeight:700,color:'#EDF0F4',fontFamily:MONO }}>{item.quantity}</span>
          <button onClick={()=>onQty(item.id,item.quantity+1)} style={{ width:30,height:30,backgroundColor:'rgba(255,255,255,0.03)',border:'none',color:'#EDF0F4',fontWeight:900,fontSize:16,cursor:'pointer',WebkitAppearance:'none' }}>+</button>
        </div>
        <span style={{ fontSize:15,fontWeight:800,color:ORANGE,fontFamily:MONO }}>L.{(item.price*item.quantity).toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Main POS ─────────────────────────────────────────────────────────────────
export default function POSTerminal() {
  const navigate = useNavigate();
  const { addOrder, addItemsToOrder, addTransaction, orders, updateOrderStatus, markItemReady, deleteOrder } = useOrders();

  const [loggedIn,setLoggedIn]       = useState(false);
  const [user,setUser]               = useState('');
  const [password,setPassword]       = useState('');
  const [currentUser,setCurrent]     = useState('');
  const [avatar,setAvatarState]      = useState('');
  const [view,setView]               = useState<'menu'|'orders'>('menu');
  const [selectedCat,setSelectedCat] = useState('Desayunos');
  const [cart,setCart]               = useState<OrderItem[]>([]);
  const [invoice,setInvoice]         = useState('');
  const [showCustom,setShowCustom]   = useState(false);
  const [showCalc,setShowCalc]       = useState(false);
  const [showAvatar,setShowAvatar]   = useState(false);
  const [payingId,setPayingId]       = useState<string|null>(null);
  const [payExtras,setPayExtras]     = useState<OrderItem[]>([]);
  const [notif,setNotif]             = useState<string|null>(null);
  const [selectMode,setSelectMode]   = useState(false);
  const [selected,setSelected]       = useState<Set<string>>(new Set());
  const [confirmDel,setConfirmDel]   = useState<'all'|'selected'|null>(null);

  const filtered     = useMemo(()=>MENU_ITEMS.filter(i=>i.category===selectedCat),[selectedCat]);
  const activeOrders = orders.filter(o=>o.status!=='delivered');
  const payOrder     = payingId ? orders.find(o=>o.id===payingId) : null;
  const cartTotal    = cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const kitchenItems = cart.filter(i=>KITCHEN_CATS.has(i.category));

  const toast = (msg: string) => { setNotif(msg); setTimeout(()=>setNotif(null),2200); };

  const handleLogin = () => {
    const u = USERS.find(u=>u.username===user&&u.password===password);
    if (u) { setLoggedIn(true); setCurrent(u.username); setAvatarState(getAvatar(u.username)); }
    else { setPassword(''); toast('Usuario o contraseña incorrectos'); }
  };

  const addToCart = useCallback((item:{name:string;price:number;category:string}) => {
    if (AUTO_CATS.has(item.category)) {
      addTransaction({amount:item.price,type:'sale',description:`Directo: ${item.name}`});
      toast(`✓ ${item.name} — L.${item.price}`);
      return;
    }
    setCart(prev=>{
      const ex=prev.find(c=>c.name===item.name);
      if(ex) return prev.map(c=>c.name===item.name?{...c,quantity:c.quantity+1}:c);
      return [...prev,{id:crypto.randomUUID(),name:item.name,price:item.price,quantity:1,category:item.category}];
    });
  },[addTransaction]);

  const chargeDrink = (d:{name:string;price:number;category:string}) => {
    addTransaction({amount:d.price,type:'drink-log',description:`Bebida: ${d.name}`});
    toast(`💧 ${d.name} — L.${d.price}`);
  };

  const removeFromCart = (id: string) => setCart(p=>p.filter(i=>i.id!==id));
  const updateQty = (id: string, q: number) => { if(q<=0) removeFromCart(id); else setCart(p=>p.map(i=>i.id===id?{...i,quantity:q}:i)); };

  const sendToKitchen = () => {
    if(cart.length===0) return;
    const orderId = invoice.trim()?`#${invoice.trim()}`:`#${Date.now().toString().slice(-5)}`;
    if(kitchenItems.length>0) addOrder({id:orderId,items:kitchenItems,total:kitchenItems.reduce((s,i)=>s+i.price*i.quantity,0),timestamp:new Date().toISOString(),status:'pending',sentBy:currentUser,avatarEmoji:avatar});
    setCart([]); setInvoice('');
  };

  const confirmPayment = () => {
    if(!payingId) return;
    if(payExtras.length>0) addItemsToOrder(payingId,payExtras);
    updateOrderStatus(payingId,'delivered');
    setPayingId(null); setPayExtras([]);
  };

  const toggleSelect = (id: string) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const doDelete = () => {
    if (confirmDel === 'all') activeOrders.forEach(o => deleteOrder(o.id));
    else if (confirmDel === 'selected') selected.forEach(id => deleteOrder(id));
    setConfirmDel(null);
    exitSelectMode();
  };

  const addPayDrink = (d:{name:string;price:number;category:string}) => {
    setPayExtras(prev=>{
      const ex=prev.find(i=>i.name===d.name);
      if(ex) return prev.map(i=>i.name===d.name?{...i,quantity:i.quantity+1}:i);
      return [...prev,{id:crypto.randomUUID(),name:d.name,price:d.price,quantity:1,category:d.category}];
    });
  };

  // ── Login ──
  if (!loggedIn) {
    const inp = { width:'100%',padding:'12px 15px',borderRadius:10,border:BORDER,backgroundColor:CARD2,color:'#EDF0F4',fontSize:14,outline:'none',boxSizing:'border-box' as const,fontFamily:F };
    return (
      <div style={{ minHeight:'100vh',backgroundColor:BG,display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:F,position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(rgba(249,115,22,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.03) 1px,transparent 1px)',backgroundSize:'44px 44px' }}/>
        {notif&&<div style={{ position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',backgroundColor:'#EF4444',color:'#FFF',padding:'9px 18px',borderRadius:10,fontWeight:700,fontSize:13,zIndex:999,fontFamily:F }}>{notif}</div>}
        <div style={{ width:'100%',maxWidth:360,position:'relative' }}>
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',marginBottom:28 }}>
            <div style={{ padding:2,borderRadius:22,background:'linear-gradient(135deg,#F97316,#FBBF24,#F97316)',boxShadow:'0 0 50px rgba(249,115,22,0.25)',marginBottom:16 }}>
              <div style={{ width:80,height:80,borderRadius:20,backgroundColor:'#FFFFFF',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden' }}>
                <img src={logoImg} alt="Don de Chuy" style={{ width:'84%',height:'84%',objectFit:'contain' }}/>
              </div>
            </div>
            <h1 style={{ fontSize:22,fontWeight:900,color:'#EDF0F4',marginBottom:3 }}>Don de Chuy</h1>
            <p style={{ fontSize:11,color:'#4B5563',fontFamily:MONO,letterSpacing:1.5,textTransform:'uppercase' }}>Terminal · VENTANA</p>
          </div>

          <div style={{ backgroundColor:CARD,borderRadius:14,border:BORDER,padding:'22px 20px' }}>
            <div style={{ marginBottom:14 }}>
              <Label>Usuario</Label>
              <input type="text" value={user} onChange={e=>setUser(e.target.value)} placeholder="Tu usuario" style={inp}/>
            </div>
            <div style={{ marginBottom:18 }}>
              <Label>Contraseña</Label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="••••••••" style={inp}/>
            </div>
            <button onClick={handleLogin} style={{ width:'100%',padding:'13px',borderRadius:10,border:'none',backgroundColor:ORANGE,color:'#FFF',fontWeight:800,fontSize:15,cursor:'pointer',WebkitAppearance:'none',fontFamily:F }}>
              Iniciar sesión
            </button>
          </div>

          <button onClick={()=>navigate('/')} style={{ display:'flex',alignItems:'center',gap:6,margin:'16px auto 0',color:'#374151',fontSize:12,fontWeight:600,background:'none',border:'none',cursor:'pointer',WebkitAppearance:'none',fontFamily:F }}>
            <ArrowLeft style={{ width:13,height:13 }}/> Regresar
          </button>
        </div>
      </div>
    );
  }

  // ── Cart Panel ──
  const CartPanel = (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',backgroundColor:'#0A0C12' }}>
      <div style={{ padding:'12px 12px 9px',borderBottom:BORDER,flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9 }}>
          <div style={{ display:'flex',alignItems:'center',gap:7 }}>
            <ShoppingCart style={{ width:14,height:14,color:ORANGE }}/>
            <span style={{ fontWeight:800,fontSize:16,color:'#EDF0F4',fontFamily:F }}>Pedido</span>
            {cart.length>0&&<span style={{ backgroundColor:ORANGE,color:'#FFF',fontSize:10,fontWeight:800,borderRadius:100,padding:'2px 7px',fontFamily:MONO }}>{cart.length}</span>}
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          <Receipt style={{ width:11,height:11,color:'#374151' }}/>
          <input type="text" value={invoice} onChange={e=>setInvoice(e.target.value)} placeholder="# Factura"
            style={{ flex:1,padding:'6px 9px',borderRadius:7,border:BORDER,backgroundColor:CARD2,color:'#EDF0F4',fontSize:12,outline:'none',fontFamily:F }}/>
        </div>
      </div>

      <div style={{ flex:1,overflowY:'auto',padding:'9px 10px',display:'flex',flexDirection:'column',gap:7 }}>
        {cart.length===0 ? (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:10 }}>
            <ShoppingCart style={{ width:32,height:32,color:'#1F2937' }}/>
            <p style={{ color:'#374151',fontSize:12,fontFamily:F }}>Carrito vacío</p>
          </div>
        ) : cart.map(i=><CartItem key={i.id} item={i} onRemove={removeFromCart} onQty={updateQty}/>)}
      </div>

      <div style={{ padding:'10px',borderTop:BORDER,flexShrink:0 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9,padding:'9px 13px',backgroundColor:'rgba(249,115,22,0.07)',borderRadius:9,border:'1px solid rgba(249,115,22,0.14)' }}>
          <span style={{ fontSize:13,fontWeight:600,color:'#6B7280',fontFamily:F }}>Total</span>
          <span style={{ fontSize:22,fontWeight:800,color:ORANGE,fontFamily:MONO }}>L.{cartTotal.toFixed(2)}</span>
        </div>
        <button onClick={sendToKitchen} disabled={cart.length===0} style={{ width:'100%',padding:'12px',borderRadius:10,border:'none',backgroundColor:cart.length>0?ORANGE:'rgba(249,115,22,0.1)',color:cart.length>0?'#FFF':'#374151',fontWeight:700,fontSize:13,cursor:cart.length>0?'pointer':'not-allowed',WebkitAppearance:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:7,fontFamily:F }}>
          <Send style={{ width:14,height:14 }}/> Enviar a cocina
        </button>
      </div>
    </div>
  );

  // ── Main ──
  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',backgroundColor:BG,fontFamily:F }}>
      {/* Modals */}
      {showAvatar&&(
        <div style={{ position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.85)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
          <div style={{ backgroundColor:CARD,borderRadius:16,border:BORDER,padding:18,width:'100%',maxWidth:300 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
              <span style={{ fontWeight:700,fontSize:14,color:'#EDF0F4',fontFamily:F }}>Tu avatar</span>
              <IBtn onClick={()=>setShowAvatar(false)}><X style={{ width:14,height:14 }}/></IBtn>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:7 }}>
              {AVATARS.map(e=>(
                <button key={e} onClick={()=>{setAvatar(currentUser,e);setAvatarState(e);setShowAvatar(false);}}
                  style={{ fontSize:24,padding:'7px',borderRadius:9,border:`2px solid ${avatar===e?ORANGE:'rgba(255,255,255,0.07)'}`,backgroundColor:avatar===e?'rgba(249,115,22,0.12)':'rgba(255,255,255,0.02)',cursor:'pointer',WebkitAppearance:'none' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {notif&&(
        <div style={{ position:'fixed',top:64,left:'50%',transform:'translateX(-50%)',backgroundColor:'rgba(34,197,94,0.95)',color:'#FFF',padding:'9px 18px',borderRadius:10,fontWeight:700,fontSize:13,zIndex:999,whiteSpace:'nowrap',fontFamily:F }}>
          {notif}
        </div>
      )}

      {/* Header */}
      <header style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 14px',backgroundColor:CARD,borderBottom:BORDER,flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <IBtn onClick={()=>navigate('/')}><ArrowLeft style={{ width:14,height:14 }}/></IBtn>
          <div style={{ width:34,height:34,borderRadius:8,backgroundColor:'#FFF',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <img src={logoImg} alt="" style={{ width:'82%',height:'82%',objectFit:'contain' }}/>
          </div>
          <div>
            <p style={{ fontWeight:800,fontSize:14,color:'#EDF0F4',lineHeight:1,letterSpacing:0.3 }}>VENTANA</p>
            <p style={{ fontSize:10,color:'#374151',marginTop:1,fontFamily:MONO,letterSpacing:0.5 }}>POS · {currentUser}</p>
          </div>
        </div>

        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          <div style={{ display:'flex',borderRadius:9,border:BORDER,overflow:'hidden' }}>
            <button onClick={()=>setView('menu')} style={{ padding:'6px 13px',backgroundColor:view==='menu'?ORANGE:'transparent',color:view==='menu'?'#FFF':'#6B7280',fontWeight:700,fontSize:12,border:'none',cursor:'pointer',WebkitAppearance:'none',fontFamily:F }}>Menú</button>
            <button onClick={()=>setView('orders')} style={{ padding:'6px 13px',backgroundColor:view==='orders'?ORANGE:'transparent',color:view==='orders'?'#FFF':'#6B7280',fontWeight:700,fontSize:12,border:'none',cursor:'pointer',WebkitAppearance:'none',position:'relative',fontFamily:F }}>
              Pedidos
              {activeOrders.length>0&&<span style={{ position:'absolute',top:-4,right:-4,width:15,height:15,borderRadius:'50%',backgroundColor:'#EF4444',color:'#FFF',fontSize:8,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:MONO }}>{activeOrders.length}</span>}
            </button>
          </div>
          <IBtn onClick={()=>setShowCalc(true)}><Calculator style={{ width:14,height:14 }}/></IBtn>
          <IBtn onClick={()=>setShowAvatar(true)}>
            {avatar ? <span style={{ fontSize:17 }}>{avatar}</span> : <User style={{ width:14,height:14 }}/>}
          </IBtn>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex:1,display:'flex',overflow:'hidden' }}>
        {view==='menu' ? (
          <>
            {/* Menu area */}
            <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
              {/* Category tabs */}
              <div style={{ padding:'8px 10px',borderBottom:BORDER,backgroundColor:'#0A0C12',flexShrink:0,overflowX:'auto' }}>
                <div style={{ display:'flex',gap:5,minWidth:'max-content' }}>
                  {CATEGORIES.map(cat=>(
                    <button key={cat} onClick={()=>setSelectedCat(cat)} style={{ padding:'6px 13px',borderRadius:100,border:`1px solid ${selectedCat===cat?ORANGE+'50':'rgba(255,255,255,0.06)'}`,backgroundColor:selectedCat===cat?'rgba(249,115,22,0.12)':'rgba(255,255,255,0.02)',color:selectedCat===cat?ORANGE:'#6B7280',fontWeight:600,fontSize:11,cursor:'pointer',WebkitAppearance:'none',whiteSpace:'nowrap',fontFamily:F }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu grid */}
              <div style={{ flex:1,overflowY:'auto',padding:'10px' }}>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(115px,1fr))',gap:7 }}>
                  {filtered.map((item,i)=>(
                    <button key={i} onClick={()=>addToCart(item)} style={{ backgroundColor:CARD,border:BORDER,borderRadius:11,padding:'13px 11px',cursor:'pointer',WebkitAppearance:'none',textAlign:'left',minHeight:76,display:'flex',flexDirection:'column',justifyContent:'space-between',transition:'border-color 0.12s' }}>
                      <p style={{ fontSize:13,fontWeight:600,color:'#EDF0F4',lineHeight:1.35,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as const,fontFamily:F }}>{item.name}</p>
                      <p style={{ fontSize:16,fontWeight:800,color:ORANGE,marginTop:6,fontFamily:MONO }}>L.{item.price}</p>
                    </button>
                  ))}
                  <button onClick={()=>setShowCustom(true)} style={{ backgroundColor:'rgba(249,115,22,0.04)',border:'1px dashed rgba(249,115,22,0.2)',borderRadius:11,padding:'12px 10px',cursor:'pointer',WebkitAppearance:'none',minHeight:66,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5 }}>
                    <Plus style={{ width:16,height:16,color:ORANGE }}/>
                    <p style={{ fontSize:10,fontWeight:700,color:ORANGE,fontFamily:F }}>Otro</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Drinks panel */}
            <div style={{ width:170,borderLeft:BORDER,backgroundColor:'#080A0F',display:'flex',flexDirection:'column',flexShrink:0 }}>
              <div style={{ padding:'8px 8px 7px',borderBottom:BORDER,textAlign:'center',flexShrink:0 }}>
                <Droplets style={{ width:13,height:13,color:'#3B82F6',margin:'0 auto 3px' }}/>
                <p style={{ fontSize:11,fontWeight:700,color:'#3B82F6',letterSpacing:1.5,textTransform:'uppercase',fontFamily:MONO }}>Bebidas</p>
              </div>
              <div style={{ flex:1,overflowY:'auto',padding:'6px',display:'flex',flexDirection:'column',gap:5 }}>
                {DRINKS.map((d,i)=>(
                  <button key={i} onClick={()=>chargeDrink(d)} style={{ backgroundColor:'rgba(59,130,246,0.05)',border:'1px solid rgba(59,130,246,0.14)',borderRadius:9,padding:'8px 10px',cursor:'pointer',WebkitAppearance:'none',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,overflow:'hidden' }}>
                    <p style={{ fontSize:12,fontWeight:600,color:'#CBD5E1',lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,fontFamily:F }}>{d.name}</p>
                    <p style={{ fontSize:13,fontWeight:800,color:'#60A5FA',fontFamily:MONO,flexShrink:0 }}>L.{d.price}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
            {/* Orders toolbar */}
            {activeOrders.length>0&&(
              <div style={{ padding:'8px 14px',borderBottom:BORDER,backgroundColor:'#0A0C12',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexShrink:0 }}>
                {selectMode ? (
                  <>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <button onClick={()=>setSelected(selected.size===activeOrders.length?new Set():new Set(activeOrders.map(o=>o.id)))}
                        style={{ padding:'5px 11px',borderRadius:7,border:BORDER,backgroundColor:CARD2,color:'#9AA3B0',fontWeight:600,fontSize:11,cursor:'pointer',WebkitAppearance:'none',fontFamily:F }}>
                        {selected.size===activeOrders.length?'Deselect todo':'Selec. todo'}
                      </button>
                      <span style={{ fontSize:11,color:'#4B5563',fontFamily:MONO }}>{selected.size} seleccionado{selected.size!==1?'s':''}</span>
                    </div>
                    <div style={{ display:'flex',gap:6 }}>
                      <button onClick={exitSelectMode}
                        style={{ padding:'5px 11px',borderRadius:7,border:BORDER,backgroundColor:'transparent',color:'#6B7280',fontWeight:600,fontSize:11,cursor:'pointer',WebkitAppearance:'none',fontFamily:F }}>
                        Cancelar
                      </button>
                      <button disabled={selected.size===0} onClick={()=>setConfirmDel('selected')}
                        style={{ padding:'5px 13px',borderRadius:7,border:'none',backgroundColor:selected.size>0?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.03)',color:selected.size>0?'#EF4444':'#374151',fontWeight:700,fontSize:11,cursor:selected.size>0?'pointer':'not-allowed',WebkitAppearance:'none',fontFamily:F,display:'flex',alignItems:'center',gap:5 }}>
                        <Trash2 style={{ width:11,height:11 }}/>Borrar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize:11,color:'#4B5563',fontFamily:F }}>{activeOrders.length} pedido{activeOrders.length!==1?'s':''} activo{activeOrders.length!==1?'s':''}</span>
                    <div style={{ display:'flex',gap:6 }}>
                      <button onClick={()=>{setSelectMode(true);setSelected(new Set());}}
                        style={{ padding:'5px 11px',borderRadius:7,border:BORDER,backgroundColor:CARD2,color:'#9AA3B0',fontWeight:600,fontSize:11,cursor:'pointer',WebkitAppearance:'none',fontFamily:F }}>
                        Seleccionar
                      </button>
                      <button onClick={()=>setConfirmDel('all')}
                        style={{ padding:'5px 11px',borderRadius:7,border:'1px solid rgba(239,68,68,0.2)',backgroundColor:'rgba(239,68,68,0.08)',color:'#EF4444',fontWeight:700,fontSize:11,cursor:'pointer',WebkitAppearance:'none',fontFamily:F,display:'flex',alignItems:'center',gap:5 }}>
                        <Trash2 style={{ width:11,height:11 }}/>Borrar todo
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <div style={{ flex:1,overflowY:'auto',padding:'14px' }}>
              {activeOrders.length===0 ? (
                <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:300,gap:12 }}>
                  <CheckCircle style={{ width:44,height:44,color:'#1F2937' }}/>
                  <p style={{ fontSize:15,fontWeight:700,color:'#374151',fontFamily:F }}>Sin pedidos activos</p>
                </div>
              ) : (
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12 }}>
                  {activeOrders.map(order=>(
                    <div key={order.id} style={{ position:'relative' }}>
                      {selectMode&&(
                        <button onClick={()=>toggleSelect(order.id)} style={{ position:'absolute',top:10,right:10,zIndex:5,width:22,height:22,borderRadius:6,border:`2px solid ${selected.has(order.id)?'#EF4444':'rgba(255,255,255,0.18)'}`,backgroundColor:selected.has(order.id)?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.04)',cursor:'pointer',WebkitAppearance:'none',display:'flex',alignItems:'center',justifyContent:'center' }}>
                          {selected.has(order.id)&&<span style={{ color:'#EF4444',fontSize:11,fontWeight:900 }}>✓</span>}
                        </button>
                      )}
                      <div onClick={selectMode?()=>toggleSelect(order.id):undefined} style={{ opacity:selectMode&&!selected.has(order.id)?0.6:1,transition:'opacity 0.15s',cursor:selectMode?'pointer':'default' }}>
                        <OrderCard order={order}
                          onDeliver={()=>!selectMode&&updateOrderStatus(order.id,'delivered')}
                          onPay={()=>!selectMode&&(setPayingId(order.id),setPayExtras([]))}
                          onMarkItem={id=>!selectMode&&markItemReady(order.id,id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cart panel */}
        <div style={{ width:248,borderLeft:BORDER,display:'flex',flexDirection:'column',flexShrink:0 }}>
          {CartPanel}
        </div>
      </div>

      {/* Confirm delete modal */}
      {confirmDel&&(
        <div style={{ position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:20 }}>
          <div style={{ width:'100%',maxWidth:320,backgroundColor:CARD,borderRadius:16,border:'1px solid rgba(239,68,68,0.25)',overflow:'hidden' }}>
            <div style={{ padding:'20px 20px 16px',textAlign:'center' }}>
              <div style={{ width:48,height:48,borderRadius:14,backgroundColor:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px' }}>
                <Trash2 style={{ width:20,height:20,color:'#EF4444' }}/>
              </div>
              <p style={{ fontWeight:800,fontSize:16,color:'#EDF0F4',marginBottom:6,fontFamily:F }}>
                {confirmDel==='all'?'¿Borrar todos los pedidos?':`¿Borrar ${selected.size} pedido${selected.size!==1?'s':''}?`}
              </p>
              <p style={{ fontSize:12,color:'#4B5563',fontFamily:F }}>Esta acción no se puede deshacer.</p>
            </div>
            <div style={{ display:'flex',gap:8,padding:'0 16px 16px' }}>
              <button onClick={()=>setConfirmDel(null)} style={{ flex:1,padding:'11px',borderRadius:9,border:BORDER,backgroundColor:CARD2,color:'#6B7280',fontWeight:700,fontSize:13,cursor:'pointer',WebkitAppearance:'none',fontFamily:F }}>Cancelar</button>
              <button onClick={doDelete} style={{ flex:1,padding:'11px',borderRadius:9,border:'none',backgroundColor:'#EF4444',color:'#FFF',fontWeight:800,fontSize:13,cursor:'pointer',WebkitAppearance:'none',fontFamily:F }}>Borrar</button>
            </div>
          </div>
        </div>
      )}
      {showCustom&&<CustomModal onAdd={addToCart} onClose={()=>setShowCustom(false)}/>}
      {showCalc&&<CalcModal onClose={()=>setShowCalc(false)}/>}
      {payOrder&&(
        <PayModal total={payOrder.total} items={payOrder.items} extras={payExtras}
          onConfirm={confirmPayment}
          onCancel={()=>{setPayingId(null);setPayExtras([]);}}
          onAddDrink={addPayDrink}
        />
      )}
    </div>
  );
}
