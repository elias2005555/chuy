import { useState, useMemo } from 'react';
import { useOrders, Transaction } from './OrderContext';
import { useNavigate } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Download, X, BarChart3, Lock, RefreshCw, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import logoImg from '../../imports/image-1.png';

const ADMIN_PASS = '20052013';

const S = {
  screen: { minHeight:'100vh', backgroundColor:'#0A0A0A', fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif', color:'#EAEAEA' },
  card:   { backgroundColor:'#141414', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', padding:'18px 20px' },
  label:  { fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase' as const, letterSpacing:1, marginBottom:6 },
  input:  { width:'100%', padding:'11px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', color:'#FFF', fontSize:15, outline:'none', boxSizing:'border-box' as const },
};

// ── Password Gate ──────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pass, setPass] = useState('');
  const [err, setErr]   = useState(false);
  const navigate        = useNavigate();

  const tryUnlock = () => {
    if (pass === ADMIN_PASS) { onUnlock(); }
    else { setErr(true); setPass(''); setTimeout(() => setErr(false), 2000); }
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:360 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
          <div style={{ padding:3, borderRadius:26, background:'linear-gradient(135deg,#FF6B35,#FFB347,#FF6B35)', boxShadow:'0 0 60px rgba(255,107,53,0.35)', marginBottom:18 }}>
            <div style={{ width:180, height:125, borderRadius:24, overflow:'hidden', backgroundColor:'#111' }}>
              <img src={logoImg} alt="Don de Chuy" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            </div>
          </div>
          <div style={{ width:50, height:50, borderRadius:15, backgroundColor:'rgba(255,107,53,0.1)', border:'1px solid rgba(255,107,53,0.25)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            <Lock style={{ width:22, height:22, color:'#FF6B35' }}/>
          </div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#FFF', marginBottom:4 }}>Administración</h2>
          <p style={{ fontSize:13, color:'#555' }}>Ingresa la contraseña para continuar</p>
        </div>

        <div style={{ backgroundColor:'#141414', borderRadius:20, border:`1px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`, padding:'22px 20px', transition:'border-color 0.2s' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Contraseña</p>
          <input
            type="password" value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryUnlock()}
            placeholder="••••••••" autoFocus
            style={{ width:'100%', padding:'13px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', color:'#FFF', fontSize:16, outline:'none', boxSizing:'border-box', marginBottom:err ? 8 : 14 }}
          />
          {err && <p style={{ fontSize:12, color:'#EF4444', fontWeight:700, marginBottom:10, textAlign:'center' }}>Contraseña incorrecta</p>}
          <button onClick={tryUnlock} style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', backgroundColor:'#FF6B35', color:'#FFF', fontWeight:800, fontSize:15, cursor:'pointer', WebkitAppearance:'none' }}>
            Entrar
          </button>
        </div>

        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, margin:'18px auto 0', color:'#555', fontSize:13, fontWeight:600, background:'none', border:'none', cursor:'pointer', WebkitAppearance:'none' }}>
          <ArrowLeft style={{ width:14, height:14 }}/> Regresar
        </button>
      </div>
    </div>
  );
}

// ── Add Transaction Modal ──────────────────────────────────────────────────────
function AddTxModal({ onAdd, onClose }: {
  onAdd: (tx: { amount: number; type: Transaction['type']; description: string }) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [type, setType]     = useState<Transaction['type']>('expense');
  const [desc, setDesc]     = useState('');

  const TYPES: { value: Transaction['type']; label: string; color: string; emoji: string }[] = [
    { value:'expense',      label:'Gasto',         color:'#EF4444', emoji:'💸' },
    { value:'other-income', label:'Otro ingreso',   color:'#22C55E', emoji:'💰' },
    { value:'card-close',   label:'Cierre tarjeta', color:'#3B82F6', emoji:'💳' },
  ];

  const submit = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0 || !desc.trim()) return;
    onAdd({ amount: a, type, description: desc.trim() });
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div style={{ width:'100%', maxWidth:400, backgroundColor:'#141414', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontWeight:800, fontSize:17, color:'#FFF' }}>Nueva transacción</span>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', cursor:'pointer', color:'#666', display:'flex', alignItems:'center', justifyContent:'center', WebkitAppearance:'none' }}>
            <X style={{ width:15, height:15 }}/>
          </button>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Tipo</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {TYPES.map(t => (
                <button key={t.value} onClick={() => setType(t.value)} style={{ padding:'10px 6px', borderRadius:12, border:`1px solid ${type===t.value ? t.color+'60' : 'rgba(255,255,255,0.06)'}`, backgroundColor: type===t.value ? t.color+'15' : 'rgba(255,255,255,0.03)', color: type===t.value ? t.color : '#555', fontWeight:700, fontSize:11, cursor:'pointer', WebkitAppearance:'none', textAlign:'center' }}>
                  <div style={{ fontSize:18, marginBottom:3 }}>{t.emoji}</div>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Monto (L.)</p>
            <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', color:'#FFF', fontSize:22, fontWeight:900, outline:'none', boxSizing:'border-box', textAlign:'center' }}/>
          </div>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Descripción</p>
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ej: Compra de ingredientes"
              style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', color:'#FFF', fontSize:14, outline:'none', boxSizing:'border-box' }}/>
          </div>
          <button onClick={submit} disabled={!amount || !desc.trim()} style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', backgroundColor: amount && desc.trim() ? '#FF6B35' : 'rgba(255,107,53,0.15)', color: amount && desc.trim() ? '#FFF' : '#444', fontWeight:800, fontSize:15, cursor: amount && desc.trim() ? 'pointer' : 'not-allowed', WebkitAppearance:'none' }}>
            Agregar transacción
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon }: { label:string; value:string; sub?:string; color:string; icon:any }) {
  return (
    <div style={{ backgroundColor:'#141414', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', padding:'16px 18px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:1 }}>{label}</p>
        <div style={{ width:32, height:32, borderRadius:10, backgroundColor:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon style={{ width:15, height:15, color }}/>
        </div>
      </div>
      <p style={{ fontSize:26, fontWeight:900, color, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'#444', marginTop:5 }}>{sub}</p>}
    </div>
  );
}

// ── Transaction Row ────────────────────────────────────────────────────────────
function TxRow({ tx, onDelete, typeColor, typeLabel }: {
  tx: Transaction; onDelete: (id:string) => void;
  typeColor: Record<string,string>; typeLabel: Record<string,string>;
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', backgroundColor:'rgba(255,255,255,0.02)', borderRadius:10, border:'1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ width:8, height:8, borderRadius:'50%', backgroundColor: typeColor[tx.type]||'#666', flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:'#EAEAEA', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.description}</p>
        <p style={{ fontSize:11, color:'#444', marginTop:1 }}>
          {typeLabel[tx.type]||tx.type} · {new Date(tx.timestamp).toLocaleDateString('es-HN')} {new Date(tx.timestamp).toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'})}
        </p>
      </div>
      <span style={{ fontSize:13, fontWeight:800, color: typeColor[tx.type]||'#FFF', flexShrink:0 }}>
        {tx.type==='expense'?'-':'+'}L.{tx.amount.toFixed(2)}
      </span>
      <button onClick={() => onDelete(tx.id)} style={{ width:30, height:30, borderRadius:8, border:'1px solid rgba(239,68,68,0.2)', backgroundColor:'rgba(239,68,68,0.08)', color:'#EF4444', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitAppearance:'none', flexShrink:0 }}>
        <Trash2 style={{ width:13, height:13 }}/>
      </button>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    transactions, deleteTransaction, addTransaction,
    getTotalSales, getTotalExpenses, getOtherIncome, getNetProfit,
    buildDailySummary, closeDayAndClean, orders,
  } = useOrders();

  const [unlocked, setUnlocked] = useState(false);
  const [showAdd, setShowAdd]   = useState(false);
  const [tab, setTab]           = useState<'overview'|'transactions'|'close'>('overview');
  const [closing, setClosing]   = useState(false);
  const [closeMsg, setCloseMsg] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const todaySales    = useMemo(() => transactions.filter(t=>t.timestamp.startsWith(today)&&t.type==='sale').reduce((s,t)=>s+t.amount,0), [transactions,today]);
  const todayExpenses = useMemo(() => transactions.filter(t=>t.timestamp.startsWith(today)&&t.type==='expense').reduce((s,t)=>s+t.amount,0), [transactions,today]);
  const todayOther    = useMemo(() => transactions.filter(t=>t.timestamp.startsWith(today)&&(t.type==='other-income'||t.type==='card-close')).reduce((s,t)=>s+t.amount,0), [transactions,today]);
  const todayNet      = todaySales + todayOther - todayExpenses;
  const todayTx       = useMemo(() => [...transactions].filter(t=>t.timestamp.startsWith(today)).sort((a,b)=>b.timestamp.localeCompare(a.timestamp)), [transactions,today]);

  const typeColor: Record<string,string> = { sale:'#22C55E', expense:'#EF4444', 'other-income':'#3B82F6', 'card-close':'#8B5CF6', 'drink-log':'#F59E0B' };
  const typeLabel: Record<string,string> = { sale:'Venta', expense:'Gasto', 'other-income':'Ingreso extra', 'card-close':'Cierre tarjeta', 'drink-log':'Bebida directa' };

  const downloadPDF = (date = today) => {
    const s = buildDailySummary(date);
    const doc = new jsPDF();
    let y = 18;
    doc.setFontSize(20); doc.setFont('helvetica','bold');
    doc.text('Don de Chuy Business — Resumen Diario', 15, y); y += 10;
    doc.setFontSize(11); doc.setFont('helvetica','normal');
    doc.text(`Fecha: ${date}   Generado: ${new Date().toLocaleString('es-HN')}`, 15, y); y += 14;
    doc.setFillColor(245,245,245); doc.rect(15,y,180,34,'F'); y += 6;
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.text('RESUMEN FINANCIERO', 20, y); y += 7;
    doc.setFontSize(11); doc.setFont('helvetica','normal');
    doc.text(`Ventas: L.${s.totalSales.toFixed(2)}   Gastos: L.${s.totalExpenses.toFixed(2)}`, 20, y); y += 6;
    doc.text(`Otros ingresos: L.${s.otherIncome.toFixed(2)}   Utilidad neta: L.${s.netProfit.toFixed(2)}`, 20, y); y += 14;
    if (s.itemsSold.length > 0) {
      doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.text('Artículos Vendidos', 15, y); y += 8;
      doc.setFontSize(9); doc.setFont('helvetica','normal');
      s.itemsSold.forEach(item => { doc.text(`  ${item.name}  ·  ${item.qty} uds  ·  L.${item.total.toFixed(2)}`, 15, y); y += 5; if(y>270){doc.addPage();y=20;} });
      y += 4;
    }
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.text('Transacciones', 15, y); y += 8;
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    s.transactions.sort((a,b)=>a.timestamp.localeCompare(b.timestamp)).forEach(tx => {
      const time = new Date(tx.timestamp).toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'});
      doc.text(`  [${time}]  ${typeLabel[tx.type]||tx.type}  ·  ${tx.description}  ·  ${tx.type==='expense'?'-':'+'}L.${tx.amount.toFixed(2)}`, 15, y);
      y += 5; if(y>275){doc.addPage();y=20;}
    });
    doc.save(`don-de-chuy-${date}.pdf`);
  };

  const handleCloseDay = async () => {
    if (!window.confirm(`¿Cerrar el día ${today}? Se descargará el PDF y se borrarán los pedidos de hoy.`)) return;
    setClosing(true);
    downloadPDF(today);
    await closeDayAndClean(today);
    setClosing(false);
    setCloseMsg(`Día ${today} cerrado exitosamente.`);
  };

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)}/>;

  const TABS = [
    { key:'overview' as const,     label:'Resumen hoy' },
    { key:'transactions' as const, label:'Transacciones' },
    { key:'close' as const,        label:'Cierre del día' },
  ];

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#0A0A0A', fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif', color:'#EAEAEA' }}>
      {showAdd && <AddTxModal onAdd={addTransaction} onClose={() => setShowAdd(false)}/>}

      {/* Header */}
      <header style={{ backgroundColor:'#141414', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'11px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => navigate('/')} style={{ width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#888', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitAppearance:'none' }}>
            <ArrowLeft style={{ width:16, height:16 }}/>
          </button>
          <div style={{ width:52, height:36, borderRadius:9, overflow:'hidden', border:'1px solid rgba(255,107,53,0.3)' }}>
            <img src={logoImg} alt="Don de Chuy" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          </div>
          <div>
            <p style={{ fontWeight:900, fontSize:15, color:'#FFF', lineHeight:1 }}>Administración</p>
            <p style={{ fontSize:11, color:'#555', marginTop:2 }}>Don de Chuy Business</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => downloadPDF(today)} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', color:'#888', fontWeight:700, fontSize:13, cursor:'pointer', WebkitAppearance:'none' }}>
            <Download style={{ width:13, height:13 }}/> PDF
          </button>
          <button onClick={() => setShowAdd(true)} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:10, border:'none', backgroundColor:'#FF6B35', color:'#FFF', fontWeight:700, fontSize:13, cursor:'pointer', WebkitAppearance:'none' }}>
            <Plus style={{ width:13, height:13 }}/> Agregar
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, padding:'12px 16px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:'9px 16px', borderRadius:'10px 10px 0 0', border:'none',
            backgroundColor: tab===t.key ? '#1A1A1A' : 'transparent',
            color: tab===t.key ? '#FFF' : '#555', fontWeight:700, fontSize:13, cursor:'pointer', WebkitAppearance:'none',
            borderBottom: tab===t.key ? '2px solid #FF6B35' : '2px solid transparent', whiteSpace:'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'18px 16px', maxWidth:960, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>

        {/* ── Overview tab ── */}
        {tab === 'overview' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:11, marginBottom:18 }}>
              <StatCard label="Ventas hoy"     value={`L.${todaySales.toFixed(2)}`}    sub={`${todayTx.filter(t=>t.type==='sale').length} operaciones`}  color="#22C55E" icon={TrendingUp}/>
              <StatCard label="Gastos hoy"     value={`L.${todayExpenses.toFixed(2)}`} sub={`${todayTx.filter(t=>t.type==='expense').length} gastos`}     color="#EF4444" icon={TrendingDown}/>
              <StatCard label="Otros ingresos" value={`L.${todayOther.toFixed(2)}`}    sub="Tarjeta + extras"                                              color="#3B82F6" icon={BarChart3}/>
              <StatCard label="Utilidad neta"  value={`L.${todayNet.toFixed(2)}`}      sub="Ventas + Otros − Gastos"                                       color={todayNet>=0?'#22C55E':'#EF4444'} icon={DollarSign}/>
            </div>

            {/* Global totals */}
            <div style={{ backgroundColor:'#141414', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', padding:'16px 18px', marginBottom:16 }}>
              <p style={{ fontWeight:800, fontSize:13, color:'#FFF', marginBottom:12 }}>Totales generales</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:9 }}>
                {[
                  { l:'Total ventas',   v:`L.${getTotalSales().toFixed(2)}`,    c:'#22C55E' },
                  { l:'Total gastos',   v:`L.${getTotalExpenses().toFixed(2)}`, c:'#EF4444' },
                  { l:'Otros ingresos', v:`L.${getOtherIncome().toFixed(2)}`,   c:'#3B82F6' },
                  { l:'Utilidad total', v:`L.${getNetProfit().toFixed(2)}`,     c: getNetProfit()>=0?'#22C55E':'#EF4444' },
                ].map(s => (
                  <div key={s.l} style={{ backgroundColor:'rgba(255,255,255,0.03)', borderRadius:11, padding:'11px 13px', border:'1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize:11, color:'#444', marginBottom:4 }}>{s.l}</p>
                    <p style={{ fontSize:19, fontWeight:900, color:s.c }}>{s.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Today activity */}
            <div style={{ backgroundColor:'#141414', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <p style={{ fontWeight:800, fontSize:13, color:'#FFF' }}>Actividad de hoy · {today}</p>
                <span style={{ fontSize:11, color:'#444' }}>{todayTx.length} movimientos</span>
              </div>
              {todayTx.length === 0
                ? <p style={{ color:'#333', fontSize:13, textAlign:'center', padding:'20px 0' }}>Sin actividad hoy</p>
                : <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {todayTx.slice(0,20).map(tx => <TxRow key={tx.id} tx={tx} typeColor={typeColor} typeLabel={typeLabel} onDelete={deleteTransaction}/>)}
                    {todayTx.length > 20 && <p style={{ color:'#444', fontSize:12, textAlign:'center', paddingTop:8 }}>+{todayTx.length-20} más en "Transacciones"</p>}
                  </div>
              }
            </div>
          </>
        )}

        {/* ── Transactions tab ── */}
        {tab === 'transactions' && (
          <div style={{ backgroundColor:'#141414', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <p style={{ fontWeight:800, fontSize:14, color:'#FFF' }}>Todas las transacciones</p>
              <span style={{ fontSize:12, color:'#444', fontWeight:600 }}>{transactions.length} total</span>
            </div>
            {transactions.length === 0
              ? <p style={{ color:'#333', fontSize:13, textAlign:'center', padding:'28px 0' }}>Sin transacciones registradas</p>
              : <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[...transactions].sort((a,b)=>b.timestamp.localeCompare(a.timestamp)).map(tx => (
                    <TxRow key={tx.id} tx={tx} typeColor={typeColor} typeLabel={typeLabel} onDelete={deleteTransaction}/>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── Close day tab ── */}
        {tab === 'close' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {closeMsg && (
              <div style={{ backgroundColor:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:14, padding:'13px 16px', color:'#22C55E', fontWeight:700, fontSize:14 }}>
                ✓ {closeMsg}
              </div>
            )}

            <div style={{ backgroundColor:'#141414', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', padding:'20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                <div style={{ width:42, height:42, borderRadius:13, backgroundColor:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Calendar style={{ width:19, height:19, color:'#FBBF24' }}/>
                </div>
                <div>
                  <p style={{ fontWeight:800, fontSize:15, color:'#FFF' }}>Cierre del día</p>
                  <p style={{ fontSize:12, color:'#555' }}>Fecha: {today}</p>
                </div>
              </div>

              <div style={{ backgroundColor:'rgba(255,255,255,0.03)', borderRadius:11, padding:'13px 15px', marginBottom:16 }}>
                <p style={{ fontSize:13, color:'#777', lineHeight:1.7 }}>
                  Al cerrar el día:<br/>
                  • Se descarga el <strong style={{ color:'#EAEAEA' }}>PDF</strong> con el resumen completo<br/>
                  • Se borran los <strong style={{ color:'#EF4444' }}>pedidos</strong> de cocina/ventana de hoy<br/>
                  • Las <strong style={{ color:'#22C55E' }}>transacciones</strong> quedan guardadas en el historial
                </p>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                <div style={{ textAlign:'center', padding:'13px', backgroundColor:'rgba(34,197,94,0.06)', borderRadius:11, border:'1px solid rgba(34,197,94,0.15)' }}>
                  <p style={{ fontSize:11, color:'#555', marginBottom:3 }}>Ventas del día</p>
                  <p style={{ fontSize:22, fontWeight:900, color:'#22C55E' }}>L.{todaySales.toFixed(2)}</p>
                </div>
                <div style={{ textAlign:'center', padding:'13px', backgroundColor: todayNet>=0?'rgba(34,197,94,0.06)':'rgba(239,68,68,0.06)', borderRadius:11, border:`1px solid ${todayNet>=0?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)'}` }}>
                  <p style={{ fontSize:11, color:'#555', marginBottom:3 }}>Utilidad neta</p>
                  <p style={{ fontSize:22, fontWeight:900, color: todayNet>=0?'#22C55E':'#EF4444' }}>L.{todayNet.toFixed(2)}</p>
                </div>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => downloadPDF(today)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', backgroundColor:'rgba(255,255,255,0.04)', color:'#EAEAEA', fontWeight:700, fontSize:14, cursor:'pointer', WebkitAppearance:'none' }}>
                  <Download style={{ width:15, height:15 }}/> Solo PDF
                </button>
                <button onClick={handleCloseDay} disabled={closing} style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:12, border:'none', backgroundColor: closing?'rgba(239,68,68,0.3)':'#EF4444', color:'#FFF', fontWeight:800, fontSize:14, cursor:closing?'not-allowed':'pointer', WebkitAppearance:'none' }}>
                  {closing ? <><RefreshCw style={{ width:15, height:15 }}/> Cerrando...</> : <><Calendar style={{ width:15, height:15 }}/> Cerrar día + PDF</>}
                </button>
              </div>
            </div>

            <div style={{ backgroundColor:'#141414', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', padding:'16px 18px' }}>
              <p style={{ fontWeight:800, fontSize:13, color:'#FFF', marginBottom:10 }}>
                Pedidos activos en cocina: <span style={{ color:'#FF6B35' }}>{orders.filter(o=>o.status!=='delivered').length}</span>
              </p>
              {orders.filter(o=>o.status!=='delivered').length === 0
                ? <p style={{ color:'#333', fontSize:13 }}>No hay pedidos pendientes</p>
                : orders.filter(o=>o.status!=='delivered').map(o => (
                    <div key={o.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 11px', backgroundColor:'rgba(255,255,255,0.03)', borderRadius:8, marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#FFF' }}>{o.id}</span>
                      <span style={{ fontSize:12, color:'#555' }}>{o.sentBy} · L.{o.total.toFixed(2)}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:100, backgroundColor:'rgba(249,115,22,0.15)', color:'#F97316' }}>{o.status}</span>
                    </div>
                  ))
              }
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
