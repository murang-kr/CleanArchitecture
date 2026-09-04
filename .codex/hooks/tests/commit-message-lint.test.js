const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  MAX_SUBJECT_LENGTH,
  normalizeLines,
  validateCommitMessage
} = require('../commit-message-lint');

function includesError(errors, text) {
  return errors.some(error => error.includes(text));
}

test('한국어 개조식 제목과 본문을 허용한다', () => {
  const message = [
    'Unity VCS 증거 하네스를 추가',
    '',
    'Scene과 Prefab의 저장 변경을 의미 단위로 수집',
    '읽기 전용 명령만 허용해 파일 변경을 방지',
    '',
    '조사와 완료 검증이 같은 공용 수집기를 사용하도록 연결'
  ].join('\n');

  assert.deepEqual(validateCommitMessage(message), []);
});

test('제목은 정확히 50자까지 허용한다', () => {
  const subject = `규칙 ${'가'.repeat(MAX_SUBJECT_LENGTH - 3)}`;
  const message = `${subject}\n\n본문 검증을 추가`;

  assert.equal(Array.from(subject).length, MAX_SUBJECT_LENGTH);
  assert.deepEqual(validateCommitMessage(message), []);
});

test('비어 있는 제목을 거부한다', () => {
  const errors = validateCommitMessage('\n# Git comment\n');

  assert.equal(includesError(errors, '제목이 비어 있다'), true);
});

test('50자를 초과한 제목을 거부한다', () => {
  const subject = `규칙 ${'가'.repeat(MAX_SUBJECT_LENGTH - 2)}`;
  const errors = validateCommitMessage(`${subject}\n\n본문 검증을 추가`);

  assert.equal(includesError(errors, '50자 이하여야 한다'), true);
});

test('영어로만 작성한 제목을 거부한다', () => {
  const errors = validateCommitMessage('Add player movement rules\n\n본문 검증을 추가');

  assert.equal(includesError(errors, '한글'), true);
});

test('영어로만 작성한 본문 줄을 거부한다', () => {
  const errors = validateCommitMessage('플레이어 이동 규칙을 추가\n\nValidate player movement');

  assert.equal(includesError(errors, '본문 1번째 줄'), true);
  assert.equal(includesError(errors, '한글'), true);
});

test('한글이 있어도 영문 명령 동사로 시작하면 거부한다', () => {
  const errors = validateCommitMessage([
    'Add Unity VCS 증거 하네스를 추가',
    '',
    'Prevent 파일 변경을 방지'
  ].join('\n'));

  assert.equal(includesError(errors, '제목은 영문 명령 동사'), true);
  assert.equal(includesError(errors, '본문 1번째 줄은 영문 명령 동사'), true);
});

test('본문이 없는 메시지를 거부한다', () => {
  const errors = validateCommitMessage('플레이어 이동 규칙을 추가');

  assert.equal(includesError(errors, '본문은 필수'), true);
});

test('제목과 본문 사이에 빈 줄이 없으면 거부한다', () => {
  const errors = validateCommitMessage([
    '플레이어 이동 규칙을 추가',
    '이동 판정 로직을 도메인으로 분리'
  ].join('\n'));

  assert.equal(includesError(errors, '빈 행'), true);
});

test('제목과 본문 사이에 빈 줄이 두 개면 거부한다', () => {
  const errors = validateCommitMessage('플레이어 이동 규칙을 추가\n\n\n이동 판정 로직을 분리');

  assert.equal(includesError(errors, '정확히 빈 행 하나'), true);
});

test('제목과 본문 줄의 종결 어미를 거부한다', () => {
  const errors = validateCommitMessage('플레이어 이동 규칙을 추가한다\n\n이동 판정 로직을 분리했다');

  assert.equal(includesError(errors, '개조식'), true);
});

test('제목과 본문 줄 끝의 종결 부호를 거부한다', () => {
  const errors = validateCommitMessage('플레이어 이동 규칙을 추가.\n\n이동 판정 로직을 분리!');

  assert.equal(includesError(errors, '종결 부호'), true);
});

test('같은 문단의 항목은 빈 줄 없이 이어 쓸 수 있다', () => {
  const message = [
    '플레이어 이동 규칙을 추가',
    '',
    '입력값을 이동 의도로 변환',
    '이동 의도를 속도로 계산'
  ].join('\n');

  assert.deepEqual(validateCommitMessage(message), []);
});

test('다른 문단은 빈 줄 하나로 구분할 수 있다', () => {
  const message = [
    '플레이어 이동 규칙을 추가',
    '',
    '입력값을 이동 의도로 변환',
    '',
    '도메인 규칙을 Unity 의존성에서 분리'
  ].join('\n');

  assert.deepEqual(validateCommitMessage(message), []);
});

test('본문 문단 사이의 연속 빈 줄을 거부한다', () => {
  const errors = validateCommitMessage([
    '플레이어 이동 규칙을 추가',
    '',
    '입력값을 이동 의도로 변환',
    '',
    '',
    '도메인 규칙을 Unity 의존성에서 분리'
  ].join('\n'));

  assert.equal(includesError(errors, '문단 사이는 빈 행 하나'), true);
});

test('Git 주석은 메시지 내용에서 제외한다', () => {
  const lines = normalizeLines([
    '커밋 메시지 정책을 문서화',
    '',
    '한국어 개조식 규칙을 정본에 기록',
    '# Please enter the commit message',
    '# Changes to be committed:'
  ].join('\n'));

  assert.deepEqual(lines, [
    '커밋 메시지 정책을 문서화',
    '',
    '한국어 개조식 규칙을 정본에 기록'
  ]);
});

test('정본 문서가 한국어 개조식 자동 검사 계약을 명시한다', () => {
  const projectRoot = path.resolve(__dirname, '..', '..', '..');
  const policy = fs.readFileSync(
    path.join(projectRoot, 'Docs', 'Commit-Message-Policy.md'),
    'utf8'
  );

  assert.match(policy, /모든 내용 줄에는 한글을 하나 이상 포함/u);
  assert.match(policy, /본문은 필수/u);
  assert.match(policy, /종결 어미/u);
  assert.match(policy, /연속된 빈 행을 두지 않는다/u);
  assert.doesNotMatch(policy, /허용하는 시작 동사/u);
});

test('commit-msg 진입점은 정상 메시지를 허용하고 오류 메시지를 거부한다', () => {
  const projectRoot = path.resolve(__dirname, '..', '..', '..');
  const hookPath = path.join(projectRoot, '.githooks', 'commit-msg');
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'commit-message-lint-'));
  const validMessagePath = path.join(temporaryDirectory, 'valid-message');
  const invalidMessagePath = path.join(temporaryDirectory, 'invalid-message');

  try {
    fs.writeFileSync(validMessagePath, '커밋 메시지 검증을 추가\n\n한국어 개조식 규칙을 검사\n', 'utf8');
    fs.writeFileSync(invalidMessagePath, 'Add commit message validation.\n', 'utf8');

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
    assert.match(invalidResult.stderr, /한글/u);
    assert.match(invalidResult.stderr, /본문은 필수/u);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
