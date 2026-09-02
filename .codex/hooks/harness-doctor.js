#!/usr/bin/env node
// SessionStart 훅: 프로젝트 하네스 바인딩 존재·도구 가용성 검사.
// Codex는 SessionStart의 stdout을 developer 컨텍스트로 주입한다.
// 계약: 문제 없으면 무출력(컨텍스트 오염 금지). 문제 있을 때만 stdout 1~2줄.
//       내부 오류는 삼키고 항상 exit 0 (fail-open).
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
try {
  let cwd = process.cwd();
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
    if (input.cwd) cwd = input.cwd;
  } catch {}
  const projectRoot = path.resolve(__dirname, '..', '..');
  // .codex 우선, 기존 Claude Code 프로젝트와의 호환을 위해 .claude 폴백
  const candidates = [
    path.join(projectRoot, '.codex', 'harness-bindings.json'),
    path.join(projectRoot, '.claude', 'harness-bindings.json')
  ];
  const bindingsPath = candidates.find(p => fs.existsSync(p));
  if (!bindingsPath) {
    console.log('[harness-doctor] 이 프로젝트에 하네스 바인딩(.codex/harness-bindings.json)이 없다. 완료 증거 계약이 쓸 기계 오라클(컴파일·테스트 명령)이 미정의 상태다 — 구현 작업을 시작하기 전에 사용자에게 이 프로젝트의 컴파일·테스트 명령을 확인해 바인딩 파일을 생성하라.');
    process.exit(0);
  }
  const bindings = JSON.parse(fs.readFileSync(bindingsPath, 'utf8'));
  const missing = [];
  for (const [name, cmd] of Object.entries(bindings.oracle || {})) {
    const exe = String(cmd).trim().split(/\s+/)[0];
    if (!exe) continue;
    const probe = process.platform === 'win32'
      ? spawnSync('where', [exe], { stdio: 'ignore' })
      : spawnSync('which', [exe], { stdio: 'ignore' });
    if (probe.status !== 0) missing.push(`${name}: ${cmd}`);
  }
  if (missing.length) {
    console.log(`[harness-doctor] 하네스 바인딩에 정의된 도구를 PATH에서 찾을 수 없다: ${missing.join(' / ')}. 해당 오라클이 필요한 작업 전에 사용자에게 알려라.`);
  }
} catch {}
process.exit(0);
