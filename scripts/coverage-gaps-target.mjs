import { readFileSync } from 'node:fs';

const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf8'));
const targets = ['server/services','server/middleware','server/utils','app/plugins','app/utils','app/layouts'];
const results = {};

for (const [file, data] of Object.entries(cov)) {
  const dir = targets.find(t => file.includes(t + '/'));
  if (!dir) continue;
  if (!results[dir]) results[dir] = [];

  const stmts = data.statementMap;
  const s = data.s;
  let uncovered = 0;
  const uncovLines = [];
  for (const [id, count] of Object.entries(s)) {
    if (count === 0) {
      uncovered++;
      const loc = stmts[id];
      if (loc) uncovLines.push(loc.start.line);
    }
  }
  if (uncovered > 0) {
    results[dir].push({ file: file.replace(/.*Tracciona[\\/]/, ''), uncovered, lines: [...new Set(uncovLines)].sort((a,b)=>a-b) });
  }
}

for (const dir of targets) {
  const files = (results[dir] || []).sort((a,b) => a.uncovered - b.uncovered);
  if (files.length === 0) { console.log('\n=== ' + dir + ' === COMPLETE'); continue; }
  const total = files.reduce((s,f) => s + f.uncovered, 0);
  console.log('\n=== ' + dir + ' === ' + total + ' uncovered statements ===');
  for (const f of files) {
    console.log('  ' + f.uncovered + ' stmts | ' + f.file + ' | lines: ' + f.lines.join(','));
  }
}
