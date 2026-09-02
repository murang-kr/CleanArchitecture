#!/usr/bin/env node
// SessionStart 훅: 프로젝트별 개발 기록 인덱스 주입.
// 프로젝트 루트의 Docs/development-record/Index.md를 컨텍스트에 주입한다.
// 세부 기록의 생성·갱신 정책은 프로젝트 AGENTS.md의 "개발 기록 정책" 절에 있다.
// 계약: 내부 오류는 삼키고 항상 exit 0 (fail-open).
const fs = require('fs'), path = require('path');
try {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const recordDir = path.join(projectRoot, 'Docs', 'development-record');
  const indexPath = path.join(recordDir, 'Index.md');
  const formatPath = path.join(projectRoot, 'Docs', 'Development-Record-Format.md');

  const formatWarning = fs.existsSync(formatPath)
    ? ''
    : `\n[development-record] 공용 포맷이 없다: ${formatPath}`;

  if (fs.existsSync(indexPath)) {
    process.stdout.write(
      `[development-record] 작업 기록 디렉터리: ${recordDir}\n` +
      `아래는 개발 기록 인덱스다. 과거 맥락이 필요하면 인덱스에서 관련 항목을 찾은 뒤 해당 기록만 읽는다. 운용 규칙은 프로젝트 AGENTS.md의 "개발 기록 정책" 절.\n` +
      `--- Index.md ---\n` +
      fs.readFileSync(indexPath, 'utf8') +
      formatWarning
    );
  } else {
    process.stdout.write(
      `[development-record] 개발 기록 인덱스가 없다: ${indexPath}. ` +
      `프로젝트 AGENTS.md의 "개발 기록 정책" 절에 따라 디렉터리와 Index.md를 생성하라.` +
      formatWarning
    );
  }
} catch {}
process.exit(0);
