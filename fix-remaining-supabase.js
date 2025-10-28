const fs = require('fs');
const path = require('path');

// Files to fix based on the error message
const filesToFix = [
  'src/app/api/v1/auth/login/route.ts',
  'src/app/api/v1/auth/register/route.ts',
  'src/app/api/v1/projects/route.ts',
  'src/app/api/v1/tasks/route.ts',
  'src/app/api/v1/users/route.ts'
];

// Function to fix a file
function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace Supabase imports
  content = content.replace(
    /import.*?@supabase\/auth-helpers-nextjs.*/g, 
    `import { authClient, dbClient } from '@/lib/supabase';`
  );
  
  // Replace createRouteHandlerClient initialization
  content = content.replace(
    /const\s+supabase\s+=\s+createRouteHandlerClient\(\s*\{\s*cookies\s*\}\s*\);/g,
    '// Using mock clients instead of createRouteHandlerClient'
  );
  
  // Replace supabase client usage with our mock clients
  content = content.replace(/supabase\.auth\./g, 'authClient.auth.');
  content = content.replace(/supabase\.from/g, 'dbClient.from');
  
  fs.writeFileSync(fullPath, content);
  console.log(`Fixed: ${filePath}`);
}

// Fix all files
filesToFix.forEach(fixFile);
console.log('All files fixed!');