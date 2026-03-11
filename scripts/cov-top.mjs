import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));
const files = [];
for (const [file, info] of Object.entries(data)) {
  if (file === 'total') continue;
  const s = info.statements;
  const uncov = s.total - s.covered;
  if (uncov > 5) {
    const short = file.replace(/.*Tracciona[/\\]/, '');
    files.push({ file: short, pct: s.pct, uncov, total: s.total });
  }
}
files.sort((a, b) => b.uncov - a.uncov);
files.slice(0, 50).forEach(f => console.log(`${f.uncov} uncov | ${f.pct}% | ${f.file}`));
console.log(`\nTotal files with >5 uncov stmts: ${files.length}`);
