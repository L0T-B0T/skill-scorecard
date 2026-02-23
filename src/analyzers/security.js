#!/usr/bin/env node
/**
 * Security Analyzer
 * Integrates Clawdex API and Cisco Skill Scanner to evaluate skill security
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CLAWDEX_API = 'https://clawdex.koi.security/api/skill/';
const CISCO_SCANNER = '/Users/lotbot/.local/bin/skill-scanner';

/**
 * Query Clawdex API for skill reputation
 * @param {string} skillName - Name of the skill
 * @returns {Promise<{status: string, score: number}>}
 */
async function checkClawdex(skillName) {
  try {
    const response = await fetch(`${CLAWDEX_API}${encodeURIComponent(skillName)}`);
    
    if (!response.ok) {
      return { status: 'unknown', score: 10, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const status = data.status || 'unknown';
    
    // Scoring: benign=20, unknown=10, malicious=0
    const scoreMap = {
      'benign': 20,
      'unknown': 10,
      'malicious': 0
    };
    
    return {
      status,
      score: scoreMap[status] || 10,
      details: data
    };
  } catch (error) {
    return {
      status: 'error',
      score: 10,
      error: error.message
    };
  }
}

/**
 * Run Cisco skill scanner on local skill path
 * @param {string} skillPath - Path to skill directory
 * @returns {Promise<{score: number, issues: object}>}
 */
async function runCiscoScanner(skillPath) {
  try {
    const { stdout, stderr } = await execAsync(
      `${CISCO_SCANNER} scan "${skillPath}" --format json`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    // Parse JSON output
    let results;
    try {
      results = JSON.parse(stdout);
    } catch (e) {
      // If JSON parsing fails, try to extract from output
      return {
        score: 15, // Assume moderate security if scanner runs but parsing fails
        issues: { critical: 0, high: 0, medium: 0, low: 0 },
        error: 'Scanner output parsing failed'
      };
    }

    // Count issues by severity
    const issues = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    // Extract findings from scanner output
    if (results.findings && Array.isArray(results.findings)) {
      results.findings.forEach(finding => {
        const severity = (finding.severity || 'low').toLowerCase();
        if (issues.hasOwnProperty(severity)) {
          issues[severity]++;
        }
      });
    }

    // Calculate score: Start at 20, deduct for issues
    let score = 20;
    score -= issues.critical * 10;
    score -= issues.high * 5;
    score -= issues.medium * 2;
    score -= issues.low * 1;
    score = Math.max(0, score); // Floor at 0

    return {
      score,
      issues,
      rawResults: results
    };
  } catch (error) {
    // Scanner not available or failed
    return {
      score: 10, // Default score when scanner unavailable
      issues: { critical: 0, high: 0, medium: 0, low: 0 },
      error: error.message,
      scannerAvailable: false
    };
  }
}

/**
 * Analyze skill security combining Clawdex and Cisco scanner
 * @param {string} skillName - Name of the skill (for Clawdex)
 * @param {string} skillPath - Path to skill directory (for Cisco)
 * @returns {Promise<{score: number, max: number, details: object}>}
 */
export async function analyzeSecurity(skillName, skillPath) {
  const [clawdexResult, ciscoResult] = await Promise.all([
    checkClawdex(skillName),
    runCiscoScanner(skillPath)
  ]);

  const totalScore = clawdexResult.score + ciscoResult.score;
  
  return {
    score: totalScore,
    max: 40,
    details: {
      clawdex: {
        status: clawdexResult.status,
        score: clawdexResult.score,
        max: 20,
        error: clawdexResult.error
      },
      cisco: {
        score: ciscoResult.score,
        max: 20,
        issues: ciscoResult.issues,
        error: ciscoResult.error,
        scannerAvailable: ciscoResult.scannerAvailable !== false
      }
    }
  };
}

export default { analyzeSecurity };
