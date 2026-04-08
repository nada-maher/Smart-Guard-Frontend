// Test script to verify admin dashboard user statistics
// This can be run in the browser console to debug the user stats

function testUserStats() {
  console.log('🔍 Testing Admin Dashboard User Stats');
  console.log('=====================================');
  
  // Mock user data to test the filtering logic
  const mockUsers = [
    { id: 1, email: 'user1@test.com', status: 'approved', role: 'admin' },
    { id: 2, email: 'user2@test.com', status: 'pending', role: 'security_man' },
    { id: 3, email: 'user3@test.com', status: 'declined', role: 'security_man' },
    { id: 4, email: 'user4@test.com', status: 'approved', role: 'security_man' },
    { id: 5, email: 'user5@test.com', status: 'pending', role: 'admin' },
  ];
  
  // Calculate user statistics (same logic as in AdminDashboard)
  const userStats = {
    total: Array.isArray(mockUsers) ? mockUsers.length : 0,
    approved: Array.isArray(mockUsers) ? mockUsers.filter(u => u && u.status === 'approved').length : 0,
    declined: Array.isArray(mockUsers) ? mockUsers.filter(u => u && u.status === 'declined').length : 0,
    pending: Array.isArray(mockUsers) ? mockUsers.filter(u => u && u.status === 'pending').length : 0,
    admins: Array.isArray(mockUsers) ? mockUsers.filter(u => u && u.role === 'admin').length : 0,
    security: Array.isArray(mockUsers) ? mockUsers.filter(u => u && u.role === 'security_man').length : 0
  };
  
  console.log('📊 Mock Users Data:');
  mockUsers.forEach(user => {
    console.log(`  - ${user.email}: ${user.status} (${user.role})`);
  });
  
  console.log('\n📈 User Statistics:');
  console.log(`  Total Users: ${userStats.total}`);
  console.log(`  Approved Users: ${userStats.approved} ✅`);
  console.log(`  Pending Users: ${userStats.pending} ⏳`);
  console.log(`  Declined Users: ${userStats.declined} ❌`);
  console.log(`  Admin Users: ${userStats.admins} 👨‍💼`);
  console.log(`  Security Users: ${userStats.security} 👮`);
  
  console.log('\n✅ Expected Results:');
  console.log('  Approved Users: 2 (user1@test.com, user4@test.com)');
  console.log('  Pending Users: 2 (user2@test.com, user5@test.com)');
  console.log('  Declined Users: 1 (user3@test.com)');
  console.log('  Admin Users: 2 (user1@test.com, user5@test.com)');
  console.log('  Security Users: 2 (user2@test.com, user3@test.com)');
  
  console.log('\n🎯 Test Results:');
  const tests = [
    { name: 'Total Users', expected: 5, actual: userStats.total },
    { name: 'Approved Users', expected: 2, actual: userStats.approved },
    { name: 'Pending Users', expected: 2, actual: userStats.pending },
    { name: 'Declined Users', expected: 1, actual: userStats.declined },
    { name: 'Admin Users', expected: 2, actual: userStats.admins },
    { name: 'Security Users', expected: 2, actual: userStats.security },
  ];
  
  tests.forEach(test => {
    const passed = test.expected === test.actual;
    console.log(`  ${passed ? '✅' : '❌'} ${test.name}: ${test.actual} (expected: ${test.expected})`);
  });
  
  console.log('\n🔍 Current Admin Dashboard State:');
  // Check if we can access the actual component state (only works in development)
  if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('  React DevTools available - check component state in DevTools');
  } else {
    console.log('  React DevTools not available - check browser console for component logs');
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testUserStats = testUserStats;
  console.log('💡 Run testUserStats() in browser console to test user statistics logic');
}

export default testUserStats;
