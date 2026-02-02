#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔄 Setting up Prisma...');

try {
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('✅ Prisma setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Set DATABASE_URL environment variable');
  console.log('2. Run: npx prisma db push');
  console.log('3. Start the dev server: npm run dev');
} catch (error) {
  console.error('❌ Prisma setup failed:', error.message);
  process.exit(1);
}
