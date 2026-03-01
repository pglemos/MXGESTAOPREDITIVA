import fs from 'fs';
const appContent = fs.readFileSync('src/hooks/useAuth.tsx', 'utf8');
console.log(appContent.match(/fetchProfile\s*=\s*/g));
