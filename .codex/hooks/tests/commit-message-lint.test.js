const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  ALLOWED_VERBS,
  MAX_SUBJECT_LENGTH,
  normalizeLines,
  validateCommitMessage
} = require('../commit-message-lint');

function includesError(errors, text) {
  return errors.some(error => error.includes(text));
}

test('명령형 제목만 있는 메시지를 허용한다', () => {
  assert.deepEqual(validateCommitMessage('Add player movement rules\n'), []);
});

test('빈 행으로 구분한 본문을 허용한다', () => {
  const message = [
    'Fix grounded jump handling',
    '',
    '접촉 캐시 이후의 상태 전이를 기다린다.',
    'PlayMode 테스트의 프레임 의존성을 제거하기 위해 변경한다.'
  ].join('\n');

  assert.deepEqual(validateCommitMessage(message), []);
});

test('제목은 정확히 50자까지 허용한다', () => {
  const subject = `Add ${'a'.repeat(MAX_SUBJECT_LENGTH - 4)}`;

  assert.equal(Array.from(subject).length, MAX_SUBJECT_LENGTH);
  assert.deepEqual(validateCommitMessage(subject), []);
});

test('비어 있는 제목을 거부한다', () => {
  const errors = validateCommitMessage('\n# Git comment\n');

  assert.equal(includesError(errors, '제목이 비어 있다'), true);
});

test('50자를 초과한 제목을 거부한다', () => {
  const subject = `Add ${'a'.repeat(MAX_SUBJECT_LENGTH - 3)}`;
  const errors = validateCommitMessage(subject);

  assert.equal(includesError(errors, '50자 이하여야 한다'), true);
});

test('허용 목록에 없는 과거형 동사를 거부한다', () => {
  const errors = validateCommitMessage('Added player movement rules');

  assert.equal(includesError(errors, '영어 동사원형'), true);
});

test('소문자로 시작한 동사를 거부한다', () => {
  const errors = validateCommitMessage('fix player movement rules');

  assert.equal(includesError(errors, '영어 동사원형'), true);
});

test('제목 끝의 마침표를 거부한다', () => {
  const errors = validateCommitMessage('Add player movement rules.');

  assert.equal(includesError(errors, '마침표'), true);
});

test('제목 바로 다음 줄에서 시작한 본문을 거부한다', () => {
  const errors = validateCommitMessage([
    'Add player movement rules',
    '이동 규칙을 추가한다.'
  ].join('\n'));

  assert.equal(includesError(errors, '빈 행'), true);
});

test('Git 주석은 메시지 내용에서 제외한다', () => {
  const lines = normalizeLines([
    'Document commit message policy',
    '',
    '# Please enter the commit message',
    '# Changes to be committed:'
  ].join('\n'));

  assert.deepEqual(lines, ['Document commit message policy']);
});

test('Merge와 Revert 자동 생성 제목을 허용한다', () => {
  assert.deepEqual(validateCommitMessage('Merge branch feature/player'), []);
  assert.deepEqual(validateCommitMessage('Revert "Add player movement rules"'), []);
});

test('정본 문서와 검사기의 허용 동사 목록이 일치한다', () => {
  const projectRoot = path.resolve(__dirname, '..', '..', '..');
  const policy = fs.readFileSync(
    path.join(projectRoot, 'Docs', 'Commit-Message-Policy.md'),
    'utf8'
  );
  const verbSection = policy.match(/## 허용하는 시작 동사[\s\S]*?```text\n([\s\S]*?)\n```/u);

  assert.notEqual(verbSection, null);
  const documentedVerbs = verbSection[1].split('\n').filter(Boolean);
  assert.deepEqual(documentedVerbs, [...ALLOWED_VERBS]);
});

test('commit-msg 진입점은 정상 메시지를 허용하고 오류 메시지를 거부한다', () => {
  const projectRoot = path.resolve(__dirname, '..', '..', '..');
  const hookPath = path.join(projectRoot, '.githooks', 'commit-msg');
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'commit-message-lint-'));
  const validMessagePath = path.join(temporaryDirectory, 'valid-message');
  const invalidMessagePath = path.join(temporaryDirectory, 'invalid-message');

  try {
    fs.writeFileSync(validMessagePath, 'Add commit message validation\n', 'utf8');
    fs.writeFileSync(invalidMessagePath, 'Added commit message validation.\n', 'utf8');

    const validResult = spawnSync(hookPath, [validMessagePath], {
      cwd: projectRoot,
      encoding: 'utf8'
    });
    const invalidResult = spawnSync(hookPath, [invalidMessagePath], {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    assert.equal(validResult.status, 0, validResult.stderr);
    assert.equal(invalidResult.status, 1);
    assert.match(invalidResult.stderr, /영어 동사원형/u);
    assert.match(invalidResult.stderr, /마침표/u);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
