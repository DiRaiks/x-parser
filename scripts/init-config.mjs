#!/usr/bin/env node

/**
 * Configuration initialization script for X-Parser
 * Copies example configuration files to working configurations
 */

import fs from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'config');
const CONFIGS = [
  { example: 'app.example.json', target: 'app.json' },
  { example: 'prompts.example.json', target: 'prompts.json' }
];

function initializeConfig() {
  console.log('🚀 Initializing X-Parser configuration...\n');

  // Check if config directory exists
  if (!fs.existsSync(CONFIG_DIR)) {
    console.log('📁 Creating config directory...');
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  let hasChanges = false;

  CONFIGS.forEach(({ example, target }) => {
    const examplePath = path.join(CONFIG_DIR, example);
    const targetPath = path.join(CONFIG_DIR, target);

    if (!fs.existsSync(examplePath)) {
      console.log(`❌ Example file not found: ${example}`);
      return;
    }

    if (fs.existsSync(targetPath)) {
      console.log(`✅ Configuration already exists: ${target}`);
      return;
    }

    console.log(`📄 Creating ${target} from ${example}...`);
    fs.copyFileSync(examplePath, targetPath);
    hasChanges = true;
  });

  if (hasChanges) {
    console.log('\n🎉 Configuration files created successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review and customize config/app.json');
    console.log('   2. Review and customize config/prompts.json');
    console.log('   3. Set up your .env file with OPENAI_API_KEY');
    console.log('   4. Run: yarn dev');
  } else {
    console.log('\n✨ All configuration files are already set up!');
  }
}

// Run the script
try {
  initializeConfig();
} catch (error) {
  console.error('❌ Error initializing configuration:', error.message);
  process.exit(1);
} 