import { useState, useEffect, useMemo } from "react";

const STORAGE_KEY = "diagnosisCenter_v1";

const TEST_TYPES = [
  "CT Scan", "X-Ray", "MRI", "Ultrasound", "Blood Test", "ECG",
  "Mammography", "Bone Densitometry", "PET Scan", "Endoscopy",
  "Biopsy", "Urine Test", "Echo Cardiography", "Doppler Study"
];

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Insurance", "Pending"];

const initialData = {
  patients: [],
  doctors: [],
  reports: [],
  payments: [],
  nextPatientId: 1001,
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : initialData;
  } catch { return initialData; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

const statusColors = {
  "Pending": { bg: "#FFF3CD", color: "#856404", border: "#FFECB5" },
  "Processing": { bg: "#D0E8FF", color: "#0C447C", border: "#B5D4F4" },
  "Ready": { bg: "#D1F2EB", color: "#0F6E56", border: "#9FE1CB" },
  "Delivered": { bg: "#E2E3E5", color: "#444441", border: "#D3D1C7" },
};

const paymentColors = {
  "Paid": { bg: "#D1F2EB", color: "#0F6E56" },
  "Pending": { bg: "#FCEBEB", color: "#A32D2D" },
  "Partial": { bg: "#FFF3CD", color: "#856404" },
};

export default function App() {
  const [db, setDb] = useState(loadData);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loginForm, setLoginForm] = useState({ user: "", pass: "", error: "" });
  const [modal, setModal] = useState(null);

  useEffect(() => { saveData(db); }, [db]);

  function updateDb(fn) {
    setDb(prev => { const next = fn({ ...prev }); saveData(next); return next; });
  }

  function handleLogin(e) {
    e.preventDefault();
    if (loginForm.user === "admin" && loginForm.pass === "admin123") {
      setUser({ name: "Admin", role: "Admin" });
      setLoginForm({ user: "", pass: "", error: "" });
    } else {
      setLoginForm(f => ({ ...f, error: "Invalid credentials. Use admin / admin123" }));
    }
  }

  if (!user) return <LoginScreen form={loginForm} setForm={setLoginForm} onLogin={handleLogin} />;

  return (
    <AppShell page={page} setPage={setPage} user={user} setUser={setUser}>
      {page === "dashboard" && <Dashboard db={db} setPage={setPage} />}
      {page === "patients" && <Patients db={db} updateDb={updateDb} modal={modal} setModal={setModal} />}
      {page === "doctors" && <Doctors db={db} updateDb={updateDb} modal={modal} setModal={setModal} />}
      {page === "reports" && <Reports db={db} updateDb={updateDb} modal={modal} setModal={setModal} />}
      {page === "payments" && <Payments db={db} updateDb={updateDb} />}
      {page === "referrals" && <Referrals db={db} />}
    </AppShell>
  );
}

function LoginScreen({ form, setForm, onLogin }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "48px 40px", width: 380, boxShadow: "0 4px 32px rgba(0,0,0,0.10)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#1a2332" }}>DiagnoCenter</div>
            <div style={{ fontSize: 12, color: "#888" }}>Management Portal</div>
          </div>
        </div>

        <form onSubmit={onLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Username</label>
            <input value={form.user} onChange={e => setForm(f => ({ ...f, user: e.target.value }))}
              placeholder="Enter username" required
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Password</label>
            <input type="password" value={form.pass} onChange={e => setForm(f => ({ ...f, pass: e.target.value }))}
              placeholder="Enter password" required
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          {form.error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{form.error}</div>}
          <button type="submit" style={{ width: "100%", padding: "12px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Sign In
          </button>
          <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 16 }}>Demo: admin / admin123</div>
        </form>
      </div>
    </div>
  );
}

