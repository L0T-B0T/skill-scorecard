#!/usr/bin/env node
/**
 * Documentation Analyzer
 * Evaluates skill documentation quality
 */

import { readFile, access } from 'fs/promises';
import { join } from 'path';

/**
 * Check if file exists
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read file content safely
 * @param {string} filePath
 * @returns {Promise<string|null>}
 */
async function readFileSafe(filePath) {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Check if text contains examples section
 * @param {string} content
 * @returns {boolean}
 */
function hasExamples(content) {
  if (!content) return false;
  const patterns = [
    /##\s*examples?/i,
    /##\s*usage/i,
    /##\s*how\s+to\s+use/i,
    /```/  // Code blocks often indicate examples
  ];
  return patterns.some(pattern => pattern.test(content));
}

/**
 * Check if text contains references section
 * @param {string} content
 * @returns {boolean}
 */
function hasReferences(content) {
  if (!content) return false;
  const patterns = [
    /##\s*references?/i,
    /##\s*links?/i,
    /##\s*see\s+also/i,
    /##\s*resources?/i
  ];
  return patterns.some(pattern => pattern.test(content));
}

/**
 * Analyze skill documentation
 * @param {string} skillPath - Path to skill directory
 * @returns {Promise<{score: number, max: number, details: object}>}
 */
export async function analyzeDocs(skillPath) {
  const skillMdPath = join(skillPath, 'SKILL.md');
  const readmePath = join(skillPath, 'README.md');

  const [skillMdExists, readmeExists] = await Promise.all([
    fileExists(skillMdPath),
    fileExists(readmePath)
  ]);

  const [skillContent, readmeContent] = await Promise.all([
    skillMdExists ? readFileSafe(skillMdPath) : null,
    readmeExists ? readFileSafe(readmePath) : null
  ]);

  let score = 0;
  const details = {};

  // SKILL.md exists and > 500 chars (10 pts)
  if (skillMdExists && skillContent && skillContent.length > 500) {
    score += 10;
    details.skillMd = { exists: true, length: skillContent.length };
  } else {
    details.skillMd = { 
      exists: skillMdExists, 
      length: skillContent?.length || 0,
      sufficient: false 
    };
  }

  // README.md exists and > 300 chars (5 pts)
  if (readmeExists && readmeContent && readmeContent.length > 300) {
    score += 5;
    details.readmeMd = { exists: true, length: readmeContent.length };
  } else {
    details.readmeMd = { 
      exists: readmeExists, 
      length: readmeContent?.length || 0,
      sufficient: false 
    };
  }

  // Examples/usage section (3 pts)
  const combinedContent = (skillContent || '') + (readmeContent || '');
  const hasExamplesSection = hasExamples(combinedContent);
  if (hasExamplesSection) {
    score += 3;
  }
  details.examples = hasExamplesSection;

  // References section (2 pts)
  const hasReferencesSection = hasReferences(combinedContent);
  if (hasReferencesSection) {
    score += 2;
  }
  details.references = hasReferencesSection;

  return {
    score,
    max: 20,
    details
  };
}

export default { analyzeDocs };
