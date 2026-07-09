import { useState, useMemo } from 'react';
import { useOrders, Transaction } from './OrderContext';
import { useNavigate } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Download, X, Lock, RefreshCw, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import logoImg from '../../imports/image-1.png';

const F    = "'Inter',-apple-system,sans-serif";
const MONO = "'JetBrains Mono',monospace";
const BG   = '#07090D';
const CARD = '#0E1117';
const CARD2= '#111620';
const BORDER = '1px solid rgba(255,255,255,0.07)';
const ORANGE = '#F97316';
const ADMIN_PASS = '20052013';
const PIE_COLORS = ['#22C55E','#EF4444','#3B82F6','#8B5CF6'];
const TX_COLORS: Record<string,string> = { sale:'#22C55E', expense:'#EF4444', 'other-income':'#3B82F6', 'card-close':'#8B5CF6', 'drink-log':'#60A5FA' };
const TX_LABELS: Record<string,string> = { sale:'Venta', expense:'Gasto', 'other-income':'Otro ingreso', 'card-close':'Tarjeta', 'drink-log':'Bebida' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Stat card ────────────────────────────────────────────────────────────────
function Stat({ label, value, icon, color, sub }: { label:string; value:string; icon:React.ReactNode; color:string; sub?:string }) {
  return (
    <div style={{ backgroundColor:CARD, border:BORDER, borderRadius:12, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, right:0, width:64, height:64, borderRadius:'0 12px 0 64px', backgroundColor:`${color}09` }}/>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:1.5, fontFamily:MONO }}>{label}</span>
        <div style={{ color }}>{icon}</div>
      </div>
      <p style={{ fontSize:22, fontWeight:800, color:'#EDF0F4', fontFamily:MONO, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:10, color:'#374151', marginTop:5, fontFamily:F }}>{sub}</p>}
    </div>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor:'#0D1018', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'9px 13px', fontFamily:F }}>
      {label && <p style={{ fontSize:11, color:'#6B7280', marginBottom:5 }}>{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize:14, fontWeight:800, color:p.color || ORANGE }}>
          L.{Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
}

// ─── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor:CARD, border:BORDER, borderRadius:12, padding:'16px 18px' }}>
      <p style={{ fontWeight:700, fontSize:13, color:'#EDF0F4', marginBottom:16, fontFamily:F }}>{title}</p>
      {children}
    </div>
  );
}

