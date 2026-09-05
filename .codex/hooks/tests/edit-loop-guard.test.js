const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 실제 훅 본문을 실행하되 세션 상태만 메모리 파일시스템에 격리한다.
// 임시 디렉터리를 감시 대상에서 제외하는 프로덕션 조건도 그대로 유지한다.
function session() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'edit-loop-guard.js'), 'utf8');
  const files = new Map();
  const exit = Symbol('exit');
  return (turn, target = 'Assets/Example.cs', options = {}) => {
    const sid = options.sid || 'test';
    const stateFile = `/project/.codex/hook-state/editloop-${sid}.json`;
    const state = JSON.parse(files.get(stateFile) || '{"files":{}}');
    files.set(stateFile, JSON.stringify({ ...state, turn }));
    const input = {
      session_id: sid, cwd: '/project', tool_name: 'apply_patch',
      tool_input: { command: `*** Begin Patch\n*** Update File: ${target}\n@@\n-a\n+b\n*** End Patch` },
      ...options.input
    };
    let stdout = '';
    const fakeFs = {
      readFileSync: file => {
        if (file === 0) return options.raw ?? JSON.stringify(input);
        if (!files.has(file)) throw new Error('ENOENT');
        return files.get(file);
      },
      mkdirSync: () => {},
      writeFileSync: (file, value) => files.set(file, value)
    };
    try {
      vm.runInNewContext(source, {
        require: name => name === 'fs' ? fakeFs : require(name),
        __dirname: '/project/.codex/hooks',
        process: { cwd: () => '/project', stdout: { write: value => { stdout += value; } }, exit: () => { throw exit; } }
      });
    } catch (error) {
      if (error !== exit) throw error;
    }
    return stdout ? JSON.parse(stdout) : null;
  };
}

test('서로 다른 세 턴의 편집은 도구 결과를 차단하지 않는 참고 문맥만 반환한다', () => {
  const run = session();
  assert.equal(run(1), null);
  assert.equal(run(2), null);
  const output = run(3);
  assert.equal(output.decision, undefined);
  assert.equal(output.continue, undefined);
  assert.equal(output.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.equal(typeof output.hookSpecificOutput.additionalContext, 'string');
  assert.ok(output.hookSpecificOutput.additionalContext.length > 0);
  assert.equal(run(4), null);
});

test('같은 턴의 반복 호출을 반복 실패라고 판정하지 않는다', () => {
  const run = session();
  for (let i = 0; i < 4; i++) assert.equal(run(1), null);
});

test('스킬·설정·훅·임시 파일은 편집 알림에서 제외한다', () => {
  for (const target of ['.agents/skills/example/SKILL.md', '.codex/hooks/example.js', '.claude/settings.json', '/tmp/example.cs']) {
    const run = session();
    for (const turn of [1, 2, 3]) assert.equal(run(turn, target), null, target);
  }
});

test('파일과 세션별 편집 횟수가 섞이지 않는다', () => {
  const run = session();
  assert.equal(run(1), null);
  assert.equal(run(2), null);
  assert.equal(run(3, 'Assets/Other.cs'), null);
  assert.equal(run(3, 'Assets/Example.cs', { sid: 'other' }), null);
  assert.ok(run(4));
});

test('잘못된 입력과 비편집 도구는 조용히 종료한다', () => {
  const run = session();
  assert.equal(run(1, undefined, { raw: '{invalid' }), null);
  assert.equal(run(1, undefined, { input: { tool_name: 'Bash', tool_input: { command: 'git status' } } }), null);
});
