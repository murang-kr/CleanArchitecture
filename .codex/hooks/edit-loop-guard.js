#!/usr/bin/env node
// PostToolUse 훅 (matcher: apply_patch|Bash)
// apply_patch의 패치 텍스트에서 수정 파일 경로를 파싱해, 같은 파일을 서로 다른
// THRESHOLD개 턴에서 수정하면 decision "block"으로 invariant-audit 스킬 절차를 지시한다.
// 발동 후 해당 파일 카운터는 리셋.
// Claude Code 원본과의 차이: 도구가 Edit/Write가 아니라 apply_patch이므로
// tool_input.command의 "*** Update|Add File: <경로>" 헤더에서 경로를 뽑는다.
// 계약: 내부 오류는 삼키고 exit 0 (fail-open). 발동 시에만 block JSON 출력.
const fs = require('fs'), path = require('path');
const THRESHOLD = 3;
// 하네스 메타 파일(설정·스킬·훅·임시 폴더)은 감시 대상이 아님
const EXCLUDES = ['/.codex/', '/.claude/', '/appdata/local/temp/', '/tmp/'];
try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const sid = String(input.session_id || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
  const cmd = String((input.tool_input || {}).command || '');
  const toolName = String(input.tool_name || '');
  // apply_patch 도구 호출이거나, 셸 명령이 apply_patch를 포함할 때만 대상
  if (toolName !== 'apply_patch' && !/apply_patch/.test(cmd)) process.exit(0);

  const rawPaths = [];
  const re = /^\*{3}\s+(?:Update|Add)\s+File:\s+(.+)$/gm;
  let m;
  while ((m = re.exec(cmd))) rawPaths.push(m[1].trim());
  if (!rawPaths.length) process.exit(0);

  const cwd = String(input.cwd || process.cwd());
  const projectRoot = path.resolve(__dirname, '..', '..');
  const file = path.join(projectRoot, '.codex', 'hook-state', `editloop-${sid}.json`);
  let state = { turn: 1, files: {} };
  try { state = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  if (!state.turn) state.turn = 1;
  if (!state.files) state.files = {};

  let firedPath = null;
  for (const rawPath of rawPaths) {
    // 패치 경로는 보통 cwd 상대 — 절대경로로 정규화해 세션 내 키를 안정화
    const abs = path.isAbsolute(rawPath) ? rawPath : path.join(cwd, rawPath);
    const target = abs.replace(/\\/g, '/').toLowerCase();
    if (EXCLUDES.some(e => target.includes(e))) continue;

    const turns = new Set(state.files[target] || []);
    turns.add(state.turn);
    const fired = turns.size >= THRESHOLD;
    state.files[target] = fired ? [] : [...turns];
    if (fired && !firedPath) firedPath = rawPath;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state));

  if (firedPath) {
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason:
        `[edit-loop guard] 이 파일을 서로 다른 ${THRESHOLD}개 턴에서 수정했다: ${firedPath}\n` +
        `발산(같은 문제를 반복 패치) 가능성이 있다. 다음 수정을 시도하기 전에 .agents/skills/invariant-audit/SKILL.md를 읽고 그 절차(면제 판정 포함)를 따르고, 끝나면 원래 작업으로 복귀하라.`
    }));
  }
} catch {}
process.exit(0);
