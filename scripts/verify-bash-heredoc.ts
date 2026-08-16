import assert from 'node:assert/strict'
import { bashHeredocWriteDiff } from '../src/channel.js'

// Basic heredoc write: cat > path <<'EOF'
const basic = bashHeredocWriteDiff(
  `cat > /tmp/a.mjs <<'EOF'\nimport x from 'y'\nconsole.log(x)\nEOF`,
)
assert.ok(basic !== undefined, 'heredoc write should be recognized')
assert.equal(basic.card, 'diff')
assert.equal(basic.diffs[0]!.path, '/tmp/a.mjs')
assert.equal(basic.diffs[0]!.oldText, null)
assert.equal(basic.diffs[0]!.newText, "import x from 'y'\nconsole.log(x)")

// Append (cat >>), indented EOF marker, unquoted marker, tee
assert.ok(bashHeredocWriteDiff(`cat >> x.txt <<EOF\nmore\n  EOF`) !== undefined, 'append with indented EOF')
assert.ok(bashHeredocWriteDiff(`tee -a log.txt <<'EOF'\nline\nEOF`) !== undefined, 'tee -a')
assert.ok(bashHeredocWriteDiff(`tee notes.md <<EOF\nhi\nEOF`) !== undefined, 'tee')

// The WSL habit: heredoc followed by more shell (export && node)
const withTail = bashHeredocWriteDiff(
  `cat > /tmp/pw-prod-login.mjs <<'EOF'\n      import { chromium } from '/tmp/pw/node_modules/playwright/index.mjs'\n      const browser = await chromium.launch({ headless: true });\n      EOF\n      export PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers && node /tmp/pw-prod-login.mjs 2>&1 | tail -20`,
)
assert.ok(withTail !== undefined, 'heredoc with trailing shell should still diff')
assert.ok(withTail.diffs[0]!.newText.includes('chromium'), 'heredoc body extracted')
assert.ok(!withTail.diffs[0]!.newText.includes('export'), 'trailing shell excluded from body')

// Non-write commands keep the terminal card (undefined)
assert.equal(bashHeredocWriteDiff('ls -la'), undefined)
assert.equal(bashHeredocWriteDiff('cat file.txt'), undefined)
assert.equal(bashHeredocWriteDiff('node /tmp/x.mjs 2>&1 | tail -20'), undefined)
assert.equal(bashHeredocWriteDiff('cat > f.txt <<EOF\nno closing marker'), undefined)
assert.equal(bashHeredocWriteDiff('single line'), undefined)

console.log('bash heredoc diff parsing verification passed')
