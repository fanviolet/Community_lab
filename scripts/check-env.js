/**
 * Environment Variables Diagnostic Script
 * Run with: node scripts/check-env.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('=== Environment Variables Diagnostic ===\n');

// Check all environment variables
const envVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden)' : 'Not set',
  'GEMINI_API_KEY': process.env.GEMINI_API_KEY ? 'Set (hidden)' : 'Not set',
  'NODE_ENV': process.env.NODE_ENV,
};

console.log('Environment Variables Status:');
Object.entries(envVars).forEach(([key, value]) => {
  const status = value && value !== 'your-project-url' && value !== 'your-anon-key' && value !== 'your-service-role-key' && value !== 'your-gemini-api-key'
    ? '✅ Configured'
    : '❌ Not configured or placeholder';
  console.log(`  ${key}: ${status}`);
  if (value && !value.includes('hidden')) {
    console.log(`    Value: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
  }
});

console.log('\n=== File Check ===');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file exists');
  const content = fs.readFileSync(envLocalPath, 'utf8');
  console.log(`   File size: ${content.length} bytes`);
  console.log(`   Line count: ${content.split('\n').length}`);
  console.log('   First few lines:');
  console.log(content.split('\n').slice(0, 5).join('\n'));
} else {
  console.log('❌ .env.local file does not exist');
}

console.log('\n=== Recommendations ===');
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key') {
  console.log('❌ GEMINI_API_KEY is not set or still has placeholder value');
  console.log('   Please update .env.local with your actual Gemini API key');
} else {
  console.log('✅ GEMINI_API_KEY appears to be configured');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your-project-url') {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL is not set or still has placeholder value');
  console.log('   Please update .env.local with your actual Supabase URL');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL appears to be configured');
}

console.log('\n=== Next Steps ===');
console.log('1. Make sure .env.local contains your actual API keys');
console.log('2. Restart the development server: npm run dev');
console.log('3. Check browser console for any remaining errors');
