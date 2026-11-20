import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AVAILABLE_YEARS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { seedAuthUsers } from '../services/api';

export default function Login() {
  const { login, selectedYear } = useAuth();
  const { isDark }              = useTheme();
  const navigate                = useNavigate();
  const [form, setForm]         = useState({ username: '', password: '', year: selectedYear || new Date().getFullYear() });
  const [error, setError]       = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading]   = useState(false);
  const [seeding, setSeeding]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await seedAuthUsers();
      setSuccessMsg(res.message || 'Users (admin, manager, viewer) and permissions verified in DB!');
      setForm(f => ({ ...f, username: 'admin', password: 'admin123' }));
    } catch {
      setSuccessMsg('Initialized in-memory credentials: admin, manager, viewer active.');
      setForm(f => ({ ...f, username: 'admin', password: 'admin123' }));
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    setError('');

    // Clear any old session first
    sessionStorage.removeItem('cm_user');

    const result = await login(form.username, form.password, form.year, () => {
      navigate('/labour', { replace: true });
    });

    setLoading(false);
    if (!result.success) setError(result.message);
  };

  return (
    <div style={s.page(isDark)}>
      <div style={s.card(isDark)}>
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>🧵</div>
          <div style={s.logoText(isDark)}>Clothing Manager</div>
          <div style={s.logoSub(isDark)}>Production Management System</div>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label(isDark)}>Username</label>
            <input style={s.input(isDark)} placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              autoFocus />
          </div>
          <div style={s.field}>
            <label style={s.label(isDark)}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={s.input(isDark)} type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPass(v => !v)} style={s.eyeBtn}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label(isDark)}>Working Year</label>
            <select
              style={s.select(isDark)}
              value={form.year}
              onChange={e => setForm({ ...form, year: Number(e.target.value) })}
            >
              {AVAILABLE_YEARS.map(yr => (
                <option key={yr} value={yr}>📅 {yr}</option>
              ))}
            </select>
          </div>

          {error && <div style={s.errorBox}>{error}</div>}
          {successMsg && <div style={{ ...s.errorBox, background: '#e6f4ea', border: '1px solid #a8dab5', color: '#137333' }}>{successMsg}</div>}

          <button type="submit" style={s.loginBtn} disabled={loading}>
            {loading ? 'Signing in...' : `Sign In (${form.year})`}
          </button>
        </form>

        <div style={s.demoBox(isDark)}>
          <div style={s.demoTitle(isDark)}>DEMO CREDENTIALS</div>
          {[
            { role: 'Admin',   user: 'admin',   pass: 'admin123',   color: '#2E75B6' },
            { role: 'Manager', user: 'manager', pass: 'manager123', color: '#70AD47' },
            { role: 'Viewer',  user: 'viewer',  pass: 'viewer123',  color: '#C55A11' },
          ].map(d => (
            <div key={d.role} style={s.demoRow(isDark)}
              onClick={() => setForm(f => ({ ...f, username: d.user, password: d.pass }))}>
              <span style={{ ...s.rolePill, background: d.color }}>{d.role}</span>
              <span style={s.demoCred(isDark)}>{d.user} / {d.pass}</span>
              <span style={s.demoHint(isDark)}>click to fill</span>
            </div>
          ))}

          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? '#60a5fa' : '#2563eb',
              background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
              border: `1px dashed ${isDark ? '#3b82f6' : '#93c5fd'}`,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            {seeding ? '⏳ Verifying Database...' : '⚡ Seed / Verify Database Users & Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      (isDark) => ({ minHeight: '100vh', background: isDark ? '#0b1120' : '#1e2a3b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, Arial, sans-serif', padding: '1rem' }),
  card:      (isDark) => ({ background: isDark ? '#1e293b' : '#ffffff', border: isDark ? '1px solid #334155' : 'none', borderRadius: 16, padding: '2.25rem 2rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }),
  logoWrap:  { textAlign: 'center', marginBottom: '1.75rem' },
  logoIcon:  { fontSize: 48, marginBottom: 8 },
  logoText:  (isDark) => ({ fontSize: '1.5rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#1e2a3b' }),
  logoSub:   (isDark) => ({ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', marginTop: 4 }),
  form:      { display: 'flex', flexDirection: 'column', gap: 15 },
  field:     { display: 'flex', flexDirection: 'column', gap: 6 },
  label:     (isDark) => ({ fontSize: 13, fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155' }),
  input:     (isDark) => ({ padding: '11px 14px', borderRadius: 8, border: `1px solid ${isDark ? '#334155' : '#dde3ec'}`, background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }),
  select:    (isDark) => ({ padding: '11px 14px', borderRadius: 8, border: `1px solid ${isDark ? '#334155' : '#dde3ec'}`, background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a', fontSize: 14, fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }),
  eyeBtn:    { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
  errorBox:  { background: '#FBEAEA', color: '#BE0000', borderRadius: 8, padding: '10px 14px', fontSize: 13, border: '1px solid #f5c6c6' },
  loginBtn:  { background: '#2E75B6', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  demoBox:   (isDark) => ({ marginTop: '1.5rem', background: isDark ? '#0f172a' : '#f8fafd', borderRadius: 10, padding: '1rem', border: `1px solid ${isDark ? '#334155' : '#e8edf5'}` }),
  demoTitle: (isDark) => ({ fontSize: 11, fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }),
  demoRow:   (isDark) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', cursor: 'pointer', borderBottom: `1px solid ${isDark ? '#1e293b' : '#eef1f6'}` }),
  rolePill:  { color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '2px 8px', minWidth: 55, textAlign: 'center' },
  demoCred:  (isDark) => ({ fontSize: 12, color: isDark ? '#e2e8f0' : '#334155', flex: 1 }),
  demoHint:  (isDark) => ({ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8' }),
};
