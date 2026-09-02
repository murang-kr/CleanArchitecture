#!/usr/bin/env node
// UserPromptSubmit 훅: 세션별 턴 카운터 증가.
// 계약: stdout에 아무것도 쓰지 않는다(UserPromptSubmit stdout은 컨텍스트에 주입됨).
//       내부 오류는 삼키고 항상 exit 0 (fail-open).
const fs = require('fs'), path = require('path');
try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const sid = String(input.session_id || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
  const projectRoot = path.resolve(__dirname, '..', '..');
  const dir = path.join(projectRoot, '.codex', 'hook-state');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `editloop-${sid}.json`);
  let state = { turn: 0, files: {} };
  try { state = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  state.turn = (state.turn || 0) + 1;
  fs.writeFileSync(file, JSON.stringify(state));
  // 7일 지난 세션 상태 파일 정리
  const now = Date.now();
  for (const f of fs.readdirSync(dir)) {
    if (!f.startsWith('editloop-')) continue;
    const p = path.join(dir, f);
    try { if (now - fs.statSync(p).mtimeMs > 7 * 24 * 3600 * 1000) fs.unlinkSync(p); } catch {}
  }
} catch {}
process.exit(0);
