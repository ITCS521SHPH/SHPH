// Quick test script to verify authentication API
// Run with: node test-auth.mjs

const testCredentials = [
  { role: 'Admin', email: 'admin@demo.com', password: 'admin123' },
  { role: 'Doctor', email: 'doctor@demo.com', password: 'doctor123' },
  { role: 'VHV', email: 'vhv@demo.com', password: 'vhv123' },
  { role: 'Patient', email: 'patient@demo.com', password: 'patient123' }
];

async function testLogin(credentials) {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${credentials.role} login SUCCESS`);
      console.log(`   User ID: ${data.userId}`);
      console.log(`   Role: ${data.role}`);
      return true;
    } else {
      console.log(`❌ ${credentials.role} login FAILED`);
      console.log(`   Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${credentials.role} login ERROR`);
    console.log(`   ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Authentication for all demo users...\n');
  
  let successCount = 0;
  for (const creds of testCredentials) {
    const success = await testLogin(creds);
    if (success) successCount++;
    console.log('');
  }

  console.log(`\n📊 Results: ${successCount}/${testCredentials.length} tests passed`);
  
  if (successCount === testCredentials.length) {
    console.log('🎉 All authentication tests PASSED!');
  } else {
    console.log('⚠️  Some authentication tests FAILED');
  }
}

runTests();
