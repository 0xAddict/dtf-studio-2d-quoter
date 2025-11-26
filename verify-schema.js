// Verify Supabase Schema - Check quote_request table structure
// Run with: node verify-schema.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqfudagohdkdtnplgtob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZnVkYWdvaGRrZHRucGxndG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTAxNjksImV4cCI6MjA3OTM4NjE2OX0.ZoWPSpqNI23TXY1FsdwS4-gbJxzLkbXp97Hmq-hxsjs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verifying Supabase Schema for quote_request table...\n');

// Expected schema by WordPress plugin
const expectedColumns = {
  id: 'uuid',
  user_id: 'uuid',
  model_id: 'uuid',
  name: 'text',
  email: 'text',
  phone: 'text',
  company: 'text',
  quantity: 'int4',
  material: 'text',
  timeline: 'text',
  notes: 'text',
  model_data: 'jsonb',
  status: 'text',
  created_at: 'timestamptz'
};

async function verifySchema() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('📋 STEP 1: Checking Table Existence');
    console.log('═══════════════════════════════════════════\n');

    // Check if table exists by trying to query it
    const { data: testData, error: testError } = await supabase
      .from('quote_request')
      .select('*')
      .limit(1);

    if (testError) {
      if (testError.code === '42P01') {
        console.log('❌ Table "quote_request" does NOT exist!');
        console.log('   Run supabase-setup.sql to create it.\n');
        return;
      }
      console.log('❌ Error accessing table:', testError.message);
      return;
    }

    console.log('✅ Table "quote_request" exists\n');

    console.log('═══════════════════════════════════════════');
    console.log('📊 STEP 2: Analyzing Table Schema');
    console.log('═══════════════════════════════════════════\n');

    // Get a sample row to see actual structure
    const { data: sampleRow, error: sampleError } = await supabase
      .from('quote_request')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sampleError && sampleError.code !== 'PGRST116') {
      console.log('⚠️  Warning: Could not fetch sample row:', sampleError.message);
    }

    if (sampleRow) {
      console.log('✅ Sample row retrieved. Analyzing columns...\n');

      const actualColumns = Object.keys(sampleRow);
      const expectedColumnNames = Object.keys(expectedColumns);

      console.log('📌 Column Comparison:');
      console.log('────────────────────────────────────────\n');

      // Check each expected column
      const missingColumns = [];
      const presentColumns = [];

      expectedColumnNames.forEach(colName => {
        if (actualColumns.includes(colName)) {
          presentColumns.push(colName);
          console.log(`✅ ${colName.padEnd(15)} - Present`);
        } else {
          missingColumns.push(colName);
          console.log(`❌ ${colName.padEnd(15)} - MISSING`);
        }
      });

      console.log('\n────────────────────────────────────────\n');

      // Check for extra columns not in expected schema
      const extraColumns = actualColumns.filter(col => !expectedColumnNames.includes(col));
      if (extraColumns.length > 0) {
        console.log('⚠️  Extra columns found (not in WordPress plugin schema):');
        extraColumns.forEach(col => {
          console.log(`   - ${col}`);
        });
        console.log();
      }

      console.log('═══════════════════════════════════════════');
      console.log('📝 STEP 3: Sample Data Structure');
      console.log('═══════════════════════════════════════════\n');

      console.log('Sample row data:');
      console.log('────────────────────────────────────────');
      Object.entries(sampleRow).forEach(([key, value]) => {
        let displayValue = value;

        // Format display value
        if (value === null) {
          displayValue = 'NULL';
        } else if (typeof value === 'object') {
          displayValue = 'JSON: ' + JSON.stringify(value).substring(0, 100) + '...';
        } else if (typeof value === 'string' && value.length > 80) {
          displayValue = value.substring(0, 80) + '...';
        }

        console.log(`${key.padEnd(15)}: ${displayValue}`);
      });
      console.log();

      // Analyze model_data structure if present
      if (sampleRow.model_data) {
        console.log('═══════════════════════════════════════════');
        console.log('🔍 STEP 4: model_data JSON Structure');
        console.log('═══════════════════════════════════════════\n');

        const modelData = typeof sampleRow.model_data === 'string'
          ? JSON.parse(sampleRow.model_data)
          : sampleRow.model_data;

        console.log('model_data contains:');
        console.log('────────────────────────────────────────');
        Object.keys(modelData).forEach(key => {
          const value = modelData[key];
          const type = Array.isArray(value) ? 'array' : typeof value;
          console.log(`  ${key.padEnd(20)}: ${type}`);
        });
        console.log();
      }

      console.log('═══════════════════════════════════════════');
      console.log('📈 STEP 5: Statistics');
      console.log('═══════════════════════════════════════════\n');

      const { count, error: countError } = await supabase
        .from('quote_request')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`Total quotes in database: ${count}`);
      }

      // Summary
      console.log('\n═══════════════════════════════════════════');
      console.log('✅ SUMMARY');
      console.log('═══════════════════════════════════════════\n');

      if (missingColumns.length === 0 && extraColumns.length === 0) {
        console.log('🎉 Perfect! Schema matches WordPress plugin expectations.');
        console.log('   All expected columns are present.\n');
      } else {
        console.log('⚠️  Schema differences detected:\n');

        if (missingColumns.length > 0) {
          console.log('❌ Missing columns (WordPress plugin expects these):');
          missingColumns.forEach(col => console.log(`   - ${col} (${expectedColumns[col]})`));
          console.log();
          console.log('   Action needed: Add these columns to your Supabase table');
          console.log('   or update the WordPress plugin to not require them.\n');
        }

        if (extraColumns.length > 0) {
          console.log('ℹ️  Extra columns (not expected by plugin):');
          extraColumns.forEach(col => console.log(`   - ${col}`));
          console.log();
          console.log('   This is usually fine - WordPress plugin will ignore these.\n');
        }
      }

      console.log('Expected column types:');
      console.log('────────────────────────────────────────');
      Object.entries(expectedColumns).forEach(([col, type]) => {
        const present = actualColumns.includes(col) ? '✅' : '❌';
        console.log(`${present} ${col.padEnd(15)}: ${type}`);
      });
      console.log();

    } else {
      console.log('ℹ️  No data in table yet. Cannot analyze column structure.');
      console.log('   Insert a test quote first, then run this script again.\n');

      console.log('Expected schema:');
      console.log('────────────────────────────────────────');
      Object.entries(expectedColumns).forEach(([col, type]) => {
        const nullable = ['user_id', 'model_id', 'phone', 'company', 'timeline', 'notes', 'model_data'].includes(col);
        const nullText = nullable ? '(nullable)' : '(required)';
        console.log(`  ${col.padEnd(15)}: ${type.padEnd(12)} ${nullText}`);
      });
      console.log();
    }

    console.log('═══════════════════════════════════════════');
    console.log('🔧 Next Steps');
    console.log('═══════════════════════════════════════════\n');

    if (missingColumns.length > 0) {
      console.log('To fix missing columns, run this SQL in Supabase SQL Editor:\n');
      missingColumns.forEach(col => {
        const type = expectedColumns[col];
        const nullable = ['user_id', 'model_id', 'phone', 'company', 'timeline', 'notes', 'model_data'].includes(col);
        const nullConstraint = nullable ? '' : ' NOT NULL';
        let defaultValue = '';

        if (col === 'status') defaultValue = " DEFAULT 'pending'";
        if (col === 'created_at') defaultValue = ' DEFAULT NOW()';

        console.log(`ALTER TABLE quote_request ADD COLUMN ${col} ${type.toUpperCase()}${nullConstraint}${defaultValue};`);
      });
      console.log();
    } else {
      console.log('✅ Your schema looks good!');
      console.log('   WordPress plugin should work correctly.\n');
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('\n');
  }
}

verifySchema();
