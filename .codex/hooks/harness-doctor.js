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
  const warnings = [];
  const bindingsPath = candidates.find(p => fs.existsSync(p));
  if (!bindingsPath) {
    warnings.push('하네스 바인딩(.codex/harness-bindings.json)이 없어 컴파일·테스트 명령이 미정의 상태다');
  } else {
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
      warnings.push(`PATH에서 찾을 수 없는 검증 도구: ${missing.join(' / ')}`);
    }
  }

  const expectedHooksPath = path.join(projectRoot, '.githooks');
  const hooksPathProbe = spawnSync(
    'git',
    ['config', '--local', '--get', 'core.hooksPath'],
    { cwd: projectRoot, encoding: 'utf8' }
  );
  const configuredHooksPath = hooksPathProbe.status === 0
    ? hooksPathProbe.stdout.trim()
    : '';
  const resolvedHooksPath = configuredHooksPath
    ? path.resolve(projectRoot, configuredHooksPath)
    : '';
  if (resolvedHooksPath !== expectedHooksPath) {
    warnings.push('Git 훅 검사를 위해 `git config --local core.hooksPath .githooks` 설정이 필요하다');
  }

  const requiredHookFiles = [
    ['커밋 메시지 훅', path.join(expectedHooksPath, 'commit-msg'), true],
    ['구조 변경 훅', path.join(expectedHooksPath, 'pre-commit'), true],
    [
      '커밋 메시지 검사기',
      path.join(projectRoot, '.codex', 'hooks', 'commit-message-lint.js'),
      false
    ],
    [
      '구조 변경 분류기',
      path.join(projectRoot, '.codex', 'hooks', 'architecture-change-guard.js'),
      false
    ],
    [
      '아키텍처 정합성 검사기',
      path.join(projectRoot, '.codex', 'hooks', 'architecture-doc-check.js'),
      false
    ]
  ];
  for (const [label, file, executable] of requiredHookFiles) {
    if (!fs.existsSync(file)) {
      warnings.push(`${label} 파일이 없다`);
      continue;
    }
    if (executable && process.platform !== 'win32') {
      try {
        fs.accessSync(file, fs.constants.X_OK);
      } catch {
        warnings.push(`${path.relative(projectRoot, file)}에 실행 권한이 없다`);
      }
    }
  }

  if (warnings.length) {
    console.log(`[harness-doctor] ${warnings.join(' / ')}. 필요한 작업 전에 사용자에게 알려라.`);
  }
} catch {}
process.exit(0);
