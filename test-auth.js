const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmprakkctummmforgkyy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcHJha2tjdHVtbW1mb3Jna3l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYwMzYzOCwiZXhwIjoyMDc0MTc5NjM4fQ.jts0UeTywXILUJZkifbMzELHD2K1uzaTtREJ_Lm8HXY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo users to test
const testUsers = [
  { email: 'admin@shph.com', password: 'password123', role: 'ADMIN' },
  { email: 'dr.smith@shph.com', password: 'password123', role: 'DOCTOR' },
  { email: 'vhv.mary@shph.com', password: 'password123', role: 'VHV' },
  { email: 'patient@shph.com', password: 'password123', role: 'PATIENT' }
];

async function testAuthentication() {
  console.log('========================================');
  console.log('TESTING AUTHENTICATION');
  console.log('========================================\n');

  // Test 1: Check if tables exist
  console.log('📋 Test 1: Checking if tables exist...');
  const tables = ['admins', 'doctors', 'vhvs', 'patients'];
  let allTablesExist = true;
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(0);
    if (error) {
      console.log(`  ❌ ${table}: Does not exist`);
      allTablesExist = false;
    } else {
      console.log(`  ✅ ${table}: Exists`);
    }
  }
  
  if (!allTablesExist) {
    console.log('\n❌ Some tables are missing!');
    console.log('📖 Please run the SQL in APPLY_TO_SUPABASE.sql first.\n');
    console.log('Instructions: See FIX_SUPABASE_AUTH_README.md\n');
    return;
  }

  console.log('\n✅ All tables exist!\n');

  // Test 2: Check if authenticate_user function exists
  console.log('🔧 Test 2: Checking authentication function...');
  try {
    const { data, error } = await supabase.rpc('authenticate_user', {
      input_email: 'test@test.com',
      input_password: 'test'
    });
    
    if (error && error.message.includes('Could not find the function')) {
      console.log('  ❌ authenticate_user function missing\n');
      console.log('📖 Please run the SQL in APPLY_TO_SUPABASE.sql\n');
      return;
    } else {
      console.log('  ✅ authenticate_user function exists\n');
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
    return;
  }

  // Test 3: Try logging in with each demo user
  console.log('🔐 Test 3: Testing login for demo users...\n');
  
  for (const user of testUsers) {
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        input_email: user.email,
        input_password: user.password
      });
      
      if (error) {
        console.log(`  ❌ ${user.role} (${user.email}): ${error.message}`);
      } else if (!data || data.length === 0) {
        console.log(`  ❌ ${user.role} (${user.email}): User not found or wrong password`);
      } else {
        const authData = data[0];
        console.log(`  ✅ ${user.role} (${user.email}): Login successful!`);
        console.log(`     User ID: ${authData.user_id}`);
        console.log(`     Role: ${authData.user_type}`);
      }
    } catch (error) {
      console.log(`  ❌ ${user.role} (${user.email}): ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================\n');

  // Test 4: Check demo user counts
  console.log('📊 Demo User Statistics:\n');
  
  for (const table of tables) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ${count || 0} records`);
  }

  console.log('\n');
}

// Run tests
testAuthentication().catch(console.error);
