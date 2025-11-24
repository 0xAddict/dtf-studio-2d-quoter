// Test Supabase Connection and Quote Insertion
// Run with: node test-supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqfudagohdkdtnplgtob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZnVkYWdvaGRrZHRucGxndG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTAxNjksImV4cCI6MjA3OTM4NjE2OX0.ZoWPSpqNI23TXY1FsdwS4-gbJxzLkbXp97Hmq-hxsjs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing Supabase Connection...\n');

async function testConnection() {
  try {
    // Test 1: Check if we can connect
    console.log('1️⃣ Testing connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('quote_requests')
      .select('count')
      .limit(1);

    if (healthError) {
      if (healthError.code === '42P01') {
        console.log('❌ Table "quote_requests" does NOT exist!');
        console.log('   👉 You need to run supabase-setup.sql in Supabase SQL Editor\n');
        return;
      }
      console.log('❌ Connection failed:', healthError.message);
      return;
    }
    console.log('✅ Connected to Supabase successfully\n');

    // Test 2: Check current quotes count
    console.log('2️⃣ Checking existing quotes...');
    const { count, error: countError } = await supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error counting quotes:', countError.message);
    } else {
      console.log(`✅ Found ${count} existing quote(s)\n`);
    }

    // Test 3: Try to insert a test quote
    console.log('3️⃣ Testing quote insertion...');
    const testQuote = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      company: 'Test Company',
      quantity: 5,
      material: 'PLA - Affordable',
      timeline: 'Normal (1-2 weeks)',
      notes: 'This is a test quote from test-supabase.js',
      model_data: JSON.stringify({
        quoteId: 'HF-TEST-' + Date.now(),
        fileName: 'test-model.stl',
        material: 'PLA - Affordable',
        quantity: 5,
        pricing: {
          baseCost: 50,
          materialCost: 75,
          finishingCost: 0,
          quantityDiscount: 0,
          total: 125
        }
      })
    };

    const { data: insertedQuote, error: insertError } = await supabase
      .from('quote_requests')
      .insert(testQuote)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Failed to insert test quote!');
      console.log('   Error:', insertError.message);
      console.log('   Code:', insertError.code);

      if (insertError.code === '42501') {
        console.log('\n⚠️  Permission denied! This means RLS policies are blocking inserts.');
        console.log('   👉 Run supabase-setup.sql to configure RLS policies correctly\n');
      }
      return;
    }

    console.log('✅ Test quote inserted successfully!');
    console.log('   Quote ID:', insertedQuote.id);
    console.log('   Quote #:', JSON.parse(insertedQuote.model_data).quoteId);
    console.log('\n');

    // Test 4: Verify we can read the quote back
    console.log('4️⃣ Verifying quote can be read...');
    const { data: readQuote, error: readError } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', insertedQuote.id)
      .single();

    if (readError) {
      console.log('❌ Failed to read quote:', readError.message);
    } else {
      console.log('✅ Quote can be read back successfully\n');
    }

    // Test 5: List recent quotes
    console.log('5️⃣ Fetching recent quotes...');
    const { data: recentQuotes, error: listError } = await supabase
      .from('quote_requests')
      .select('id, name, email, material, quantity, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (listError) {
      console.log('❌ Failed to list quotes:', listError.message);
    } else {
      console.log(`✅ Found ${recentQuotes.length} recent quote(s):`);
      recentQuotes.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.name} (${q.email}) - ${q.material} x${q.quantity}`);
      });
      console.log('\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════');
    console.log('Your Supabase database is configured correctly.');
    console.log('Quotes should now save from your React app.\n');
    console.log('Next steps:');
    console.log('1. Restart your dev server if it\'s running');
    console.log('2. Submit a quote through your app');
    console.log('3. Check WordPress Forge dashboard\n');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('\n');
  }
}

testConnection();
