#!/usr/bin/env node
// UserPromptSubmit 훅: 같은 폴더의 ambiguity-check.md를 stdout으로 출력한다.
// Codex는 UserPromptSubmit의 비-JSON stdout을 additionalContext로 주입한다.
// (셸 종속적인 cat 대신 node로 읽어 Windows/POSIX 양쪽에서 동작)
// 계약: 내부 오류는 삼키고 항상 exit 0 (fail-open).
const fs = require('fs'), path = require('path');
try {
  process.stdout.write(fs.readFileSync(path.join(__dirname, 'ambiguity-check.md'), 'utf8'));
} catch {}
process.exit(0);
