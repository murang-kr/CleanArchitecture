#!/usr/bin/env node
const fs = require('fs');

const MAX_SUBJECT_LENGTH = 50;
const SUBJECT_PERIOD = /[.。．]$/u;
const COMMENT_LINE = /^\s*#/u;
const ALLOWED_VERBS = new Set([
  'Add',
  'Fix',
  'Update',
  'Remove',
  'Refactor',
  'Move',
  'Rename',
  'Document',
  'Test',
  'Configure',
  'Enable',
  'Disable',
  'Improve',
  'Simplify',
  'Prevent',
  'Enforce',
  'Unify',
  'Connect',
  'Replace',
  'Create',
  'Implement',
  'Support',
  'Handle',
  'Use',
  'Align',
  'Clean',
  'Extract',
  'Introduce',
  'Separate',
  'Restore',
  'Validate',
  'Guard',
  'Change',
  'Set',
  'Bump',
  'Merge',
  'Revert'
]);

function normalizeLines(message) {
  const normalized = String(message)
    .replace(/^\uFEFF/u, '')
    .replace(/\r\n?/gu, '\n');
  const lines = normalized
    .split('\n')
    .filter(line => !COMMENT_LINE.test(line));

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  return lines;
}

function validateCommitMessage(message) {
  const lines = normalizeLines(message);
  const subject = lines.length > 0 ? lines[0].trim() : '';
  const errors = [];

  if (subject.length === 0) {
    errors.push('제목이 비어 있다. 첫 줄에 변경 사항을 요약한다.');
    return errors;
  }

  const subjectLength = Array.from(subject).length;
  if (subjectLength > MAX_SUBJECT_LENGTH) {
    errors.push(`제목은 ${MAX_SUBJECT_LENGTH}자 이하여야 한다. 현재 ${subjectLength}자다.`);
  }

  const firstWord = subject.match(/^([A-Za-z]+)\b/u)?.[1] || '';
  if (!ALLOWED_VERBS.has(firstWord)) {
    errors.push(`제목은 허용된 영어 동사원형으로 시작해야 한다. 현재 시작: ${firstWord || '(없음)'}`);
  }

  if (SUBJECT_PERIOD.test(subject)) {
    errors.push('제목 끝에는 마침표를 사용하지 않는다.');
  }

  const hasBody = lines.slice(1).some(line => line.trim() !== '');
  if (hasBody && lines[1].trim() !== '') {
    errors.push('제목과 본문 사이에 빈 행을 둔다.');
  }

  return errors;
}

function run(messagePath) {
  if (!messagePath) {
    console.error('[commit-message] 검사할 커밋 메시지 파일 경로가 없다.');
    return 2;
  }

  let message;
  try {
    message = fs.readFileSync(messagePath, 'utf8');
  } catch (error) {
    console.error(`[commit-message] 커밋 메시지 파일을 읽지 못했다: ${error.message}`);
    return 2;
  }

  const errors = validateCommitMessage(message);
  if (errors.length === 0) {
    return 0;
  }

  console.error('[commit-message] 커밋 메시지 규칙을 만족하지 않는다.');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('규칙: Docs/Commit-Message-Policy.md');
  return 1;
}

if (require.main === module) {
  process.exitCode = run(process.argv[2]);
}

module.exports = {
  ALLOWED_VERBS,
  MAX_SUBJECT_LENGTH,
  normalizeLines,
  run,
  validateCommitMessage
};
