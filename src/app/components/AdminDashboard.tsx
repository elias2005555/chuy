import { useState, useMemo } from 'react';
import { useOrders, Transaction } from './OrderContext';
import { useNavigate } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Download, X, Lock, RefreshCw, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import logoImg from 'figma:asset/2dd061b7efdafb8480bf69f0f13ce1543d82c799.png';

const F    = "'Inter',-apple-system,sans-serif";
const MONO = "'JetBrains Mono',monospace";
const BG   = '#07090D';
const CARD = '#0E1117';
const CARD2= '#111620';
const BORDER = '1px solid rgba(255,255,255,0.07)';
const ORANGE = '#F97316';
const ADMIN_PASS = '20052013';

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize:10, fontWeight:700, color:'#4B5563', textTransform:'uppercase' as const, letterSpacing:1.5, marginBottom:7, fontFamily:MONO }}>{children}</p>;
}
function IBtn({ onClick, children }: { onClick?:()=>void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ width:34, height:34, borderRadius:8, border:BORDER, backgroundColor:CARD2, cursor:'pointer', WebkitAppearance:'none', display:'flex', alignItems:'center', justifyContent:'center', color:'#6B7280' }}>
      {children}
    </button>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function Stat({ label, value, icon, color, sub }: { label:string; value:string; icon:React.ReactNode; color:string; sub?:string }) {
  return (
    <div style={{ backgroundColor:CARD, border:BORDER, borderRadius:12, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, right:0, width:60, height:60, borderRadius:'0 12px 0 60px', backgroundColor:`${color}08` }}/>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:1.5, fontFamily:MONO }}>{label}</span>
        <div style={{ color }}>{icon}</div>
      </div>
      <p style={{ fontSize:22, fontWeight:800, color:'#EDF0F4', fontFamily:MONO, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:10, color:'#374151', marginTop:5, fontFamily:F }}>{sub}</p>}
    </div>
  );
}