function AppShell({ children, page, setPage, user, setUser }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "patients", label: "Patients", icon: "👤" },
    { id: "doctors", label: "Doctors", icon: "🩺" },
    { id: "reports", label: "Reports", icon: "📋" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "referrals", label: "Referrals", icon: "📊" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#F4F6FA" }}>
      <div style={{ width: 220, background: "#0F2A22", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1a3d2e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚕</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>DiagnoCenter</div>
              <div style={{ color: "#5DCAA5", fontSize: 11 }}>Management</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                background: page === n.id ? "#1D9E75" : "transparent",
                color: page === n.id ? "#fff" : "#9FE1CB",
                border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13.5, fontWeight: page === n.id ? 600 : 400,
                marginBottom: 2, textAlign: "left"
              }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px", borderTop: "1px solid #1a3d2e" }}>
          <div style={{ color: "#5DCAA5", fontSize: 12, marginBottom: 4 }}>{user.name}</div>
          <button onClick={() => setUser(null)}
            style={{ background: "transparent", border: "none", color: "#9FE1CB", cursor: "pointer", fontSize: 12, padding: 0 }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>
        {children}
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a2332" }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, color = "#1D9E75", icon }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 20px", border: "1px solid #eee", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
        </div>
        <div style={{ fontSize: 26, opacity: 0.7 }}>{icon}</div>
      </div>
    </div>
  );
}

function Btn({ onClick, children, variant = "primary", small }) {
  const styles = {
    primary: { background: "#1D9E75", color: "#fff", border: "none" },
    secondary: { background: "#fff", color: "#333", border: "1.5px solid #ddd" },
    danger: { background: "#FCEBEB", color: "#A32D2D", border: "1.5px solid #F7C1C1" },
  };
  return (
    <button onClick={onClick}
      style={{ ...styles[variant], padding: small ? "6px 14px" : "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: small ? 12 : 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
      {children}
    </button>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "28px 32px", width: 360, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2332", marginBottom: 8 }}>Confirm Delete</div>
        <div style={{ fontSize: 13.5, color: "#666", marginBottom: 24 }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm}>Yes, Delete</Btn>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 520, maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a2332" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#aaa" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#555", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", required }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
      style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13.5, boxSizing: "border-box", outline: "none" }} />
  );
}

function Select({ value, onChange, children, required }) {
  return (
    <select value={value} onChange={onChange} required={required}
      style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13.5, background: "#fff", boxSizing: "border-box" }}>
      {children}
    </select>
  );
}

