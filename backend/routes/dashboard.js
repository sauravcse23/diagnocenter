const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const todayPatients = db.prepare("SELECT COUNT(*) as count FROM patients WHERE visit_date = ?").get(today);
  const totalPatients = db.prepare("SELECT COUNT(*) as count FROM patients").get();
  const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'Pending' OR status = 'Processing'").get();
  const revenue = db.prepare("SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments").get();
  const todayRevenue = db.prepare(`
    SELECT COALESCE(SUM(pay.amount_paid), 0) as total
    FROM payments pay
    JOIN patients p ON pay.patient_id = p.id
    WHERE p.visit_date = ?
  `).get(today);

  const topDoctors = db.prepare(`
    SELECT d.name, d.specialty, COUNT(p.id) as referrals
    FROM doctors d
    LEFT JOIN patients p ON p.referred_by = d.id
    GROUP BY d.id
    ORDER BY referrals DESC
    LIMIT 5
  `).all();

  const recentPatients = db.prepare(`
    SELECT p.pid, p.name, p.test_type, p.visit_date, p.status, d.name as doctor_name
    FROM patients p
    LEFT JOIN doctors d ON p.referred_by = d.id
    ORDER BY p.created_at DESC
    LIMIT 8
  `).all();

  const testTypeCounts = db.prepare(`
    SELECT test_type, COUNT(*) as count
    FROM patients
    GROUP BY test_type
    ORDER BY count DESC
  `).all();

  const monthlyPatients = db.prepare(`
    SELECT strftime('%Y-%m', visit_date) as month, COUNT(*) as count
    FROM patients
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `).all();

  res.json({
    todayPatients: todayPatients.count,
    totalPatients: totalPatients.count,
    pendingReports: pendingReports.count,
    totalRevenue: revenue.total,
    todayRevenue: todayRevenue.total,
    topDoctors,
    recentPatients,
    testTypeCounts,
    monthlyPatients
  });
});

module.exports = router;
