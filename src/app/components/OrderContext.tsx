import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
const projectId = 'taxicpjtltijhzpojmxw';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRheGljcGp0bHRpamh6cG9qbXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzQ0MTUsImV4cCI6MjA5NzExMDQxNX0.rAUINlyH24n9NdSAkaUMIE9-LfSVn1Uuy-7EsG0b3ek';

const SUPABASE_URL = `https://${projectId}.supabase.co`;

const supabase = createClient(SUPABASE_URL, publicAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

const LS_KEY  = 'ddc-state-v7';
const BC_NAME = 'ddc-bc-v7';
const Q_KEY   = 'ddc-queue-v7';

export interface OrderItem {
  id: string; name: string; price: number; quantity: number; category: string;
}
export interface Order {
  id: string; items: OrderItem[]; total: number; timestamp: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  deliveredItems: string[]; sentBy: string; avatarEmoji?: string;
}
export interface Transaction {
  id: string; amount: number;
  type: 'sale' | 'expense' | 'other-income' | 'card-close' | 'drink-log';
  description: string; timestamp: string;
}
export interface DailySummary {
  date: string; totalSales: number; totalExpenses: number;
  otherIncome: number; netProfit: number;
  itemsSold: { name: string; qty: number; total: number }[];
  transactions: Transaction[];
}

interface AppState { orders: Order[]; transactions: Transaction[] }
interface BCMsg { type: 'STATE'; state: AppState; from: string }

interface OrderContextType {
  orders: Order[]; transactions: Transaction[];
  connected: boolean; pendingCount: number;
  addOrder: (o: Omit<Order, 'deliveredItems'>) => void;
  addItemsToOrder: (id: string, items: OrderItem[]) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  markItemReady: (orderId: string, itemId: string) => void;
  deleteOrder: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  deleteTransaction: (id: string) => void;
  getTotalSales: () => number; getTotalExpenses: () => number;
  getOtherIncome: () => number; getNetProfit: () => number;
  buildDailySummary: (date: string) => DailySummary;
  closeDayAndClean: (date: string) => Promise<void>;
}

const Ctx = createContext<OrderContextType | undefined>(undefined);

function toDb(o: Order) {
  return {
    id: o.id, items: o.items, total: o.total, timestamp: o.timestamp,
    status: o.status, delivered_items: o.deliveredItems,
    sent_by: o.sentBy, avatar_emoji: o.avatarEmoji || '',
  };
}
function fromDb(r: any): Order {
  return {
    id: r.id, items: r.items, total: parseFloat(r.total),
    timestamp: r.timestamp, status: r.status,
    deliveredItems: r.delivered_items || [], sentBy: r.sent_by,
    avatarEmoji: r.avatar_emoji || '',
  };
}

function loadLS(): AppState {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : { orders: [], transactions: [] }; }
  catch { return { orders: [], transactions: [] }; }
}
function saveLS(s: AppState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

type QOp =
  | { t: 'upsert_order'; d: ReturnType<typeof toDb> }
  | { t: 'update_order'; id: string; patch: Record<string, any> }
  | { t: 'delete_order'; id: string }
  | { t: 'upsert_tx'; d: Transaction }
  | { t: 'delete_tx'; id: string }
  | { t: 'delete_tx_desc'; desc: string }
  | { t: 'update_tx_amt'; id: string; amount: number };

function loadQ(): QOp[] { try { return JSON.parse(localStorage.getItem(Q_KEY) || '[]'); } catch { return []; } }
function saveQ(q: QOp[]) { try { localStorage.setItem(Q_KEY, JSON.stringify(q)); } catch {} }
function enq(op: QOp) { const q = loadQ(); q.push(op); saveQ(q); }

async function flushQ(): Promise<number> {
  const q = loadQ();
  if (!q.length) return 0;
  const failed: QOp[] = [];
  for (const op of q) {
    try {
      let ok = false;
      if (op.t === 'upsert_order')     ok = !(await supabase.from('orders').upsert([op.d])).error;
      else if (op.t === 'update_order') ok = !(await supabase.from('orders').update(op.patch).eq('id', op.id)).error;
      else if (op.t === 'delete_order') ok = !(await supabase.from('orders').delete().eq('id', op.id)).error;
      else if (op.t === 'upsert_tx')    ok = !(await supabase.from('transactions').upsert([op.d])).error;
      else if (op.t === 'delete_tx')    ok = !(await supabase.from('transactions').delete().eq('id', (op as any).id)).error;
      else if (op.t === 'delete_tx_desc') ok = !(await supabase.from('transactions').delete().eq('description', (op as any).desc)).error;
      else if (op.t === 'update_tx_amt')  ok = !(await supabase.from('transactions').update({ amount: (op as any).amount }).eq('id', (op as any).id)).error;
      if (!ok) failed.push(op);
    } catch { failed.push(op); }
  }
  saveQ(failed);
  return failed.length;
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connected, setConnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const ordersRef = useRef<Order[]>([]);
  const txRef     = useRef<Transaction[]>([]);
  const tabId     = useRef(crypto.randomUUID());
  const bcRef     = useRef<BroadcastChannel | null>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks Realtime WebSocket connection state independently from REST polling
  const realtimeConnectedRef = useRef(false);

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { txRef.current = transactions; }, [transactions]);

  const apply = useCallback((s: AppState, broadcast = false) => {
    setOrders(s.orders);
    setTransactions(s.transactions);
    saveLS(s);
    setPendingCount(loadQ().length);
    if (broadcast) bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current } as BCMsg);
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(BC_NAME);
    bcRef.current = bc;
    bc.onmessage = (e: MessageEvent<BCMsg>) => {
      if (e.data.type === 'STATE' && e.data.from !== tabId.current) apply(e.data.state, false);
    };
    return () => bc.close();
  }, [apply]);

  const fetchAll = useCallback(async (): Promise<boolean> => {
    try {
      // Solo pedir datos de hoy — evita traer miles de registros viejos
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const since = todayStart.toISOString();

      const [{ data: od, error: oe }, { data: td, error: te }] = await Promise.all([
        supabase.from('orders').select('*').gte('timestamp', since).order('timestamp', { ascending: false }),
        supabase.from('transactions').select('*').gte('timestamp', since).order('timestamp', { ascending: false }),
      ]);
      if (oe || te) return false;

      const dbOrders = (od || []).map(fromDb);
      const dbTxs    = (td || []).map((r: any) => ({ ...r, amount: parseFloat(r.amount) }));

      // Conservar pedidos locales pendientes de confirmación en Supabase
      const q = loadQ();
      const pendingOrderIds = new Set(q.filter(op => op.t === 'upsert_order').map(op => (op as any).d.id));
      const pendingTxIds    = new Set(q.filter(op => op.t === 'upsert_tx').map(op => (op as any).d.id));
      const localOnlyOrders = ordersRef.current.filter(o => pendingOrderIds.has(o.id) && !dbOrders.find(x => x.id === o.id));
      const localOnlyTxs    = txRef.current.filter(t => pendingTxIds.has(t.id) && !dbTxs.find(x => x.id === t.id));

      const mergedOrders = [...dbOrders, ...localOnlyOrders]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const mergedTxs = [...dbTxs, ...localOnlyTxs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      apply({ orders: mergedOrders, transactions: mergedTxs }, true);
      return true;
    } catch { return false; }
  }, [apply]);

  const writeOrder = useCallback(async (op: QOp) => {
    try {
      let err: any = null;
      if (op.t === 'upsert_order')     err = (await supabase.from('orders').upsert([op.d])).error;
      else if (op.t === 'update_order') err = (await supabase.from('orders').update(op.patch).eq('id', op.id)).error;
      else if (op.t === 'delete_order') err = (await supabase.from('orders').delete().eq('id', op.id)).error;
      if (err) enq(op);
    } catch { enq(op); }
    setPendingCount(loadQ().length);
  }, []);

  const writeTx = useCallback(async (op: QOp) => {
    try {
      let err: any = null;
      if (op.t === 'upsert_tx')        err = (await supabase.from('transactions').upsert([op.d])).error;
      else if (op.t === 'delete_tx')   err = (await supabase.from('transactions').delete().eq('id', (op as any).id)).error;
      else if (op.t === 'delete_tx_desc') err = (await supabase.from('transactions').delete().eq('description', (op as any).desc)).error;
      else if (op.t === 'update_tx_amt')  err = (await supabase.from('transactions').update({ amount: (op as any).amount }).eq('id', (op as any).id)).error;
      if (err) enq(op);
    } catch { enq(op); }
    setPendingCount(loadQ().length);
  }, []);

  useEffect(() => {
    const boot = async () => {
      const ls = loadLS();
      apply(ls, false);
      ordersRef.current = ls.orders;
      txRef.current = ls.transactions;
      await flushQ();
      setPendingCount(loadQ().length);
      // Reduced retries from 4 to 3, keeping 1.5s gap
      for (let i = 0; i < 3; i++) {
        const ok = await fetchAll();
        if (ok) { setConnected(true); break; }
        if (i < 2) await new Promise(r => setTimeout(r, 1500));
      }
    };
    boot();
  }, [fetchAll, apply]);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const remaining = await flushQ();
      setPendingCount(remaining);
      const ok = await fetchAll();
      // Only mark disconnected from REST failures if Realtime WebSocket is also not connected.
      // If Realtime is healthy, transient REST failures don't affect the connected indicator.
      if (ok) {
        setConnected(true);
      } else if (!realtimeConnectedRef.current) {
        setConnected(false);
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchAll]);

  // Auto-borrar pedidos a las 11:59 PM (transacciones se conservan)
  useEffect(() => {
    const midnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 23 && now.getMinutes() === 59) {
        supabase.from('orders').delete().neq('id', '__keep__').then(() => {
          setOrders([]);
          ordersRef.current = [];
          const s = { orders: [], transactions: txRef.current };
          saveLS(s);
          bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
        }).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(midnight);
  }, []);

  useEffect(() => {
    let ordCh: RealtimeChannel, txCh: RealtimeChannel;
    const setup = async () => {
      await new Promise(r => setTimeout(r, 800));
      ordCh = supabase.channel('orders-rt-v7')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
          // Receiving a realtime event means the WebSocket is alive
          realtimeConnectedRef.current = true;
          setConnected(true);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const o = fromDb(payload.new);
            setOrders(prev => {
              const upd = [...prev.filter(x => x.id !== o.id), o]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              const s = { orders: upd, transactions: txRef.current };
              saveLS(s); bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
              return upd;
            });
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => {
              const upd = prev.filter(x => x.id !== payload.old.id);
              const s = { orders: upd, transactions: txRef.current };
              saveLS(s); bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
              return upd;
            });
          }
        })
        .subscribe(status => {
          const isSubscribed = status === 'SUBSCRIBED';
          realtimeConnectedRef.current = isSubscribed;
          // When subscribed, always mark connected. When not subscribed, only mark
          // disconnected if realtime truly dropped (not just a transient REST issue).
          setConnected(isSubscribed || realtimeConnectedRef.current);
        });

      txCh = supabase.channel('transactions-rt-v7')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, payload => {
          // Receiving a realtime event means the WebSocket is alive
          realtimeConnectedRef.current = true;
          setConnected(true);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const tx = { ...payload.new as Transaction, amount: parseFloat((payload.new as any).amount) };
            setTransactions(prev => {
              const upd = [...prev.filter(x => x.id !== tx.id), tx]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              const s = { orders: ordersRef.current, transactions: upd };
              saveLS(s); bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
              return upd;
            });
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => {
              const upd = prev.filter(x => x.id !== payload.old.id);
              const s = { orders: ordersRef.current, transactions: upd };
              saveLS(s); bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
              return upd;
            });
          }
        }).subscribe(status => {
          const isSubscribed = status === 'SUBSCRIBED';
          // Only update realtimeConnectedRef to true here; the orders channel subscribe
          // callback is the canonical source for disconnection state to avoid flip-flopping.
          if (isSubscribed) {
            realtimeConnectedRef.current = true;
            setConnected(true);
          }
        });
    };
    setup();
    return () => {
      ordCh && supabase.removeChannel(ordCh).catch(() => {});
      txCh  && supabase.removeChannel(txCh).catch(() => {});
    };
  }, []);

  useEffect(() => {
    const h = () => fetchAll().then(ok => {
      if (ok) setConnected(true);
      else if (!realtimeConnectedRef.current) setConnected(false);
    });
    window.addEventListener('online', h);
    return () => window.removeEventListener('online', h);
  }, [fetchAll]);

  const addOrder = useCallback((order: Omit<Order, 'deliveredItems'>) => {
    const full: Order = { ...order, deliveredItems: [] };
    const newTx: Transaction = {
      id: crypto.randomUUID(), amount: order.total, type: 'sale',
      description: `Pedido ${order.id}`, timestamp: new Date().toISOString(),
    };
    setOrders(prev => {
      const upd = [...prev, full];
      const s = { orders: upd, transactions: txRef.current };
      saveLS(s); bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
      return upd;
    });
    setTransactions(prev => {
      const upd = [...prev, newTx];
      const s = { orders: ordersRef.current, transactions: upd };
      saveLS(s); bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
      return upd;
    });
    writeOrder({ t: 'upsert_order', d: toDb(full) });
    writeTx({ t: 'upsert_tx', d: newTx });
  }, [writeOrder, writeTx]);

  const updateOrderStatus = useCallback((id: string, status: Order['status']) => {
    setOrders(prev => {
      const upd = prev.map(o => o.id === id ? { ...o, status } : o);
      const s = { orders: upd, transactions: txRef.current };
      saveLS(s); bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
      return upd;
    });
    writeOrder({ t: 'update_order', id, patch: { status } });
  }, [writeOrder]);

  const markItemReady = useCallback((orderId: string, itemId: string) => {
    const order = ordersRef.current.find(o => o.id === orderId);
    if (!order) return;
    const deliveredItems = order.deliveredItems.includes(itemId)
      ? order.deliveredItems.filter(x => x !== itemId)
      : [...order.deliveredItems, itemId];
    const allDone = order.items.every(i => deliveredItems.includes(i.id));
    const status: Order['status'] = allDone ? 'ready' : (order.status === 'ready' ? 'preparing' : order.status);
    setOrders(prev => {
      const upd = prev.map(o => o.id === orderId ? { ...o, deliveredItems, status } : o);
      const s = { orders: upd, transactions: txRef.current };
      saveLS(s); bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
      return upd;
    });
    writeOrder({ t: 'update_order', id: orderId, patch: { delivered_items: deliveredItems, status } });
  }, [writeOrder]);

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => {
      const upd = prev.filter(o => o.id !== id);
      const s = { orders: upd, transactions: txRef.current };
      saveLS(s); bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
      return upd;
    });
    setTransactions(prev => prev.filter(t => t.description !== `Pedido ${id}`));
    writeOrder({ t: 'delete_order', id });
    writeTx({ t: 'delete_tx_desc', desc: `Pedido ${id}` });
  }, [writeOrder, writeTx]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = { ...tx, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setTransactions(prev => {
      const upd = [...prev, newTx];
      const s = { orders: ordersRef.current, transactions: upd };
      saveLS(s); bcRef.current?.postMessage({ type: 'STATE', state: s, from: tabId.current });
      return upd;
    });
    writeTx({ t: 'upsert_tx', d: newTx });
  }, [writeTx]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const upd = prev.filter(t => t.id !== id);
      saveLS({ orders: ordersRef.current, transactions: upd });
      return upd;
    });
    writeTx({ t: 'delete_tx', id });
  }, [writeTx]);

  const addItemsToOrder = useCallback((orderId: string, newItems: OrderItem[]) => {
    const order = ordersRef.current.find(o => o.id === orderId);
    if (!order) return;
    const merged = [...order.items];
    newItems.forEach(ni => {
      const ex = merged.find(i => i.name === ni.name);
      if (ex) ex.quantity += ni.quantity; else merged.push({ ...ni, id: crypto.randomUUID() });
    });
    const newTotal = merged.reduce((s, i) => s + i.price * i.quantity, 0);
    const upd = { ...order, items: merged, total: newTotal };
    setOrders(prev => {
      const updList = prev.map(o => o.id === orderId ? upd : o);
      saveLS({ orders: updList, transactions: txRef.current });
      return updList;
    });
    writeOrder({ t: 'upsert_order', d: toDb(upd) });
    const extraAmt = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const existTx = txRef.current.find(t => t.description === `Pedido ${orderId}`);
    if (existTx) writeTx({ t: 'update_tx_amt', id: existTx.id, amount: order.total + extraAmt });
  }, [writeOrder, writeTx]);

  const getTotalSales    = useCallback(() => transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0), [transactions]);
  const getTotalExpenses = useCallback(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);
  const getOtherIncome   = useCallback(() => transactions.filter(t => t.type === 'other-income' || t.type === 'card-close').reduce((s, t) => s + t.amount, 0), [transactions]);
  const getNetProfit     = useCallback(() => getTotalSales() + getOtherIncome() - getTotalExpenses(), [getTotalSales, getOtherIncome, getTotalExpenses]);

  const buildDailySummary = useCallback((date: string): DailySummary => {
    const dayTx  = txRef.current.filter(t => t.timestamp.startsWith(date));
    const dayOrd = ordersRef.current.filter(o => o.timestamp.startsWith(date));
    const totalSales    = dayTx.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const otherIncome   = dayTx.filter(t => t.type === 'other-income' || t.type === 'card-close').reduce((s, t) => s + t.amount, 0);
    const itemMap: Record<string, { qty: number; total: number }> = {};
    dayOrd.forEach(o => o.items.forEach(i => {
      if (!itemMap[i.name]) itemMap[i.name] = { qty: 0, total: 0 };
      itemMap[i.name].qty += i.quantity; itemMap[i.name].total += i.price * i.quantity;
    }));
    return {
      date, totalSales, totalExpenses, otherIncome,
      netProfit: totalSales + otherIncome - totalExpenses,
      itemsSold: Object.entries(itemMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total),
      transactions: dayTx,
    };
  }, []);

  const closeDayAndClean = useCallback(async (date: string) => {
    const dayOrdIds = ordersRef.current.filter(o => o.timestamp.startsWith(date)).map(o => o.id);
    if (dayOrdIds.length) { try { await supabase.from('orders').delete().in('id', dayOrdIds); } catch {} }
    setOrders(prev => { const u = prev.filter(o => !o.timestamp.startsWith(date)); saveLS({ orders: u, transactions: txRef.current }); return u; });
  }, []);

  return (
    <Ctx.Provider value={{
      orders, transactions, connected, pendingCount,
      addOrder, addItemsToOrder, updateOrderStatus, markItemReady,
      deleteOrder, addTransaction, deleteTransaction,
      getTotalSales, getTotalExpenses, getOtherIncome, getNetProfit,
      buildDailySummary, closeDayAndClean,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}
