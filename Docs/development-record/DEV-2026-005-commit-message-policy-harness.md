---
id: DEV-2026-005
title: 커밋 메시지 규칙 하네스
status: completed
verification_tier: 2
plan_review: okay
date: 2026-09-03
approved_at: 2026-09-03
completed_at: 2026-09-03
unity_version: 6000.3.20f1
platform: macOS
related_issue:
related_commit:
tags: [harness, git, commit-message, validation]
---

> 이 문서는 승인된 계획, 실행 기록, 검증, 최종 결과를 함께 관리하는 단일 정본이다. 별도 계획 문서를 만들지 않는다.

# 목표

## 배경

현재 프로젝트 하네스는 `git commit` 실행 전 사용자 승인을 강제하지만 커밋 메시지 형식은 검사하지 않는다. 제목과 본문의 구조, 제목 길이, 명령형 동사, 제목 끝 마침표 금지 규칙을 문서화하고 Codex와 사람이 만드는 모든 새 커밋에 동일하게 적용한다.

## 완료 조건

- 커밋 메시지 규칙의 한국어 정본이 `Docs/` 아래에 존재한다.
- 제목 존재, 50자 이하, 허용 명령형 동사 시작, 제목 끝 마침표 금지, 본문 앞 빈 행을 자동 검사한다.
- 규칙 위반 시 커밋을 생성하지 않고 구체적인 한국어 오류를 출력한다.
- 기존 사용자 승인 게이트와 독립적으로 동작한다.
- 정상·오류 사례의 자동 테스트가 통과하고 하네스 닥터가 훅 활성화 상태를 확인한다.

# 제약사항

- 기존 커밋 이력은 수정하지 않고 새 커밋부터 적용한다.
- 본문의 의미가 실제로 변경 내용과 이유를 설명하는지는 정적 검사하지 않는다.
- `commit`, `push`, `reset`, `revert`의 사용자 승인 정책은 변경하지 않는다.
- 사용자 승인 없이 결과를 커밋하거나 푸시하지 않는다.

# 계획

1. 커밋 메시지 규칙과 자동 검사 범위를 문서화한다.
2. 파일로 전달된 Git 커밋 메시지를 검사하는 공용 Node 검사기를 구현한다.
3. 저장소의 `commit-msg` Git 훅에서 공용 검사기를 호출한다.
4. 하네스 닥터가 `core.hooksPath`와 훅 파일을 점검하게 한다.
5. 현재 저장소에 버전 관리되는 훅 경로를 연결한다.
6. 정상·오류 사례를 자동 테스트하고 실제 훅 진입점을 검증한다.

## 변경 예정 파일

- `Docs/Commit-Message-Policy.md`: 규칙, 자동 검사 범위, 예외와 예시의 한국어 정본 신설
- `AGENTS.md`: 커밋 전 정본 준수와 자동 검사 실패 우회 금지 지시 추가
- `.codex/hooks/commit-message-lint.js`: 커밋 메시지 구조와 제목 규칙 검사기 신설
- `.codex/hooks/tests/commit-message-lint.test.js`: 허용·거부 사례 자동 테스트 신설
- `.githooks/commit-msg`: Git이 호출하는 얇은 진입점 신설
- `.codex/hooks/harness-doctor.js`: Git 훅 경로와 진입점 상태 검사 추가
- `Docs/development-record/DEV-2026-005-commit-message-policy-harness.md`: 계획·실행·결과 정본
- `Docs/development-record/Index.md`: DEV-005 포인터 추가
- `.git/config`: 현재 clone의 `core.hooksPath=.githooks` 설정(버전 관리 대상 아님)

## 영향 범위

- 이후 생성되는 모든 Git 커밋 메시지
- Codex 세션 시작 시 하네스 상태 진단
- Codex의 커밋 메시지 작성 및 사용자 승인 흐름

## 범위 제외 (Non-goals)

- Conventional Commits 타입·스코프 도입
- 기존 커밋 메시지 재작성
- 본문 내용의 자연어 의미 판정
- CI나 원격 저장소 규칙 설정

## 구조·소유권 점검

