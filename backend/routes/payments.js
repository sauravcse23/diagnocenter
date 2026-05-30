const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all payments with patient info
router.get('/', (req, res) => {
  const payments = db.prepare(`
    SELECT pay.*, p.pid, p.name as patient_name, p.test_type, p.visit_date
    FROM payments pay
    JOIN patients p ON pay.patient_id = p.id
    ORDER BY pay.created_at DESC
  `).all();
  res.json(payments);
});

// Get payment by patient
router.get('/patient/:patientId', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE patient_id = ?').get(req.params.patientId);
  res.json(payment || null);
});

// Update payment
router.put('/:id', (req, res) => {
  const { amount_paid, payment_method, status } = req.body;
  const paidAt = status === 'Paid' ? "CURRENT_TIMESTAMP" : null;
  db.prepare(`
    UPDATE payments SET amount_paid=?, payment_method=?, status=?, paid_at=${paidAt ? 'CURRENT_TIMESTAMP' : 'NULL'}
    WHERE id=?
  `).run(amount_paid, payment_method, status, req.params.id);
  res.json(db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id));
});

// Revenue summary
router.get('/summary/revenue', (req, res) => {
  const { month } = req.query;
  let where = '';
  let params = [];
  if (month) {
    where = `WHERE strftime('%Y-%m', pay.created_at) = ?`;
    params.push(month);
  }
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_records,
      COALESCE(SUM(amount_due), 0) as total_due,
      COALESCE(SUM(amount_paid), 0) as total_collected,
      COALESCE(SUM(amount_due) - SUM(amount_paid), 0) as total_pending,
      COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN status = 'Partial' THEN 1 END) as partial_count,
      COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count
    FROM payments pay
    ${where}
  `).get(...params);
  res.json(summary);
});

module.exports = router;
