#!/usr/bin/env node
/**
 * Pre-flight check for Firebase emulator ports
 *
 * Ensures no emulator is already running before starting tests.
 * This prevents the "multiple instances" warning and test interference.
 */

const { execSync } = require('child_process');

const PORTS = [9000, 9099, 4000, 5002]; // Database, Auth, Emulator UI, Hosting
const PORT_NAMES = {
  9000: 'Database',
  9099: 'Auth',
  4000: 'Emulator UI',
  5002: 'Hosting'
};

function checkPorts() {
  const occupiedPorts = [];

  for (const port of PORTS) {
    try {
      // Check if port is in use (works on macOS/Linux)
      const result = execSync(`lsof -i :${port} -t 2>/dev/null`, { encoding: 'utf8' });
      if (result.trim()) {
        occupiedPorts.push({ port, pids: result.trim().split('\n') });
      }
    } catch {
      // Port is free (lsof exits with error when no process found)
    }
  }

  return occupiedPorts;
}

function main() {
  const occupied = checkPorts();

  if (occupied.length === 0) {
    console.log('✓ All emulator ports are free');
    process.exit(0);
  }

  console.error('');
  console.error('='.repeat(60));
  console.error('FIREBASE EMULATOR ALREADY RUNNING');
  console.error('='.repeat(60));
  console.error('');
  console.error('The following emulator ports are in use:');
  console.error('');

  for (const { port, pids } of occupied) {
    console.error(`  Port ${port} (${PORT_NAMES[port] || 'Unknown'}): PIDs ${pids.join(', ')}`);
  }

  console.error('');
  console.error('This will cause test interference. Options:');
  console.error('');
  console.error('  1. Stop the existing emulator:');
  console.error('     - Press Ctrl+C in the terminal running "npm run emulators"');
  console.error('     - Or run: pkill -f "firebase.*emulators"');
  console.error('');
  console.error('  2. Use the existing emulator (if intentional):');
  console.error('     - Run: npm run test:e2e');
  console.error('');
  console.error('='.repeat(60));

  process.exit(1);
}

main();
