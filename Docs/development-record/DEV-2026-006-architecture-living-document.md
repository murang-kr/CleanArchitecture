---
id: DEV-2026-006
title: 아키텍처 UML 정본과 구조 변경 게이트
status: completed
verification_tier: 2
plan_review: okay
date: 2026-09-04
approved_at: 2026-09-04
completed_at: 2026-09-04
unity_version: 6000.3.20f1
platform: macOS
related_issue:
related_commit:
tags: [architecture, documentation, uml, mermaid, harness]
---

> 이 문서는 승인된 계획, 실행 기록, 검증, 최종 결과를 함께 관리하는 단일 정본이다. 별도 계획 문서를 만들지 않는다.

# 목표

## 배경

현재 Player 이동 세로 슬라이스로 Clean Architecture 계층과 asmdef 의존 방향을 검증했지만, 상세 구조는 README와 개발 기록에 흩어져 있다. 실제 코드에 근거한 UML 다이어그램을 `Docs/Architecture.md`에 모으고 이후 구조 변경과 함께 갱신되는 아키텍처 정본으로 지정한다.

## 완료 조건

- 현재 구현된 모든 런타임 asmdef와 직접 참조가 문서에 반영된다.
- Player 주요 타입의 정적 관계와 입력부터 물리·표시까지의 런타임 흐름을 UML로 표현한다.
- README의 중복 상세 설명을 아키텍처 정본 링크로 축약한다.
- 아키텍처에 영향을 주는 변경이 같은 작업에서 문서를 갱신하도록 `AGENTS.md`에 규칙을 둔다.
- Unity 컴파일과 문서 정적 검증을 통과한다.

# 제약사항

- 구현되지 않은 Feature나 `Shared`를 현재 구조인 것처럼 표현하지 않는다.
- 실제 asmdef 참조와 코드 호출부에서 확인되지 않은 의존 관계를 추가하지 않는다.
- 상세 프로젝트 문서는 `Docs/` 아래에 한국어로 작성한다.
- gameplay 코드와 에셋 동작은 변경하지 않는다.
- 사용자 승인 없이 commit이나 push를 수행하지 않는다.

# 계획

1. 현재 asmdef와 Player 호출 경로를 코드 본문으로 재검증한다.
2. Mermaid 어셈블리 그래프, 클래스 다이어그램, 시퀀스 다이어그램을 포함한 `Docs/Architecture.md`를 작성한다.
3. README의 중복 아키텍처 설명을 정본 링크와 짧은 현황으로 대체한다.
4. `AGENTS.md`에 아키텍처 변경 시 동시 갱신 규칙을 추가한다.
5. 실제 참조 대조, Markdown 정적 검사와 Unity 컴파일로 검증한다.

### 후속 승인 계획: 균형형 구조 변경 게이트

1. Mermaid CLI는 도입하지 않고 VS Code 렌더링을 사람 검수로 유지한다.
2. staged asmdef와 Architecture.md의 노드·간선·엔진 참조 계약·코드 링크를 비교하는 Node 검사기를 추가한다.
3. asmdef 변경, Core·Feature 타입 추가·삭제·이동, Installer 변경, composition 씬 변경을 구조 변경으로 분류한다.
4. 구조 변경 시 Architecture.md가 같은 커밋에 staged되지 않으면 `pre-commit`에서 거부한다.
5. 하네스 닥터가 새 훅과 검사기 파일·실행 권한을 진단하게 한다.
6. 분류·정합성·거부 경로 자동 테스트와 기존 훅 회귀 테스트를 실행한다.

## 변경 예정 파일

- `Docs/Architecture.md`: 현재 아키텍처, UML, 의존 규칙, 유지보수 계약의 정본 신설
- `README.md`: 상세 아키텍처 중복 제거와 정본 링크 추가
- `AGENTS.md`: 아키텍처 문서 동기화 트리거 추가
- `Docs/development-record/DEV-2026-006-architecture-living-document.md`: 계획·실행·결과 정본
- `Docs/development-record/Index.md`: DEV-006 포인터 추가
- `.codex/hooks/architecture-doc-check.js`: staged asmdef와 아키텍처 정본의 기계적 정합성 검사기 신설
- `.codex/hooks/architecture-change-guard.js`: 균형형 구조 변경 분류와 문서 staged 강제 신설
- `.codex/hooks/tests/architecture-doc-check.test.js`: 문서 정합성 판정 자동 테스트 신설
- `.codex/hooks/tests/architecture-change-guard.test.js`: 구조 변경 분류와 거부 조건 자동 테스트 신설
- `.githooks/pre-commit`: 구조 변경 게이트 진입점 신설
- `.codex/hooks/harness-doctor.js`: pre-commit과 아키텍처 검사기 상태 진단 추가

