#!/usr/bin/env node
/**
 * Code Quality Analyzer
 * Evaluates code quality through static analysis
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Recursively get all files in directory
 * @param {string} dir
 * @param {Array} fileList
 * @returns {Promise<Array<string>>}
 */
async function getAllFiles(dir, fileList = []) {
  try {
    const files = await readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = join(dir, file.name);
      
      // Skip common non-code directories
      if (file.isDirectory()) {
        if (!['node_modules', '.git', '.vscode', 'dist', 'build'].includes(file.name)) {
          await getAllFiles(filePath, fileList);
        }
      } else {
        // Only analyze code files
        if (/\.(js|mjs|cjs|ts|sh|py|md)$/i.test(file.name)) {
          fileList.push(filePath);
        }
      }
    }
  } catch (error) {
    // Ignore permission errors
  }
  
  return fileList;
}

/**
 * Check for hardcoded secrets/tokens
 * @param {string} content
 * @returns {Array<string>}
 */
function findHardcodedSecrets(content) {
  const patterns = [
    /(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token|secret[_-]?key)\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi,
    /sk-[a-zA-Z0-9]{32,}/g,  // OpenAI-style keys
    /ghp_[a-zA-Z0-9]{36}/g,   // GitHub tokens
    /xox[baprs]-[a-zA-Z0-9-]+/g  // Slack tokens
  ];
  
  const findings = [];
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      findings.push(...matches);
    }
  });
  
  return findings;
}

/**
 * Check for error handling patterns
 * @param {string} content
 * @returns {boolean}
 */
function hasErrorHandling(content) {
  const patterns = [
    /try\s*{/,
    /catch\s*\(/,
    /\.catch\(/,
    /if\s*\([^)]*error/i,
    /throw\s+new\s+Error/
  ];
  
  return patterns.some(pattern => pattern.test(content));
}

/**
 * Check for comments/documentation
 * @param {string} content
 * @returns {number} Percentage of lines with comments
 */
function calculateCommentDensity(content) {
  const lines = content.split('\n');
  const commentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || 
           trimmed.startsWith('/*') || 
           trimmed.startsWith('*') ||
           trimmed.startsWith('#');
  });
  
  return lines.length > 0 ? (commentLines.length / lines.length) * 100 : 0;
}

/**
 * Check naming conventions
 * @param {string} content
 * @returns {boolean}
 */
function followsNamingConventions(content) {
  // Basic check: Look for camelCase functions and variables
  const hasCamelCase = /(?:const|let|var|function)\s+[a-z][a-zA-Z0-9]*/.test(content);
  
  // Check for excessive use of single-letter variables (poor naming)
  const singleLetterVars = content.match(/(?:const|let|var)\s+[a-z]\s*=/g) || [];
  const totalVars = content.match(/(?:const|let|var)\s+/g) || [];
  
  const singleLetterRatio = totalVars.length > 0 ? 
    singleLetterVars.length / totalVars.length : 0;
  
  return hasCamelCase && singleLetterRatio < 0.5; // Less than 50% single-letter vars
}

/**
 * Analyze code quality
 * @param {string} skillPath
 * @returns {Promise<{score: number, max: number, details: object}>}
 */
export async function analyzeCode(skillPath) {
  const files = await getAllFiles(skillPath);
  
  let totalSecretFindings = [];
  let filesWithErrorHandling = 0;
  let totalCommentDensity = 0;
  let filesWithGoodNaming = 0;
  let analyzedFiles = 0;

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Skip markdown files for code analysis
      if (filePath.endsWith('.md')) continue;
      
      analyzedFiles++;
      
      // Check for secrets
      const secrets = findHardcodedSecrets(content);
      totalSecretFindings.push(...secrets);
      
      // Check error handling
      if (hasErrorHandling(content)) {
        filesWithErrorHandling++;
      }
      
      // Calculate comment density
      totalCommentDensity += calculateCommentDensity(content);
      
      // Check naming
      if (followsNamingConventions(content)) {
        filesWithGoodNaming++;
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  let score = 0;
  const details = {
    analyzedFiles,
    totalFiles: files.length
  };

  // No hardcoded secrets (10 pts)
  if (totalSecretFindings.length === 0) {
    score += 10;
    details.secrets = { found: 0, clean: true };
  } else {
    details.secrets = { 
      found: totalSecretFindings.length, 
      clean: false,
      samples: totalSecretFindings.slice(0, 3) // Show first 3
    };
  }

  // Error handling (5 pts) - at least 30% of files should have error handling
  const errorHandlingRatio = analyzedFiles > 0 ? 
    filesWithErrorHandling / analyzedFiles : 0;
  if (errorHandlingRatio >= 0.3) {
    score += 5;
  }
  details.errorHandling = {
    filesWithHandling: filesWithErrorHandling,
    ratio: Math.round(errorHandlingRatio * 100)
  };

  // Comments (3 pts) - average 10%+ comment density
  const avgCommentDensity = analyzedFiles > 0 ? 
    totalCommentDensity / analyzedFiles : 0;
  if (avgCommentDensity >= 10) {
    score += 3;
  }
  details.comments = {
    averageDensity: Math.round(avgCommentDensity * 10) / 10
  };

  // Naming conventions (2 pts) - at least 50% of files follow conventions
  const namingRatio = analyzedFiles > 0 ? 
    filesWithGoodNaming / analyzedFiles : 0;
  if (namingRatio >= 0.5) {
    score += 2;
  }
  details.naming = {
    filesWithGoodNaming,
    ratio: Math.round(namingRatio * 100)
  };

  return {
    score,
    max: 20,
    details
  };
}

export default { analyzeCode };
