import { readFileSync } from 'fs';
const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf8'));
const keys = Object.keys(cov);

console.log('Total files in coverage:', keys.length);
console.log('Sample paths:');
keys.slice(0,5).forEach(k => console.log(' ', k));

// Count per dir
const dirs = {};
for (const k of keys) {
  const norm = k.replace(/\\/g, '/');
  const parts = norm.split('/');
  const idx = parts.findIndex(p => p === 'app' || p === 'server');
  if (idx >= 0) {
    const dir = parts.slice(idx, idx+2).join('/');
    dirs[dir] = (dirs[dir] || 0) + 1;
  }
}
console.log('\nFiles per directory:');
Object.entries(dirs).sort((a,b) => b[1]-a[1]).forEach(([d,c]) => console.log(' ', c, d));

// Check uncovered in our target dirs
const targets = ['server/services','server/middleware','server/utils','app/plugins','app/utils','app/layouts'];
for (const target of targets) {
  let totalUncov = 0;
  let totalStmts = 0;
  let filesWithGaps = 0;
  for (const [file, data] of Object.entries(cov)) {
    const norm = file.replace(/\\/g, '/');
    if (!norm.includes('/' + target + '/')) continue;
    const s = data.s;
    for (const [id, count] of Object.entries(s)) {
      totalStmts++;
      if (count === 0) totalUncov++;
    }
    const uncov = Object.values(s).filter(c => c === 0).length;
    if (uncov > 0) {
      filesWithGaps++;
      const stmts = data.statementMap;
      const lines = [];
      for (const [id, count] of Object.entries(s)) {
        if (count === 0) lines.push(stmts[id]?.start?.line);
      }
      console.log(`\n${target} GAP: ${norm.split('/').pop()} | ${uncov} uncov | lines: ${[...new Set(lines)].sort((a,b)=>a-b).join(',')}`);
    }
  }
  if (filesWithGaps === 0) {
    console.log(`\n${target}: COMPLETE (${totalStmts} stmts, 0 uncov)`);
  } else {
    console.log(`${target} TOTAL: ${totalUncov}/${totalStmts} uncovered in ${filesWithGaps} files`);
  }
}
