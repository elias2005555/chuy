import { useOrders, Order } from './OrderContext';
import { useNavigate } from 'react-router';
import { ArrowLeft, Clock, CheckCircle, ChefHat, Wifi, WifiOff } from 'lucide-react';
import { useState, memo } from 'react';
import logoImg from '../../imports/image-1.png';

const F    = "'Inter',-apple-system,sans-serif";
const MONO = "'JetBrains Mono',monospace";
const BG   = '#05070A';
const CARD = '#0C0F15';
const BORDER = '1px solid rgba(255,255,255,0.07)';

function AvatarImg({ src, size = 28 }: { src: string; size?: number }) {
  const isUrl = src?.startsWith('http') || src?.startsWith('//');
  if (isUrl) return <img src={src} alt="" width={size} height={size} style={{ borderRadius:'50%', objectFit:'cover', display:'block' }}/>;
  return <span style={{ fontSize: size * 0.8, lineHeight:1 }}>{src}</span>;
}

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

const OrderTicket = memo(function OrderTicket({ order, onNext, onMarkItem, dimmed, now }: {
  order: Order; onNext:()=>void; onMarkItem:(id:string)=>void; dimmed?:boolean; now: number;
}) {
  const meta = STATUS_META[order.status];
  const time = elapsed(order.timestamp);
  void now; // triggers re-render from parent tick

  const allDone = order.items.every(i=>order.deliveredItems.includes(i.id));

  return (
    <div style={{
      backgroundColor: CARD,
      borderRadius: 16,
      border: `1px solid ${dimmed ? 'rgba(255,255,255,0.04)' : meta.color+'30'}`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      opacity: dimmed ? 0.45 : 1,
      transition: 'opacity 0.3s',
    }}>
      {/* Header */}
      <div style={{ backgroundColor:`${meta.color}10`, borderBottom:`1px solid ${meta.color}20`, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
        <div>
          <p style={{ fontWeight:900, fontSize:32, color:'#EDF0F4', fontFamily:MONO, lineHeight:1 }}>{order.id}</p>
          <p style={{ fontSize:26, fontWeight:900, color: dimmed ? '#4B5563' : '#EDF0F4', marginTop:7, fontFamily:F, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:28 }}>{order.avatarEmoji}</span>
            {order.sentBy}
          </p>
        </div>
        <div style={{ textAlign:'right' }}>
          <span style={{ fontSize:13, fontWeight:800, padding:'6px 14px', borderRadius:100, backgroundColor:`${meta.color}18`, color:meta.color, fontFamily:MONO, letterSpacing:0.5, display:'block', marginBottom:7 }}>
            {meta.label}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
            <Clock style={{ width:13, height:13, color:'#4B5563' }}/>
            <span style={{ fontSize:14, color:'#4B5563', fontFamily:MONO }}>{time}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding:'12px 14px', flex:1, display:'flex', flexDirection:'column', gap:6 }}>
        {order.items.map(item=>{
          const done = order.deliveredItems.includes(item.id);
          return (
            <button key={item.id} onClick={()=>!dimmed&&onMarkItem(item.id)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
              borderRadius:11, border:`1px solid ${done?'rgba(34,197,94,0.25)':'rgba(255,255,255,0.05)'}`,
              backgroundColor:done?'rgba(34,197,94,0.07)':'rgba(255,255,255,0.025)',
              cursor: dimmed ? 'default' : 'pointer', WebkitAppearance:'none', textAlign:'left', width:'100%',
            }}>
              <div style={{ width:26, height:26, borderRadius:7, flexShrink:0, backgroundColor:done?'#22C55E':'transparent', border:`2px solid ${done?'#22C55E':'rgba(255,255,255,0.14)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {done&&<span style={{ color:'#FFF', fontSize:13, fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ flex:1, fontSize:20, fontWeight:700, color:done?'#374151':'#EDF0F4', textDecoration:done?'line-through':'none', fontFamily:F }}>
                {item.quantity}× {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action */}
      {meta.next && !dimmed && (
        <div style={{ padding:'14px', borderTop:BORDER }}>
          <button onClick={onNext} style={{
            width:'100%', padding:'16px', borderRadius:12, border:'none',
            backgroundColor: meta.next==='ready'?'#22C55E':meta.color,
            color:'#FFF', fontWeight:900, fontSize:18, cursor:'pointer',
            WebkitAppearance:'none', fontFamily:F,
            opacity: allDone||order.status==='pending' ? 1 : 0.7,
          }}>
            {meta.nextLabel}
          </button>
        </div>
      )}
      {order.status==='ready' && !dimmed && (
        <div style={{ padding:'14px 18px', borderTop:BORDER, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <CheckCircle style={{ width:18, height:18, color:'#22C55E' }}/>
          <span style={{ fontSize:16, color:'#22C55E', fontWeight:800, fontFamily:F }}>Esperando al mesero</span>
        </div>
      )}
      {dimmed && (
        <div style={{ padding:'11px 18px', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
          <CheckCircle style={{ width:14, height:14, color:'#4B5563' }}/>
          <span style={{ fontSize:13, color:'#4B5563', fontWeight:700, fontFamily:F }}>Cerrado desde ventana</span>
        </div>
      )}
    </div>
  );
});

export default function KitchenDisplay() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus, markItemReady, connected } = useOrders();
  const [now, setNow] = useState(Date.now());
  useState(()=>{ const id = setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(id); });

  const active    = orders.filter(o=>o.status!=='delivered');
  const delivered = orders.filter(o=>o.status==='delivered');
  const pending   = active.filter(o=>o.status==='pending');
  const prep      = active.filter(o=>o.status==='preparing');
  const ready     = active.filter(o=>o.status==='ready');

  const handleNext = (order: Order) => {
    const meta = STATUS_META[order.status];
    if (meta.next) updateOrderStatus(order.id, meta.next);
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:BG, fontFamily:F, color:'#EDF0F4', position:'relative' }}>
      {/* Header */}
      <header style={{ backgroundColor:CARD, borderBottom:BORDER, padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>navigate('/')} style={{ width:36,height:36,borderRadius:9,border:BORDER,backgroundColor:'rgba(255,255,255,0.03)',cursor:'pointer',WebkitAppearance:'none',display:'flex',alignItems:'center',justifyContent:'center',color:'#6B7280' }}>
            <ArrowLeft style={{ width:15,height:15 }}/>
          </button>
          <div style={{ width:34,height:34,borderRadius:8,backgroundColor:'#FFF',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <img src={logoImg} alt="" style={{ width:'82%',height:'82%',objectFit:'contain' }}/>
          </div>
          <div>
            <p style={{ fontWeight:900, fontSize:16, color:'#EDF0F4', lineHeight:1 }}>COCINA</p>
            <p style={{ fontSize:11, color:'#374151', marginTop:1, fontFamily:MONO, letterSpacing:0.5 }}>Display KDS</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ display:'flex', gap:12 }}>
            {[
              { n:pending.length,  color:'#F59E0B', label:'Nuevo' },
              { n:prep.length,     color:'#3B82F6', label:'Prep.' },
              { n:ready.length,    color:'#22C55E', label:'Listo' },
            ].map(x=>(
              <div key={x.label} style={{ textAlign:'center' }}>
                <p style={{ fontSize:22, fontWeight:900, color:x.color, fontFamily:MONO, lineHeight:1 }}>{x.n}</p>
                <p style={{ fontSize:10, color:'#4B5563', fontFamily:MONO, letterSpacing:1 }}>{x.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 13px', borderRadius:100, backgroundColor:connected?'rgba(34,197,94,0.07)':'rgba(239,68,68,0.07)', border:`1px solid ${connected?'rgba(34,197,94,0.18)':'rgba(239,68,68,0.18)'}` }}>
            {connected ? <Wifi style={{ width:12,height:12,color:'#22C55E' }}/> : <WifiOff style={{ width:12,height:12,color:'#EF4444' }}/>}
            <span style={{ fontSize:11, fontWeight:800, color:connected?'#22C55E':'#EF4444', fontFamily:MONO }}>{connected?'LIVE':'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      {orders.length===0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 64px)', gap:16, position:'relative', zIndex:1 }}>
          <div style={{ width:70, height:70, borderRadius:20, backgroundColor:'rgba(249,115,22,0.07)', border:'1px solid rgba(249,115,22,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChefHat style={{ width:32, height:32, color:'rgba(249,115,22,0.4)' }}/>
          </div>
          <p style={{ fontSize:18, fontWeight:800, color:'#374151', fontFamily:F }}>Sin pedidos activos</p>
          <p style={{ fontSize:14, color:'#1F2937', fontFamily:F }}>Los pedidos aparecerán aquí en tiempo real</p>
        </div>
      ) : (
        <div style={{ padding:'18px', position:'relative', zIndex:1 }}>
          {/* Active orders */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14, alignItems:'start' }}>
            {[...pending,...prep,...ready].map(order=>(
              <OrderTicket key={order.id} order={order} onNext={()=>handleNext(order)} onMarkItem={id=>markItemReady(order.id,id)} now={now}/>
            ))}
          </div>

          {/* Delivered orders — dimmed at bottom */}
          {delivered.length>0 && (
            <div style={{ marginTop:28 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#2D3748', letterSpacing:2, textTransform:'uppercase', fontFamily:MONO, marginBottom:12 }}>
                Entregados por ventana ({delivered.length})
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12, alignItems:'start' }}>
                {delivered.map(order=>(
                  <OrderTicket key={order.id} order={order} onNext={()=>{}} onMarkItem={()=>{}} dimmed now={now}/>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