// ─── PDF builder ──────────────────────────────────────────────────────────────
function pdfTable(doc: jsPDF, headers: string[], rows: string[][], colW: number[], y: number): number {
  const x0 = 14, rh = 8;

  // Header row
  doc.setFillColor(18, 22, 32);
  doc.rect(x0, y, colW.reduce((a,b)=>a+b,0), rh, 'F');
  doc.setFontSize(7.5); doc.setTextColor(249,115,22);
  let cx = x0;
  headers.forEach((h,i) => { doc.text(h, cx+2, y+5.5); cx += colW[i]; });
  y += rh;

  // Data rows
  rows.forEach((row, ri) => {
    if (y > 274) { doc.addPage(); y = 18; }
    if (ri % 2 === 0) { doc.setFillColor(12,14,20); doc.rect(x0, y, colW.reduce((a,b)=>a+b,0), rh, 'F'); }
    doc.setFontSize(7.5); doc.setTextColor(200,210,220);
    cx = x0;
    row.forEach((cell,i) => { doc.text(String(cell).slice(0,34), cx+2, y+5.5); cx += colW[i]; });
    y += rh;
  });

  // Bottom rule
  doc.setDrawColor(40,45,60);
  doc.line(x0, y, x0 + colW.reduce((a,b)=>a+b,0), y);
  return y + 5;
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
                  <div style={{ fontSize:18, marginBottom:3 }}>{t.emoji}</div>{t.label}
                </button>
              ))}
            </div>
          </div>
          <div><Label>Monto (L.)</Label><input type="number" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={{ ...inp, fontSize:18, fontFamily:MONO }}/></div>
          <div><Label>Descripción</Label><input type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ej: Compra de gas" style={inp}/></div>
          <button onClick={()=>{const a=parseFloat(amount);if(a>0&&desc.trim()){onAdd({amount:a,type,description:desc.trim()});onClose();}}}
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
  const tryUnlock = () => { if(pass===ADMIN_PASS){onUnlock();}else{setErr(true);setPass('');setTimeout(()=>setErr(false),2000);} };
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
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&tryUnlock()} placeholder="••••••••" autoFocus
            style={{ width:'100%', padding:'12px 15px', borderRadius:10, border:`1px solid ${err?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.07)'}`, backgroundColor:CARD2, color:'#EDF0F4', fontSize:15, outline:'none', boxSizing:'border-box', marginBottom:err?8:14, fontFamily:F, transition:'border-color 0.2s' }}/>
          {err && <p style={{ fontSize:12, color:'#EF4444', fontWeight:600, marginBottom:12, textAlign:'center' }}>Contraseña incorrecta</p>}
          <button onClick={tryUnlock} style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', backgroundColor:ORANGE, color:'#FFF', fontWeight:800, fontSize:14, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>Entrar</button>
        </div>
        <button onClick={()=>navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, margin:'16px auto 0', color:'#374151', fontSize:12, fontWeight:600, background:'none', border:'none', cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>
          <ArrowLeft style={{ width:13, height:13 }}/> Regresar
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { transactions, deleteTransaction, addTransaction, buildDailySummary, closeDayAndClean, cleanOldOrders, orders } = useOrders();

  const [unlocked,setUnlocked]   = useState(false);
  const [tab,setTab]             = useState<'overview'|'transactions'|'close'>('overview');
  const [showAddTx,setShowAddTx] = useState(false);
  const [closeDate,setCloseDate] = useState(new Date().toISOString().slice(0,10));
  const [closing,setClosing]     = useState(false);
  const [closed,setClosed]       = useState(false);
  const [cleaning,setCleaning]   = useState(false);
  const [cleanMsg,setCleanMsg]   = useState<string|null>(null);

  const today   = new Date().toISOString().slice(0,10);
  const todayTx = useMemo(()=>transactions.filter(t=>t.timestamp.startsWith(today)),[transactions,today]);
  const summary  = useMemo(()=>buildDailySummary(today),[transactions,today]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const hourlyData = useMemo(()=>{
    const map: Record<number,number> = {};
    todayTx.filter(t=>t.type==='sale'||t.type==='drink-log').forEach(t=>{
      const h = new Date(t.timestamp).getHours();
      map[h] = (map[h]||0) + t.amount;
    });
    return Array.from({length:16},(_,i)=>i+6).map(h=>({
      hora: `${h}h`, ventas: parseFloat((map[h]||0).toFixed(2)),
    }));
  },[todayTx]);

  const itemChartData = useMemo(()=>
    summary.itemsSold.slice(0,8).map(it=>({
      name: it.name.length > 14 ? it.name.slice(0,13)+'…' : it.name,
      total: parseFloat(it.total.toFixed(2)),
      qty: it.qty,
    }))
  ,[summary]);

  const pieData = useMemo(()=>[
    { name:'Ventas',     value: parseFloat(summary.totalSales.toFixed(2)) },
    { name:'Gastos',     value: parseFloat(summary.totalExpenses.toFixed(2)) },
    { name:'Otros ing.', value: parseFloat(summary.otherIncome.toFixed(2)) },
  ].filter(d=>d.value>0),[summary]);

  // ── PDF ───────────────────────────────────────────────────────────────────
  const downloadPDF = () => {
    const doc = new jsPDF();
    const s   = buildDailySummary(today);
    const now = new Date().toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'});

    // Header bar
    doc.setFillColor(8,10,15);
    doc.rect(0,0,210,36,'F');
    doc.setFillColor(249,115,22);
    doc.rect(0,0,5,36,'F');
    doc.setFontSize(18); doc.setTextColor(249,115,22);
    doc.text('Don de Chuy Business', 13, 16);
    doc.setFontSize(9); doc.setTextColor(140,150,170);
    doc.text(`Reporte del día: ${today}  ·  Generado: ${now}`, 13, 26);
    doc.setDrawColor(249,115,22); doc.setLineWidth(0.3);
    doc.line(0,36,210,36);

    let y = 46;

    // ── Resumen financiero (4 boxes)
    doc.setFontSize(10); doc.setTextColor(249,115,22);
    doc.text('RESUMEN FINANCIERO', 14, y); y += 6;

    const metrics = [
      { label:'Ventas totales', value:`L.${s.totalSales.toFixed(2)}`,    color:[34,197,94]  as [number,number,number] },
      { label:'Gastos',         value:`L.${s.totalExpenses.toFixed(2)}`, color:[239,68,68]  as [number,number,number] },
      { label:'Otros ingresos', value:`L.${s.otherIncome.toFixed(2)}`,   color:[59,130,246] as [number,number,number] },
      { label:'Ganancia neta',  value:`L.${s.netProfit.toFixed(2)}`,     color:s.netProfit>=0?[34,197,94] as [number,number,number]:[239,68,68] as [number,number,number] },
    ];
    const bw = 44, bh = 18, gap = 3;
    metrics.forEach((m,i)=>{
      const bx = 14 + i*(bw+gap);
      doc.setFillColor(12,16,26); doc.rect(bx, y, bw, bh, 'F');
      doc.setDrawColor(...m.color); doc.setLineWidth(0.4);
      doc.rect(bx, y, bw, bh);
      doc.setFontSize(7); doc.setTextColor(120,130,150);
      doc.text(m.label, bx+3, y+6);
      doc.setFontSize(10); doc.setTextColor(...m.color);
      doc.text(m.value, bx+3, y+14);
    });
    y += bh + 10;

    // ── Desglose rápido
    y = pdfTable(doc,
      ['Concepto','Monto (L.)','# Registros','% del total'],
      [
        ['Ventas', `L.${s.totalSales.toFixed(2)}`,
          String(s.transactions.filter(t=>t.type==='sale'||t.type==='drink-log').length),
          s.totalSales>0?`${((s.totalSales/(s.totalSales+s.otherIncome))*100).toFixed(1)}%`:'—'],
        ['Gastos', `L.${s.totalExpenses.toFixed(2)}`,
          String(s.transactions.filter(t=>t.type==='expense').length), '—'],
        ['Otros ingresos', `L.${s.otherIncome.toFixed(2)}`,
          String(s.transactions.filter(t=>t.type==='other-income'||t.type==='card-close').length), '—'],
        ['GANANCIA NETA', `L.${s.netProfit.toFixed(2)}`, '—',
          s.netProfit>=0?'✓ Positiva':'✗ Negativa'],
      ],
      [60,45,40,45], y
    );

    // ── Productos vendidos
    if (s.itemsSold.length > 0) {
      if (y > 230) { doc.addPage(); y = 18; }
      doc.setFontSize(10); doc.setTextColor(249,115,22);
      doc.text('PRODUCTOS VENDIDOS', 14, y); y += 6;
      y = pdfTable(doc,
        ['Producto','Cant.','Precio unit.','Total (L.)'],
        s.itemsSold.map(it=>[
          it.name,
          `${it.qty}×`,
          `L.${(it.total/it.qty).toFixed(2)}`,
          `L.${it.total.toFixed(2)}`,
        ]),
        [80,22,45,45], y
      );
    }

    // ── Transacciones detalladas
    if (s.transactions.length > 0) {
      if (y > 230) { doc.addPage(); y = 18; }
      doc.setFontSize(10); doc.setTextColor(249,115,22);
      doc.text('TRANSACCIONES DEL DÍA', 14, y); y += 6;
      y = pdfTable(doc,
        ['Hora','Tipo','Descripción','Monto'],
        s.transactions.map(t=>[
          t.timestamp.slice(11,16),
          TX_LABELS[t.type]||t.type,
          t.description,
          `${t.type==='expense'?'−':'+'}L.${t.amount.toFixed(2)}`,
        ]),
        [18,24,110,40], y
      );
    }

    // Footer
    const pages = (doc as any).internal.getNumberOfPages();
    for (let i=1; i<=pages; i++) {
      doc.setPage(i);
      doc.setFillColor(8,10,15); doc.rect(0,284,210,13,'F');
      doc.setFontSize(7); doc.setTextColor(60,70,90);
      doc.text(`Don de Chuy Business  ·  ${today}  ·  Página ${i} de ${pages}`, 14, 291);
    }

    doc.save(`ddc-reporte-${today}.pdf`);
  };

  const doClose = async () => {
    if (!closeDate) return;
    setClosing(true);
    await closeDayAndClean(closeDate);
    setClosing(false); setClosed(true);
    setTimeout(()=>setClosed(false),3000);
  };

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
          {activeOrders>0 && <span style={{ fontSize:11, fontWeight:700, color:'#F97316', fontFamily:MONO }}>{activeOrders} activo{activeOrders!==1?'s':''}</span>}
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

      <div style={{ padding:'20px', maxWidth:980 }}>

        {/* ──────────── OVERVIEW ──────────── */}
        {tab==='overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Stat cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))', gap:10 }}>
              <Stat label="Ventas del día"  value={`L.${summary.totalSales.toFixed(2)}`}    color="#22C55E" icon={<TrendingUp style={{ width:16,height:16 }}/>} sub={`${todayTx.filter(t=>t.type==='sale'||t.type==='drink-log').length} transacciones`}/>
              <Stat label="Gastos"          value={`L.${summary.totalExpenses.toFixed(2)}`} color="#EF4444" icon={<TrendingDown style={{ width:16,height:16 }}/>} sub={`${todayTx.filter(t=>t.type==='expense').length} registros`}/>
              <Stat label="Otros ingresos"  value={`L.${summary.otherIncome.toFixed(2)}`}   color="#3B82F6" icon={<BarChart3 style={{ width:16,height:16 }}/>}/>
              <Stat label="Ganancia neta"   value={`L.${summary.netProfit.toFixed(2)}`}     color={summary.netProfit>=0?'#22C55E':'#EF4444'} icon={<DollarSign style={{ width:16,height:16 }}/>} sub="Ventas + otros − gastos"/>
            </div>

            {/* Charts row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

              {/* Ventas por hora */}
              <ChartCard title="Ventas por hora (L.)">
                <ResponsiveContainer width="100%" height={185}>
                  <BarChart data={hourlyData} margin={{ top:2, right:4, left:-18, bottom:0 }}>
                    <XAxis dataKey="hora" tick={{ fill:'#374151', fontSize:9, fontFamily:MONO }} axisLine={false} tickLine={false} interval={1}/>
                    <YAxis tick={{ fill:'#374151', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTip/>} cursor={{ fill:'rgba(249,115,22,0.05)' }}/>
                    <Bar dataKey="ventas" fill={ORANGE} radius={[4,4,0,0]} maxBarSize={22}/>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Distribución (donut) */}
              <ChartCard title="Distribución financiera">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={185}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="48%" innerRadius={52} outerRadius={76} paddingAngle={4} dataKey="value" strokeWidth={0}>
                        {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v:any)=>`L.${Number(v).toFixed(2)}`} contentStyle={{ backgroundColor:'#0D1018', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontFamily:F, fontSize:12 }}/>
                      <Legend iconSize={9} iconType="circle" wrapperStyle={{ fontSize:11, fontFamily:F, paddingTop:8 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height:185, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <p style={{ color:'#2D3748', fontSize:13, fontFamily:F }}>Sin datos registrados aún</p>
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Top productos (horizontal bar) */}
            {itemChartData.length > 0 && (
              <ChartCard title="Productos más vendidos (L.)">
                <ResponsiveContainer width="100%" height={itemChartData.length * 28 + 20}>
                  <BarChart data={itemChartData} layout="vertical" margin={{ top:0, right:16, left:6, bottom:0 }}>
                    <XAxis type="number" tick={{ fill:'#374151', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="name" tick={{ fill:'#9AA3B0', fontSize:11, fontFamily:F }} axisLine={false} tickLine={false} width={100}/>
                    <Tooltip content={<ChartTip/>} cursor={{ fill:'rgba(251,191,36,0.05)' }}/>
                    <Bar dataKey="total" fill="#FBBF24" radius={[0,5,5,0]} maxBarSize={16}/>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Tabla detalle de productos */}
            {summary.itemsSold.length > 0 && (
              <div style={{ backgroundColor:CARD, borderRadius:12, border:BORDER, overflow:'hidden' }}>
                <div style={{ padding:'13px 18px', borderBottom:BORDER }}>
                  <p style={{ fontWeight:700, fontSize:13, color:'#EDF0F4', fontFamily:F }}>Detalle de productos</p>
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor:CARD2 }}>
                      {['Producto','Cant.','Total'].map(h=>(
                        <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:1.2, fontFamily:MONO }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.itemsSold.map((it,i)=>(
                      <tr key={it.name} style={{ borderTop:'1px solid rgba(255,255,255,0.04)', backgroundColor:i%2===0?'transparent':`${CARD2}66` }}>
                        <td style={{ padding:'9px 16px', fontSize:13, color:'#EDF0F4', fontFamily:F }}>{it.name}</td>
                        <td style={{ padding:'9px 16px', fontSize:13, color:'#6B7280', fontFamily:MONO }}>{it.qty}×</td>
                        <td style={{ padding:'9px 16px', fontSize:13, fontWeight:700, color:ORANGE, fontFamily:MONO }}>L.{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ──────────── TRANSACTIONS ──────────── */}
        {tab==='transactions' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <p style={{ fontSize:13, color:'#6B7280', fontFamily:F }}>{transactions.length} transaccion{transactions.length!==1?'es':''} en total</p>
              <button onClick={()=>setShowAddTx(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:9, border:BORDER, backgroundColor:CARD2, color:ORANGE, fontWeight:600, fontSize:12, cursor:'pointer', WebkitAppearance:'none', fontFamily:F }}>
                <Plus style={{ width:12,height:12 }}/> Nueva
              </button>
            </div>
            <div style={{ backgroundColor:CARD, borderRadius:12, border:BORDER, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor:CARD2 }}>
                    {['Hora','Tipo','Descripción','Monto',''].map(h=>(
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#4B5563', textTransform:'uppercase', letterSpacing:1.2, fontFamily:MONO }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...transactions].reverse().map((tx,i)=>{
                    const c = TX_COLORS[tx.type]||'#6B7280';
                    const sign = tx.type==='expense'?'−':'+';
                    return (
                      <tr key={tx.id} style={{ borderTop:'1px solid rgba(255,255,255,0.04)', backgroundColor:i%2===0?'transparent':`${CARD2}66` }}>
                        <td style={{ padding:'10px 14px', fontSize:11, color:'#4B5563', fontFamily:MONO, whiteSpace:'nowrap' }}>{tx.timestamp.slice(11,16)}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:100, backgroundColor:`${c}14`, color:c, fontFamily:MONO }}>
                            {TX_LABELS[tx.type]}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:13, color:'#EDF0F4', fontFamily:F }}>{tx.description}</td>
                        <td style={{ padding:'10px 14px', fontSize:14, fontWeight:800, color:c, fontFamily:MONO, whiteSpace:'nowrap' }}>{sign}L.{tx.amount.toFixed(2)}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <button onClick={()=>deleteTransaction(tx.id)} style={{ width:28, height:28, borderRadius:7, backgroundColor:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.14)', color:'#EF4444', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitAppearance:'none' }}>
                            <Trash2 style={{ width:11, height:11 }}/>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {transactions.length===0 && (
                <div style={{ textAlign:'center', padding:'52px 0', color:'#374151' }}>
                  <BarChart3 style={{ width:36, height:36, margin:'0 auto 10px', color:'#1F2937' }}/>
                  <p style={{ fontSize:14, fontFamily:F }}>Sin transacciones</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────── CLOSE DAY ──────────── */}
        {tab==='close' && (
          <div style={{ maxWidth:500 }}>
            <div style={{ backgroundColor:CARD, border:BORDER, borderRadius:12, padding:'20px 22px', marginBottom:16 }}>
              <p style={{ fontWeight:700, fontSize:15, color:'#EDF0F4', marginBottom:4, fontFamily:F }}>Cierre del día</p>
              <p style={{ fontSize:12, color:'#6B7280', marginBottom:18, fontFamily:F }}>Elimina los pedidos de cocina del día. Las transacciones se conservan.</p>
              <Label>Fecha a cerrar</Label>
              <input type="date" value={closeDate} onChange={e=>setCloseDate(e.target.value)}
                style={{ width:'100%', padding:'11px 13px', borderRadius:9, border:BORDER, backgroundColor:CARD2, color:'#EDF0F4', fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:14, fontFamily:MONO }}/>
              {closeDate && (()=>{
                const s = buildDailySummary(closeDate);
                return (
                  <div style={{ backgroundColor:CARD2, borderRadius:9, padding:'14px', marginBottom:16, border:BORDER }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        { l:'Ventas',  v:`L.${s.totalSales.toFixed(2)}`,    c:'#22C55E' },
                        { l:'Gastos',  v:`L.${s.totalExpenses.toFixed(2)}`, c:'#EF4444' },
                        { l:'Otros',   v:`L.${s.otherIncome.toFixed(2)}`,   c:'#3B82F6' },
                        { l:'Neto',    v:`L.${s.netProfit.toFixed(2)}`,     c:s.netProfit>=0?'#22C55E':'#EF4444' },
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
                  {closing&&<RefreshCw style={{ width:14,height:14 }}/>}
                  {closing?'Cerrando...':closed?'✓ Cerrado':'Cerrar día'}
                </button>
              </div>
            </div>

            <p style={{ fontSize:11, color:'#374151', fontFamily:F, lineHeight:1.6 }}>
              ⚠ Esta acción elimina permanentemente los pedidos. Las transacciones financieras se conservan.
            </p>

            <div style={{ backgroundColor:CARD, border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'20px 22px', marginTop:16 }}>
              <p style={{ fontWeight:700, fontSize:15, color:'#EDF0F4', marginBottom:4, fontFamily:F }}>Limpiar historial antiguo</p>
              <p style={{ fontSize:12, color:'#6B7280', marginBottom:18, fontFamily:F }}>Borra de Supabase todos los pedidos anteriores a hoy.</p>
              <button onClick={async()=>{setCleaning(true);setCleanMsg(null);const n=await cleanOldOrders();setCleaning(false);setCleanMsg(n<0?'Error al conectar.':(n===0?'No había pedidos antiguos.':`✓ Se borraron ${n} pedido${n!==1?'s':''} antiguos.`));}}
                disabled={cleaning}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:10, border:'none', backgroundColor:cleaning?'rgba(239,68,68,0.15)':'rgba(239,68,68,0.75)', color:'#FFF', fontWeight:700, fontSize:14, cursor:cleaning?'not-allowed':'pointer', WebkitAppearance:'none', fontFamily:F }}>
                {cleaning?<RefreshCw style={{ width:15,height:15 }}/>:<Trash2 style={{ width:15,height:15 }}/>}
                {cleaning?'Limpiando...':'Borrar pedidos antiguos'}
              </button>
              {cleanMsg && <p style={{ fontSize:13, fontWeight:600, color:cleanMsg.startsWith('✓')?'#22C55E':'#EF4444', marginTop:12, textAlign:'center', fontFamily:F }}>{cleanMsg}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
