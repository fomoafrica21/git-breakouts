import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();
const foundPackages = new Set();

// We ignore these folders entirely to save time and avoid unwanted errors
const ignoreDirs = ['node_modules', '.next', 'out', 'dist', '.git'];

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        scanDirectory(fullPath);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      analyzeFile(fullPath);
    }
  }
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex for: import ... from 'package' or import('package') or require('package')
  const importRegex = /from\s+['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\)|require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2] || match[3];
    
    if (importPath) {
      // Ignore relative paths (e.g., ./components/Button) and Next.js aliases (e.g., @/components)
      if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
        // For Scoped Packages (e.g., @tailwindcss/typography), keep the main name
        // For normal packages (e.g., lodash/map), extract just the base package name
        const parts = importPath.split('/');
        const pkgName = importPath.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
        
        // Ignore native Node.js built-ins
        const builtIns = ['fs', 'path', 'crypto', 'child_process', 'os', 'http', 'https', 'url', 'stream'];
        if (!builtIns.includes(pkgName)) {
          foundPackages.add(pkgName);
        }
      }
    }
  }
}

console.log('🔍 Scanning Next.js codebase for missing imports...');
scanDirectory(projectRoot);

// Check what is already present in your package.json
const packageJsonPath = path.join(projectRoot, 'package.json');
let currentDeps = [];
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  currentDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
}

// Filter out only the packages that are NOT installed yet
const missingPackages = [...foundPackages].filter(pkg => !currentDeps.includes(pkg));

if (missingPackages.length === 0) {
  console.log('✅ All packages found in your files are already declared in package.json!');
} else {
  console.log(`📦 Found missing packages: ${missingPackages.join(', ')}`);
  console.log('⚡ Starting automatic installation via npm...');
  
  try {
    // Install all missing packages in one single batch
    execSync(`npm install ${missingPackages.join(' ')}`, { stdio: 'inherit' });
    console.log('🎉 All packages installed successfully!');
  } catch (error) {
    console.error('❌ Error installing some packages:', error.message);
  }
}