## 영향 범위

- 아키텍처 탐색과 신규 Feature 설계 기준
- 이후 asmdef, 계층 책임, composition root, 주요 호출 흐름 변경 작업의 문서 완료 조건
- README와 상세 아키텍처 문서의 정보 소유권

## 범위 제외 (Non-goals)

- gameplay 코드·씬·에셋·asmdef 변경
- Mermaid 자동 생성기 또는 외부 렌더러 설치
- 구현되지 않은 Combat, Enemy, Inventory, Map의 상세 설계 확정
- CI 문서 드리프트 검사 도입
- Mermaid CLI, Mermaid npm 패키지, SVG·PNG 자동 생성

## 구조·소유권 점검

- 현재 상세 아키텍처 설명은 `README.md`의 디렉터리 구조 절이 소유하지만 제안 구조와 실제 구현이 섞여 있다.
- 신규 `Docs/Architecture.md`가 상세 구조를 단독 소유하고 README는 진입 링크만 유지해 DRY를 지킨다.
- 프로젝트 운영 규칙의 소유자는 `AGENTS.md`이므로 지속 갱신 트리거를 이 파일에 확장한다.
- Mermaid는 Markdown 안에서 관리해 별도 이미지 산출물과 렌더링 파이프라인을 만들지 않는다.

## 계획 검토

문서와 운영 규칙만 변경하는 티어 0 작업이므로 `plan-critic` 대상이 아니다. 사용자가 Mermaid UML 정본 방식의 추천안을 승인했다.

후속 균형형 게이트는 티어 2로 재분류했다. `plan-critic`: **OKAY**. 기존 `commit-msg`와 책임이 겹치지 않고 `core.hooksPath=.githooks`를 그대로 확장할 수 있다. Node 기본 모듈만으로 staged 파일 분류와 asmdef·문서 정합성을 검사할 수 있으며 Mermaid 시각 배치는 명시적으로 사람 검수에 남긴다.

## 검증 계획

후속 하네스 구현을 포함해 증거 티어 2로 진행한다.

```bash
uloop compile
git diff --check
rg를 이용한 asmdef 이름·직접 참조와 문서 노드·간선 대조
rg를 이용한 주요 호출 심볼과 UML 참여자 대조
node --test .codex/hooks/tests/architecture-doc-check.test.js .codex/hooks/tests/architecture-change-guard.test.js
.githooks/pre-commit
```

로컬에 Mermaid CLI가 없으므로 실제 렌더링 모양은 사람 검수 항목으로 분리한다.

## 사람 검수 항목

- Markdown 뷰어에서 Mermaid 다이어그램의 배치와 가독성
- 신규 팀원이 문서만 보고 계층 책임과 변경 위치를 찾을 수 있는지

# 실행 기록

| 시각 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 07:30 | 런타임 asmdef 7개와 주요 Player 호출 경로 재검증 | 성공 | `Assets/Core/Installer/`, `Assets/Feature/Player/`의 실제 본문과 참조 확인 |
| 07:30 | Mermaid·PlantUML·자동 생성 방식 비교 후 추천안 승인 | 성공 | Mermaid UML과 asmdef 근거표 방식 선택 |
| 07:32 | 아키텍처 정본과 UML 다이어그램 작성 | 성공 | `Docs/Architecture.md`에 어셈블리·클래스·시퀀스·composition root 표현 |
| 07:33 | README 중복 축약과 지속 관리 규칙 추가 | 성공 | `README.md`, `AGENTS.md` |
| 07:34 | 실제 코드 대조와 Unity 컴파일 | 성공 | asmdef 7개·간선 16개 일치, 링크·타입 일치, compile 오류 0·경고 0 |
| 07:45 | Mermaid CLI 도입 근거 재검토 | 도입 취소 | VS Code 렌더링이 이미 가능하고 구조 강제에는 렌더러가 필요하지 않음 |
| 07:46 | 균형형 구조 변경 게이트 계획 재검토 | OKAY | 기존 pre-commit 소유자 없음, `.githooks` 활성화 상태 확인 |
| 08:03 | staged 구조 변경 분류기와 아키텍처 정합성 검사기 구현 | 성공 | asmdef·타입 소유권·Installer·composition 씬 분류와 staged snapshot 대조 |
| 08:05 | pre-commit과 하네스 닥터 연결 | 성공 | `.githooks/pre-commit` 실행 권한, `core.hooksPath=.githooks`, 닥터 무경고 |
| 08:06 | Node 검사기와 기존 commit-msg 회귀 테스트 | 성공 | 27 passed, 0 failed |
| 08:08 | Unity 회귀 검증 | 성공 | compile 오류 0·경고 0, EditMode 8개·PlayMode 1개 통과 |

