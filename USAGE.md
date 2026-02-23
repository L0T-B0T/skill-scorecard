# Usage Guide

## Installation

```bash
cd /Users/lotbot/.openclaw/workspace/projects/skill-scorecard
npm install  # (when dependencies are added)
```

Make CLI executable:
```bash
chmod +x src/cli.js
```

## Basic Usage

### Scan a single skill

```bash
# Using node
export PATH="/opt/homebrew/Cellar/node@22/22.22.0/bin:$PATH"
node src/cli.js /path/to/skill

# Once installed as npm package
skill-scorecard /path/to/skill
```

### Output as JSON

```bash
node src/cli.js /path/to/skill --json
```

### Override skill name

```bash
node src/cli.js ./my-skill-dir --name "Custom Skill Name"
```

## Examples

### Scan weather skill
```bash
node src/cli.js /Users/lotbot/.npm-global/lib/node_modules/openclaw/skills/weather
```

Output:
```
============================================================
  SKILL SCORECARD: weather
============================================================
  Path: /Users/lotbot/.npm-global/lib/node_modules/openclaw/skills/weather
  Scanned: 2/23/2026, 2:03:23 AM
  Duration: 1531ms
============================================================

  Overall Score: 53/100 (53%)
  Grade: F

  Breakdown:
    Security:       30/40
    Documentation:  13/20
    Code Quality:   10/20
    Maintenance:    0/20

  Recommendations:
    • Expand SKILL.md content (currently < 500 characters)
    • Add references section with related links/resources
    • Improve error handling coverage in code
    • Add more code comments and documentation
    • Initialize git repository for version control
    • Add version information (package.json, CHANGELOG, or VERSION file)

============================================================
```

### Batch scan all skills

```bash
# Scan all OpenClaw built-in skills
for skill in /Users/lotbot/.npm-global/lib/node_modules/openclaw/skills/*; do
  echo "Scanning $(basename $skill)..."
  node src/cli.js "$skill" --json > "results/$(basename $skill).json"
done
```

### Scan workspace skills

```bash
# Scan skills in workspace
for skill in /Users/lotbot/.openclaw/workspace/skills/*; do
  node src/cli.js "$skill"
done
```

## Understanding Scores

### Security (40 points)
- **Clawdex API (20 pts):**
  - Benign: 20 points
  - Unknown: 10 points
  - Malicious: 0 points

- **Cisco Scanner (20 pts):**
  - Start at 20 points
  - Deduct: -10 per critical, -5 per high, -2 per medium, -1 per low
  - Floor at 0

### Documentation (20 points)
- SKILL.md exists and > 500 chars: 10 points
- README.md exists and > 300 chars: 5 points
- Examples/usage section: 3 points
- References section: 2 points

### Code Quality (20 points)
- No hardcoded secrets: 10 points
- Error handling (30%+ of files): 5 points
- Comments (10%+ density): 3 points
- Naming conventions (50%+ files): 2 points

### Maintenance (20 points)
- Git repo exists: 5 points
- Recent commits (< 6 months): 10 points
- Version/changelog present: 5 points

### Grading Scale
- **A:** 90-100 — Excellent
- **B:** 80-89 — Good
- **C:** 70-79 — Satisfactory
- **D:** 60-69 — Poor
- **F:** < 60 — Failing

## Advanced Usage

### Programmatic Use

```javascript
import { scoreSkill } from './src/scorer.js';

const result = await scoreSkill('/path/to/skill', 'skill-name');
console.log(result);
```

### Custom Analyzers

Create new analyzer in `src/analyzers/`:

```javascript
export async function analyzeCustom(skillPath) {
  return {
    score: 0,
    max: 10,
    details: {}
  };
}
```

Import and add to scorer.js.

## Troubleshooting

### Node not found
Export PATH with node binary:
```bash
export PATH="/opt/homebrew/Cellar/node@22/22.22.0/bin:$PATH"
```

### Cisco scanner not found
Install via pipx:
```bash
pipx install cisco-ai-skill-scanner
```

Verify path: `/Users/lotbot/.local/bin/skill-scanner`

### Permission denied
Make CLI executable:
```bash
chmod +x src/cli.js
```

## Future Enhancements

- [ ] Batch scanning with progress bar
- [ ] HTML report generation
- [ ] Markdown report for GitHub
- [ ] Compare multiple skills
- [ ] Historical tracking
- [ ] CI/CD integration
- [ ] Public API/database
