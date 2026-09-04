const test = require('node:test');
const assert = require('node:assert/strict');

const subject = require('./unity-vcs-evidence.js');

test('beta.8 이상 버전을 허용하고 이전 prerelease를 거부한다', () => {
  assert.equal(subject.compareVersions('1.0.0-beta.7', subject.MINIMUM_VERSION), -1);
  assert.equal(subject.compareVersions('1.0.0-beta.8', subject.MINIMUM_VERSION), 0);
  assert.equal(subject.compareVersions('1.0.0-rc.1', subject.MINIMUM_VERSION), 1);
  assert.equal(subject.compareVersions('1.0.0', subject.MINIMUM_VERSION), 1);
});

test('읽기 전용 Scene·Prefab 호출만 허용한다', () => {
  assert.doesNotThrow(() => subject.validateInvocation(['diff', 'Assets/A.unity', '--from', 'HEAD']));
  assert.doesNotThrow(() => subject.validateInvocation(['explain', 'Assets/A.prefab']));
  assert.doesNotThrow(() => subject.validateInvocation(['conflicts']));
  assert.throws(() => subject.validateInvocation(['resolve', 'Assets/A.unity']), /읽기 전용/);
  assert.throws(() => subject.validateInvocation(['diff', 'Assets/A.asset']), /\.unity 또는 \.prefab/);
  assert.throws(() => subject.validateInvocation(['diff', 'Assets/A.unity', '--format', 'text']), /JSON/);
});

test('공통 비대화형 JSON 플래그를 강제한다', () => {
  assert.deepEqual(subject.buildUnityArgs(['diff', 'Assets/A.unity']), [
    'vcs', 'diff', 'Assets/A.unity',
    '--format', 'json', '--no-banner', '--no-pager', '--non-interactive',
  ]);
});

test('raw fields와 표시 label을 분리하고 Unity 원본을 보존한다', () => {
  const unity = {
    success: true,
    data: {
      changes: [{
        change: 'modified',
        side: 'both',
        object: 'Transform',
        owner: 'Player',
        changedFields: ['m_LocalPosition'],
        fieldLabels: ['Position'],
        summary: 'Player Transform position changed',
        futureField: 42,
      }],
    },
  };
  const result = subject.normalizeEnvelope('1.0.0-beta.8', 'diff', unity);
  assert.deepEqual(result.normalizedChanges[0].fields, ['m_LocalPosition']);
  assert.deepEqual(result.normalizedChanges[0].fieldLabels, ['Position']);
  assert.equal(result.unity.data.changes[0].futureField, 42);
  assert.deepEqual(result.unity.data.changes[0].changedFields, ['m_LocalPosition']);
  assert.equal(result.evidenceLayer, 'E1');
});

test('실행 계층은 버전 확인 뒤 인자 배열로 unity vcs를 호출한다', () => {
  const calls = [];
  const runner = (binary, args) => {
    calls.push({ binary, args });
    if (args[0] === '--version') return { status: 0, stdout: '1.0.0-beta.8\n', stderr: '' };
    return { status: 0, stdout: JSON.stringify({ success: true, data: { changes: [] } }), stderr: '' };
  };
  const result = subject.run(['diff', 'Assets/A.prefab'], { binary: '/opt/unity', runner });
  assert.equal(result.output.success, true);
  assert.deepEqual(calls[1], {
    binary: '/opt/unity',
    args: ['vcs', 'diff', 'Assets/A.prefab', '--format', 'json', '--no-banner', '--no-pager', '--non-interactive'],
  });
});

test('구버전 CLI에서는 vcs를 호출하지 않는다', () => {
  let calls = 0;
  const runner = () => {
    calls += 1;
    return { status: 0, stdout: '1.0.0-beta.5\n', stderr: '' };
  };
  assert.throws(() => subject.run(['conflicts'], { runner }), /beta\.8 이상/);
  assert.equal(calls, 1);
});

test('Unity JSON이 실패를 보고하면 프로세스 성공 코드로 숨기지 않는다', () => {
  const runner = (_binary, args) => {
    if (args[0] === '--version') return { status: 0, stdout: '1.0.0-beta.8\n', stderr: '' };
    return { status: 0, stdout: JSON.stringify({ success: false, errors: ['bad ref'] }), stderr: '' };
  };
  const result = subject.run(['diff', 'Assets/A.unity'], { runner });
  assert.equal(result.output.success, false);
  assert.equal(result.status, 1);
});
