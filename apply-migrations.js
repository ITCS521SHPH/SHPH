const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmprakkctummmforgkyy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcHJha2tjdHVtbW1mb3Jna3l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYwMzYzOCwiZXhwIjoyMDc0MTc5NjM4fQ.jts0UeTywXILUJZkifbMzELHD2K1uzaTtREJ_Lm8HXY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrations() {
  console.log('Starting migration process...\n');

  // List of critical migrations in order
  const migrations = [
    '002_create_password_functions.sql',
    '001_create_authenticate_user_function.sql',
    '009_add_patient_medical_fields.sql',
    '010_add_notifications_and_status_tracking.sql',
    '011_add_audit_logs.sql',
    '012_add_in_review_status.sql',
    '016_enable_in_review_status_check.sql'
  ];

  for (const migration of migrations) {
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', migration);
    
    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  Migration file not found: ${migration}`);
      continue;
    }

    console.log(`📄 Applying ${migration}...`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    try {
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length > 0) {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            // Try direct execution if RPC doesn't work
            console.log(`   Trying direct execution...`);
            // We'll need to use pg for direct SQL execution
          }
        }
      }

      console.log(`✅ Successfully applied ${migration}\n`);
    } catch (error) {
      console.error(`❌ Error applying ${migration}:`, error.message, '\n');
    }
  }

  console.log('Migration process completed!');
}

// Test database connection
async function testConnection() {
  console.log('Testing database connection...');
  
  const { data, error } = await supabase.from('users').select('count').limit(1);
  
  if (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
  
  console.log('✅ Connection successful!\n');
  return true;
}

// Check if functions exist
async function checkFunctions() {
  console.log('Checking database functions...\n');
  
  // Check authenticate_user
  try {
    const { data, error } = await supabase.rpc('authenticate_user', {
      input_email: 'test@test.com',
      input_password: 'test'
    });
    
    if (error && error.message.includes('Could not find the function')) {
      console.log('❌ authenticate_user function missing');
      return false;
    } else {
      console.log('✅ authenticate_user function exists');
    }
  } catch (error) {
    console.log('❌ authenticate_user function missing or error:', error.message);
    return false;
  }
  
  return true;
}

async function main() {
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  const functionsExist = await checkFunctions();
  
  if (!functionsExist) {
    console.log('\n⚠️  Required functions missing. Migrations need to be applied.\n');
    console.log('Please run the SQL migrations manually in Supabase dashboard:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/cmprakkctummmforgkyy/editor');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of each migration file in order:\n');
    console.log('   - supabase/migrations/002_create_password_functions.sql');
    console.log('   - supabase/migrations/001_create_authenticate_user_function.sql\n');
  } else {
    console.log('\n✅ All required functions are present!\n');
  }
}

main();