- 사용자 승인 정책의 기존 소유자는 `.codex/hooks/git-commit-confirm.js`이며 수정하지 않는다.
- 하네스 상태 진단의 기존 소유자는 `.codex/hooks/harness-doctor.js`이므로 훅 활성화 점검을 이 파일에 확장한다.
- 커밋 메시지 형식 소유자는 검색 결과 존재하지 않고 `core.hooksPath`도 미설정이다.
- 공용 검사기는 정책 판정만, `.githooks/commit-msg`는 Git 진입점만 담당해 SRP를 유지한다.
- Codex 전용 명령 파서를 중복 구현하지 않고 Git 네이티브 훅을 사용해 사람의 커밋에도 같은 규칙을 적용한다.

## 계획 검토

`plan-critic`: **OKAY**. 기존 승인 훅은 승인 책임만 가지며 메시지 검사 경로와 `core.hooksPath`가 없음을 확인했다. 네이티브 `commit-msg` 훅, 독립 검사기, Node 자동 테스트, 하네스 닥터 점검으로 요구사항별 실행·검증 경로가 모두 존재한다.

## 검증 계획

증거 티어 2로 진행하며 다음 명령으로 검사기 판정, 실제 Git 훅 진입점, 활성화 상태와 기존 하네스를 검증한다.

```bash
node --test .codex/hooks/tests/commit-message-lint.test.js
node .codex/hooks/harness-doctor.js
git config --local --get core.hooksPath
.githooks/commit-msg <임시 정상 메시지 파일>
.githooks/commit-msg <임시 오류 메시지 파일>
node .codex/hooks/inject-work-gate.js
node .codex/hooks/development-record-load.js
git diff --check
```

## 사람 검수 항목

- 허용 명령형 동사 목록이 팀의 실제 커밋 표현을 충분히 포함하는지
- 오류 안내 문구가 규칙 위반을 수정하기에 명확한지

# 실행 기록

| 시각 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 22:37 | 기존 커밋 승인 훅, 하네스 닥터, Git 훅 설정 조사 | 성공 | 승인 훅은 메시지를 검사하지 않고 `core.hooksPath`는 미설정 |
| 22:37 | 티어 2 계획 적대적 재검토 | OKAY | 기존 소유권과 요구사항별 검증 경로 확인 |
| 22:39 | 규칙 정본, 공용 검사기, Git 훅 진입점 구현 | 성공 | `Docs/Commit-Message-Policy.md`, `.codex/hooks/commit-message-lint.js`, `.githooks/commit-msg` |
| 22:40 | 최초 검사기 테스트와 하네스 닥터 실행 | RED 확인 | 검사기 11/11 통과, 닥터가 미설정 `core.hooksPath`를 정확히 경고 |
| 22:41 | 현재 clone의 Git 훅 경로 설정 | 성공 | `core.hooksPath=.githooks`, 실제 hook 경로 `.githooks/commit-msg` |
| 22:42 | 통합 테스트와 verifier 재검증 | PASS | Node 13/13, Unity compile 0/0, EditMode 8/8, 하네스 훅·로더 정상 |

# 발견 사항

- Codex `PreToolUse`에서 커밋 명령의 `-m`, `-F`, 편집기 입력 방식을 모두 다시 해석하면 기존 셸 렉서를 중복하거나 메시지 입력 방식을 제한하게 된다. Git 네이티브 `commit-msg` 훅은 최종 메시지 파일을 동일한 시점에 검사하므로 Codex와 사람의 커밋을 한 경로로 다룰 수 있다.
- `core.hooksPath`는 저장소 파일이 아니라 clone별 `.git/config` 설정이므로 훅 파일만 버전 관리해서는 자동 활성화되지 않는다. 하네스 닥터가 누락을 경고하고 정책 문서에 한 번의 설정 명령을 기록해야 한다.
- 명령형 여부를 일반 영어 문법으로 완전하게 판정하는 것은 정적 검사 범위를 벗어난다. 프로젝트에서 사용하는 동사원형을 명시적 허용 목록으로 관리하면 과거형과 소문자 시작을 결정적으로 차단할 수 있다.

# 결정 사항

## DEC-001: Git 네이티브 commit-msg 훅을 단일 실행 경로로 사용

### 맥락

기존 `.codex/hooks/git-commit-confirm.js`는 Codex의 Bash 명령만 관측하고 사용자 승인 여부를 판정한다. 커밋 메시지 형식은 Codex뿐 아니라 사람이 직접 실행한 Git 커밋에도 동일해야 한다.

### 검토한 선택지

