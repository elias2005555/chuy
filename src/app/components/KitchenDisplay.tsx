import { useOrders, Order } from './OrderContext';
import { useNavigate } from 'react-router';
import { ArrowLeft, Clock, CheckCircle, ChefHat, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import logoImg from 'figma:asset/2dd061b7efdafb8480bf69f0f13ce1543d82c799.png';

const F    = "'Inter',-apple-system,sans-serif";
const MONO = "'JetBrains Mono',monospace";
const BG   = '#05070A';
const CARD = '#0C0F15';
const BORDER = '1px solid rgba(255,255,255,0.07)';

function elapsed(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s/60)}m ${s%60}s`;
}

const STATUS_META: Record<string,{label:string;color:string;next:Order['status']|null;nextLabel:string}> = {
  pending:   { label:'Nuevo',       color:'#F59E0B', next:'preparing', nextLabel:'Preparar' },
  preparing: { label:'Preparando',  color:'#3B82F6', next:'ready',    nextLabel:'Listo ✓' },
  ready:     { label:'Listo ✓',     color:'#22C55E', next:null,       nextLabel:'' },
  delivered: { label:'Entregado',   color:'#374151', next:null,       nextLabel:'' },
};

// ─── Order Ticket ─────────────────────────────────────────────────────────────
const OrderTicket = memo(function OrderTicket({ order, onNext, onMarkItem }: {
  order: Order;
  onNext: ()=>void;
  onMarkItem: (id: string)=>void;
}) {
  const [time, setTime] = useState(elapsed(order.timestamp));
  const meta = STATUS_META[order.status];

  useEffect(()=>{
    const id = setInterval(()=>setTime(elapsed(order.timestamp)), 1000);
    return ()=>clearInterval(id);
  },[order.timestamp]);

  const allDone = order.items.every(i=>order.deliveredItems.includes(i.id));

  return (
    <div style={{
      backgroundColor: CARD,
      borderRadius: 14,
      border: `1px solid ${meta.color}22`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Ticket header */}
      <div style={{ backgroundColor:`${meta.color}0E`, borderBottom:`1px solid ${meta.color}18`, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontWeight:900, fontSize:18, color:'#EDF0F4', fontFamily:MONO, lineHeight:1 }}>{order.id}</p>
          <p style={{ fontSize:10, color:'#4B5563', marginTop:3, fontFamily:F }}>
            {order.avatarEmoji} {order.sentBy}
          </p>
        </div>
        <div style={{ textAlign:'right' }}>
          <span style={{ fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:100, backgroundColor:`${meta.color}18`, color:meta.color, fontFamily:MONO, letterSpacing:0.5, display:'block', marginBottom:5 }}>
            {meta.label}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end' }}>
            <Clock style={{ width:10, height:10, color:'#4B5563' }}/>
            <span style={{ fontSize:10, color:'#4B5563', fontFamily:MONO }}>{time}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding:'8px 10px', flex:1, display:'flex', flexDirection:'column', gap:3 }}>
        {order.items.map(item=>{
          const done = order.deliveredItems.includes(item.id);
          return (
            <button key={item.id} onClick={()=>onMarkItem(item.id)} style={{
              display:'flex', alignItems:'center', gap:9, padding:'8px 10px',
              borderRadius:8, border:`1px solid ${done?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.04)'}`,
              backgroundColor:done?'rgba(34,197,94,0.06)':'rgba(255,255,255,0.02)',
              cursor:'pointer', WebkitAppearance:'none', textAlign:'left', width:'100%',
            }}>
              <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, backgroundColor:done?'#22C55E':'transparent', border:`1.5px solid ${done?'#22C55E':'rgba(255,255,255,0.12)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {done&&<span style={{ color:'#FFF', fontSize:9, fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ flex:1, fontSize:13, fontWeight:700, color:done?'#374151':'#EDF0F4', textDecoration:done?'line-through':'none', fontFamily:F }}>
                {item.quantity}× {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action */}
      {meta.next && (
        <div style={{ padding:'10px', borderTop:BORDER }}>
          <button onClick={onNext} style={{
            width:'100%', padding:'11px', borderRadius:10, border:'none',
            backgroundColor: meta.next==='ready'?'#22C55E':meta.color,
            color:'#FFF', fontWeight:800, fontSize:13, cursor:'pointer',
            WebkitAppearance:'none', fontFamily:F,
            opacity: allDone||order.status==='pending' ? 1 : 0.7,
          }}>
            {meta.nextLabel}
          </button>
        </div>
      )}
      {order.status==='ready' && (
        <div style={{ padding:'10px 14px', borderTop:BORDER, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
          <CheckCircle style={{ width:14, height:14, color:'#22C55E' }}/>
          <span style={{ fontSize:12, color:'#22C55E', fontWeight:700, fontFamily:F }}>Esperando al mesero</span>
        </div>
      )}
    </div>
  );
});

// ─── Main Kitchen Display ─────────────────────────────────────────────────────
export default function KitchenDisplay() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus, markItemReady, connected } = useOrders();

  const active   = orders.filter(o=>o.status!=='delivered');
  const pending  = active.filter(o=>o.status==='pending');
  const prep     = active.filter(o=>o.status==='preparing');
  const ready    = active.filter(o=>o.status==='ready');

  const handleNext = (order: Order) => {
    const meta = STATUS_META[order.status];
    if (meta.next) updateOrderStatus(order.id, meta.next);
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:BG, fontFamily:F, color:'#EDF0F4' }}>
      {/* Header */}
      <header style={{ backgroundColor:CARD, borderBottom:BORDER, padding:'11px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>navigate('/')} style={{ width:34,height:34,borderRadius:8,border:BORDER,backgroundColor:'rgba(255,255,255,0.03)',cursor:'pointer',WebkitAppearance:'none',display:'flex',alignItems:'center',justifyContent:'center',color:'#6B7280' }}>
            <ArrowLeft style={{ width:14,height:14 }}/>
          </button>
          <div style={{ width:32,height:32,borderRadius:8,backgroundColor:'#FFF',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <img src={logoImg} alt="" style={{ width:'82%',height:'82%',objectFit:'contain' }}/>
          </div>
          <div>
            <p style={{ fontWeight:800, fontSize:14, color:'#EDF0F4', lineHeight:1 }}>COCINA</p>
            <p style={{ fontSize:10, color:'#374151', marginTop:1, fontFamily:MONO, letterSpacing:0.5 }}>Display KDS</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Status counts */}
          <div style={{ display:'flex', gap:8 }}>
            {[
              { n:pending.length,  color:'#F59E0B', label:'Nuevo' },
              { n:prep.length,     color:'#3B82F6', label:'Prep.' },
              { n:ready.length,    color:'#22C55E', label:'Listo' },
            ].map(x=>(
              <div key={x.label} style={{ textAlign:'center' }}>
                <p style={{ fontSize:18, fontWeight:900, color:x.color, fontFamily:MONO, lineHeight:1 }}>{x.n}</p>
                <p style={{ fontSize:9, color:'#4B5563', fontFamily:MONO, letterSpacing:1 }}>{x.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:100, backgroundColor:connected?'rgba(34,197,94,0.07)':'rgba(239,68,68,0.07)', border:`1px solid ${connected?'rgba(34,197,94,0.18)':'rgba(239,68,68,0.18)'}` }}>
            {connected ? <Wifi style={{ width:11,height:11,color:'#22C55E' }}/> : <WifiOff style={{ width:11,height:11,color:'#EF4444' }}/>}
            <span style={{ fontSize:10, fontWeight:700, color:connected?'#22C55E':'#EF4444', fontFamily:MONO }}>{connected?'LIVE':'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      {active.length===0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 60px)', gap:14 }}>
          <div style={{ width:60, height:60, borderRadius:18, backgroundColor:'rgba(249,115,22,0.07)', border:'1px solid rgba(249,115,22,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChefHat style={{ width:28, height:28, color:'rgba(249,115,22,0.4)' }}/>
          </div>
          <p style={{ fontSize:16, fontWeight:700, color:'#374151', fontFamily:F }}>Sin pedidos activos</p>
          <p style={{ fontSize:12, color:'#1F2937', fontFamily:F }}>Los pedidos aparecerán aquí en tiempo real</p>
        </div>
      ) : (
        <div style={{ padding:'16px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12, alignItems:'start' }}>
          {/* Pending first, then preparing, then ready */}
          {[...pending,...prep,...ready].map(order=>(
            <OrderTicket
              key={order.id}
              order={order}
              onNext={()=>handleNext(order)}
              onMarkItem={id=>markItemReady(order.id,id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
