const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all patients (with doctor name)
router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = `
    SELECT p.*, d.name as doctor_name
    FROM patients p
    LEFT JOIN doctors d ON p.referred_by = d.id
    ORDER BY p.created_at DESC
  `;
  let patients;
  if (search) {
    patients = db.prepare(`
      SELECT p.*, d.name as doctor_name
      FROM patients p
      LEFT JOIN doctors d ON p.referred_by = d.id
      WHERE p.name LIKE ? OR p.pid LIKE ? OR p.phone LIKE ?
      ORDER BY p.created_at DESC
    `).all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    patients = db.prepare(sql).all();
  }
  res.json(patients);
});

// Get single patient
router.get('/:id', (req, res) => {
  const patient = db.prepare(`
    SELECT p.*, d.name as doctor_name
    FROM patients p
    LEFT JOIN doctors d ON p.referred_by = d.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// Create patient
router.post('/', (req, res) => {
  const { name, age, gender, phone, address, test_type, referred_by, fee, visit_date } = req.body;
  if (!name || !test_type || !visit_date) return res.status(400).json({ error: 'name, test_type, visit_date required' });

  // Generate PID
  const lastPatient = db.prepare("SELECT pid FROM patients ORDER BY id DESC LIMIT 1").get();
  let nextNum = 1001;
  if (lastPatient) {
    const match = lastPatient.pid.match(/\d+/);
    if (match) nextNum = parseInt(match[0]) + 1;
  }
  const pid = `PID-${nextNum}`;

  try {
    const result = db.prepare(`
      INSERT INTO patients (pid, name, age, gender, phone, address, test_type, referred_by, fee, visit_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(pid, name, age || null, gender || null, phone || null, address || null, test_type, referred_by || null, fee || 0, visit_date);

    const patientId = result.lastInsertRowid;

    // Auto-create payment record
    db.prepare(`INSERT INTO payments (patient_id, amount_due, amount_paid) VALUES (?, ?, 0)`).run(patientId, fee || 0);

    // Auto-create report record
    db.prepare(`INSERT INTO reports (patient_id, status) VALUES (?, 'Pending')`).run(patientId);

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    res.status(201).json(patient);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update patient
router.put('/:id', (req, res) => {
  const { name, age, gender, phone, address, test_type, referred_by, fee, status, visit_date } = req.body;
  try {
    db.prepare(`
      UPDATE patients SET name=?, age=?, gender=?, phone=?, address=?, test_type=?, referred_by=?, fee=?, status=?, visit_date=?
      WHERE id=?
    `).run(name, age, gender, phone, address, test_type, referred_by || null, fee, status, visit_date, req.params.id);

    // Sync payment amount_due if fee changed
    db.prepare('UPDATE payments SET amount_due = ? WHERE patient_id = ?').run(fee, req.params.id);

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    res.json(patient);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete patient
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM payments WHERE patient_id = ?').run(req.params.id);
  db.prepare('DELETE FROM reports WHERE patient_id = ?').run(req.params.id);
  db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
