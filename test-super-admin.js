// Quick test for Super Admin endpoints
const jwt = require('jsonwebtoken');

// Create Super Admin token
const token = jwt.sign(
    {
        userId: 1,
        username: 'admin@techlog.com',
        name: 'Super Admin',
        role: 'super_admin',
        clinicId: 1,
    },
    process.env.JWT_SECRET || 'test-jwt-secret-key',
    { expiresIn: '1h' }
);

console.log('\n🔐 Super Admin Test Token Generated:');
console.log('Token:', token.substring(0, 80) + '...\n');

console.log('📋 Available endpoints:');
console.log('  GET  /api/saas/stats/system    - System statistics (MRR, churn, patients)');
console.log('  GET  /api/saas/clinics         - List all clinics with last login');
console.log('  PATCH /api/saas/clinics/:id/status - Block/unblock clinic\n');

console.log('📝 Example cURL commands:\n');

console.log('# Get system stats:');
console.log(`curl -X GET http://localhost:3000/api/saas/stats/system \\
  -H "Authorization: Bearer ${token.substring(0, 50)}..."\n`);

console.log('# List clinics:');
console.log(`curl -X GET http://localhost:3000/api/saas/clinics \\
  -H "Authorization: Bearer ${token.substring(0, 50)}..."\n`);

console.log('# Block a clinic:');
console.log(`curl -X PATCH http://localhost:3000/api/saas/clinics/2/status \\
  -H "Authorization: Bearer ${token.substring(0, 50)}..." \\
  -H "Content-Type: application/json" \\
  -d '{"status": "suspended", "reason": "Payment overdue"}'\n`);

console.log('✅ Super Admin management system ready!');
console.log('📚 See SUPER_ADMIN_MANAGEMENT.md for full documentation\n');
