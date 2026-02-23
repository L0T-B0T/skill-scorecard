# Skill Scorecard Architecture

## Overview
A multi-signal skill quality rating system that aggregates security, documentation, code quality, and maintenance signals into a unified score (0-100).

## Scoring Components

### 1. Security Score (40 points)
- **Clawdex API** (20 pts): Benign=20, Unknown=10, Malicious=0
- **Cisco Scanner** (20 pts):
  - Critical issues: -10 each
  - High issues: -5 each
  - Medium issues: -2 each
  - Low issues: -1 each
  - Floor at 0

### 2. Documentation Score (20 points)
- SKILL.md exists and > 500 chars (10 pts)
- README.md exists and > 300 chars (5 pts)
- Examples/usage section present (3 pts)
- References section present (2 pts)

### 3. Code Quality Score (20 points)
- No hardcoded secrets/tokens (10 pts)
- Proper error handling (5 pts)
- Comments/documentation in code (3 pts)
- Follows naming conventions (2 pts)

### 4. Maintenance Score (20 points)
- Git repo exists (5 pts)
- Recent commits (< 6 months) (10 pts)
- Version/changelog present (5 pts)

## Architecture

```
┌─────────────────┐
│   CLI/API       │
│  Entry Point    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Skill Loader   │ ← Accepts path/URL/ClawHub name
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│        Scorer Engine                │
│  ┌──────────┬──────────┬─────────┐ │
│  │ Security │   Docs   │  Code   │ │
│  │ Analyzer │ Analyzer │Analyzer │ │
│  └──────────┴──────────┴─────────┘ │
│  ┌──────────────────────────────┐  │
│  │   Maintenance Analyzer       │  │
│  └──────────────────────────────┘  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Score Renderer │ ← JSON/HTML/Markdown
└─────────────────┘
```

## File Structure

```
skill-scorecard/
├── README.md
├── ARCHITECTURE.md
├── package.json
├── src/
│   ├── cli.js              # Entry point
│   ├── loader.js           # Skill loading logic
│   ├── scorer.js           # Main scoring engine
│   ├── analyzers/
│   │   ├── security.js     # Clawdex + Cisco
│   │   ├── docs.js         # Documentation checks
│   │   ├── code.js         # Code quality
│   │   └── maintenance.js  # Git/version checks
│   └── renderers/
│       ├── json.js
│       ├── html.js
│       └── markdown.js
├── tests/
└── examples/
```

## External Dependencies

### APIs
- **Clawdex**: `https://clawdex.koi.security/api/skill/{name}`
- **Cisco Scanner**: `/Users/lotbot/.local/bin/skill-scanner scan {path}`

### Libraries
- Node.js (exec for Cisco scanner)
- Simple HTTP client (node-fetch or native fetch)
- Minimal dependencies

## Output Format

```json
{
  "skill": "skill-name",
  "version": "1.0.0",
  "scannedAt": "2026-02-23T07:00:00Z",
  "overallScore": 78,
  "grade": "B",
  "breakdown": {
    "security": {
      "score": 35,
      "max": 40,
      "details": {
        "clawdex": "benign",
        "ciscoIssues": {
          "critical": 0,
          "high": 1,
          "medium": 2,
          "low": 0
        }
      }
    },
    "documentation": {
      "score": 18,
      "max": 20,
      "details": {
        "skillMd": true,
        "readmeMd": true,
        "examples": true,
        "references": false
      }
    },
    "codeQuality": {
      "score": 15,
      "max": 20,
      "details": {...}
    },
    "maintenance": {
      "score": 10,
      "max": 20,
      "details": {...}
    }
  },
  "recommendations": [
    "Add references section to SKILL.md",
    "Update git repository (last commit > 6 months ago)"
  ]
}
```

## Phases

### Phase 1: MVP (Current)
- CLI tool
- Local skill scanning
- JSON output
- Core 4 analyzers

### Phase 2: Distribution
- NPM package
- Static site generator
- Batch scanning

### Phase 3: Community
- API service
- Public scorecard database
- ClawHub integration

## Next Steps
1. Set up Node.js project structure
2. Implement security analyzer (Clawdex + Cisco)
3. Build doc analyzer
4. Create CLI interface
5. Test with real skills
