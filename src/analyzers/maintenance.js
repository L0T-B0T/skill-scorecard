#!/usr/bin/env node
/**
 * Maintenance Analyzer
 * Evaluates skill maintenance and activity
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { access, readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Check if directory is a git repo
 * @param {string} skillPath
 * @returns {Promise<boolean>}
 */
async function isGitRepo(skillPath) {
  try {
    await access(join(skillPath, '.git'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get last commit date
 * @param {string} skillPath
 * @returns {Promise<Date|null>}
 */
async function getLastCommitDate(skillPath) {
  try {
    const { stdout } = await execAsync(
      'git log -1 --format=%ct',
      { cwd: skillPath }
    );
    const timestamp = parseInt(stdout.trim(), 10);
    return new Date(timestamp * 1000);
  } catch {
    return null;
  }
}

/**
 * Check if skill has version info
 * @param {string} skillPath
 * @returns {Promise<{hasVersion: boolean, version: string|null, source: string|null}>}
 */
async function checkVersionInfo(skillPath) {
  // Check package.json
  try {
    const pkgPath = join(skillPath, 'package.json');
    const pkgContent = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    if (pkg.version) {
      return { hasVersion: true, version: pkg.version, source: 'package.json' };
    }
  } catch {}

  // Check CHANGELOG
  const changelogFiles = ['CHANGELOG.md', 'CHANGELOG', 'HISTORY.md', 'RELEASES.md'];
  for (const file of changelogFiles) {
    try {
      await access(join(skillPath, file));
      return { hasVersion: true, version: null, source: file };
    } catch {}
  }

  // Check VERSION file
  try {
    const versionPath = join(skillPath, 'VERSION');
    const version = await readFile(versionPath, 'utf-8');
    return { hasVersion: true, version: version.trim(), source: 'VERSION' };
  } catch {}

  return { hasVersion: false, version: null, source: null };
}

/**
 * Analyze maintenance signals
 * @param {string} skillPath
 * @returns {Promise<{score: number, max: number, details: object}>}
 */
export async function analyzeMaintenance(skillPath) {
  const isGit = await isGitRepo(skillPath);
  const lastCommit = isGit ? await getLastCommitDate(skillPath) : null;
  const versionInfo = await checkVersionInfo(skillPath);

  let score = 0;
  const details = {};

  // Git repo exists (5 pts)
  if (isGit) {
    score += 5;
    details.git = { exists: true };
  } else {
    details.git = { exists: false };
  }

  // Recent commits < 6 months (10 pts)
  if (lastCommit) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const isRecent = lastCommit > sixMonthsAgo;
    if (isRecent) {
      score += 10;
    }
    
    const daysSinceCommit = Math.floor(
      (Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    details.lastCommit = {
      date: lastCommit.toISOString(),
      daysAgo: daysSinceCommit,
      isRecent
    };
  } else {
    details.lastCommit = { exists: false };
  }

  // Version/changelog present (5 pts)
  if (versionInfo.hasVersion) {
    score += 5;
    details.version = {
      exists: true,
      version: versionInfo.version,
      source: versionInfo.source
    };
  } else {
    details.version = { exists: false };
  }

  return {
    score,
    max: 20,
    details
  };
}

export default { analyzeMaintenance };
