#!/usr/bin/env node
/**
 * Main Scorer Engine
 * Orchestrates all analyzers and produces unified score
 */

import { analyzeSecurity } from './analyzers/security.js';
import { analyzeDocs } from './analyzers/docs.js';
import { analyzeCode } from './analyzers/code.js';
import { analyzeMaintenance } from './analyzers/maintenance.js';
import { basename } from 'path';

/**
 * Calculate letter grade from score
 * @param {number} score
 * @returns {string}
 */
function calculateGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate recommendations based on analysis
 * @param {object} breakdown
 * @returns {Array<string>}
 */
function generateRecommendations(breakdown) {
  const recommendations = [];

  // Security recommendations
  if (breakdown.security.details.clawdex.status === 'malicious') {
    recommendations.push('⚠️ CRITICAL: Skill flagged as malicious by Clawdex - DO NOT USE');
  }
  if (breakdown.security.details.cisco.issues.critical > 0) {
    recommendations.push(`Fix ${breakdown.security.details.cisco.issues.critical} critical security issue(s)`);
  }
  if (breakdown.security.details.cisco.issues.high > 0) {
    recommendations.push(`Address ${breakdown.security.details.cisco.issues.high} high-severity issue(s)`);
  }

  // Documentation recommendations
  if (!breakdown.documentation.details.skillMd?.exists) {
    recommendations.push('Add SKILL.md file with usage documentation');
  } else if (!breakdown.documentation.details.skillMd?.sufficient) {
    recommendations.push('Expand SKILL.md content (currently < 500 characters)');
  }
  
  if (!breakdown.documentation.details.examples) {
    recommendations.push('Add examples or usage section to documentation');
  }
  
  if (!breakdown.documentation.details.references) {
    recommendations.push('Add references section with related links/resources');
  }

  // Code quality recommendations
  if (breakdown.codeQuality.details.secrets?.found > 0) {
    recommendations.push(`⚠️ Remove ${breakdown.codeQuality.details.secrets.found} hardcoded secret(s)`);
  }
  
  if (breakdown.codeQuality.details.errorHandling?.ratio < 30) {
    recommendations.push('Improve error handling coverage in code');
  }
  
  if (breakdown.codeQuality.details.comments?.averageDensity < 10) {
    recommendations.push('Add more code comments and documentation');
  }

  // Maintenance recommendations
  if (!breakdown.maintenance.details.git?.exists) {
    recommendations.push('Initialize git repository for version control');
  }
  
  if (breakdown.maintenance.details.lastCommit?.daysAgo > 180) {
    recommendations.push(`Update repository (last commit ${breakdown.maintenance.details.lastCommit.daysAgo} days ago)`);
  }
  
  if (!breakdown.maintenance.details.version?.exists) {
    recommendations.push('Add version information (package.json, CHANGELOG, or VERSION file)');
  }

  return recommendations;
}

/**
 * Score a skill
 * @param {string} skillPath - Path to skill directory
 * @param {string} skillName - Name of skill (optional, defaults to directory name)
 * @returns {Promise<object>}
 */
export async function scoreSkill(skillPath, skillName = null) {
  const name = skillName || basename(skillPath);
  const startTime = Date.now();

  console.error(`[Scorecard] Analyzing ${name}...`);

  // Run all analyzers in parallel
  const [security, documentation, codeQuality, maintenance] = await Promise.all([
    analyzeSecurity(name, skillPath).catch(err => ({
      score: 0, max: 40, error: err.message
    })),
    analyzeDocs(skillPath).catch(err => ({
      score: 0, max: 20, error: err.message
    })),
    analyzeCode(skillPath).catch(err => ({
      score: 0, max: 20, error: err.message
    })),
    analyzeMaintenance(skillPath).catch(err => ({
      score: 0, max: 20, error: err.message
    }))
  ]);

  const overallScore = security.score + documentation.score + 
                       codeQuality.score + maintenance.score;
  const maxScore = 100;

  const breakdown = {
    security,
    documentation,
    codeQuality,
    maintenance
  };

  const recommendations = generateRecommendations(breakdown);
  const elapsedMs = Date.now() - startTime;

  return {
    skill: name,
    path: skillPath,
    scannedAt: new Date().toISOString(),
    scanDurationMs: elapsedMs,
    overallScore,
    maxScore,
    grade: calculateGrade(overallScore),
    breakdown,
    recommendations
  };
}

export default { scoreSkill };
