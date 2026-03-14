/**
 * Fix lcov.info paths: convert Windows backslashes to forward slashes.
 * SonarQube (in Docker) expects forward slashes.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const file = 'coverage/lcov.info'
let text = readFileSync(file, 'utf8')
const before = (text.match(/\\/g) || []).length
text = text.replaceAll('\\', '/')
writeFileSync(file, text)
console.log(`Fixed ${before} backslashes in ${file}`)
