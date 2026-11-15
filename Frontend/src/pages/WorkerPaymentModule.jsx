import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAllStaff,
  getEntries,
  getWageRates,
  getWageSummary,
  getWagePayments,
  createWagePayment,
  deleteWagePayment,
  getAdvanceBalance,
  createAdvance,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { calculateWorkerWagesFromEntries, getEffectiveNetAmount, getEffectivePaidDate } from '../utils/wageUtils';

const fmt = (n) => {
  const num = Number(n || 0);
  const formatted = Math.abs(num).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return num < 0 ? `-PKR ${formatted}` : `PKR ${formatted}`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const today = () => new Date().toISOString().split('T')[0];
const firstOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

const BT = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#10b981',
  successDark: '#059669',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  purple: '#7c3aed',
};

const AVATAR_PALETTES = [
  { bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', lightBg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  { bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)', lightBg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', lightBg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  { bg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', lightBg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  { bg: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', lightBg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
  { bg: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)', lightBg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' },
  { bg: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', lightBg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
];

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'W';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getWorkerPalette(idOrName) {
  let hash = 0;
  const str = String(idOrName || 'worker');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function generateWhatsAppMessage({ workerName, netAmount, grossAmount, deductions, paidAt, notes, isAdvance }) {
  const company = 'Clothing Manager';
  const dateStr = paidAt
    ? new Date(paidAt).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  let text = `*${company.toUpperCase()} — PAYMENT VOUCHER* 🧾\n\n`;
  text += `👤 *Worker:* ${workerName}\n`;
  text += `📅 *Date:* ${dateStr}\n`;
  if (isAdvance) {
    text += `🔖 *Payment Type:* Cash Advance\n`;
    text += `💰 *Advance Paid:* *Rs ${Number(netAmount || 0).toLocaleString()}*\n`;
  } else {
    text += `🔖 *Payment Type:* Worker Wage Payment\n`;
    text += `💵 *Amount:* Rs ${Number(grossAmount || 0).toLocaleString()}\n`;
    if (Number(deductions) > 0) {
      text += `➖ *Advance Deduction:* Rs ${Number(deductions || 0).toLocaleString()}\n`;
    }
    text += `✅ *Net Paid to Worker:* *Rs ${Number(netAmount || 0).toLocaleString()}*\n`;
  }
  if (notes) {
    text += `📝 *Notes:* ${notes}\n`;
  }
  text += `\nThank you for your hard work! 👍`;
  return text;
}

export default function WorkerPaymentModule() {
  const { user, can } = useAuth();
  const { isDark } = useTheme();

  // Role-Based Access Control
  // Admin: canRecordPayment = true, canDeletePayment = true
  // Manager: canRecordPayment = true, canDeletePayment = false
  // Viewer: canRecordPayment = false, canDeletePayment = false
  const canRecordPayment = can('canRecordPayment');
  const canDeletePayment = can('canManageWages');
  const userRole = user?.role || 'Viewer';
  const isAdmin = userRole === 'Admin' || canDeletePayment;

  const [workers, setWorkers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Simple 1-Step Payment Form state
  const [workerId, setWorkerId] = useState('');
  const [paymentType, setPaymentType] = useState('wage'); // 'wage' | 'advance'
  const [payAmount, setPayAmount] = useState('');
  const [payDeduction, setPayDeduction] = useState('0');
  const [payDate, setPayDate] = useState(today());
  const [payNotes, setPayNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-fetched helper info for the selected worker
  const [workerStats, setWorkerStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filter & Pagination state for payment history grid
  const [filterWorkerId, setFilterWorkerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [whatsAppModal, setWhatsAppModal] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ws, sum, pmts] = await Promise.all([
        getAllStaff(),
        getWageSummary(),
        getWagePayments({}),
      ]);
      setWorkers(ws || []);
      setSummary(sum || null);
      setPayments(pmts || []);
    } catch {
      setError('Failed to load worker payments. Please make sure the server is running.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automatically fetch earned wages & advance balance when a worker is selected
  useEffect(() => {
    if (!workerId) {
      setWorkerStats(null);
      setPayAmount('');
      setPayDeduction('0');
      return;
    }

    let cancelled = false;
    const wid = Number(workerId);
    setStatsLoading(true);

    Promise.all([
      getEntries(wid).catch(() => []),
      getWageRates(wid).catch(() => []),
      getAdvanceBalance(wid).catch(() => null),
    ]).then(([entries, rates, adv]) => {
      if (cancelled) return;
      const { grossAmount: totalEarned, breakdown } = calculateWorkerWagesFromEntries(wid, entries, rates);
      const workerPmts = payments.filter(p => p.workerId === wid);
      const totalAlreadyPaid = workerPmts.reduce((s, p) => s + (Number(p.grossAmount) || 0), 0);
      const remainingDue = totalEarned - totalAlreadyPaid;
      const pendingAdvance = adv?.pendingBalance || 0;

      setWorkerStats({
        totalEarned,
        totalAlreadyPaid,
        paymentCount: workerPmts.length,
        remainingDue,
        pendingAdvance,
        breakdown,
      });

      setPayAmount('');
      setPayDeduction('0');
      setStatsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [workerId, payments]);

  const netToWorker = useMemo(() => {
    const gross = Number(payAmount) || 0;
    const ded = paymentType === 'wage' ? Number(payDeduction) || 0 : 0;
    return gross - ded;
  }, [payAmount, payDeduction, paymentType]);

  const openWhatsAppReceipt = (data) => {
    const worker = workers.find(w => w.id === data.workerId || w.name === data.workerName);
    const phone = data.phone || worker?.phone || '';
    const message = generateWhatsAppMessage(data);
    setWhatsAppModal({
      workerName: data.workerName,
      phone,
      netAmount: data.netAmount,
      message,
      copied: false,
    });
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!canRecordPayment) {
      setError('You do not have permission to disburse worker payments.');
      return;
    }
    setError('');
    setSuccessMsg('');

    if (!workerId) {
      setError('Please select a worker first.');
      return;
    }
    const gross = Number(payAmount) || 0;
    if (gross <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    setSaving(true);
    try {
      const wid = Number(workerId);
      const worker = workers.find(w => w.id === wid);

      if (paymentType === 'advance') {
        const created = await createAdvance({
          workerId: wid,
          amount: gross,
          notes: payNotes || null,
          advanceDate: new Date(payDate || today()).toISOString(),
        });
        setSuccessMsg(`Cash advance of ${fmt(gross)} recorded for ${worker?.name || 'Worker'}.`);
        setPayAmount('');
        setPayNotes('');
        await loadData();
        openWhatsAppReceipt({
          workerId: wid,
          workerName: worker?.name || created?.workerName || 'Worker',
          phone: worker?.phone,
          grossAmount: gross,
          deductions: 0,
          netAmount: gross,
          paidAt: payDate,
          notes: payNotes,
          isAdvance: true,
        });
      } else {
        const ded = Number(payDeduction) || 0;
        const netPaid = Math.max(0, gross - ded);
        const created = await createWagePayment({
          workerId: wid,
          periodFrom: new Date(firstOfMonth()).toISOString(),
          periodTo: new Date(payDate || today()).toISOString(),
          paidAt: new Date(payDate || today()).toISOString(),
          grossAmount: gross,
          deductions: ded,
          netAmount: netPaid,
          notes: payNotes || null,
          recordAsAdvance: false,
        });
        setSuccessMsg(`Payment of ${fmt(netPaid)} disbursed to ${worker?.name || 'Worker'}.`);
        setPayAmount('');
        setPayDeduction('0');
        setPayNotes('');
        await loadData();
        openWhatsAppReceipt({
          workerId: wid,
          workerName: worker?.name || created?.workerName || 'Worker',
          phone: worker?.phone,
          grossAmount: gross,
          deductions: ded,
          netAmount: netPaid,
          paidAt: payDate,
          notes: payNotes,
          isAdvance: false,
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record payment. Please check inputs.');
    }
    setSaving(false);
  };

  const handleDeletePayment = async (id) => {
    if (!canDeletePayment) {
      setError('Only Administrators can delete payment records.');
      setDeleteConfirm(null);
      return;
    }
    try {
      await deleteWagePayment(id);
      setPayments(prev => prev.filter(p => p.id !== id));
      const sum = await getWageSummary();
      setSummary(sum);
      setSuccessMsg('Payment record deleted.');
    } catch {
      setError('Failed to delete payment record.');
    }
    setDeleteConfirm(null);
  };

  const workerMap = useMemo(() => {
    const map = {};
    workers.forEach(w => { map[w.id] = w; });
    return map;
  }, [workers]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (filterWorkerId && p.workerId !== Number(filterWorkerId)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (p.workerName || '').toLowerCase().includes(q);
        const noteMatch = (p.notes || '').toLowerCase().includes(q);
        const amtMatch = String(p.grossAmount || '').includes(q) || String(p.netAmount || '').includes(q);
        if (!nameMatch && !noteMatch && !amtMatch) return false;
      }
      return true;
    });
  }, [payments, filterWorkerId, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterWorkerId, searchQuery, pageSize]);

  const filteredTotals = useMemo(() => {
    return filteredPayments.reduce(
      (acc, p) => {
        acc.gross += Number(p.grossAmount) || 0;
        acc.ded += Number(p.deductions) || 0;
        acc.net += getEffectiveNetAmount(p);
        return acc;
      },
      { gross: 0, ded: 0, net: 0 }
    );
  }, [filteredPayments]);

  const totalPages = useMemo(() => {
    if (pageSize === 0) return 1;
    return Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  }, [filteredPayments.length, pageSize]);

  const paginatedPayments = useMemo(() => {
    if (pageSize === 0) return filteredPayments;
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const roleBadgeInfo = useMemo(() => {
    if (userRole === 'Admin') {
      return { icon: '🛡️', text: 'Admin • Full Access', bg: isDark ? 'rgba(37,99,235,0.2)' : '#dbeafe', color: isDark ? '#93c5fd' : '#1e40af', border: isDark ? '#1e40af' : '#93c5fd' };
    }
    if (userRole === 'Manager') {
      return { icon: '💼', text: 'Manager • Disburse Only', bg: isDark ? 'rgba(16,185,129,0.2)' : '#d1fae5', color: isDark ? '#6ee7b7' : '#065f46', border: isDark ? '#065f46' : '#6ee7b7' };
    }
    return { icon: '👁️', text: 'Viewer • Read-Only Mode', bg: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7', color: isDark ? '#fcd34d' : '#92400e', border: isDark ? '#92400e' : '#fcd34d' };
  }, [userRole, isDark]);

  if (loading) {
    return (
      <div style={styles.loadingBox(isDark)}>
        <div style={styles.spinner} />
        <div style={{ marginTop: 14, fontWeight: 600 }}>Loading Worker Payments…</div>
      </div>
    );
  }

  return (
    <div style={styles.page(isDark)}>
      {/* ── Executive Header ── */}
      <div style={styles.header(isDark)}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrap}>
            <span>💵</span>
          </div>
          <div>
            <div style={styles.headerBreadcrumb}>WORKFORCE DISBURSEMENT &amp; LEDGER</div>
            <h1 style={styles.headerTitle(isDark)}>Worker Payments</h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            background: roleBadgeInfo.bg,
            color: roleBadgeInfo.color,
            border: `1px solid ${roleBadgeInfo.border}`,
            padding: '6px 13px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>{roleBadgeInfo.icon}</span>
            <span>{roleBadgeInfo.text}</span>
          </span>
          <span style={styles.headerSubBadge(isDark)}>
            📊 {payments.length} Payments Recorded
          </span>
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={styles.alertCloseBtn}>✕</button>
        </div>
      )}

      {successMsg && (
        <div style={styles.successAlert}>
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={styles.alertCloseBtn}>✕</button>
        </div>
      )}

      {/* ── KPI Summary Row ── */}
      {summary && (
        <div style={styles.kpiGrid}>
          <KpiCard
            label="Total Net Disbursed"
            sub={`${payments.length} total vouchers`}
            tag="NET PAID TO WORKERS"
            value={fmt(payments.length > 0 ? payments.reduce((s, p) => s + getEffectiveNetAmount(p), 0) : summary.totalNet)}
            gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
            icon="✅"
          />
          <KpiCard
            label="Total Gross Wages"
            sub="Before advance deductions"
            tag="GROSS SETTLED"
            value={fmt(summary.totalPaid)}
            gradient="linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)"
            icon="💵"
          />
          <KpiCard
            label="Advances Deducted"
            sub="Recovered from wages"
            tag="RECOVERED"
            value={fmt(summary.totalDeductions)}
            gradient="linear-gradient(135deg, #be123c 0%, #f43f5e 100%)"
            icon="🔻"
          />
          <KpiCard
            label="Pending Worker Advances"
            sub="Unsettled advance balance"
            tag="OUTSTANDING"
            value={fmt(summary.totalOutstandingAdvances)}
            gradient="linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)"
            icon="⏳"
          />
        </div>
      )}

      {/* ── Worker Balance Inspector & Disbursement Studio ── */}
      <div style={styles.cardBox(isDark)}>
        <div style={styles.cardHeader(isDark)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: canRecordPayment
                ? (isDark ? 'rgba(16,185,129,0.2)' : '#ecfdf5')
                : (isDark ? 'rgba(59,130,246,0.2)' : '#eff6ff'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}>
              {canRecordPayment ? '💸' : '🔍'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {canRecordPayment ? 'Pay Worker (Simple 1-Step Disbursement)' : 'Worker Wage & Balance Inspector'}
              </div>
              <div style={{ fontSize: 11.5, color: isDark ? '#94a3b8' : '#64748b', marginTop: 1 }}>
                {canRecordPayment
                  ? 'Select a worker to view real-time earned wages and disburse payment or advance'
                  : 'Select a worker below to inspect their earned wages, paid amounts, and remaining balance'}
              </div>
            </div>
          </div>

          {canRecordPayment ? (
            <div style={styles.segmentedControl(isDark)}>
              <button
                type="button"
                onClick={() => setPaymentType('wage')}
                style={styles.typePill(paymentType === 'wage', '#059669', isDark)}
              >
                💵 Wage Payment
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('advance')}
                style={styles.typePill(paymentType === 'advance', '#7c3aed', isDark)}
              >
                💳 Cash Advance
              </button>
            </div>
          ) : (
            <span style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: isDark ? '#fcd34d' : '#b45309',
              background: isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb',
              border: `1px solid ${isDark ? '#92400e' : '#fde68a'}`,
              padding: '5px 12px',
              borderRadius: 999,
            }}>
              🔒 View-Only Access (Disbursement Disabled)
            </span>
          )}
        </div>

        <form onSubmit={handlePaySubmit} style={{ padding: '20px 22px' }}>
          {/* Worker Selection + Form Fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: canRecordPayment ? 'repeat(auto-fit, minmax(210px, 1fr))' : 'minmax(260px, 420px)',
            gap: 16,
          }}>
            {/* 1. Select Worker */}
            <div style={styles.fieldGroup}>
              <label style={styles.label(isDark)}>
                Select Worker {canRecordPayment && <span style={{ color: BT.danger }}>*</span>}
              </label>
              <select
                style={styles.select(isDark)}
                value={workerId}
                onChange={e => setWorkerId(e.target.value)}
                required={canRecordPayment}
              >
                <option value="">— Choose Worker to {canRecordPayment ? 'Pay' : 'Inspect'} —</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.sheetType ? `(${w.sheetType})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {canRecordPayment && (
              <>
                {/* 2. Amount Paying Now */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label(isDark)}>
                    {paymentType === 'advance' ? 'Advance Amount (PKR)' : 'Amount Paying Now (PKR)'}{' '}
                    <span style={{ color: BT.danger }}>*</span>
                  </label>
                  <input
                    style={styles.input(isDark)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    required
                  />
                </div>

                {/* 3. Advance Deduction (only when paying wage) */}
                {paymentType === 'wage' && (
                  <div style={styles.fieldGroup}>
                    <label style={styles.label(isDark)}>Advance Deduction (PKR)</label>
                    <input
                      style={styles.input(isDark)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={payDeduction}
                      onChange={e => setPayDeduction(e.target.value)}
                    />
                  </div>
                )}

                {/* 4. Payment Date */}
                <div style={styles.fieldGroup}>
                  <label style={styles.label(isDark)}>Payment Date</label>
                  <input
                    style={styles.input(isDark)}
                    type="date"
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                  />
                </div>

                {/* 5. Notes */}
                <div style={{ ...styles.fieldGroup, gridColumn: paymentType === 'wage' ? '1 / -1' : 'auto' }}>
                  <label style={styles.label(isDark)}>Notes / Remarks</label>
                  <input
                    style={styles.input(isDark)}
                    type="text"
                    placeholder="e.g. Weekly wage settlement, cash payout…"
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* ── Enhanced Worker Balance Panel when a worker is selected ── */}
          {workerId && (
            <div style={styles.balancePanel(isDark)}>
              {statsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                  <span>⏳</span>
                  <span>Calculating worker earnings &amp; ledger balance…</span>
                </div>
              ) : workerStats ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={styles.balanceMiniGrid}>
                    {/* Card 1: Total Earned */}
                    <div style={styles.miniStatCard(isDark, '#2563eb')}>
                      <div style={styles.miniStatLabel(isDark)}>📈 Total Earned</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#60a5fa' : '#1d4ed8', marginTop: 4 }}>
                        {fmt(workerStats.totalEarned)}
                      </div>
                      <div style={styles.miniStatSub(isDark)}>
                        From {workerStats.breakdown?.reduce((s, b) => s + (b.totalPieces || 0), 0)?.toLocaleString() || 0} total pcs
                      </div>
                    </div>

                    {/* Card 2: Already Paid */}
                    <div style={styles.miniStatCard(isDark, '#64748b')}>
                      <div style={styles.miniStatLabel(isDark)}>✅ Already Paid</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#e2e8f0' : '#334155', marginTop: 4 }}>
                        {fmt(workerStats.totalAlreadyPaid)}
                      </div>
                      <div style={styles.miniStatSub(isDark)}>
                        Across {workerStats.paymentCount || 0} payment(s)
                      </div>
                    </div>

                    {/* Card 3: Remaining Unpaid Wages (shows negative in Red if overpaid) */}
                    <div style={styles.miniStatCard(
                      isDark,
                      workerStats.remainingDue < 0 ? '#ef4444' : workerStats.remainingDue > 0 ? '#10b981' : '#64748b'
                    )}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <span style={styles.miniStatLabel(isDark)}>
                          {workerStats.remainingDue < 0 ? '⚠️ Remaining Unpaid (Overpaid)' : '⚖️ Remaining Unpaid Wages'}
                        </span>
                        {canRecordPayment && workerStats.remainingDue > 0 && paymentType === 'wage' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayAmount(String(workerStats.remainingDue));
                              setPayDeduction(String(Math.min(workerStats.pendingAdvance, workerStats.remainingDue)));
                            }}
                            style={styles.autoFillBtn}
                            title="Click to auto-fill remaining balance"
                          >
                            ⚡ Auto-Fill
                          </button>
                        )}
                      </div>
                      <div style={{
                        fontSize: 19,
                        fontWeight: 800,
                        marginTop: 4,
                        color: workerStats.remainingDue < 0
                          ? '#ef4444'
                          : workerStats.remainingDue > 0
                            ? (isDark ? '#34d399' : '#059669')
                            : (isDark ? '#94a3b8' : '#64748b'),
                      }}>
                        {fmt(workerStats.remainingDue)}
                      </div>
                      <div style={styles.miniStatSub(isDark)}>
                        {workerStats.remainingDue < 0
                          ? 'Worker paid in excess of earned entries'
                          : workerStats.remainingDue > 0
                            ? 'Payable balance due to worker'
                            : 'All earned wages settled'}
                      </div>
                    </div>

                    {/* Card 4: Pending Advance */}
                    <div style={styles.miniStatCard(isDark, workerStats.pendingAdvance > 0 ? '#f59e0b' : '#64748b')}>
                      <div style={styles.miniStatLabel(isDark)}>💳 Pending Advance</div>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 800,
                        marginTop: 4,
                        color: workerStats.pendingAdvance > 0 ? (isDark ? '#fbbf24' : '#d97706') : (isDark ? '#94a3b8' : '#64748b'),
                      }}>
                        {fmt(workerStats.pendingAdvance)}
                      </div>
                      <div style={styles.miniStatSub(isDark)}>
                        {workerStats.pendingAdvance > 0 ? 'Available for deduction' : 'No pending cash advance'}
                      </div>
                    </div>
                  </div>

                  {/* Task Breakdown Chips — Admin Only */}
                  {isAdmin && workerStats.breakdown?.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      paddingTop: 10,
                      borderTop: `1px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
                    }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: isDark ? '#94a3b8' : '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Task Breakdown:
                      </span>
                      {workerStats.breakdown.map(b => (
                        <span
                          key={`${b.taskType}-${b.ratePerPiece}`}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '4px 11px',
                            borderRadius: 999,
                            background: isDark ? 'rgba(37,99,235,0.18)' : '#ffffff',
                            border: `1px solid ${isDark ? '#1e40af' : '#bfdbfe'}`,
                            color: isDark ? '#93c5fd' : '#1e40af',
                            boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                          }}
                        >
                          {b.taskType}: <strong>{b.totalPieces.toLocaleString()} pcs</strong> × ₨ {b.ratePerPiece} = <strong>{fmt(b.amount)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Bottom Summary & Submit Bar (Only for Admin & Manager) */}
          {canRecordPayment && (
            <div style={styles.disburseFooter(isDark)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                  Net to Worker:{' '}
                  <strong style={{ color: netToWorker < 0 ? BT.danger : BT.successDark, fontSize: 20 }}>
                    {fmt(netToWorker)}
                  </strong>
                </span>
                {paymentType === 'wage' && Number(payDeduction) > 0 && (
                  <span style={{
                    fontSize: 12,
                    color: BT.danger,
                    fontWeight: 700,
                    background: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
                    padding: '3px 10px',
                    borderRadius: 999,
                    border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
                  }}>
                    ➖ Includes {fmt(payDeduction)} advance deduction
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setWorkerId('');
                    setPayAmount('');
                    setPayDeduction('0');
                    setPayNotes('');
                  }}
                  style={styles.btnSecondary(isDark)}
                >
                  Reset
                </button>
                <button type="submit" disabled={saving} style={styles.btnConfirm}>
                  {saving ? '⏳ Processing…' : '✓ Confirm & Disburse'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* ── Beautiful Worker Payment History Grid ── */}
      <div style={styles.cardBox(isDark)}>
        {/* Grid Header & Toolbar */}
        <div style={styles.gridHeader(isDark)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: isDark ? 'rgba(37,99,235,0.2)' : '#eff6ff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
              }}>
                🧾
              </span>
              <span style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Worker Payment History
              </span>
            </div>

            <span style={styles.countPill(isDark)}>
              {filteredPayments.length} {filteredPayments.length === 1 ? 'Record' : 'Records'}
            </span>

            {filteredPayments.length > 0 && (
              <div style={styles.summaryRibbon(isDark)}>
                <span>Gross: <strong style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>{fmt(filteredTotals.gross)}</strong></span>
                {filteredTotals.ded > 0 && (
                  <>
                    <span style={{ opacity: 0.35 }}>|</span>
                    <span>Ded.: <strong style={{ color: '#ef4444' }}>{fmt(filteredTotals.ded)}</strong></span>
                  </>
                )}
                <span style={{ opacity: 0.35 }}>|</span>
                <span>Net Paid: <strong style={{ color: isDark ? '#34d399' : '#059669' }}>{fmt(filteredTotals.net)}</strong></span>
              </div>
            )}
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 11, fontSize: 13, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
              <input
                style={{ ...styles.input(isDark), width: 225, padding: '7px 30px 7px 32px', fontSize: 13 }}
                placeholder="Search worker, amount, notes…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              style={{ ...styles.select(isDark), width: 195, padding: '7px 12px', fontSize: 13 }}
              value={filterWorkerId}
              onChange={e => setFilterWorkerId(e.target.value)}
            >
              <option value="">All Workers ({payments.length})</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>

            <select
              style={{ ...styles.select(isDark), width: 115, padding: '7px 10px', fontSize: 12.5 }}
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              title="Rows per page"
            >
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={0}>Show All</option>
            </select>
          </div>
        </div>

        {/* Modern Data Grid */}
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th(isDark), width: 58, textAlign: 'center' }}>#</th>
                <th style={styles.th(isDark)}>Worker</th>
                <th style={styles.th(isDark)}>Paid On</th>
                <th style={{ ...styles.th(isDark), textAlign: 'right' }}>Gross Amount</th>
                <th style={{ ...styles.th(isDark), textAlign: 'right' }}>Adv. Deduction</th>
                <th style={{ ...styles.th(isDark), textAlign: 'right' }}>Net Paid</th>
                <th style={styles.th(isDark)}>Remarks / Notes</th>
                <th style={{ ...styles.th(isDark), textAlign: 'center', width: canDeletePayment ? 165 : 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.empty(isDark)}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#e2e8f0' : '#334155' }}>
                      No worker payment records found
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 4 }}>
                      {searchQuery || filterWorkerId
                        ? 'Try clearing your search or worker filter.'
                        : 'Disburse a worker payment above to see records here.'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p, idx) => {
                  const globalIdx = pageSize === 0 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                  const workerInfo = workerMap[p.workerId];
                  const palette = getWorkerPalette(p.workerId || p.workerName);
                  const netAmt = getEffectiveNetAmount(p);
                  const hasDed = Number(p.deductions) > 0;
                  const isRowHovered = hoveredRow === p.id;

                  return (
                    <tr
                      key={p.id}
                      onMouseEnter={() => setHoveredRow(p.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={styles.tr(isDark, idx % 2 === 0, isRowHovered)}
                    >
                      {/* 1. Serial Number Badge */}
                      <td style={{ ...styles.td(isDark), textAlign: 'center' }}>
                        <span style={styles.serialBadge(isDark)}>
                          {String(globalIdx).padStart(2, '0')}
                        </span>
                      </td>

                      {/* 2. Worker Avatar + Name + Role */}
                      <td style={styles.td(isDark)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: palette.bg,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 13,
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                          }}>
                            {getInitials(p.workerName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: isDark ? '#f8fafc' : '#0f172a' }}>
                              {p.workerName}
                            </div>
                            {(workerInfo?.sheetType || workerInfo?.role) && (
                              <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginTop: 1 }}>
                                {workerInfo.sheetType || workerInfo.role}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Paid On Date Pill */}
                      <td style={styles.td(isDark)}>
                        <span style={styles.datePill(isDark)}>
                          📅 {fmtDate(getEffectivePaidDate(p))}
                        </span>
                      </td>

                      {/* 4. Gross Amount */}
                      <td style={{ ...styles.td(isDark), textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: isDark ? '#cbd5e1' : '#334155' }}>
                          {fmt(p.grossAmount)}
                        </span>
                      </td>

                      {/* 5. Advance Deduction */}
                      <td style={{ ...styles.td(isDark), textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {hasDed ? (
                          <span style={styles.deductionPill(isDark)}>
                            -{fmt(p.deductions)}
                          </span>
                        ) : (
                          <span style={{ color: isDark ? '#475569' : '#cbd5e1', fontWeight: 600 }}>—</span>
                        )}
                      </td>

                      {/* 6. Net Paid */}
                      <td style={{ ...styles.td(isDark), textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={styles.netPaidPill(isDark, netAmt < 0)}>
                          {fmt(netAmt)}
                        </span>
                      </td>

                      {/* 7. Notes / Remarks */}
                      <td style={{ ...styles.td(isDark), maxWidth: 260 }}>
                        {p.notes ? (
                          <span style={{
                            color: isDark ? '#cbd5e1' : '#475569',
                            fontSize: 12.5,
                            display: 'inline-block',
                            lineHeight: 1.4,
                          }}>
                            {p.notes}
                          </span>
                        ) : (
                          <span style={{ color: isDark ? '#475569' : '#cbd5e1', fontSize: 12, fontStyle: 'italic' }}>
                            No remarks
                          </span>
                        )}
                      </td>

                      {/* 8. Actions (Receipt for all; Delete strictly for Admin only) */}
                      <td style={{ ...styles.td(isDark), textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            type="button"
                            style={styles.whatsAppSmBtn}
                            onClick={() => openWhatsAppReceipt({
                              workerId: p.workerId,
                              workerName: p.workerName,
                              phone: p.workerPhone || workerInfo?.phone,
                              grossAmount: p.grossAmount,
                              deductions: p.deductions,
                              netAmount: netAmt,
                              paidAt: getEffectivePaidDate(p),
                              notes: p.notes,
                              isAdvance: false,
                            })}
                            title="View or share payment voucher via WhatsApp"
                          >
                            📲 Receipt
                          </button>

                          {canDeletePayment && (
                            deleteConfirm === p.id ? (
                              <>
                                <button
                                  type="button"
                                  style={styles.btnDangerSm}
                                  onClick={() => handleDeletePayment(p.id)}
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  style={styles.btnSecondarySm}
                                  onClick={() => setDeleteConfirm(null)}
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                style={styles.deleteIconBtn(isDark)}
                                onClick={() => setDeleteConfirm(p.id)}
                                title="Delete Payment Record (Admin Only)"
                              >
                                🗑️
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Summary Footer */}
            {filteredPayments.length > 0 && (
              <tfoot>
                <tr style={styles.tfootRow(isDark)}>
                  <td colSpan={3} style={{ ...styles.td(isDark), fontWeight: 800, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total ({filteredPayments.length} {filteredPayments.length === 1 ? 'Payment' : 'Payments'})
                  </td>
                  <td style={{ ...styles.td(isDark), textAlign: 'right', fontWeight: 800, fontSize: 13.5 }}>
                    {fmt(filteredTotals.gross)}
                  </td>
                  <td style={{ ...styles.td(isDark), textAlign: 'right', fontWeight: 800, fontSize: 13.5, color: '#ef4444' }}>
                    {filteredTotals.ded > 0 ? `-${fmt(filteredTotals.ded)}` : '—'}
                  </td>
                  <td style={{ ...styles.td(isDark), textAlign: 'right', fontWeight: 800, fontSize: 14, color: isDark ? '#34d399' : '#059669' }}>
                    {fmt(filteredTotals.net)}
                  </td>
                  <td colSpan={2} style={styles.td(isDark)} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Bar */}
        {pageSize > 0 && totalPages > 1 && (
          <div style={styles.paginationBar(isDark)}>
            <div style={{ fontSize: 12.5, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong>–
              <strong>{Math.min(currentPage * pageSize, filteredPayments.length)}</strong> of{' '}
              <strong>{filteredPayments.length}</strong> payments
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={styles.pageBtn(false, currentPage <= 1, isDark)}
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .reduce((acc, page, idx, arr) => {
                  if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...');
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      style={styles.pageBtn(currentPage === item, false, isDark)}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={styles.pageBtn(false, currentPage >= totalPages, isDark)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── WhatsApp Receipt Modal ── */}
      {whatsAppModal && (
        <div style={styles.modalOverlay} onClick={() => setWhatsAppModal(null)}>
          <div style={styles.modalCard(isDark)} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>📲 Payment Voucher Ready</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Send receipt to {whatsAppModal.workerName}</div>
              </div>
              <button onClick={() => setWhatsAppModal(null)} style={styles.modalCloseBtn}>✕</button>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={styles.label(isDark)}>Worker WhatsApp Number</label>
                <input
                  style={styles.input(isDark)}
                  placeholder="e.g. 03001234567"
                  value={whatsAppModal.phone}
                  onChange={e => setWhatsAppModal(m => ({ ...m, phone: e.target.value }))}
                />
              </div>
              <pre style={styles.voucherPre(isDark)}>{whatsAppModal.message}</pre>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(whatsAppModal.message);
                    setWhatsAppModal(m => ({ ...m, copied: true }));
                  }}
                  style={styles.btnSecondary(isDark)}
                >
                  {whatsAppModal.copied ? '✓ Copied' : '📋 Copy Text'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    let cleanPhone = (whatsAppModal.phone || '').replace(/[^0-9]/g, '');
                    if (cleanPhone.startsWith('03')) cleanPhone = '92' + cleanPhone.slice(1);
                    const encoded = encodeURIComponent(whatsAppModal.message);
                    const url = cleanPhone
                      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
                      : `https://api.whatsapp.com/send?text=${encoded}`;
                    window.open(url, '_blank');
                  }}
                  style={styles.btnConfirm}
                >
                  📲 Send via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, sub, tag, value, gradient, icon }) {
  return (
    <div style={{
      background: gradient,
      borderRadius: 16,
      padding: '18px 20px',
      color: '#fff',
      boxShadow: '0 8px 22px rgba(0,0,0,0.14)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 108,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        right: -18,
        bottom: -22,
        width: 90,
        height: 90,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
          background: 'rgba(255,255,255,0.22)',
          padding: '3px 9px',
          borderRadius: 6,
          backdropFilter: 'blur(4px)',
        }}>
          {tag}
        </span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>{value}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <span style={{ fontSize: 12.5, opacity: 0.95, fontWeight: 700 }}>{label}</span>
          {sub && <span style={{ fontSize: 11, opacity: 0.78, fontWeight: 500 }}>{sub}</span>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: (isDark) => ({
    padding: '1.25rem 1.5rem',
    minHeight: '100vh',
    background: isDark ? 'var(--bg-page)' : '#f1f5f9',
    boxSizing: 'border-box',
  }),
  header: (isDark) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    padding: '1.1rem 1.4rem',
    marginBottom: '1.1rem',
    background: isDark ? 'var(--bg-card)' : '#ffffff',
    borderRadius: 16,
    border: `1px solid ${isDark ? 'var(--border-color)' : '#e2e8f0'}`,
    boxShadow: isDark ? 'none' : '0 2px 10px rgba(15, 23, 42, 0.04)',
  }),
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  headerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 23,
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },
  headerBreadcrumb: { fontSize: 10.5, fontWeight: 800, color: '#64748b', letterSpacing: '0.07em' },
  headerTitle: (isDark) => ({ margin: '2px 0 0', fontSize: '1.4rem', fontWeight: 800, color: isDark ? '#fff' : '#0f172a' }),
  headerSubBadge: (isDark) => ({
    background: isDark ? '#1e293b' : '#f1f5f9',
    color: isDark ? '#cbd5e1' : '#334155',
    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
    padding: '6px 13px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  }),
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
    marginBottom: '1.15rem',
  },
  cardBox: (isDark) => ({
    background: isDark ? 'var(--bg-card)' : '#ffffff',
    borderRadius: 16,
    border: `1px solid ${isDark ? 'var(--border-color)' : '#e2e8f0'}`,
    marginBottom: '1.15rem',
    overflow: 'hidden',
    boxShadow: isDark ? 'none' : '0 4px 16px rgba(15, 23, 42, 0.04)',
  }),
  cardHeader: (isDark) => ({
    padding: '15px 22px',
    borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#e2e8f0'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    color: isDark ? '#fff' : '#0f172a',
    background: isDark ? 'rgba(255,255,255,0.01)' : '#fcfcfd',
  }),
  segmentedControl: (isDark) => ({
    display: 'inline-flex',
    gap: 4,
    padding: 4,
    borderRadius: 12,
    background: isDark ? '#0f172a' : '#f1f5f9',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
  }),
  typePill: (active, color, isDark) => ({
    padding: '6px 14px',
    borderRadius: 9,
    border: 'none',
    background: active ? color : 'transparent',
    color: active ? '#fff' : (isDark ? '#94a3b8' : '#475569'),
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.16)' : 'none',
    transition: 'all 0.15s ease',
  }),
  balancePanel: (isDark) => ({
    background: isDark ? 'rgba(15, 23, 42, 0.55)' : '#f8fafc',
    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
    borderRadius: 14,
    padding: '14px 16px',
    marginTop: 18,
  }),
  balanceMiniGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
    gap: 12,
  },
  miniStatCard: (isDark, accentColor) => ({
    background: isDark ? 'var(--bg-card)' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderLeft: `4px solid ${accentColor}`,
    borderRadius: 11,
    padding: '11px 14px',
    boxShadow: isDark ? 'none' : '0 1px 4px rgba(15, 23, 42, 0.04)',
  }),
  miniStatLabel: (isDark) => ({
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: isDark ? '#94a3b8' : '#64748b',
  }),
  miniStatSub: (isDark) => ({
    fontSize: 11,
    color: isDark ? '#64748b' : '#94a3b8',
    marginTop: 3,
    fontWeight: 600,
  }),
  autoFillBtn: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '3px 9px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: (isDark) => ({
    fontSize: 11.5,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: isDark ? '#94a3b8' : '#475569',
  }),
  input: (isDark) => ({
    padding: '9px 13px',
    borderRadius: 10,
    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
    background: isDark ? 'var(--bg-subtle)' : '#fff',
    color: isDark ? 'var(--text-main)' : '#0f172a',
    fontSize: 13.5,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }),
  select: (isDark) => ({
    padding: '9px 13px',
    borderRadius: 10,
    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
    background: isDark ? 'var(--bg-subtle)' : '#fff',
    color: isDark ? 'var(--text-main)' : '#0f172a',
    fontSize: 13.5,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }),
  disburseFooter: (isDark) => ({
    marginTop: 18,
    paddingTop: 15,
    borderTop: `1px solid ${isDark ? 'var(--border-color)' : '#e2e8f0'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  }),
  btnConfirm: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 22px',
    fontSize: 13.5,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.28)',
  },
  btnSecondary: (isDark) => ({
    background: isDark ? '#334155' : '#e2e8f0',
    color: isDark ? '#f8fafc' : '#334155',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  }),
  gridHeader: (isDark) => ({
    padding: '16px 22px',
    borderBottom: `1px solid ${isDark ? 'var(--border-color)' : '#e2e8f0'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    background: isDark ? 'rgba(255,255,255,0.01)' : '#fcfcfd',
    color: isDark ? '#fff' : '#0f172a',
  }),
  countPill: (isDark) => ({
    background: isDark ? '#1e293b' : '#f1f5f9',
    color: isDark ? '#94a3b8' : '#475569',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 700,
  }),
  summaryRibbon: (isDark) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    color: isDark ? '#cbd5e1' : '#475569',
  }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: (isDark) => ({
    background: isDark ? '#0f172a' : '#f8fafc',
    color: isDark ? '#94a3b8' : '#475569',
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: `2px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    whiteSpace: 'nowrap',
  }),
  tr: (isDark, even, hovered) => ({
    background: hovered
      ? (isDark ? 'rgba(37, 99, 235, 0.12)' : '#f0f7ff')
      : even
        ? (isDark ? 'var(--bg-card)' : '#ffffff')
        : (isDark ? 'rgba(255,255,255,0.015)' : '#f8fafc'),
    borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
    transition: 'background 0.12s ease',
  }),
  td: (isDark) => ({
    padding: '12px 16px',
    color: isDark ? 'var(--text-main)' : '#1e293b',
    verticalAlign: 'middle',
  }),
  tfootRow: (isDark) => ({
    background: isDark ? '#0f172a' : '#f8fafc',
    borderTop: `2px solid ${isDark ? '#334155' : '#cbd5e1'}`,
  }),
  serialBadge: (isDark) => ({
    display: 'inline-block',
    minWidth: 28,
    padding: '3px 7px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
    background: isDark ? '#1e293b' : '#f1f5f9',
    color: isDark ? '#94a3b8' : '#64748b',
    fontVariantNumeric: 'tabular-nums',
  }),
  datePill: (isDark) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    background: isDark ? '#1e293b' : '#f1f5f9',
    color: isDark ? '#cbd5e1' : '#334155',
    whiteSpace: 'nowrap',
  }),
  deductionPill: (isDark) => ({
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 700,
    background: isDark ? 'rgba(239, 68, 68, 0.18)' : '#fef2f2',
    color: isDark ? '#fca5a5' : '#dc2626',
    border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
  }),
  netPaidPill: (isDark, isNegative) => ({
    display: 'inline-block',
    padding: '4px 11px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 800,
    background: isNegative
      ? (isDark ? 'rgba(239, 68, 68, 0.18)' : '#fef2f2')
      : (isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5'),
    color: isNegative
      ? (isDark ? '#fca5a5' : '#dc2626')
      : (isDark ? '#6ee7b7' : '#047857'),
    border: `1px solid ${isNegative
      ? (isDark ? '#7f1d1d' : '#fecaca')
      : (isDark ? '#065f46' : '#a7f3d0')}`,
  }),
  empty: (isDark) => ({
    textAlign: 'center',
    padding: '3.2rem 1.5rem',
    color: isDark ? '#94a3b8' : '#64748b',
  }),
  whatsAppSmBtn: {
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '5px 11px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(22, 163, 74, 0.22)',
    whiteSpace: 'nowrap',
  },
  btnDangerSm: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    padding: '5px 9px',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnSecondarySm: {
    background: '#64748b',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    padding: '5px 8px',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  deleteIconBtn: (isDark) => ({
    background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
    border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
    borderRadius: 8,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1,
  }),
  paginationBar: (isDark) => ({
    padding: '12px 20px',
    borderTop: `1px solid ${isDark ? 'var(--border-color)' : '#e2e8f0'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    background: isDark ? 'rgba(255,255,255,0.01)' : '#fcfcfd',
  }),
  pageBtn: (active, disabled, isDark) => ({
    padding: '5px 11px',
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 700,
    border: active ? '1px solid #2563eb' : `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
    background: active ? '#2563eb' : (isDark ? '#1e293b' : '#ffffff'),
    color: active ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
  }),
  errorAlert: {
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    padding: '11px 16px',
    borderRadius: 12,
    marginBottom: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 600,
  },
  successAlert: {
    background: '#f0fdf4',
    color: '#15803d',
    border: '1px solid #bbf7d0',
    padding: '11px 16px',
    borderRadius: 12,
    marginBottom: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 600,
  },
  alertCloseBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 },
  loadingBox: (isDark) => ({
    padding: '4rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: isDark ? '#94a3b8' : '#64748b',
  }),
  spinner: {
    width: 34,
    height: 34,
    border: '3px solid #cbd5e1',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modalCard: (isDark) => ({
    background: isDark ? 'var(--bg-card)' : '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
  }),
  modalHeader: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: '#fff',
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCloseBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer' },
  voucherPre: (isDark) => ({
    background: isDark ? '#0f172a' : '#f8fafc',
    color: isDark ? '#e2e8f0' : '#1e293b',
    padding: 12,
    borderRadius: 10,
    fontSize: 12.5,
    whiteSpace: 'pre-wrap',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    maxHeight: 220,
    overflowY: 'auto',
  }),
};
