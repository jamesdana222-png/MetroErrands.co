const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files with Supabase imports
const files = execSync('git grep -l "@supabase" -- "*.ts" "*.tsx"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} files with Supabase imports`);

// Replace imports in each file
files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace auth-helpers-nextjs imports
    content = content.replace(
      /import\s+\{\s*createRouteHandlerClient\s*\}\s+from\s+['"]@supabase\/auth-helpers-nextjs['"];?/g, 
      `import { authClient } from '@/lib/supabase';`
    );
    
    content = content.replace(
      /import\s+\{\s*createClientComponentClient\s*\}\s+from\s+['"]@supabase\/auth-helpers-nextjs['"];?/g, 
      `import { dbClient } from '@/lib/supabase';`
    );
    
    // Replace ssr imports
    content = content.replace(
      /import\s+\{\s*createBrowserClient\s*\}\s+from\s+['"]@supabase\/ssr['"];?/g, 
      `import { dbClient } from '@/lib/supabase';`
    );
    
    // Replace supabase-js imports
    content = content.replace(
      /import\s+.*\s+from\s+['"]@supabase\/supabase-js['"];?/g, 
      ``
    );
    
    // Replace client initialization
    content = content.replace(
      /const\s+supabase\s+=\s+createRouteHandlerClient\(\{\s*cookies[^}]*\}\);?/g,
      ``
    );
    
    content = content.replace(
      /const\s+supabase\s+=\s+createClientComponentClient\(\);?/g,
      ``
    );
    
    content = content.replace(
      /const\s+supabase\s+=\s+createBrowserClient\([^)]*\);?/g,
      ``
    );
    
    // Replace supabase client usage with our mock clients
    content = content.replace(/supabase\.auth\./g, 'authClient.');
    content = content.replace(/supabase\.from\(/g, 'dbClient.from(');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
});

console.log('All Supabase imports replaced successfully!');