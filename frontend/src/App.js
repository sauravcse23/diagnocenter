import React, { useState, useEffect, useCallback } from 'react';

// ─── API Helper ────────────────────────────────────────────────────────────────
const api = async (path, options = {}) => {
  const token = localStorage.getItem('dc_token');
  const res = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f0f4f8', display: 'flex' },
  sidebar: { width: 220, background: '#1a2744', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarHeader: { padding: '24px 20px 16px', borderBottom: '1px solid #2d3a5a' },
  sidebarTitle: { fontSize: 18, fontWeight: 700, color: '#60a5fa', margin: 0 },
  sidebarSub: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  navItem: (active) => ({ padding: '11px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, background: active ? '#2d4a8a' : 'transparent', color: active ? '#fff' : '#94a3b8', borderLeft: active ? '3px solid #60a5fa' : '3px solid transparent', transition: 'all 0.2s' }),
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: { background: '#fff', padding: '14px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  content: { flex: 1, padding: 28, overflowY: 'auto' },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  statCard: (color) => ({ background: color, borderRadius: 12, padding: '20px 24px', color: '#fff' }),
  statVal: { fontSize: 28, fontWeight: 700, margin: 0 },
  statLabel: { fontSize: 13, opacity: 0.85, marginTop: 4 },
  grid: (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }),
  btn: (color = '#3b82f6', text = '#fff') => ({ background: color, color: text, border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }),
  btnSm: (color = '#3b82f6') => ({ background: color, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }),
  input: { width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { background: '#f8fafc', padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '10px 14px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  badge: (color) => ({ background: color + '20', color, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }),
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: 14, padding: 28, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
  h2: { margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#1e293b' },
  row: { display: 'flex', gap: 12 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
  section: { marginBottom: 20 },
};

const statusColor = { Pending: '#f59e0b', Processing: '#3b82f6', Ready: '#10b981', Delivered: '#6366f1', Paid: '#10b981', Partial: '#f59e0b', Active: '#10b981' };

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={S.modal}>
      <div style={{ ...S.modalBox, width: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <p style={{ fontSize: 16, color: '#334155', marginBottom: 24 }}>{message}</p>
        <div style={{ ...S.row, justifyContent: 'center' }}>
          <button style={S.btn('#e2e8f0', '#374151')} onClick={onCancel}>Cancel</button>
          <button style={S.btn('#ef4444')} onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: form });
      localStorage.setItem('dc_token', data.token);
      onLogin(data.user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a2744,#2d4a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏥</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1a2744' }}>DiagnoCenter</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>Diagnosis Management System</p>
        </div>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Username</label>
          <input style={S.input} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="admin" onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={S.label}>Password</label>
          <input style={S.input} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••" onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <button style={{ ...S.btn(), width: '100%', padding: '11px', fontSize: 15 }} onClick={submit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 16 }}>Default: admin / admin123</p>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api('/dashboard/stats').then(setStats).catch(console.error); }, []);

  if (!stats) return <div style={{ color: '#64748b' }}>Loading dashboard...</div>;

  const sc = [['#3b82f6', "Today's Patients", stats.todayPatients, '👤'],
    ['#10b981', "Today's Revenue", `₹${stats.todayRevenue?.toLocaleString() || 0}`, '💰'],
    ['#f59e0b', 'Pending Reports', stats.pendingReports, '📋'],
    ['#6366f1', 'Total Patients', stats.totalPatients, '🏥']];

  return (
    <div>
      <h2 style={S.h2}>Dashboard</h2>
      <div style={{ ...S.grid(4), marginBottom: 24 }}>
        {sc.map(([color, label, val, icon]) => (
          <div key={label} style={S.statCard(color)}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
            <p style={S.statVal}>{val}</p>
            <p style={S.statLabel}>{label}</p>
          </div>
        ))}
      </div>
      <div style={{ ...S.grid(2), marginBottom: 24 }}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>🏆 Top Referring Doctors</h3>
          {stats.topDoctors.length === 0 ? <p style={{ color: '#94a3b8' }}>No referrals yet</p> :
            stats.topDoctors.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#334155' }}><b style={{ color: '#6366f1' }}>#{i + 1}</b> {d.name} <span style={{ color: '#94a3b8', fontSize: 12 }}>({d.specialty})</span></span>
                <span style={S.badge('#3b82f6')}>{d.referrals} pts</span>
              </div>
            ))}
        </div>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>📊 Tests Breakdown</h3>
          {stats.testTypeCounts.map(t => (
            <div key={t.test_type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#334155' }}>{t.test_type}</span>
              <div style={{ ...S.badge('#10b981') }}>{t.count}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>🕐 Recent Patients</h3>
        <table style={S.table}>
          <thead><tr>
            {['PID', 'Name', 'Test', 'Doctor', 'Date', 'Status'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {stats.recentPatients.map(p => (
              <tr key={p.pid}>
                <td style={S.td}><code style={{ color: '#6366f1', fontSize: 12 }}>{p.pid}</code></td>
                <td style={S.td}>{p.name}</td>
                <td style={S.td}>{p.test_type}</td>
                <td style={S.td}>{p.doctor_name || '—'}</td>
                <td style={S.td}>{p.visit_date}</td>
                <td style={S.td}><span style={S.badge(statusColor[p.status] || '#64748b')}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
const TEST_TYPES = ['CT Scan', 'MRI', 'X-Ray', 'Ultrasound', 'ECG', 'Blood Test', 'Urine Test', 'PET Scan', 'Mammography', 'Biopsy', 'Endoscopy', 'Bone Density'];
const BLANK_PATIENT = { name: '', age: '', gender: 'Male', phone: '', address: '', test_type: 'CT Scan', referred_by: '', fee: '', visit_date: new Date().toISOString().split('T')[0] };

function Patients() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_PATIENT);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    api(`/patients${search ? `?search=${search}` : ''}`).then(setPatients);
    api('/doctors').then(setDoctors);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setLoading(true);
    try {
      if (editing) await api(`/patients/${editing}`, { method: 'PUT', body: form });
      else await api('/patients', { method: 'POST', body: form });
      setShowForm(false); setEditing(null); setForm(BLANK_PATIENT); load();
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const del = async (id) => {
    await api(`/patients/${id}`, { method: 'DELETE' });
    setConfirm(null); load();
  };

  const edit = (p) => {
    setForm({ name: p.name, age: p.age || '', gender: p.gender || 'Male', phone: p.phone || '', address: p.address || '', test_type: p.test_type, referred_by: p.referred_by || '', fee: p.fee || '', visit_date: p.visit_date });
    setEditing(p.id); setShowForm(true);
  };

  const F = ({ label, children, half }) => (
    <div style={{ marginBottom: 14, ...(half ? {} : {}) }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );

  return (
    <div>
      {confirm && <ConfirmModal message={`Delete patient ${confirm.name}?`} onConfirm={() => del(confirm.id)} onCancel={() => setConfirm(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ ...S.h2, margin: 0 }}>Patients</h2>
        <button style={S.btn()} onClick={() => { setShowForm(true); setEditing(null); setForm(BLANK_PATIENT); }}>+ Register Patient</button>
      </div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <input style={S.input} placeholder="Search by name, PID, or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {showForm && (
        <div style={S.modal}>
          <div style={S.modalBox}>
            <h3 style={{ ...S.h2 }}>{editing ? 'Edit Patient' : 'Register New Patient'}</h3>
            <div style={S.formRow}>
              <F label="Full Name *"><input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></F>
              <F label="Visit Date *"><input type="date" style={S.input} value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} /></F>
            </div>
            <div style={S.formRow}>
              <F label="Age"><input type="number" style={S.input} value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></F>
              <F label="Gender">
                <select style={S.input} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                </select>
              </F>
            </div>
            <div style={S.formRow}>
              <F label="Phone"><input style={S.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></F>
              <F label="Test Type *">
                <select style={S.input} value={form.test_type} onChange={e => setForm({ ...form, test_type: e.target.value })}>
                  {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </F>
            </div>
            <div style={S.formRow}>
              <F label="Referring Doctor">
                <select style={S.input} value={form.referred_by} onChange={e => setForm({ ...form, referred_by: e.target.value })}>
                  <option value="">— Self / Walk-in —</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty || 'General'})</option>)}
                </select>
              </F>
              <F label="Fee (₹)"><input type="number" style={S.input} value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} /></F>
            </div>
            <F label="Address"><input style={S.input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></F>
            <div style={{ ...S.row, justifyContent: 'flex-end', marginTop: 8 }}>
              <button style={S.btn('#e2e8f0', '#374151')} onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
              <button style={S.btn()} onClick={save} disabled={loading}>{loading ? 'Saving...' : editing ? 'Update' : 'Register'}</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>
            {['PID', 'Name', 'Age', 'Test', 'Doctor', 'Fee', 'Date', 'Status', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {patients.length === 0 ? <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: '#94a3b8' }}>No patients found</td></tr> :
              patients.map(p => (
                <tr key={p.id}>
                  <td style={S.td}><code style={{ color: '#6366f1', fontSize: 12 }}>{p.pid}</code></td>
                  <td style={S.td}><b>{p.name}</b><br /><span style={{ fontSize: 11, color: '#64748b' }}>{p.phone}</span></td>
                  <td style={S.td}>{p.age || '—'}</td>
                  <td style={S.td}>{p.test_type}</td>
                  <td style={S.td}>{p.doctor_name || '—'}</td>
                  <td style={S.td}>₹{p.fee?.toLocaleString() || 0}</td>
                  <td style={S.td}>{p.visit_date}</td>
                  <td style={S.td}><span style={S.badge(statusColor[p.status] || '#64748b')}>{p.status}</span></td>
                  <td style={S.td}>
                    <div style={S.row}>
                      <button style={S.btnSm('#6366f1')} onClick={() => edit(p)}>Edit</button>
                      <button style={S.btnSm('#ef4444')} onClick={() => setConfirm(p)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DOCTORS ─────────────────────────────────────────────────────────────────
const BLANK_DOC = { name: '', specialty: '', clinic: '', phone: '', email: '' };

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_DOC);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => api('/doctors').then(setDoctors);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editing) await api(`/doctors/${editing}`, { method: 'PUT', body: form });
    else await api('/doctors', { method: 'POST', body: form });
    setShowForm(false); setEditing(null); setForm(BLANK_DOC); load();
  };

  const del = async (id) => { await api(`/doctors/${id}`, { method: 'DELETE' }); setConfirm(null); load(); };

  const edit = (d) => { setForm({ name: d.name, specialty: d.specialty || '', clinic: d.clinic || '', phone: d.phone || '', email: d.email || '' }); setEditing(d.id); setShowForm(true); };

  return (
    <div>
      {confirm && <ConfirmModal message={`Delete Dr. ${confirm.name}?`} onConfirm={() => del(confirm.id)} onCancel={() => setConfirm(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ ...S.h2, margin: 0 }}>Referring Doctors</h2>
        <button style={S.btn()} onClick={() => { setShowForm(true); setEditing(null); setForm(BLANK_DOC); }}>+ Add Doctor</button>
      </div>
      {showForm && (
        <div style={S.modal}>
          <div style={S.modalBox}>
            <h3 style={S.h2}>{editing ? 'Edit Doctor' : 'Add New Doctor'}</h3>
            <div style={S.formRow}>
              <div><label style={S.label}>Full Name *</label><input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label style={S.label}>Specialty</label><input style={S.input} value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Cardiologist, etc." /></div>
            </div>
            <div style={S.formRow}>
              <div><label style={S.label}>Clinic / Hospital</label><input style={S.input} value={form.clinic} onChange={e => setForm({ ...form, clinic: e.target.value })} /></div>
              <div><label style={S.label}>Phone</label><input style={S.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={S.label}>Email</label><input style={S.input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div style={{ ...S.row, justifyContent: 'flex-end' }}>
              <button style={S.btn('#e2e8f0', '#374151')} onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
              <button style={S.btn()} onClick={save}>{editing ? 'Update' : 'Add Doctor'}</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.grid(3)}>
        {doctors.map(d => (
          <div key={d.id} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 22, marginBottom: 6 }}>👨‍⚕️</div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#1e293b' }}>Dr. {d.name}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{d.specialty || 'General'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6' }}>{d.referral_count}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>referrals</div>
              </div>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '12px 0' }} />
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#475569' }}>🏥 {d.clinic || 'Private Practice'}</p>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#475569' }}>📞 {d.phone || '—'}</p>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#475569' }}>💰 ₹{d.total_revenue?.toLocaleString() || 0} revenue</p>
            <div style={S.row}>
              <button style={S.btnSm('#6366f1')} onClick={() => edit(d)}>Edit</button>
              <button style={S.btnSm('#ef4444')} onClick={() => setConfirm(d)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {doctors.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: '#94a3b8', padding: 48 }}>No doctors added yet. Add your first referring doctor!</div>}
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function Reports() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});

  const load = () => api('/reports').then(setReports);
  useEffect(() => { load(); }, []);

  const open = (r) => { setSelected(r); setForm({ findings: r.findings || '', impression: r.impression || '', reported_by: r.reported_by || '', status: r.status }); };

  const save = async () => {
    await api(`/reports/${selected.id}`, { method: 'PUT', body: form });
    setSelected(null); load();
  };

  const STATUSES = ['Pending', 'Processing', 'Ready', 'Delivered'];

  return (
    <div>
      <h2 style={S.h2}>Reports</h2>
      {selected && (
        <div style={S.modal}>
          <div style={S.modalBox}>
            <h3 style={S.h2}>Report — {selected.patient_name} ({selected.pid})</h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>Test: <b>{selected.test_type}</b> · Date: {selected.visit_date}</p>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Status</label>
              <select style={S.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Findings</label>
              <textarea style={{ ...S.input, height: 90, resize: 'vertical' }} value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} placeholder="Describe findings..." />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Clinical Impression / Diagnosis</label>
              <textarea style={{ ...S.input, height: 70, resize: 'vertical' }} value={form.impression} onChange={e => setForm({ ...form, impression: e.target.value })} placeholder="Clinical impression..." />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Reported By</label>
              <input style={S.input} value={form.reported_by} onChange={e => setForm({ ...form, reported_by: e.target.value })} placeholder="Radiologist / Doctor name" />
            </div>
            <div style={{ ...S.row, justifyContent: 'flex-end' }}>
              <button style={S.btn('#e2e8f0', '#374151')} onClick={() => setSelected(null)}>Cancel</button>
              <button style={S.btn()} onClick={save}>Save Report</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>
            {['PID', 'Patient', 'Test', 'Date', 'Reported By', 'Status', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {reports.length === 0 ? <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#94a3b8' }}>No reports yet</td></tr> :
              reports.map(r => (
                <tr key={r.id}>
                  <td style={S.td}><code style={{ color: '#6366f1', fontSize: 12 }}>{r.pid}</code></td>
                  <td style={S.td}>{r.patient_name}</td>
                  <td style={S.td}>{r.test_type}</td>
                  <td style={S.td}>{r.visit_date}</td>
                  <td style={S.td}>{r.reported_by || '—'}</td>
                  <td style={S.td}><span style={S.badge(statusColor[r.status] || '#64748b')}>{r.status}</span></td>
                  <td style={S.td}><button style={S.btnSm('#6366f1')} onClick={() => open(r)}>Edit Report</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
function Payments() {
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [summary, setSummary] = useState(null);

  const load = () => {
    api('/payments').then(setPayments);
    api('/payments/summary/revenue').then(setSummary);
  };
  useEffect(() => { load(); }, []);

  const open = (p) => { setSelected(p); setForm({ amount_paid: p.amount_paid || '', payment_method: p.payment_method || 'Cash', status: p.status }); };

  const save = async () => {
    await api(`/payments/${selected.id}`, { method: 'PUT', body: form });
    setSelected(null); load();
  };

  return (
    <div>
      <h2 style={S.h2}>Payments</h2>
      {summary && (
        <div style={{ ...S.grid(4), marginBottom: 20 }}>
          {[['#10b981', 'Collected', `₹${summary.total_collected?.toLocaleString()}`],
            ['#f59e0b', 'Pending Due', `₹${summary.total_pending?.toLocaleString()}`],
            ['#3b82f6', 'Paid Records', summary.paid_count],
            ['#6366f1', 'Partial', summary.partial_count]].map(([c, l, v]) => (
            <div key={l} style={S.statCard(c)}><p style={S.statVal}>{v}</p><p style={S.statLabel}>{l}</p></div>
          ))}
        </div>
      )}
      {selected && (
        <div style={S.modal}>
          <div style={S.modalBox}>
            <h3 style={S.h2}>Record Payment — {selected.patient_name}</h3>
            <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: 13 }}>Amount Due: <b>₹{selected.amount_due?.toLocaleString()}</b> · Test: {selected.test_type}</p>
            <div style={S.formRow}>
              <div><label style={S.label}>Amount Paid (₹)</label><input type="number" style={S.input} value={form.amount_paid} onChange={e => setForm({ ...form, amount_paid: e.target.value })} /></div>
              <div><label style={S.label}>Payment Method</label>
                <select style={S.input} value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                  {['Cash', 'UPI', 'Card', 'Insurance', 'Cheque'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={S.label}>Status</label>
              <select style={S.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Pending', 'Partial', 'Paid'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ ...S.row, justifyContent: 'flex-end' }}>
              <button style={S.btn('#e2e8f0', '#374151')} onClick={() => setSelected(null)}>Cancel</button>
              <button style={S.btn('#10b981')} onClick={save}>Save Payment</button>
            </div>
          </div>
        </div>
      )}
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>
            {['PID', 'Patient', 'Test', 'Due', 'Paid', 'Method', 'Status', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td style={S.td}><code style={{ color: '#6366f1', fontSize: 12 }}>{p.pid}</code></td>
                <td style={S.td}>{p.patient_name}</td>
                <td style={S.td}>{p.test_type}</td>
                <td style={S.td}>₹{p.amount_due?.toLocaleString()}</td>
                <td style={S.td}>₹{p.amount_paid?.toLocaleString()}</td>
                <td style={S.td}>{p.payment_method || '—'}</td>
                <td style={S.td}><span style={S.badge(statusColor[p.status] || '#64748b')}>{p.status}</span></td>
                <td style={S.td}><button style={S.btnSm('#10b981')} onClick={() => open(p)}>Record</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REFERRAL ANALYTICS ───────────────────────────────────────────────────────
function Referrals() {
  const [data, setData] = useState([]);
  const [month, setMonth] = useState('');

  const load = () => api(`/doctors/analytics/referrals${month ? `?month=${month}` : ''}`).then(setData);
  useEffect(() => { load(); }, [month]);

  const max = Math.max(...data.map(d => d.referral_count), 1);

  return (
    <div>
      <h2 style={S.h2}>Referral Analytics</h2>
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ ...S.label, margin: 0, whiteSpace: 'nowrap' }}>Filter by month:</label>
          <input type="month" style={{ ...S.input, width: 180 }} value={month} onChange={e => setMonth(e.target.value)} />
          {month && <button style={S.btnSm('#64748b')} onClick={() => setMonth('')}>Clear</button>}
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>🏆 Doctor Referral Leaderboard</h3>
        {data.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>No referral data found</p> :
          data.map((d, i) => (
            <div key={d.id} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 700, color: ['#f59e0b', '#64748b', '#a16207'][i] || '#334155' }}>#{i + 1} </span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>Dr. {d.name}</span>
                  <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>({d.specialty || 'General'}) · {d.clinic || 'Private'}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={S.badge('#3b82f6')}>{d.referral_count} patients</span>
                  <span style={S.badge('#10b981')}>₹{d.total_revenue?.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ background: '#f1f5f9', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                <div style={{ background: i === 0 ? '#f59e0b' : '#3b82f6', height: '100%', width: `${(d.referral_count / max) * 100}%`, borderRadius: 99, transition: 'width 0.5s' }} />
              </div>
              {d.test_types && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>Tests: {d.test_types}</p>}
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'patients', label: 'Patients', icon: '👤' },
  { id: 'doctors', label: 'Doctors', icon: '👨‍⚕️' },
  { id: 'reports', label: 'Reports', icon: '📋' },
  { id: 'payments', label: 'Payments', icon: '💰' },
  { id: 'referrals', label: 'Referral Analytics', icon: '📈' },
];

const PAGE_MAP = { dashboard: Dashboard, patients: Patients, doctors: Doctors, reports: Reports, payments: Payments, referrals: Referrals };

export default function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('dc_token');
    return token ? { name: 'User' } : null;
  });
  const [page, setPage] = useState('dashboard');

  if (!user) return <Login onLogin={setUser} />;

  const PageComponent = PAGE_MAP[page];

  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🏥</div>
          <p style={S.sidebarTitle}>DiagnoCenter</p>
          <p style={S.sidebarSub}>Management System</p>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {PAGES.map(p => (
            <div key={p.id} style={S.navItem(page === p.id)} onClick={() => setPage(p.id)}>
              <span>{p.icon}</span><span>{p.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #2d3a5a' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Logged in as</p>
          <p style={{ margin: '2px 0 10px', fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{user.name || user.username}</p>
          <button style={{ ...S.btn('#374151', '#94a3b8'), width: '100%', fontSize: 13 }} onClick={() => { localStorage.removeItem('dc_token'); setUser(null); }}>Sign Out</button>
        </div>
      </div>
      <div style={S.main}>
        <div style={S.topbar}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>{PAGES.find(p => p.id === page)?.label}</h2>
          <span style={{ fontSize: 13, color: '#64748b' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div style={S.content}>
          <PageComponent />
        </div>
      </div>
    </div>
  );
}
