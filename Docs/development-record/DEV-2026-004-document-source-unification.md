---
id: DEV-2026-004
title: 계획과 개발 기록 정본 통합
status: completed
verification_tier: 1
plan_review: not_required
date: 2026-09-03
approved_at: 2026-09-03
completed_at: 2026-09-03
unity_version: 6000.3.20f1
platform: macOS
related_issue:
related_commit:
tags: [harness, documentation, plan-gate, development-record]
---

> 이 문서는 승인된 계획, 실행 기록, 검증, 최종 결과를 함께 관리하는 단일 정본이다. 별도 계획 문서를 만들지 않는다.

# 목표

## 배경

프로젝트 로컬 `plan-gate`는 승인된 티어 2 계획을 `.codex/plans/`에 저장하도록 요구하고, `AGENTS.md`는 같은 구현 작업을 `Docs/development-record/`에 기록하도록 요구했다. 그 결과 목적과 양식이 겹치는 두 정본이 생겼다. 또한 기존 README에 아키텍처 규칙이 있는데 별도 `Docs/Architecture.md`가 추가되어 문서 소유권과 언어 일관성이 흐려졌다.

## 완료 조건

- 프로젝트 산출 문서는 `Docs/` 아래에만 저장하고 기본 언어를 한국어로 명시한다.
- `plan-gate`가 별도 계획 문서 대신 개발 기록 하나를 정본으로 사용한다.
- 개발 기록 공용 양식이 계획 승인부터 완료까지의 상태와 필수 계획 항목을 지원한다.
- 기존 `.codex/plans` 계획을 DEV-003에 병합하고 중복 `Architecture.md`와 잘못된 참조를 제거한다.

# 제약사항

- 루트 `README.md`와 에이전트 실행에 필요한 `AGENTS.md`, `SKILL.md`, 훅 프롬프트는 저장 위치가 고정된 운영 파일로 취급한다.
- Player 게임플레이 코드, 씬, 에셋, 테스트 동작은 변경하지 않는다.
- 사용자 승인 없는 git commit이나 push를 수행하지 않는다.

# 계획

1. `AGENTS.md`에 문서 위치·언어·단일 정본 규칙을 추가한다.
2. 프로젝트 로컬 `plan-gate`에서 `.codex/plans` 지시를 제거하고 DEV 기록 수명주기를 정의한다.
3. 개발 기록 공용 양식에 계획 게이트가 요구하는 항목과 상태 필드를 추가한다.
4. 기존 계획 내용을 DEV-003에 병합하고 중복 계획·아키텍처 문서를 제거한다.

## 변경 예정 파일

- `AGENTS.md`: 프로젝트 문서 저장 위치, 기본 언어, 운영 파일 예외, 단일 정본 규칙
- `.agents/skills/plan-gate/SKILL.md`: 계획 영속화 위치와 상태 전이 변경
- `Docs/Development-Record-Format.md`: 계획과 실행을 함께 담는 공용 양식 확장
- `Docs/development-record/DEV-2026-003-player-walking-skeleton.md`: 기존 계획의 고유 내용 병합
- `Docs/development-record/DEV-2026-004-document-source-unification.md`: 이번 변경의 단일 정본
- `Docs/development-record/Index.md`: DEV-004 포인터 추가
- `README.md`: 삭제된 `Docs/Architecture.md` 링크 제거
- `.codex/plans/2026-09-03-player-walking-skeleton.md`: 병합 후 제거
- `Docs/Architecture.md`: README·DEV-003과 중복되어 제거

## 영향 범위

- 이후 구현 작업의 계획 승인, 세션 재개, 실행 기록, 완료 검증 문서 흐름
- 프로젝트 문서의 저장 위치와 기본 작성 언어
- 기존 Player 이동 작업 기록의 계획 정본 위치

## 범위 제외 (Non-goals)

- gameplay 코드·asmdef·씬·테스트 변경
- 공용 Codex 설치 영역의 전역 스킬 변경
- 새로운 문서 관리 도구나 자동 생성기 도입

## 구조·소유권 점검

- 문서 정책의 기존 소유자는 `AGENTS.md`의 개발 기록 절이다.
- 구현 계획 절차의 기존 소유자는 `.agents/skills/plan-gate/SKILL.md`다.
- 계획·실행·결과 양식의 기존 소유자는 `Docs/Development-Record-Format.md`다.
- 세션 재개는 기존 `.codex/hooks/development-record-load.js`가 `Docs/development-record/Index.md`를 읽으므로 새 로더를 만들 필요가 없다.

## 계획 검토

티어 1 문서·기존 하네스 로직 변경이므로 `plan-critic` 대상이 아니다. 사용자가 변경 순서와 범위를 명시적으로 승인했다.

## 검증 계획

- 수정한 `plan-gate`의 YAML frontmatter와 필수 필드를 파싱한다.
- `.codex/plans` 활성 저장 지시와 삭제된 `Docs/Architecture.md` 활성 링크가 남아 있지 않은지 검색한다. 삭제 배경을 설명하는 개발 기록의 역사적 언급은 유지한다.
- 기존 작업 게이트·개발 기록 로드 훅을 직접 실행한다.
- `git diff --check`와 변경 경로 점검으로 범위 밖 수정을 확인한다.

