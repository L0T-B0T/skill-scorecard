#!/usr/bin/env node
/**
 * Skill Scorecard CLI
 * Command-line interface for skill quality assessment
 */

import { scoreSkill } from './scorer.js';
import { resolve } from 'path';

/**
 * Format score with color
 * @param {number} score
 * @param {number} max
 * @returns {string}
 */
function formatScore(score, max) {
  const percentage = (score / max) * 100;
  let color = '\x1b[31m'; // Red
  
  if (percentage >= 80) color = '\x1b[32m'; // Green
  else if (percentage >= 60) color = '\x1b[33m'; // Yellow
  
  return `${color}${score}/${max}\x1b[0m`;
}

/**
 * Format grade with color
 * @param {string} grade
 * @returns {string}
 */
function formatGrade(grade) {
  const colors = {
    'A': '\x1b[32m',  // Green
    'B': '\x1b[36m',  // Cyan
    'C': '\x1b[33m',  // Yellow
    'D': '\x1b[31m',  // Red
    'F': '\x1b[31m\x1b[1m'  // Bold Red
  };
  
  const color = colors[grade] || '\x1b[0m';
  return `${color}${grade}\x1b[0m`;
}

/**
 * Print results to console
 * @param {object} result
 */
function printResults(result) {
  console.log('\n' + '='.repeat(60));
  console.log(`  SKILL SCORECARD: ${result.skill}`);
  console.log('='.repeat(60));
  console.log(`  Path: ${result.path}`);
  console.log(`  Scanned: ${new Date(result.scannedAt).toLocaleString()}`);
  console.log(`  Duration: ${result.scanDurationMs}ms`);
  console.log('='.repeat(60));
  
  console.log(`\n  Overall Score: ${formatScore(result.overallScore, result.maxScore)} (${result.overallScore}%)`);
  console.log(`  Grade: ${formatGrade(result.grade)}\n`);
  
  console.log('  Breakdown:');
  console.log(`    Security:       ${formatScore(result.breakdown.security.score, 40)}`);
  console.log(`    Documentation:  ${formatScore(result.breakdown.documentation.score, 20)}`);
  console.log(`    Code Quality:   ${formatScore(result.breakdown.codeQuality.score, 20)}`);
  console.log(`    Maintenance:    ${formatScore(result.breakdown.maintenance.score, 20)}`);
  
  if (result.recommendations.length > 0) {
    console.log('\n  Recommendations:');
    result.recommendations.forEach(rec => {
      const icon = rec.startsWith('⚠️') ? '' : '  •';
      console.log(`    ${icon} ${rec}`);
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Print usage help
 */
function printHelp() {
  console.log(`
Skill Scorecard - Quality and security assessment for OpenClaw skills

USAGE:
  skill-scorecard <path-to-skill> [options]

OPTIONS:
  --json          Output results as JSON
  --name <name>   Override skill name
  --help          Show this help message

EXAMPLES:
  skill-scorecard ./my-skill
  skill-scorecard ~/.openclaw/workspace/skills/weather --json
  skill-scorecard ./skill-dir --name "Custom Name"

SCORING:
  Security (40 pts):     Clawdex API + Cisco scanner
  Documentation (20 pts): SKILL.md, README.md, examples
  Code Quality (20 pts):  No secrets, error handling, comments
  Maintenance (20 pts):   Git repo, recent commits, versioning

  Grade: A (90+), B (80-89), C (70-79), D (60-69), F (<60)
  `);
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const skillPath = args[0];
  const options = {
    json: args.includes('--json'),
    name: null
  };

  const nameIndex = args.indexOf('--name');
  if (nameIndex !== -1 && args[nameIndex + 1]) {
    options.name = args[nameIndex + 1];
  }

  try {
    const fullPath = resolve(skillPath);
    const result = await scoreSkill(fullPath, options.name);
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printResults(result);
    }
    
    // Exit code based on grade
    const exitCodes = { 'A': 0, 'B': 0, 'C': 0, 'D': 1, 'F': 1 };
    process.exit(exitCodes[result.grade] || 1);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, printResults };
