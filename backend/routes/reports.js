const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all reports with patient info
router.get('/', (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, p.pid, p.name as patient_name, p.test_type, p.visit_date
    FROM reports r
    JOIN patients p ON r.patient_id = p.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(reports);
});

// Get report by patient id
router.get('/patient/:patientId', (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE patient_id = ?').get(req.params.patientId);
  res.json(report || null);
});

// Get single report
router.get('/:id', (req, res) => {
  const report = db.prepare(`
    SELECT r.*, p.pid, p.name as patient_name, p.test_type, p.age, p.gender, p.visit_date, d.name as doctor_name
    FROM reports r
    JOIN patients p ON r.patient_id = p.id
    LEFT JOIN doctors d ON p.referred_by = d.id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

// Update report
router.put('/:id', (req, res) => {
  const { findings, impression, reported_by, status } = req.body;
  db.prepare(`
    UPDATE reports SET findings=?, impression=?, reported_by=?, status=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(findings || null, impression || null, reported_by || null, status || 'Pending', req.params.id);
  res.json(db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id));
});

module.exports = router;