# 발견 사항

- 기존 README의 예시 디렉터리에는 아직 존재하지 않는 Combat, Inventory, Enemy, Map, Shared가 현재 Player 구현과 같은 목록에 섞여 있었다. 실제 구조의 정본으로 재사용하면 구현 상태를 오해할 수 있어 README에는 정본 링크와 현재 상태만 남겼다.
- 현재 런타임 asmdef는 Core 1개와 Player 6개이며 직접 참조 간선은 외부 `VContainer`, `Unity.InputSystem`을 포함해 16개다.
- 로컬 환경에 Mermaid CLI가 없어 렌더링 이미지의 배치까지 자동 검증할 수 없다. 다이어그램 블록 구조와 실제 노드·간선은 정적으로 검증했다.
- 일반 C# 메서드 본문의 의미 변화까지 경로 기반 훅에서 판별하면 오탐이 커진다. 균형형 게이트는 식별 가능한 구조 변경만 강제하고 의미 기반 구조 변경은 계획·완료 검증 규칙으로 보완한다.

# 결정 사항

## DEC-001: Architecture.md를 상세 아키텍처의 단일 정본으로 지정

### 맥락

README는 저장소 진입점이지만 상세 디렉터리 제안, 의존 규칙과 현재 구현 상태가 한 절에 섞여 있었다. 별도 아키텍처 문서를 추가하면서 두 파일에 같은 상세 정보를 유지하면 다시 불일치가 생긴다.

### 검토한 선택지

- README와 Architecture.md에 같은 상세 구조 유지
- README 상세를 제거하고 Architecture.md만 정본으로 사용
- asmdef 그래프 생성기를 도입해 문서를 자동 생성

### 결정

`Docs/Architecture.md`가 상세 구조와 UML을 단독 소유한다. README는 정본 링크와 짧은 현재 상태만 제공한다.

### 영향

- 신규 참여자는 README에서 상세 정본으로 바로 이동할 수 있다.
- 계층 정보 중복과 문서 드리프트 가능성이 줄어든다.
- 아키텍처 변경 작업은 Architecture.md를 함께 수정해야 완료된다.

## DEC-002: 현재 코드 기반 Mermaid UML을 수동 유지

### 맥락

현재 규모는 런타임 asmdef 7개와 Player 세로 슬라이스 하나이며 외부 다이어그램 렌더러는 설치돼 있지 않다.

### 검토한 선택지

- Mermaid UML을 Markdown 안에서 유지
- PlantUML과 렌더러 도입
- asmdef·코드에서 다이어그램 자동 생성

### 결정

Mermaid의 flowchart, classDiagram, sequenceDiagram을 사용하고 asmdef·코드 근거표와 유지보수 계약을 같은 문서에 둔다.

### 영향

- 별도 이미지 산출물이나 도구 없이 diff로 변경을 검토할 수 있다.
- 시각적 배치 확인은 Mermaid 지원 Markdown 뷰어에서 사람이 수행해야 한다.
- Feature 수가 증가하면 자동 생성 필요성을 다시 평가한다.

## DEC-003: 외부 렌더러 없이 균형형 구조 변경 게이트를 적용

### 맥락

VS Code에서 Mermaid 다이어그램을 이미 확인할 수 있어 로컬 Mermaid CLI 설치는 사람의 열람 문제를 해결하지 않는다. 필요한 자동화는 이미지 생성보다 구조 변경 커밋에서 아키텍처 정본 누락과 asmdef 드리프트를 막는 일이다.

### 검토한 선택지

- Mermaid CLI와 브라우저 런타임을 설치해 모든 커밋에서 렌더링
- 외부 의존성 없이 staged 파일의 구조적 정합성만 검사
- 운영 규칙만 두고 자동 검사를 추가하지 않음

