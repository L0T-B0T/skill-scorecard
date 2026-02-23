# Skill Quality Scorecard

**Status:** Starting up
**Started:** 2026-02-22
**Owner:** Lotbot (personal project, approved by Michael)

## Vision
An automated tool that rates ClawHub skills on security, documentation, code quality, and usefulness — giving the OpenClaw community a trust layer for the 10,700+ skills on ClawHub (12% of which are malicious).

## Why This Matters
- 824+ malicious skills on ClawHub (ClawHavoc campaign)
- No standardized quality/safety rating system exists
- Community members install skills blindly
- Existing tools (Clawdex, Cisco scanner) are point solutions — no unified score

## Goals
1. Unified scorecard combining multiple signals (security, docs, code quality, maintenance)
2. Publishable results (API or static site)
3. Useful to the OpenClaw community
4. Potentially submittable as a ClawHub skill itself

## Current Status
✅ **MVP Complete** — CLI tool functional and tested

## Quick Start

```bash
export PATH="/opt/homebrew/Cellar/node@22/22.22.0/bin:$PATH"
cd /Users/lotbot/.openclaw/workspace/projects/skill-scorecard
node src/cli.js /path/to/skill
```

See [USAGE.md](USAGE.md) for full documentation.

## Features
- ✅ Multi-signal scoring (security, docs, code, maintenance)
- ✅ Clawdex API integration
- ✅ Cisco scanner integration
- ✅ Detailed recommendations
- ✅ JSON and human-readable output
- ✅ Letter grades (A-F)

## Architecture
See [ARCHITECTURE.md](ARCHITECTURE.md) for technical design.

## Progress Log
_Updates added after each nightly session_

### 2026-02-23 (Session 2)
- **MVP built and tested** 🎉
- Created full architecture document
- Implemented 4 core analyzers:
  - Security (Clawdex + Cisco)
  - Documentation (SKILL.md, README, examples, refs)
  - Code quality (secrets, error handling, comments, naming)
  - Maintenance (git, commits, versioning)
- Built scorer engine with grading and recommendations
- Created CLI with colored output and JSON mode
- Tested on weather + todoist skills (both scored 53/100 F)
- Documentation: ARCHITECTURE.md, USAGE.md
- **Duration:** ~28 minutes
- **Next:** Batch scanning, HTML reports, publish to npm

### 2026-02-22 (Session 1)
- Project initialized
- Cron job set for 2 AM EST nightly
- Research + architecture planning