## 사람 검수 항목

- 통합된 DEV 양식의 실제 사용 편의성
- 한국어 문서 표현과 절 구성의 선호도

# 실행 기록

| 시각 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 21:56 | 문서 정본·한국어·운영 파일 예외 규칙 추가 | 성공 | `AGENTS.md` |
| 21:58 | `plan-gate`의 계획 저장 경로를 DEV 기록으로 변경 | 성공 | `.agents/skills/plan-gate/SKILL.md` |
| 21:59 | 제공 quick validator 실행 | 환경 의존성 부족 | 호스트 Python에 `yaml` 모듈이 없어 중단; Ruby YAML 파서와 정적 검색으로 대체 |
| 22:00 | 개발 기록 공용 양식 확장 | 성공 | `Docs/Development-Record-Format.md` |
| 22:01 | 기존 계획 병합과 중복 문서 정리 | 성공 | DEV-003 갱신, `.codex/plans`와 `Docs/Architecture.md` 제거, README 링크 정리 |

# 발견 사항

- 작업 게이트 훅 자체는 `.codex/plans`를 만들지 않는다. `inject-work-gate.js`가 `ambiguity-check.md`를 주입하고, 그 문서가 `plan-gate`를 선택하게 하며, 실제 저장 경로는 `plan-gate`가 결정했다.
- 세션 시작의 개발 기록 로더는 이미 `Docs/development-record/Index.md`를 정본 탐색점으로 사용하므로 계획 저장소를 별도로 둘 이유가 없다.
- `Docs/Architecture.md` 생성과 영어 작성은 하네스 요구사항이 아니었으며, 기존 README 아키텍처 절과 중복되는 구현 판단이었다.

# 결정 사항

## DEC-001: 개발 기록을 계획과 실행 결과의 단일 정본으로 사용

### 맥락

별도 계획 파일과 개발 기록이 같은 목표·범위·검증 정보를 중복 보관해 서로 어긋날 가능성이 있었다.

### 검토한 선택지

- `.codex/plans`와 개발 기록을 계속 별도로 유지
- 계획 파일을 `Docs/plans/`로 옮기되 개발 기록과 분리
- 개발 기록 하나가 승인 계획부터 완료 결과까지 상태에 따라 성장

### 결정

개발 기록 하나를 단일 정본으로 사용한다. 승인 전 계획은 대화에서 검토하고, 승인 직후 DEV 기록을 생성하거나 기존 기록을 갱신한다.

### 영향

- 계획과 결과의 불일치 가능성과 문서 탐색 비용이 줄어든다.
- DEV 공용 양식이 계획 게이트 항목까지 포함하므로 기존보다 길어질 수 있다.

# 변경 내용

- 프로젝트 문서 위치와 언어 규칙을 `AGENTS.md`에 추가했다.
- `plan-gate`의 `.codex/plans` 저장 규칙을 제거하고 DEV 기록 상태 전이를 정의했다.
- 개발 기록 양식에 검증 티어, 계획 검토 상태, 승인·완료일과 계획 필수 절을 추가했다.
- Player 이동 계획을 DEV-003에 병합하고 별도 계획 파일과 빈 디렉터리를 제거했다.
- 중복 `Docs/Architecture.md`를 제거하고 README의 링크를 정리했다.

# 검증

- 프로젝트 로컬 `plan-gate` frontmatter: Ruby YAML 파싱 성공, `name: plan-gate`, description 존재
- 제공 `quick_validate.py`: 호스트에 `PyYAML`이 없어 실행 불가; 수동 대체 검증 완료
- `.codex/plans` 활성 저장 지시: 없음
- `Docs/Architecture.md` 활성 링크: 없음; 삭제 배경을 설명하는 역사적 언급만 존재
- 작업 게이트와 개발 기록 로드 훅: 직접 실행 결과 정상
- `git diff --check`: 오류 없음
- gameplay 소스·씬·에셋·테스트 변경: 없음

# 최종 결과

승인 계획과 개발 기록을 `Docs/development-record/`의 DEV 문서 하나로 통합했다. 프로젝트 산출 문서는 `Docs/`에 저장하고 기본적으로 한국어로 작성하도록 상위 규칙과 `plan-gate`를 일치시켰다.

# 후속 작업

- [ ] 다음 구현 작업에서 승인 직후 통합 DEV 양식이 실제로 자연스럽게 사용되는지 확인한다.

# 다음 작업에서 재사용할 지식

- 계획 저장 위치를 바꾸려면 훅보다 실제 영속화 정책을 가진 `plan-gate`를 수정해야 한다.
- 세션 재개는 기존 개발 기록 Index 로더를 그대로 사용할 수 있다.
- 프로젝트 문서와 에이전트 실행 지침을 구분해야 위치 검사에서 `AGENTS.md`와 `SKILL.md`를 잘못 차단하지 않는다.
