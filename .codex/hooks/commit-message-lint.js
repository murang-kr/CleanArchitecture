#!/usr/bin/env node
const fs = require('fs');

const MAX_SUBJECT_LENGTH = 50;
const COMMENT_LINE = /^\s*#/u;
const HANGUL = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7A3]/u;
const TERMINAL_PUNCTUATION = /[.!?。．！？]$/u;
const SENTENCE_ENDING = /(?:다|요|죠|네요|까요|세요|십시오|하자)$/u;
const ENGLISH_ACTION_PREFIX = /^(?:Add|Fix|Update|Remove|Refactor|Move|Rename|Document|Test|Configure|Enable|Disable|Improve|Simplify|Prevent|Enforce|Unify|Connect|Replace|Create|Implement|Support|Handle|Use|Align|Clean|Extract|Introduce|Separate|Restore|Validate|Guard|Change|Set|Bump|Merge|Revert)\b/u;

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

  if (!HANGUL.test(subject)) {
    errors.push('제목은 한글을 포함한 한국어 개조식 문구로 작성한다.');
  }
  if (ENGLISH_ACTION_PREFIX.test(subject)) {
    errors.push('제목은 영문 명령 동사로 시작하지 않고 한국어 개조식으로 작성한다.');
  }

  if (TERMINAL_PUNCTUATION.test(subject)) {
    errors.push('제목 끝에는 마침표·느낌표·물음표 같은 종결 부호를 사용하지 않는다.');
  } else if (SENTENCE_ENDING.test(subject)) {
    errors.push('제목은 종결 어미 없이 명사형 개조식 문구로 작성한다.');
  }

  const bodyLines = lines.slice(1);
  const hasBody = bodyLines.some(line => line.trim() !== '');
  if (!hasBody) {
    errors.push('본문은 필수다. 제목 다음 빈 행 뒤에 변경 내용과 이유를 작성한다.');
    return errors;
  }

  if (lines[1].trim() !== '') {
    errors.push('제목과 본문 사이에 빈 행을 둔다.');
    return errors;
  }

  if (lines[2]?.trim() === '') {
    errors.push('제목과 본문 사이는 정확히 빈 행 하나로 구분한다.');
  }

  let previousWasBlank = false;
  let contentLineNumber = 0;
  for (const line of lines.slice(2)) {
    const content = line.trim();
    if (content === '') {
      if (previousWasBlank) {
        errors.push('본문 문단 사이는 빈 행 하나로만 구분한다.');
      }
      previousWasBlank = true;
      continue;
    }

    previousWasBlank = false;
    contentLineNumber += 1;
    if (!HANGUL.test(content)) {
      errors.push(`본문 ${contentLineNumber}번째 줄은 한글을 포함한 한국어 개조식 문구로 작성한다.`);
    }
    if (ENGLISH_ACTION_PREFIX.test(content)) {
      errors.push(`본문 ${contentLineNumber}번째 줄은 영문 명령 동사로 시작하지 않고 한국어 개조식으로 작성한다.`);
    }
    if (TERMINAL_PUNCTUATION.test(content)) {
      errors.push(`본문 ${contentLineNumber}번째 줄 끝에는 종결 부호를 사용하지 않는다.`);
    } else if (SENTENCE_ENDING.test(content)) {
      errors.push(`본문 ${contentLineNumber}번째 줄은 종결 어미 없이 명사형 개조식 문구로 작성한다.`);
    }
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
  MAX_SUBJECT_LENGTH,
  normalizeLines,
  run,
  validateCommitMessage
};