function Badge({ label, style: extra }) {
  return <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, ...extra }}>{label}</span>;
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ db, setPage }) {
  const today = todayISO();
  const todayPatients = db.patients.filter(p => p.date === today);
  const totalRevenue = db.payments.reduce((s, p) => s + (p.amountPaid || 0), 0);
  const pendingPayments = db.payments.filter(p => p.status === "Pending").length;
  const pendingReports = db.reports.filter(r => r.status === "Pending" || r.status === "Processing").length;

  const topDoctors = useMemo(() => {
    const map = {};
    db.patients.forEach(p => {
      if (p.referringDoctorId) {
        map[p.referringDoctorId] = (map[p.referringDoctorId] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([id, count]) => ({ doctor: db.doctors.find(d => d.id === id), count }))
      .filter(x => x.doctor)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [db]);

  const recentPatients = [...db.patients].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Today: ${formatDate(today)}`} />

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <StatCard label="Today's Patients" value={todayPatients.length} color="#1D9E75" icon="👤" />
        <StatCard label="Total Patients" value={db.patients.length} color="#185FA5" icon="📁" />
        <StatCard label="Pending Reports" value={pendingReports} color="#BA7517" icon="📋" />
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} color="#533AB7" icon="💰" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a2332" }}>Recent Patients</h3>
            <button onClick={() => setPage("patients")} style={{ background: "none", border: "none", color: "#1D9E75", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>View all →</button>
          </div>
          {recentPatients.length === 0 && <p style={{ color: "#aaa", fontSize: 13 }}>No patients yet. Register your first patient.</p>}
          {recentPatients.map(p => {
            const doc = db.doctors.find(d => d.id === p.referringDoctorId);
            return (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "#1a2332" }}>#{p.pid} {p.name}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{p.testType} · {doc ? "Dr. " + doc.name : "No ref."}</div>
                </div>
                <Badge label={p.reportStatus || "Pending"} style={statusColors[p.reportStatus || "Pending"]} />
              </div>
            );
          })}
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a2332" }}>Top Referring Doctors</h3>
            <button onClick={() => setPage("referrals")} style={{ background: "none", border: "none", color: "#1D9E75", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Full report →</button>
          </div>
          {topDoctors.length === 0 && <p style={{ color: "#aaa", fontSize: 13 }}>No referrals yet.</p>}
          {topDoctors.map(({ doctor, count }, i) => (
            <div key={doctor.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: ["#1D9E75", "#185FA5", "#BA7517", "#A32D2D", "#533AB7"][i], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Dr. {doctor.name}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{doctor.specialty}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1D9E75" }}>{count}</div>
                <div style={{ fontSize: 10, color: "#aaa" }}>referrals</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PATIENTS ─────────────────────────────────────────────────────────────────
function Patients({ db, updateDb, modal, setModal }) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", age: "", gender: "Male", phone: "", address: "", referringDoctorId: "", testType: "", date: todayISO(), notes: "", fee: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return db.patients.filter(p => p.name.toLowerCase().includes(q) || String(p.pid).includes(q) || p.phone?.includes(q));
  }, [db.patients, search]);

  function openAdd() { setForm({ name: "", age: "", gender: "Male", phone: "", address: "", referringDoctorId: "", testType: TEST_TYPES[0], date: todayISO(), notes: "", fee: "" }); setModal("add"); }

  function savePatient(e) {
    e.preventDefault();
    const pid = db.nextPatientId;
    const patient = {
      ...form, id: "P" + pid, pid, createdAt: new Date().toISOString(),
      reportStatus: "Pending", age: Number(form.age), fee: Number(form.fee),
    };
    const payment = { id: "PAY" + Date.now(), patientId: patient.id, pid, patientName: patient.name, testType: patient.testType, totalFee: patient.fee, amountPaid: 0, status: "Pending", method: "", date: patient.date, createdAt: new Date().toISOString() };
    updateDb(d => ({ ...d, patients: [patient, ...d.patients], payments: [payment, ...d.payments], nextPatientId: d.nextPatientId + 1 }));
    setModal(null);
  }

  function deletePatient(id) {
    setConfirmDelete(id);
  }

  function doDeletePatient() {
    const id = confirmDelete;
    updateDb(d => ({ ...d, patients: d.patients.filter(p => p.id !== id), payments: d.payments.filter(p => p.patientId !== id), reports: d.reports.filter(r => r.patientId !== id) }));
    setConfirmDelete(null);
  }

  return (
    <div>
      <PageHeader title="Patients" subtitle={`${db.patients.length} total registered`}
        action={<Btn onClick={openAdd}>+ Register Patient</Btn>} />

      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, or phone…"
          style={{ padding: "9px 14px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13.5, width: 300, outline: "none" }} />
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFB" }}>
              {["PID", "Patient Name", "Age/Gender", "Test", "Referring Doctor", "Date", "Report", "Payment", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid #eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "#aaa", fontSize: 14 }}>No patients found. Register your first patient.</td></tr>
            )}
            {filtered.map(p => {
              const doc = db.doctors.find(d => d.id === p.referringDoctorId);
              const pay = db.payments.find(x => x.patientId === p.id);
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>#{p.pid}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#1a2332" }}>{p.name}<div style={{ fontSize: 11, color: "#aaa" }}>{p.phone}</div></td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#555" }}>{p.age}y / {p.gender}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#555" }}>{p.testType}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#555" }}>{doc ? "Dr. " + doc.name : <span style={{ color: "#ccc" }}>—</span>}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#888" }}>{formatDate(p.date)}</td>
                  <td style={{ padding: "11px 14px" }}><Badge label={p.reportStatus || "Pending"} style={statusColors[p.reportStatus || "Pending"]} /></td>
                  <td style={{ padding: "11px 14px" }}><Badge label={pay?.status || "Pending"} style={paymentColors[pay?.status || "Pending"]} /></td>
                  <td style={{ padding: "11px 14px" }}>
                    <button onClick={() => deletePatient(p.id)} style={{ background: "none", border: "none", color: "#E24B4A", cursor: "pointer", fontSize: 13 }}>🗑</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirmDelete && <ConfirmModal message="This will permanently delete the patient and all their records." onConfirm={doDeletePatient} onCancel={() => setConfirmDelete(null)} />}

      {modal === "add" && (
        <Modal title="Register New Patient" onClose={() => setModal(null)}>
          <form onSubmit={savePatient}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Field label="Full Name *"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Patient full name" required /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Mobile number" /></Field>
              <Field label="Age *"><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Age" required /></Field>
              <Field label="Gender">
                <Select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </Select>
              </Field>
              <Field label="Test Type *">
                <Select value={form.testType} onChange={e => setForm(f => ({ ...f, testType: e.target.value }))} required>
                  {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Date *"><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></Field>
              <Field label="Referring Doctor">
                <Select value={form.referringDoctorId} onChange={e => setForm(f => ({ ...f, referringDoctorId: e.target.value }))}>
                  <option value="">— Self / Walk-in —</option>
                  {db.doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialty})</option>)}
                </Select>
              </Field>
              <Field label="Consultation Fee (₹)"><Input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} placeholder="0" /></Field>
            </div>
            <Field label="Address / Notes"><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" /></Field>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn>Register Patient</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── DOCTORS ───────────────────────────────────────────────────────────────────
function Doctors({ db, updateDb, modal, setModal }) {
  const [form, setForm] = useState({ name: "", specialty: "", clinic: "", phone: "", email: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);

  function saveDoctor(e) {
    e.preventDefault();
    const doc = { ...form, id: "D" + Date.now(), createdAt: new Date().toISOString() };
    updateDb(d => ({ ...d, doctors: [doc, ...d.doctors] }));
    setModal(null);
  }

  function deleteDoctor(id) {
    setConfirmDelete(id);
  }

  function doDeleteDoctor() {
    updateDb(d => ({ ...d, doctors: d.doctors.filter(x => x.id !== confirmDelete) }));
    setConfirmDelete(null);
  }

  return (
    <div>
      <PageHeader title="Doctors" subtitle={`${db.doctors.length} referring doctors registered`}
        action={<Btn onClick={() => { setForm({ name: "", specialty: "", clinic: "", phone: "", email: "" }); setModal("add"); }}>+ Add Doctor</Btn>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {db.doctors.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: "#aaa", background: "#fff", borderRadius: 12, border: "1px solid #eee" }}>
            No doctors added yet. Add your referring doctors.
          </div>
        )}
        {db.doctors.map(d => {
          const count = db.patients.filter(p => p.referringDoctorId === d.id).length;
          return (
            <div key={d.id} style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🩺</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2332" }}>Dr. {d.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{d.specialty}</div>
                  </div>
                </div>
                <button onClick={() => deleteDoctor(d.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer" }}>🗑</button>
              </div>
              {d.clinic && <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>🏥 {d.clinic}</div>}
              {d.phone && <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>📞 {d.phone}</div>}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>Total Referrals</span>
                <span style={{ fontWeight: 700, fontSize: 20, color: "#1D9E75" }}>{count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {confirmDelete && <ConfirmModal message="This will remove the doctor from your list." onConfirm={doDeleteDoctor} onCancel={() => setConfirmDelete(null)} />}

      {modal === "add" && (
        <Modal title="Add Referring Doctor" onClose={() => setModal(null)}>
          <form onSubmit={saveDoctor}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Field label="Doctor's Name *"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" required /></Field>
              <Field label="Specialty *"><Input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="e.g. Orthopedics" required /></Field>
              <Field label="Clinic / Hospital"><Input value={form.clinic} onChange={e => setForm(f => ({ ...f, clinic: e.target.value }))} placeholder="Clinic name" /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Contact number" /></Field>
            </div>
            <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" /></Field>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn>Save Doctor</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
function Reports({ db, updateDb, modal, setModal }) {
  const [form, setForm] = useState({ patientId: "", findings: "", impression: "", status: "Processing", reportedBy: "", date: todayISO() });
  const [editId, setEditId] = useState(null);

  function openAdd() {
    setForm({ patientId: "", findings: "", impression: "", status: "Processing", reportedBy: "", date: todayISO() });
    setEditId(null);
    setModal("report");
  }

  function saveReport(e) {
    e.preventDefault();
    const patient = db.patients.find(p => p.id === form.patientId);
    if (!patient) return;
    if (editId) {
      updateDb(d => ({
        ...d,
        reports: d.reports.map(r => r.id === editId ? { ...r, ...form, patientName: patient.name } : r),
        patients: d.patients.map(p => p.id === form.patientId ? { ...p, reportStatus: form.status } : p),
      }));
    } else {
      const report = { ...form, id: "R" + Date.now(), patientName: patient.name, pid: patient.pid, testType: patient.testType, createdAt: new Date().toISOString() };
      updateDb(d => ({
        ...d,
        reports: [report, ...d.reports],
        patients: d.patients.map(p => p.id === form.patientId ? { ...p, reportStatus: form.status } : p),
      }));
    }
    setModal(null);
  }

  function openEdit(r) {
    setForm({ patientId: r.patientId, findings: r.findings, impression: r.impression, status: r.status, reportedBy: r.reportedBy, date: r.date });
    setEditId(r.id);
    setModal("report");
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle={`${db.reports.length} reports created`}
        action={<Btn onClick={openAdd}>+ Add Report</Btn>} />

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFB" }}>
              {["PID", "Patient", "Test", "Date", "Findings (summary)", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {db.reports.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#aaa" }}>No reports yet. Start by adding a report for a registered patient.</td></tr>
            )}
            {db.reports.map(r => (
              <tr key={r.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
                <td style={{ padding: "11px 14px", fontWeight: 600, fontSize: 13, color: "#1D9E75" }}>#{r.pid}</td>
                <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#1a2332" }}>{r.patientName}</td>
                <td style={{ padding: "11px 14px", fontSize: 13, color: "#555" }}>{r.testType}</td>
                <td style={{ padding: "11px 14px", fontSize: 12, color: "#888" }}>{formatDate(r.date)}</td>
                <td style={{ padding: "11px 14px", fontSize: 12, color: "#666", maxWidth: 200 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.findings || "—"}</div>
                </td>
                <td style={{ padding: "11px 14px" }}><Badge label={r.status} style={statusColors[r.status]} /></td>
                <td style={{ padding: "11px 14px" }}>
                  <button onClick={() => openEdit(r)} style={{ background: "none", border: "none", color: "#185FA5", cursor: "pointer", fontSize: 13 }}>✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === "report" && (
        <Modal title={editId ? "Update Report" : "Add Report"} onClose={() => setModal(null)}>
          <form onSubmit={saveReport}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Field label="Patient *">
                <Select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required>
                  <option value="">Select patient</option>
                  {db.patients.map(p => <option key={p.id} value={p.id}>#{p.pid} {p.name} — {p.testType}</option>)}
                </Select>
              </Field>
              <Field label="Report Date"><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
              <Field label="Reported By"><Input value={form.reportedBy} onChange={e => setForm(f => ({ ...f, reportedBy: e.target.value }))} placeholder="Radiologist / Doctor name" /></Field>
              <Field label="Status">
                <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.keys(statusColors).map(s => <option key={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Findings">
              <textarea value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))}
                rows={3} placeholder="Describe findings…"
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13.5, boxSizing: "border-box", resize: "vertical" }} />
            </Field>
            <Field label="Impression / Diagnosis">
              <textarea value={form.impression} onChange={e => setForm(f => ({ ...f, impression: e.target.value }))}
                rows={2} placeholder="Clinical impression…"
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13.5, boxSizing: "border-box", resize: "vertical" }} />
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn>{editId ? "Update Report" : "Save Report"}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
function Payments({ db, updateDb }) {
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ amountPaid: "", method: "Cash", status: "Paid" });

  const totalRevenue = db.payments.reduce((s, p) => s + (p.amountPaid || 0), 0);
  const totalFee = db.payments.reduce((s, p) => s + (p.totalFee || 0), 0);
  const pendingCount = db.payments.filter(p => p.status === "Pending").length;

  function openEdit(pay) {
    setEditId(pay.id);
    setForm({ amountPaid: pay.amountPaid || "", method: pay.method || "Cash", status: pay.status || "Pending" });
    setModal("pay");
  }

  function savePayment(e) {
    e.preventDefault();
    updateDb(d => ({
      ...d,
      payments: d.payments.map(p => p.id === editId ? { ...p, ...form, amountPaid: Number(form.amountPaid) } : p)
    }));
    setModal(null);
  }

  return (
    <div>
      <PageHeader title="Payments" subtitle="Track fees and collection status" />

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Billed" value={`₹${totalFee.toLocaleString("en-IN")}`} color="#185FA5" icon="📄" />
        <StatCard label="Collected" value={`₹${totalRevenue.toLocaleString("en-IN")}`} color="#1D9E75" icon="✅" />
        <StatCard label="Pending Payments" value={pendingCount} color="#A32D2D" icon="⏳" />
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFB" }}>
              {["PID", "Patient", "Test", "Date", "Total Fee", "Paid", "Method", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {db.payments.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#aaa" }}>No payments yet. Register patients to create payment records.</td></tr>
            )}
            {db.payments.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
                <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>#{p.pid}</td>
                <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#1a2332" }}>{p.patientName}</td>
                <td style={{ padding: "11px 14px", fontSize: 13, color: "#555" }}>{p.testType}</td>
                <td style={{ padding: "11px 14px", fontSize: 12, color: "#888" }}>{formatDate(p.date)}</td>
                <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600 }}>₹{(p.totalFee || 0).toLocaleString("en-IN")}</td>
                <td style={{ padding: "11px 14px", fontSize: 13, color: "#1D9E75", fontWeight: 600 }}>₹{(p.amountPaid || 0).toLocaleString("en-IN")}</td>
                <td style={{ padding: "11px 14px", fontSize: 12, color: "#555" }}>{p.method || "—"}</td>
                <td style={{ padding: "11px 14px" }}><Badge label={p.status || "Pending"} style={paymentColors[p.status || "Pending"]} /></td>
                <td style={{ padding: "11px 14px" }}>
                  <button onClick={() => openEdit(p)} style={{ background: "none", border: "none", color: "#185FA5", cursor: "pointer", fontSize: 13 }}>💳 Collect</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === "pay" && (
        <Modal title="Record Payment" onClose={() => setModal(null)}>
          <form onSubmit={savePayment}>
            <Field label="Amount Paid (₹) *"><Input type="number" value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))} placeholder="0" required /></Field>
            <Field label="Payment Method">
              <Select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="Payment Status">
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option>Paid</option><option>Partial</option><option>Pending</option>
              </Select>
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn>Save Payment</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── REFERRALS ─────────────────────────────────────────────────────────────────
function Referrals({ db }) {
  const [filterMonth, setFilterMonth] = useState("");

  const referralStats = useMemo(() => {
    return db.doctors.map(doc => {
      let patients = db.patients.filter(p => p.referringDoctorId === doc.id);
      if (filterMonth) patients = patients.filter(p => p.date?.startsWith(filterMonth));
      const revenue = patients.reduce((s, p) => {
        const pay = db.payments.find(x => x.patientId === p.id);
        return s + (pay?.amountPaid || 0);
      }, 0);
      const tests = {};
      patients.forEach(p => { tests[p.testType] = (tests[p.testType] || 0) + 1; });
      return { doc, count: patients.length, revenue, tests };
    }).sort((a, b) => b.count - a.count);
  }, [db, filterMonth]);

  const walkin = useMemo(() => {
    let patients = db.patients.filter(p => !p.referringDoctorId);
    if (filterMonth) patients = patients.filter(p => p.date?.startsWith(filterMonth));
    return patients.length;
  }, [db, filterMonth]);

  const maxCount = Math.max(...referralStats.map(x => x.count), 1);

  return (
    <div>
      <PageHeader title="Referral Analytics" subtitle="Track which doctors refer the most patients" />

      <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Filter by Month:</label>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ padding: "8px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13 }} />
        {filterMonth && <button onClick={() => setFilterMonth("")} style={{ background: "none", border: "none", color: "#E24B4A", cursor: "pointer", fontSize: 13 }}>✕ Clear</button>}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Referrals" value={referralStats.reduce((s, x) => s + x.count, 0)} color="#1D9E75" icon="📊" />
        <StatCard label="Walk-in Patients" value={walkin} color="#185FA5" icon="🚶" />
        <StatCard label="Active Doctors" value={referralStats.filter(x => x.count > 0).length} color="#533AB7" icon="🩺" />
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#1a2332" }}>Referral Leaderboard</h3>
        {referralStats.length === 0 && <p style={{ color: "#aaa", fontSize: 13 }}>No doctors registered yet.</p>}
        {referralStats.map(({ doc, count, revenue, tests }, i) => (
          <div key={doc.id} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%", background: ["#1D9E75", "#185FA5", "#BA7517", "#A32D2D", "#533AB7"][Math.min(i, 4)],
                  display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0
                }}>{i + 1}</span>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13.5, color: "#1a2332" }}>Dr. {doc.name}</span>
                  <span style={{ fontSize: 12, color: "#aaa", marginLeft: 8 }}>{doc.specialty}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: "#1D9E75" }}>{count}</span>
                <span style={{ fontSize: 12, color: "#aaa", marginLeft: 4 }}>patients</span>
                <span style={{ fontSize: 12, color: "#888", marginLeft: 12 }}>₹{revenue.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div style={{ background: "#F4F6FA", borderRadius: 6, height: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 6, background: ["#1D9E75", "#185FA5", "#BA7517", "#A32D2D", "#533AB7"][Math.min(i, 4)], width: `${Math.round((count / maxCount) * 100)}%`, transition: "width 0.5s ease" }} />
            </div>
            {count > 0 && (
              <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(tests).map(([t, n]) => (
                  <span key={t} style={{ fontSize: 11, background: "#F0F4F8", color: "#555", padding: "2px 8px", borderRadius: 10 }}>{t}: {n}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}