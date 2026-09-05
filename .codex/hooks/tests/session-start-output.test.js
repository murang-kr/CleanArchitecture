const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function run(script, { missing = [], readError = false, missingTool = false } = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', script), 'utf8');
  let stdout = '';
  const exit = Symbol('exit');
  const write = value => { stdout += value; };
  const fakeFs = {
    existsSync: file => !missing.some(name => file.endsWith(name)),
    accessSync: () => {}, constants: fs.constants,
    readFileSync: file => {
      if (file === 0) return '{}';
      if (readError) throw new Error('EACCES');
      if (file.endsWith('harness-bindings.json')) return '{"oracle":{"test":"node --test"}}';
      return '# 인덱스\n- [기록](DEV.md) "인용" \\ 경로\n';
    }
  };
  try {
    vm.runInNewContext(source, {
      require: name => name === 'fs' ? fakeFs : name === 'child_process'
        ? { spawnSync: command => command === 'git'
          ? { status: 0, stdout: '.githooks\n' }
          : { status: missingTool ? 1 : 0 } }
        : require(name),
      __dirname: '/project/.codex/hooks',
      console: { log: value => write(value + '\n') },
      process: { platform: 'darwin', cwd: () => '/project', stdout: { write }, exit: () => { throw exit; } }
    });
  } catch (error) { if (error !== exit) throw error; }
  return stdout;
}

function context(stdout) {
  const output = JSON.parse(stdout);
  assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.equal(output.continue, undefined);
  return output.hookSpecificOutput.additionalContext;
}

test('인덱스와 특수문자를 SessionStart JSON 문맥으로 손실 없이 전달한다', () => {
  assert.ok(context(run('development-record-load.js')).includes('# 인덱스\n- [기록](DEV.md) "인용" \\ 경로\n'));
});
test('인덱스가 없어도 안내는 유효한 SessionStart JSON이다', () => {
  assert.match(context(run('development-record-load.js', { missing: ['Index.md'] })), /개발 기록 인덱스가 없다/);
});
test('포맷 누락 경고도 인덱스와 함께 전달한다', () => {
  assert.match(context(run('development-record-load.js', { missing: ['Development-Record-Format.md'] })), /공용 포맷이 없다/);
});
test('로더의 파일 읽기 오류는 작업을 차단하지 않는다', () => {
  assert.equal(run('development-record-load.js', { readError: true }), '');
});
test('닥터는 정상일 때 무출력, 경고가 있으면 유효한 SessionStart JSON이다', () => {
  assert.equal(run('harness-doctor.js'), '');
  assert.match(context(run('harness-doctor.js', { missingTool: true })), /PATH에서 찾을 수 없는 검증 도구/);
});
