import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOrders } from './OrderContext';
import { ShoppingCart, ChefHat, Wifi, WifiOff, RefreshCw, AlertTriangle, Copy, Check } from 'lucide-react';

import logoImg from '../../imports/image-1.png';

const F = "'Inter', -apple-system, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const FIX_SQL = `-- Pegar en Supabase → SQL Editor → Run
alter table orders disable row level security;
alter table transactions disable row level security;
grant all on orders to anon;
grant all on transactions to anon;
grant usage on schema public to anon;`;

function DbErrorBanner({ error }: { error: string }) {
  const [copied, setCopied] = useState(false);

  const isRls = error === 'rls';
  const isNoTable = error === 'no_table';

  const copy = () => {
    navigator.clipboard.writeText(FIX_SQL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ width:'100%', maxWidth:420, backgroundColor:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:14, padding:'16px', marginBottom:20, fontFamily:F }}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:12 }}>
        <AlertTriangle style={{ width:18, height:18, color:'#EF4444', flexShrink:0, marginTop:1 }}/>
        <div>
          <p style={{ fontWeight:800, fontSize:14, color:'#EDF0F4', marginBottom:3 }}>
            {isRls ? 'Sin permiso en la base de datos' : isNoTable ? 'Tablas no encontradas' : 'Error de base de datos'}
          </p>
          <p style={{ fontSize:12, color:'#9AA3B0', lineHeight:1.5 }}>
            {isRls
              ? 'Supabase bloqueó el acceso. Los pedidos no se sincronizan entre dispositivos.'
              : isNoTable
              ? 'Las tablas orders/transactions no existen en tu proyecto Supabase.'
              : `Error de Supabase: ${error}`}
          </p>
        </div>
      </div>

      {(isRls || isNoTable) && (
        <>
          <p style={{ fontSize:11, fontWeight:700, color:'#6B7280', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>
            {isRls ? 'Solución — corre este SQL en Supabase:' : 'Solución — crear tablas primero'}
          </p>
          <div style={{ position:'relative', backgroundColor:'#060809', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', padding:'10px 12px', marginBottom:8 }}>
            <pre style={{ fontSize:11, color:'#9AA3B0', margin:0, whiteSpace:'pre-wrap', fontFamily:MONO, lineHeight:1.6 }}>{FIX_SQL}</pre>
            <button onClick={copy} style={{ position:'absolute', top:8, right:8, display:'flex', alignItems:'center', gap:4, padding:'4px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', backgroundColor:'rgba(255,255,255,0.05)', color:copied?'#22C55E':'#6B7280', fontSize:10, fontWeight:700, cursor:'pointer', WebkitAppearance:'none', fontFamily:MONO }}>
              {copied ? <Check style={{ width:10, height:10 }}/> : <Copy style={{ width:10, height:10 }}/>}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p style={{ fontSize:11, color:'#4B5563', lineHeight:1.5 }}>
            Supabase → tu proyecto → <strong style={{ color:'#6B7280' }}>SQL Editor</strong> → pegar → <strong style={{ color:'#6B7280' }}>Run</strong>
          </p>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { connected, orders, reconnect, dbError, pendingCount } = useOrders();
  const [taps, setTaps] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);

  const handleReconnect = async () => {
    setReconnecting(true);
    await reconnect();
    setTimeout(() => setReconnecting(false), 1000);
  };

  const handleLogoTap = () => {
    const n = taps + 1;
    setTaps(n);
    if (n >= 5) { navigate('/admin'); setTaps(0); return; }
    setTimeout(() => setTaps(0), 3000);
  };

  const ready  = orders.filter(o => o.status === 'ready').length;
  const active = orders.filter(o => o.status !== 'delivered').length;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#07090D', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', fontFamily:F, position:'relative', overflow:'hidden' }}>
      {/* Grid bg */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(249,115,22,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.03) 1px,transparent 1px)', backgroundSize:'44px 44px' }}/>
      {/* Radial glow */}
      <div style={{ position:'absolute', top:'28%', left:'50%', transform:'translateX(-50%)', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(249,115,22,0.07) 0%,transparent 70%)', pointerEvents:'none' }}/>

      {/* Logo */}
      <div onClick={handleLogoTap} style={{ marginBottom:32, cursor:'pointer', userSelect:'none', position:'relative' }}>
        <div style={{ padding:3, borderRadius:28, background:'linear-gradient(135deg,#F97316 0%,#FBBF24 50%,#F97316 100%)', boxShadow:'0 0 80px rgba(249,115,22,0.3),0 0 25px rgba(249,115,22,0.12)' }}>
          <div style={{ width:196, height:196, borderRadius:26, backgroundColor:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            <img src={logoImg} alt="Don de Chuy" style={{ width:'86%', height:'86%', objectFit:'contain' }}/>
          </div>
        </div>
        <div style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width:4, height:4, borderRadius:'50%', backgroundColor:i<taps?'#F97316':'rgba(249,115,22,0.18)', transition:'background-color 0.15s' }}/>
          ))}
        </div>
      </div>

      {/* Title */}
      <h1 style={{ fontSize:34, fontWeight:900, color:'#EDF0F4', letterSpacing:-0.5, marginBottom:6, textAlign:'center' }}>Don de Chuy</h1>
      <p style={{ fontSize:13, color:'#374151', fontWeight:600, letterSpacing:3, textTransform:'uppercase', marginBottom:28, textAlign:'center' }}>Business · Sistema POS</p>

      {/* DB error banner */}
      {dbError && <DbErrorBanner error={dbError} />}

      {/* Pending sync warning — shows even without dbError */}
      {!dbError && connected && pendingCount > 0 && (
        <div style={{ width:'100%', maxWidth:420, backgroundColor:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.25)', borderRadius:12, padding:'13px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <AlertTriangle style={{ width:16, height:16, color:'#FBBF24', flexShrink:0 }}/>
          <p style={{ fontSize:13, color:'#D97706', fontWeight:600, fontFamily:F }}>
            {pendingCount} pedido{pendingCount !== 1 ? 's' : ''} sin sincronizar — las escrituras a Supabase están fallando
          </p>
        </div>
      )}

      {/* Status */}
      <div style={{ marginBottom:36, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:100, backgroundColor:connected?'rgba(34,197,94,0.07)':'rgba(239,68,68,0.07)', border:`1px solid ${connected?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'}` }}>
          {connected ? <Wifi style={{ width:14, height:14, color:'#22C55E' }}/> : <WifiOff style={{ width:14, height:14, color:'#EF4444' }}/>}
          <span style={{ fontSize:13, fontWeight:700, color:connected?'#22C55E':'#EF4444', fontFamily:MONO, letterSpacing:1 }}>
            {connected?'ONLINE':'OFFLINE'}
          </span>
        </div>
        {!connected && (
          <button onClick={handleReconnect} disabled={reconnecting} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:100, border:'1px solid rgba(249,115,22,0.3)', backgroundColor:'rgba(249,115,22,0.08)', color:'#F97316', fontWeight:700, fontSize:12, cursor:reconnecting?'not-allowed':'pointer', WebkitAppearance:'none', fontFamily:MONO }}>
            <RefreshCw style={{ width:12, height:12, animation:reconnecting?'spin 1s linear infinite':undefined }}/>
            {reconnecting ? 'Conectando...' : 'Reconectar'}
          </button>
        )}
      </div>

      {/* Nav buttons */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, width:'100%', maxWidth:380, marginBottom:12 }}>
        <NavBtn
          label="Ventana"
          sub="Punto de venta"
          icon={<ShoppingCart style={{ width:26, height:26, color:'#F97316' }}/>}
          accent="#F97316"
          onClick={() => navigate('/pos')}
        />
        <NavBtn
          label="Cocina"
          sub="Display KDS"
          icon={<ChefHat style={{ width:26, height:26, color:'#FBBF24' }}/>}
          accent="#FBBF24"
          badge={ready > 0 ? ready : undefined}
          onClick={() => navigate('/kitchen')}
        />
      </div>

      {active > 0 && (
        <button onClick={() => navigate('/pos')} style={{ width:'100%', maxWidth:380, backgroundColor:'#0E1117', border:'1px solid rgba(249,115,22,0.18)', borderRadius:12, padding:'13px 18px', cursor:'pointer', WebkitAppearance:'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', backgroundColor:'#F97316', boxShadow:'0 0 6px #F97316' }}/>
            <span style={{ fontSize:14, fontWeight:500, color:'#6B7280' }}>
              <span style={{ color:'#F97316', fontFamily:MONO, fontWeight:700, fontSize:15 }}>{active}</span> pedido{active!==1?'s':''} activo{active!==1?'s':''}
            </span>
          </div>
          <span style={{ color:'#F97316', fontSize:18 }}>›</span>
        </button>
      )}

      <p style={{ marginTop:44, fontSize:11, color:'#1F2937', fontFamily:MONO, letterSpacing:1.5 }}>DDC POS · v2025</p>
    </div>
  );
}

function NavBtn({ label, sub, icon, accent, badge, onClick }: {
  label: string; sub: string; icon: React.ReactNode;
  accent: string; badge?: number; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ backgroundColor:hov?'#111620':'#0E1117', border:`1px solid ${hov?accent+'40':'rgba(255,255,255,0.07)'}`, borderRadius:14, padding:'24px 12px', cursor:'pointer', WebkitAppearance:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:10, transition:'all 0.15s', position:'relative' }}>
      {badge !== undefined && (
        <div style={{ position:'absolute', top:8, right:8, minWidth:20, height:20, borderRadius:100, backgroundColor:'#22C55E', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 5px' }}>
          <span style={{ color:'#FFF', fontSize:10, fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>{badge}</span>
        </div>
      )}
      <div style={{ width:48, height:48, borderRadius:13, backgroundColor:`${accent}15`, border:`1px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {icon}
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontWeight:800, fontSize:16, color:'#EDF0F4', letterSpacing:0.5, textTransform:'uppercase' }}>{label}</p>
        <p style={{ fontSize:12, color:'#4B5563', marginTop:3 }}>{sub}</p>
      </div>
    </button>
  );
}
