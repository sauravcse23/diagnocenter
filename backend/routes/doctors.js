const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all doctors with referral count
router.get('/', (req, res) => {
  const doctors = db.prepare(`
    SELECT d.*, COUNT(p.id) as referral_count,
           COALESCE(SUM(p.fee), 0) as total_revenue
    FROM doctors d
    LEFT JOIN patients p ON p.referred_by = d.id
    GROUP BY d.id
    ORDER BY referral_count DESC
  `).all();
  res.json(doctors);
});

// Get single doctor with stats
router.get('/:id', (req, res) => {
  const doctor = db.prepare(`
    SELECT d.*, COUNT(p.id) as referral_count,
           COALESCE(SUM(p.fee), 0) as total_revenue
    FROM doctors d
    LEFT JOIN patients p ON p.referred_by = d.id
    WHERE d.id = ?
    GROUP BY d.id
  `).get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  // Also get their patients
  const patients = db.prepare(`
    SELECT pid, name, test_type, visit_date, fee, status
    FROM patients WHERE referred_by = ?
    ORDER BY visit_date DESC
  `).all(req.params.id);

  res.json({ ...doctor, patients });
});

// Referral analytics - by month
router.get('/analytics/referrals', (req, res) => {
  const { month } = req.query; // format: YYYY-MM
  let sql = `
    SELECT d.id, d.name, d.specialty, d.clinic,
           COUNT(p.id) as referral_count,
           COALESCE(SUM(p.fee), 0) as total_revenue,
           GROUP_CONCAT(DISTINCT p.test_type) as test_types
    FROM doctors d
    LEFT JOIN patients p ON p.referred_by = d.id
  `;
  let params = [];
  if (month) {
    sql += ` WHERE strftime('%Y-%m', p.visit_date) = ?`;
    params.push(month);
  }
  sql += ` GROUP BY d.id ORDER BY referral_count DESC`;

  const data = db.prepare(sql).all(...params);
  res.json(data);
});

// Create doctor
router.post('/', (req, res) => {
  const { name, specialty, clinic, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const result = db.prepare('INSERT INTO doctors (name, specialty, clinic, phone, email) VALUES (?, ?, ?, ?, ?)').run(name, specialty || null, clinic || null, phone || null, email || null);
    res.status(201).json(db.prepare('SELECT * FROM doctors WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update doctor
router.put('/:id', (req, res) => {
  const { name, specialty, clinic, phone, email } = req.body;
  db.prepare('UPDATE doctors SET name=?, specialty=?, clinic=?, phone=?, email=? WHERE id=?').run(name, specialty, clinic, phone, email, req.params.id);
  res.json(db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id));
});

// Delete doctor
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE patients SET referred_by = NULL WHERE referred_by = ?').run(req.params.id);
  db.prepare('DELETE FROM doctors WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
