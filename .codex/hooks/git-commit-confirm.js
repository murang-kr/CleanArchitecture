#!/usr/bin/env node
// PreToolUse 훅 (matcher: Bash)
// 실제 git 실행의 보호 서브커맨드(commit·push·reset·revert)만 판별해
// 건별 사용자 컨펌을 강제한다. 검색 문자열·파일명·읽기 명령의 동명 단어는 무시한다.
// Codex는 permissionDecision 'ask'를 아직 지원하지 않으므로(파싱만 됨, 2026-07 확인)
// deny + 재시도 마커 방식을 쓴다:
//   1차 시도 → deny + "사용자 승인 후 GIT_CONFIRMED 마커를 붙여 재시도" 지시
//   보호 대상 git 명령 세그먼트에 GIT_CONFIRMED=1이 직접 붙어 있으면 통과.
// 마커를 사용자 승인 없이 붙이는 것은 금지 — AGENTS.md에 규칙으로 명시돼 있다.
// Codex가 'ask'를 지원하게 되면 claude/hooks/git-commit-confirm.js 방식으로 되돌릴 것.
// 계약: 내부 오류·비해당 명령은 무출력 exit 0 (fail-open).
const fs = require('fs');

const PROTECTED_SUBCOMMANDS = new Set(['commit', 'push', 'reset', 'revert']);
const POSIX_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=(.*)$/;
const POSIX_CONFIRMATION = /^GIT_CONFIRMED=1$/;
const POWERSHELL_CONFIRMATION = /^\$env:GIT_CONFIRMED=1$/i;

// 완전한 셸 AST가 아니라 명령 위치 판별에 필요한 최소 렉서다.
// 따옴표·이스케이프·주석을 보존하고 제어 연산자마다 실행 세그먼트를 나눈다.
function splitShellCommands(command) {
  const segments = [];
  let tokens = [];
  let token = '';
  let tokenStarted = false;
  let quote = null;
  let escaped = false;
  let comment = false;

  const flushToken = () => {
    if (!tokenStarted) return;
    tokens.push(token);
    token = '';
    tokenStarted = false;
  };
  const flushSegment = () => {
    flushToken();
    if (tokens.length) segments.push(tokens);
    tokens = [];
  };

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];

    if (comment) {
      if (ch === '\n') {
        comment = false;
        flushSegment();
      }
      continue;
    }

    if (escaped) {
      if (ch === '\n' || ch === '\r') {
        escaped = false;
        continue;
      }
      token += ch;
      tokenStarted = true;
      escaped = false;
      continue;
    }

    if (quote) {
      if (ch === quote) {
        quote = null;
      } else if ((ch === '\\' && quote === '"') || ch === '`') {
        escaped = true;
      } else {
        token += ch;
        tokenStarted = true;
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      tokenStarted = true;
      continue;
    }
    if (ch === '\\' || ch === '`') {
      escaped = true;
      continue;
    }
    if (ch === '#' && !tokenStarted) {
      comment = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (ch === '\n' || ch === '\r') flushSegment();
      else flushToken();
      continue;
    }
    if (ch === ';' || ch === '|' || ch === '&' || ch === '(' || ch === ')') {
      flushSegment();
      if ((ch === '|' || ch === '&') && command[i + 1] === ch) i++;
      continue;
    }

    token += ch;
    tokenStarted = true;
  }

  flushSegment();
  return segments;
}

function executableBasename(value) {
  return String(value).replace(/\\/g, '/').split('/').pop().toLowerCase();
}

function skipOptions(tokens, index, optionsWithValues) {
  let i = index;
  while (i < tokens.length && tokens[i].startsWith('-')) {
    if (tokens[i] === '--') return i + 1;
    const current = tokens[i];
    const option = current.split('=', 1)[0];
    i += optionsWithValues.has(option) && !current.includes('=') ? 2 : 1;
  }
  return i;
}