### 결정

Mermaid CLI와 npm 패키지는 도입하지 않는다. Node 기본 모듈로 staged 변경을 분류하고, 구조 변경에는 `Docs/Architecture.md`의 동시 stage를 요구한다. 문서가 staged되면 런타임 asmdef의 노드·간선·`noEngineReferences` 계약과 로컬 링크를 Git index 기준으로 검증한다.

### 영향

- 브라우저 바이너리와 npm 의존성 없이 기존 `.githooks`에서 실행된다.
- 경로로 식별 가능한 구조 변경은 커밋 전에 누락을 차단한다.
- Mermaid 문법 전체와 시각 배치는 VS Code 사람 검수에 남는다.
- 일반 메서드 본문이 구조 의미를 바꾸는 경우는 계획·완료 검증에서 판단해야 한다.

# 변경 내용

- `Docs/Architecture.md`를 생성해 현재 디렉터리, asmdef 의존 그래프, 어셈블리 계약, Player 클래스 UML, 이동 시퀀스, composition root, 허용·금지 의존과 코드 근거를 기록했다.
- Architecture.md에 구조 변경 트리거와 갱신 순서를 명시해 살아있는 문서의 자체 유지보수 계약을 추가했다.
- README의 중복 상세 구조를 제거하고 Architecture.md 링크와 현재 구현 상태만 유지했다.
- `AGENTS.md`에 asmdef, 계층 책임, 소유권, Feature 의존, DI 조립, 주요 런타임 흐름 변경 시 Architecture.md를 같은 작업에서 갱신하는 규칙을 추가했다.
- `.githooks/pre-commit`과 Node 검사기 2개를 추가해 구조 변경 분류, Architecture.md 동시 stage, staged asmdef·문서 정합성을 강제했다.
- 하네스 닥터가 `commit-msg`, `pre-commit`, 관련 검사기와 훅 실행 권한을 함께 진단하도록 확장했다.
- DEV-006 개발 기록과 Index 포인터를 추가했다.

# 검증

- 실제 런타임 asmdef JSON과 Mermaid 의존 그래프 자동 대조: 7 assemblies, 16 edges matched
- Architecture.md의 어셈블리 계약 표: 실제 asmdef 7개 이름 모두 확인
- UML 주요 타입 11개: 현재 C# 선언과 문서 참여자 모두 확인
- Architecture.md와 README의 로컬 Markdown 링크: 모두 존재
- `uloop compile`: Success, ErrorCount 0, WarningCount 0
- `git diff --check`: 오류 없음
- 변경 파일의 후행 공백 검색: 없음
- Node 훅 테스트: 27 passed, 0 failed
- 작업 트리 아키텍처 검사: 7 assemblies, 16 edges, 4 Mermaid blocks matched
- `.githooks/pre-commit`: staged 구조 변경이 없는 상태에서 종료 코드 0
- 하네스 닥터: 무경고, `core.hooksPath=.githooks` 확인
- `uloop run-tests --test-mode EditMode --filter-type all`: 8 passed, 0 failed
- `uloop run-tests --test-mode PlayMode --filter-type all`: 1 passed, 0 failed
- Mermaid 시각 렌더링: 로컬 CLI 부재로 자동 검증하지 못했으며 사람 검수 필요

# 최종 결과

현재 Player 이동 세로 슬라이스의 정적 구조와 런타임 흐름을 보여주는 `Docs/Architecture.md`를 상세 아키텍처 정본으로 완성했다. README와 AGENTS의 소유권·갱신 규칙을 정리하고, 균형형 pre-commit 게이트로 식별 가능한 구조 변경에는 문서 동시 갱신과 staged asmdef 정합성 검사를 강제했다. Mermaid CLI는 설치하지 않았다.

# 후속 작업

- [ ] Feature 수가 늘어나면 asmdef 그래프 자동 생성 필요성을 재평가한다.
- [ ] CI가 도입되면 로컬 아키텍처 검사기를 같은 명령으로 실행한다.

# 다음 작업에서 재사용할 지식

- asmdef 그래프의 간선은 문서 설명이 아니라 각 asmdef의 `references` 배열을 기준으로 검증한다.
- Architecture.md에는 계획된 빈 계층을 미리 넣지 않고 실제 구현된 구조와 예정 구조를 분리한다.
- README는 아키텍처 진입점만 제공하고 상세 구조는 Architecture.md가 단독 소유한다.