// ─── Add Tx Modal ─────────────────────────────────────────────────────────────
function AddTxModal({ onAdd, onClose }: { onAdd:(tx:{amount:number;type:Transaction['type'];description:string})=>void; onClose:()=>void }) {
  const [amount,setAmount] = useState('');
  const [type,setType]     = useState<Transaction['type']>('expense');
  const [desc,setDesc]     = useState('');

  const TYPES = [
    { value:'expense'      as Transaction['type'], label:'Gasto',         color:'#EF4444', emoji:'💸' },
    { value:'other-income' as Transaction['type'], label:'Otro ingreso',  color:'#22C55E', emoji:'💰' },
    { value:'card-close'   as Transaction['type'], label:'Cierre tarjeta',color:'#3B82F6', emoji:'💳' },
  ];

  const inp = { width:'100%', padding:'11px 13px', borderRadius:9, border:BORDER, backgroundColor:CARD2, color:'#EDF0F4', fontSize:14, outline:'none', boxSizing:'border-box' as const, fontFamily:F };

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16 }}>
      <div style={{ width:'100%', maxWidth:380, backgroundColor:CARD, borderRadius:16, border:BORDER, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:BORDER }}>
          <span style={{ fontWeight:700, fontSize:15, color:'#EDF0F4', fontFamily:F }}>Nueva transacción</span>
          <IBtn onClick={onClose}><X style={{ width:14, height:14 }}/></IBtn>
        </div>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <Label>Tipo</Label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
              {TYPES.map(t=>(
                <button key={t.value} onClick={()=>setType(t.value)} style={{ padding:'10px 6px', borderRadius:10, border:`1px solid ${type===t.value?t.color+'40':'rgba(255,255,255,0.07)'}`, backgroundColor:type===t.value?`${t.color}12`:'rgba(255,255,255,0.02)', color:type===t.value?t.color:'#6B7280', fontWeight:700, fontSize:10, cursor:'pointer', WebkitAppearance:'none', textAlign:'center', fontFamily:F }}>
                  <div style={{ fontSize:18, marginBottom:3 }}>{t.emoji}</div>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div><Label>Monto (L.)</Label><input type="number" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={{ ...inp, fontSize:18, fontFamily:MONO }}/></div>
          <div><Label>Descripción</Label><input type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ej: Compra de gas" style={inp}/></div>
          <button
            onClick={()=>{ const a=parseFloat(amount); if(a>0&&desc.trim()){onAdd({amount:a,type,description:desc.trim()});onClose();} }}
            style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', backgroundColor:ORANGE, color:'#FFF', fontWeight:700, fontSize:14, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Password Gate ────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock:()=>void }) {
  const [pass,setPass] = useState('');
  const [err,setErr]   = useState(false);
  const navigate = useNavigate();

  const tryUnlock = () => {
    if (pass===ADMIN_PASS) { onUnlock(); }
    else { setErr(true); setPass(''); setTimeout(()=>setErr(false),2000); }
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:BG, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:F, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(249,115,22,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.03) 1px,transparent 1px)', backgroundSize:'44px 44px' }}/>
      <div style={{ width:'100%', maxWidth:340, position:'relative' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
          <div style={{ padding:2, borderRadius:22, background:'linear-gradient(135deg,#F97316,#FBBF24,#F97316)', boxShadow:'0 0 50px rgba(249,115,22,0.2)', marginBottom:16 }}>
            <div style={{ width:80, height:80, borderRadius:20, backgroundColor:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              <img src={logoImg} alt="Don de Chuy" style={{ width:'84%', height:'84%', objectFit:'contain' }}/>
            </div>
          </div>
          <div style={{ width:42, height:42, borderRadius:12, backgroundColor:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            <Lock style={{ width:18, height:18, color:ORANGE }}/>
          </div>
          <h2 style={{ fontSize:20, fontWeight:900, color:'#EDF0F4', marginBottom:3 }}>Administración</h2>
          <p style={{ fontSize:11, color:'#4B5563', fontFamily:MONO, letterSpacing:1 }}>ACCESO RESTRINGIDO</p>
        </div>

        <div style={{ backgroundColor:CARD, borderRadius:14, border:`1px solid ${err?'rgba(239,68,68,0.35)':BORDER.split('solid')[1]}`, padding:'22px 20px', transition:'border-color 0.2s' }}>
          <Label>Contraseña</Label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&tryUnlock()}
            placeholder="••••••••" autoFocus
            style={{ width:'100%', padding:'12px 15px', borderRadius:10, border:`1px solid ${err?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.07)'}`, backgroundColor:CARD2, color:'#EDF0F4', fontSize:15, outline:'none', boxSizing:'border-box', marginBottom:err?8:14, fontFamily:F, transition:'border-color 0.2s' }}/>
          {err && <p style={{ fontSize:12, color:'#EF4444', fontWeight:600, marginBottom:12, textAlign:'center', fontFamily:F }}>Contraseña incorrecta</p>}
          <button onClick={tryUnlock} style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', backgroundColor:ORANGE, color:'#FFF', fontWeight:800, fontSize:14, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>
            Entrar
          </button>
        </div>

        <button onClick={()=>navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, margin:'16px auto 0', color:'#374151', fontSize:12, fontWeight:600, background:'none', border:'none', cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>
          <ArrowLeft style={{ width:13, height:13 }}/> Regresar
        </button>
      </div>
    </div>
  );
}

// ─── Main Admin ───────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { transactions, deleteTransaction, addTransaction, getTotalSales, getTotalExpenses, getOtherIncome, getNetProfit, buildDailySummary, closeDayAndClean, orders } = useOrders();

  const [unlocked,setUnlocked]   = useState(false);
  const [tab,setTab]             = useState<'overview'|'transactions'|'close'>('overview');
  const [showAddTx,setShowAddTx] = useState(false);
  const [closeDate,setCloseDate] = useState(new Date().toISOString().slice(0,10));
  const [closing,setClosing]     = useState(false);
  const [closed,setClosed]       = useState(false);

  const today = new Date().toISOString().slice(0,10);
  const todayTx = useMemo(()=>transactions.filter(t=>t.timestamp.startsWith(today)),[transactions,today]);

  const summary = useMemo(()=>buildDailySummary(today),[transactions,today]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const s = buildDailySummary(today);
    doc.setFontSize(18); doc.text('Don de Chuy Business', 20, 20);
    doc.setFontSize(12); doc.text(`Resumen del día: ${today}`, 20, 32);
    doc.setFontSize(10);
    doc.text(`Ventas totales:  L.${s.totalSales.toFixed(2)}`, 20, 48);
    doc.text(`Gastos:          L.${s.totalExpenses.toFixed(2)}`, 20, 56);
    doc.text(`Otros ingresos:  L.${s.otherIncome.toFixed(2)}`, 20, 64);
    doc.text(`Ganancia neta:   L.${s.netProfit.toFixed(2)}`, 20, 72);
    doc.setFontSize(11); doc.text('Transacciones:', 20, 88);
    doc.setFontSize(9);
    s.transactions.forEach((t,i)=>{
      const y = 96 + i*8;
      const sign = t.type==='expense'?'-':'+';
      doc.text(`${sign}L.${t.amount.toFixed(2)}  ${t.description}  ${t.timestamp.slice(11,16)}`, 20, y);
    });
    doc.save(`ddc-resumen-${today}.pdf`);
  };

  const doClose = async () => {
    if (!closeDate) return;
    setClosing(true);
    await closeDayAndClean(closeDate);
    setClosing(false); setClosed(true);
    setTimeout(()=>setClosed(false),3000);
  };

  const TX_COLORS: Record<string,string> = { sale:'#22C55E', expense:'#EF4444', 'other-income':'#3B82F6', 'card-close':'#8B5CF6', 'drink-log':'#60A5FA' };
  const TX_LABELS: Record<string,string> = { sale:'Venta', expense:'Gasto', 'other-income':'Otro ingreso', 'card-close':'Tarjeta', 'drink-log':'Bebida' };

  if (!unlocked) return <PasswordGate onUnlock={()=>setUnlocked(true)}/>;

  const activeOrders = orders.filter(o=>o.status!=='delivered').length;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:BG, fontFamily:F, color:'#EDF0F4' }}>
      {showAddTx && <AddTxModal onAdd={tx=>addTransaction(tx)} onClose={()=>setShowAddTx(false)}/>}

      {/* Header */}
      <header style={{ backgroundColor:CARD, borderBottom:BORDER, padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <IBtn onClick={()=>navigate('/')}><ArrowLeft style={{ width:14, height:14 }}/></IBtn>
          <div style={{ width:32, height:32, borderRadius:8, backgroundColor:'#FFF', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img src={logoImg} alt="" style={{ width:'82%', height:'82%', objectFit:'contain' }}/>
          </div>
          <div>
            <p style={{ fontWeight:800, fontSize:14, color:'#EDF0F4', lineHeight:1 }}>Administración</p>
            <p style={{ fontSize:10, color:'#374151', marginTop:1, fontFamily:MONO, letterSpacing:0.5 }}>Don de Chuy Business</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {activeOrders>0&&<span style={{ fontSize:11, fontWeight:700, color:'#F97316', fontFamily:MONO }}>{activeOrders} activo{activeOrders!==1?'s':''}</span>}
          <IBtn onClick={downloadPDF}><Download style={{ width:14, height:14 }}/></IBtn>
          <button onClick={()=>setShowAddTx(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:9, border:'none', backgroundColor:ORANGE, color:'#FFF', fontWeight:700, fontSize:12, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>
            <Plus style={{ width:13, height:13 }}/> Registrar
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ padding:'16px 20px 0' }}>
        <div style={{ display:'flex', gap:2, backgroundColor:CARD, borderRadius:10, padding:3, border:BORDER, width:'fit-content' }}>
          {(['overview','transactions','close'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 16px', borderRadius:8, border:'none', backgroundColor:tab===t?'rgba(249,115,22,0.15)':'transparent', color:tab===t?ORANGE:'#6B7280', fontWeight:700, fontSize:12, cursor:'pointer', WebkitAppearance:'none', fontFamily:F, transition:'all 0.15s', borderBottom:tab===t?`2px solid ${ORANGE}`:'2px solid transparent' }}>
              {t==='overview'?'Resumen hoy':t==='transactions'?'Transacciones':'Cierre del día'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'20px', maxWidth:900 }}>

        {/* ── OVERVIEW ── */}
        {tab==='overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
              <Stat label="Ventas del día" value={`L.${summary.totalSales.toFixed(2)}`} color="#22C55E" icon={<TrendingUp style={{ width:16,height:16 }}/>} sub={`${todayTx.filter(t=>t.type==='sale'||t.type==='drink-log').length} transacciones`}/>
              <Stat label="Gastos" value={`L.${summary.totalExpenses.toFixed(2)}`} color="#EF4444" icon={<TrendingDown style={{ width:16,height:16 }}/>}/>
              <Stat label="Otros ingresos" value={`L.${summary.otherIncome.toFixed(2)}`} color="#3B82F6" icon={<BarChart3 style={{ width:16,height:16 }}/>}/>
              <Stat label="Ganancia neta" value={`L.${summary.netProfit.toFixed(2)}`} color={summary.netProfit>=0?"#22C55E":"#EF4444"} icon={<DollarSign style={{ width:16,height:16 }}/>} sub="Ventas + ingresos − gastos"/>
            </div>

            {/* Top items */}
            {summary.itemsSold.length>0 && (
              <div style={{ backgroundColor:CARD, borderRadius:12, border:BORDER, padding:'16px 18px' }}>
                <p style={{ fontWeight:700, fontSize:13, color:'#EDF0F4', marginBottom:12, fontFamily:F }}>Productos vendidos hoy</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {summary.itemsSold.slice(0,10).map(it=>(
                    <div key={it.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', backgroundColor:CARD2, borderRadius:8 }}>
                      <span style={{ fontSize:12, color:'#9AA3B0', fontFamily:F }}>{it.qty}× {it.name}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:ORANGE, fontFamily:MONO }}>L.{it.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS ── */}
        {tab==='transactions' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <p style={{ fontSize:13, color:'#6B7280', fontFamily:F }}>{transactions.length} transaccion{transactions.length!==1?'es':''} en total</p>
              <button onClick={()=>setShowAddTx(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:9, border:BORDER, backgroundColor:CARD2, color:ORANGE, fontWeight:600, fontSize:12, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>
                <Plus style={{ width:12,height:12 }}/> Nueva
              </button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {[...transactions].reverse().map(tx=>{
                const c = TX_COLORS[tx.type]||'#6B7280';
                const sign = tx.type==='expense'?'-':'+';
                return (
                  <div key={tx.id} style={{ display:'flex', alignItems:'center', gap:12, backgroundColor:CARD, border:BORDER, borderRadius:10, padding:'11px 14px' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', backgroundColor:c, flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, color:'#EDF0F4', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:F }}>{tx.description}</p>
                      <p style={{ fontSize:10, color:'#374151', marginTop:2, fontFamily:MONO }}>
                        {TX_LABELS[tx.type]} · {tx.timestamp.slice(0,10)} {tx.timestamp.slice(11,16)}
                      </p>
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color:c, fontFamily:MONO, flexShrink:0 }}>{sign}L.{tx.amount.toFixed(2)}</span>
                    <button onClick={()=>deleteTransaction(tx.id)} style={{ width:28, height:28, borderRadius:7, backgroundColor:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', color:'#EF4444', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitAppearance:'none', flexShrink:0 }}>
                      <Trash2 style={{ width:11, height:11 }}/>
                    </button>
                  </div>
                );
              })}
              {transactions.length===0&&(
                <div style={{ textAlign:'center', padding:'48px 0', color:'#374151' }}>
                  <BarChart3 style={{ width:36, height:36, margin:'0 auto 10px', color:'#1F2937' }}/>
                  <p style={{ fontSize:14, fontFamily:F }}>Sin transacciones</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CLOSE DAY ── */}
        {tab==='close' && (
          <div style={{ maxWidth:500 }}>
            <div style={{ backgroundColor:CARD, border:BORDER, borderRadius:12, padding:'20px 22px', marginBottom:16 }}>
              <p style={{ fontWeight:700, fontSize:15, color:'#EDF0F4', marginBottom:4, fontFamily:F }}>Cierre del día</p>
              <p style={{ fontSize:12, color:'#6B7280', marginBottom:18, fontFamily:F }}>Elimina todos los pedidos de cocina del día seleccionado. Las transacciones no se eliminan.</p>

              <Label>Fecha a cerrar</Label>
              <input type="date" value={closeDate} onChange={e=>setCloseDate(e.target.value)}
                style={{ width:'100%', padding:'11px 13px', borderRadius:9, border:BORDER, backgroundColor:CARD2, color:'#EDF0F4', fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:14, fontFamily:MONO }}/>

              {closeDate && (()=>{
                const s = buildDailySummary(closeDate);
                return (
                  <div style={{ backgroundColor:CARD2, borderRadius:9, padding:'14px', marginBottom:16, border:BORDER }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        { l:'Ventas', v:`L.${s.totalSales.toFixed(2)}`, c:'#22C55E' },
                        { l:'Gastos', v:`L.${s.totalExpenses.toFixed(2)}`, c:'#EF4444' },
                        { l:'Otros', v:`L.${s.otherIncome.toFixed(2)}`, c:'#3B82F6' },
                        { l:'Neto', v:`L.${s.netProfit.toFixed(2)}`, c:s.netProfit>=0?'#22C55E':'#EF4444' },
                      ].map(r=>(
                        <div key={r.l}>
                          <p style={{ fontSize:10, color:'#4B5563', fontFamily:MONO, letterSpacing:1 }}>{r.l}</p>
                          <p style={{ fontSize:16, fontWeight:800, color:r.c, fontFamily:MONO }}>{r.v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display:'flex', gap:9 }}>
                <button onClick={downloadPDF} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'12px', borderRadius:10, border:BORDER, backgroundColor:CARD2, color:'#9AA3B0', fontWeight:700, fontSize:13, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>
                  <Download style={{ width:14,height:14 }}/> PDF
                </button>
                <button onClick={doClose} disabled={closing} style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'12px', borderRadius:10, border:'none', backgroundColor:closing?'rgba(239,68,68,0.2)':'rgba(239,68,68,0.85)', color:'#FFF', fontWeight:700, fontSize:13, cursor:closing?'not-allowed':'pointer', WebkitAppearance:'none', fontFamily:F }}>
                  {closing ? <RefreshCw style={{ width:14,height:14 }}/> : null}
                  {closing?'Cerrando...':closed?'✓ Cerrado':'Cerrar día'}
                </button>
              </div>
            </div>

            <p style={{ fontSize:11, color:'#374151', fontFamily:F, lineHeight:1.6 }}>
              ⚠ Esta acción elimina permanentemente los pedidos de cocina del día. Las transacciones financieras se conservan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