function locateExecutable(tokens) {
  let i = 0;
  let confirmed = false;

  while (i < tokens.length && POSIX_ASSIGNMENT.test(tokens[i])) {
    if (POSIX_CONFIRMATION.test(tokens[i])) confirmed = true;
    i++;
  }

  while (i < tokens.length) {
    const executable = executableBasename(tokens[i]);

    if (executable === 'env' || executable === 'env.exe') {
      i++;
      const envOptionsWithValues = new Set([
        '-u', '--unset', '-C', '--chdir', '-S', '--split-string'
      ]);
      i = skipOptions(tokens, i, envOptionsWithValues);
      while (i < tokens.length && POSIX_ASSIGNMENT.test(tokens[i])) {
        if (POSIX_CONFIRMATION.test(tokens[i])) confirmed = true;
        i++;
      }
      continue;
    }

    if ([
      'command', 'builtin', 'exec', 'nohup',
      'if', 'then', 'elif', 'while', 'until', 'do', '!', 'time', '{'
    ].includes(executable)) {
      i++;
      i = skipOptions(tokens, i, new Set());
      continue;
    }

    if (executable === 'sudo' || executable === 'sudo.exe') {
      i++;
      i = skipOptions(tokens, i, new Set([
        '-u', '--user', '-g', '--group', '-h', '--host', '-p', '--prompt',
        '-C', '--chdir', '-r', '--role', '-t', '--type'
      ]));
      continue;
    }

    break;
  }

  return { index: i, confirmed };
}

function findGitSubcommand(tokens, gitIndex) {
  const optionsWithValues = new Set([
    '-C', '-c', '--git-dir', '--work-tree', '--namespace', '--super-prefix',
    '--config-env'
  ]);
  const i = skipOptions(tokens, gitIndex + 1, optionsWithValues);
  return i < tokens.length ? tokens[i].toLowerCase() : null;
}

function analyzeSegment(tokens) {
  const { index, confirmed } = locateExecutable(tokens);
  if (index >= tokens.length) return { protected: false, confirmed: false };

  const executable = executableBasename(tokens[index]);
  if (executable !== 'git' && executable !== 'git.exe') {
    return { protected: false, confirmed: false };
  }

  const subcommand = findGitSubcommand(tokens, index);
  return {
    protected: PROTECTED_SUBCOMMANDS.has(subcommand),
    confirmed
  };
}

function isPowerShellConfirmation(tokens) {
  return tokens.length === 1 && POWERSHELL_CONFIRMATION.test(tokens[0]);
}

function findNestedShellCommand(tokens) {
  const { index } = locateExecutable(tokens);
  if (index >= tokens.length) return null;

  const executable = executableBasename(tokens[index]);
  const shells = new Set([
    'sh', 'bash', 'zsh', 'dash', 'ksh',
    'pwsh', 'pwsh.exe', 'powershell', 'powershell.exe',
    'cmd', 'cmd.exe'
  ]);
  if (!shells.has(executable)) return null;

  for (let i = index + 1; i < tokens.length - 1; i++) {
    const option = tokens[i].toLowerCase();
    const isPosixCommand = /^-[a-z]*c[a-z]*$/.test(option);
    const isPowerShellCommand = option === '-command' || option === '--command';
    const isCmdCommand = option === '/c';
    if (isPosixCommand || isPowerShellCommand || isCmdCommand) return tokens[i + 1];
  }

  return null;
}

function hasUnconfirmedMutation(command, depth = 0) {
  if (depth > 3) return false;
  let pendingPowerShellConfirmation = false;

  for (const tokens of splitShellCommands(command)) {
    if (isPowerShellConfirmation(tokens)) {
      pendingPowerShellConfirmation = true;
      continue;
    }

    const result = analyzeSegment(tokens);
    if (result.protected) {
      const confirmed = result.confirmed || pendingPowerShellConfirmation;
      pendingPowerShellConfirmation = false;
      if (!confirmed) return true;
      continue;
    }

    const nestedCommand = findNestedShellCommand(tokens);
    if (nestedCommand && hasUnconfirmedMutation(nestedCommand, depth + 1)) return true;

    // PowerShell 마커는 바로 다음 실제 명령 한 건에만 적용한다.
    pendingPowerShellConfirmation = false;
  }

  return false;
}

try {
  let raw = fs.readFileSync(0, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // BOM 방어 (수동 테스트 파이프 대비)
  const input = JSON.parse(raw.trim() || '{}');
  const cmd = String((input.tool_input || {}).command || '');
  if (hasUnconfirmedMutation(cmd)) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'git 상태 변경(commit/push/reset/revert)은 건별 사용자 컨펌 규칙. 사용자에게 이 명령의 실행 여부를 물어 명시적 승인을 받고, 승인받은 해당 git 명령에만 GIT_CONFIRMED=1 마커를 직접 붙여 재시도하라 (POSIX: `GIT_CONFIRMED=1 git ...`, PowerShell: `$env:GIT_CONFIRMED="1"; git ...`). 복합 명령은 보호 대상 git 명령마다 별도 마커가 필요하며, 직전 승인은 이월되지 않는다. 승인 없이 마커를 붙이는 것은 규칙 위반이다.'
      }
    }));
  }
} catch {}
process.exit(0);
