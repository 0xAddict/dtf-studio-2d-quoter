// Check database constraint for allowed status values
// Run with: node check-status-constraint.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqfudagohdkdtnplgtob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZnVkYWdvaGRrZHRucGxndG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTAxNjksImV4cCI6MjA3OTM4NjE2OX0.ZoWPSpqNI23TXY1FsdwS4-gbJxzLkbXp97Hmq-hxsjs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Checking status constraint on quote_request table...\n');

// Try to get a sample quote to see what status values exist
const { data: quotes, error } = await supabase
  .from('quote_request')
  .select('status')
  .limit(10);

if (error) {
  console.error('Error fetching quotes:', error.message);
} else {
  console.log('Current status values in database:');
  const statuses = [...new Set(quotes.map(q => q.status))];
  statuses.forEach(s => console.log(`  - ${s}`));
}

console.log('\nWordPress plugin expects these statuses:');
const wpStatuses = ['pending', 'processing', 'quoted', 'approved', 'in_production', 'completed', 'cancelled'];
wpStatuses.forEach(s => console.log(`  - ${s}`));

console.log('\n⚠️  To fix: Run this SQL in Supabase SQL Editor to see the constraint:\n');
console.log(`SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'quotes_status_check';`);