- 기존 `PreToolUse` 승인 훅에 메시지 파싱까지 추가
- 별도 Codex `PreToolUse` 메시지 훅 추가
- 공용 검사기를 Git 네이티브 `commit-msg` 훅에서 호출

### 결정

공용 Node 검사기를 `.githooks/commit-msg`에서 호출한다. 기존 승인 훅은 수정하지 않는다.

### 영향

- 승인과 메시지 형식 판정의 책임이 분리된다.
- Codex와 사람의 커밋에 같은 검사기가 적용된다.
- clone마다 `core.hooksPath=.githooks` 설정이 한 번 필요하다.

## DEC-002: 명령형 제목은 허용 동사 목록으로 판정

### 맥락

외부 자연어 분석 의존성 없이 동사원형과 과거형을 결정적으로 구분해야 한다.

### 검토한 선택지

- 첫 단어 형태만 정규식으로 검사
- 영어 형태소 분석 도구 추가
- 프로젝트 허용 동사 목록 사용

### 결정

대소문자를 구분하는 영어 동사원형 목록을 정책 문서와 검사기에 둔다. 필요한 새 동사는 문서와 검사기를 함께 변경한다.

### 영향

- 판정이 빠르고 재현 가능하다.
- 목록에 없는 올바른 동사는 정책 변경 전까지 거부된다.

# 변경 내용

- `Docs/Commit-Message-Policy.md`에 기본 구조, 작성 규칙, 허용 동사, 자동 검사 범위와 활성화 방법을 기록했다.
- `.codex/hooks/commit-message-lint.js`가 제목 존재·50자·허용 동사·마침표·본문 앞 빈 행을 검사하고 한국어 오류를 반환하게 했다.
- `.githooks/commit-msg`가 공용 검사기를 호출하도록 추가하고 실행 권한을 설정했다.
- Node 기본 테스트 러너로 단위·경계·문서 동기화·실제 Git 훅 진입점 테스트 13개를 추가했다.
- `AGENTS.md`에 정책 정본 준수와 `--no-verify` 우회 금지를 추가했다.
- 하네스 닥터가 `core.hooksPath`, 훅 진입점, 검사기 파일과 실행 권한을 점검하게 했다.
- 현재 clone에 `core.hooksPath=.githooks`를 설정했다.

# 검증

- `node --test .codex/hooks/tests/commit-message-lint.test.js`: 13 passed, 0 failed
- 실제 `.githooks/commit-msg` 진입점: 정상 메시지 exit 0, 과거형·마침표 오류 메시지 exit 1
- 미설정 상태의 하네스 닥터: `core.hooksPath` 누락 경고 확인
- 설정 후 `node .codex/hooks/harness-doctor.js`: 출력 없음, exit 0
- `git config --local --get core.hooksPath`: `.githooks`
- `git rev-parse --git-path hooks/commit-msg`: `.githooks/commit-msg`
- `uloop compile`: Success, ErrorCount 0, WarningCount 0
- `uloop run-tests --test-mode EditMode --filter-type all`: 8 passed, 0 failed
- `node .codex/hooks/inject-work-gate.js`: 정상 디스패치 출력
- `node .codex/hooks/development-record-load.js`: DEV-005를 포함한 Index 정상 로드
- `.codex/hooks.json`: JSON 파싱 성공
- `git diff --check`: 오류 없음

# 최종 결과

새 커밋 메시지를 프로젝트 규칙에 따라 생성 전에 차단하는 하네스를 완성했다. 기존 사용자 승인 게이트를 유지하면서 Git 네이티브 훅이 Codex와 사람의 커밋을 같은 공용 검사기로 검증하며, 현재 clone에서 즉시 활성화돼 있다.

# 후속 작업

- [ ] 구현 후 팀 사용 결과에 따라 허용 동사 목록을 조정한다.

# 다음 작업에서 재사용할 지식

- 메시지 형식은 Codex 명령 문자열보다 Git이 준비한 최종 메시지 파일을 검사하는 편이 입력 방식에 덜 의존한다.
- 버전 관리되는 Git 훅은 `core.hooksPath` 설정이 없으면 실행되지 않으므로 세션 진단에서 활성화 상태를 함께 확인해야 한다.
- 명령형 판정 목록을 변경할 때 `Docs/Commit-Message-Policy.md`와 `.codex/hooks/commit-message-lint.js`를 함께 갱신한다.
