---
id: DEV-2026-008
title: Unity VCS 증거 수집 하네스
status: completed
verification_tier: V2
plan_review: okay
date: 2026-09-04
approved_at: 2026-09-04
completed_at: 2026-09-04
unity_version: 6000.3.20f1
platform: macOS arm64
related_issue:
related_commit:
tags: [harness, unity-cli, unity-vcs, evidence]
---

> 이 문서는 승인된 계획, 실행 기록, 검증, 최종 결과를 함께 관리하는 단일 정본이다. 별도 계획 문서를 만들지 않는다.

# 목표

## 배경

기존 하네스는 코드 본문·호출부, 실행 중 Editor 상태, ScriptableObject의 `SerializedObject`, 컴파일·테스트를 증거로 사용한다. Scene·Prefab은 Git diff에서 파일 변경 여부만 알 수 있고, 어떤 GameObject·Component·직렬화 필드가 바뀌었는지 Unity 의미 단위로 수집하는 공용 경로가 없다.

Unity CLI `1.0.0-beta.8`의 읽기 전용 `unity vcs diff`, `conflicts`, `explain`을 E1 직렬화 증거 수집기로 도입한다. `com.unity.pipeline`은 설치하지 않는다.

## 완료 조건

- Unity CLI `1.0.0-beta.8`을 사용할 수 있다.
- Scene·Prefab의 읽기 전용 VCS 증거 수집을 한 공용 계층에서 실행한다.
- 완료 검증 티어 V0–V2와 관측 증거 계층 E1–E4가 서로 다른 축임을 하네스에 명시한다.
- 조사·계획·검증 스킬이 공용 계층을 일관되게 사용한다.
- 쓰기 명령은 공용 계층에서 거부한다.
- 자동화 테스트, 실제 `unity vcs` 스모크, Unity 컴파일·EditMode 테스트·Console 검증이 통과한다.

# 제약사항

- `com.unity.pipeline`을 설치하지 않는다.
- `unity vcs resolve`, `hooks install`, worktree 명령, `doctor --fix`를 실행하거나 래핑하지 않는다.
- 기존 `.githooks`와 아키텍처 훅을 변경하지 않는다.
- Scene·Prefab 에셋 자체를 변경하지 않는다.
- `unity vcs` 증거만으로 런타임 동작을 주장하지 않는다.

# 계획

1. Unity CLI를 `1.0.0-beta.8`로 갱신하고 실제 명령 표면과 JSON 출력을 관측한다.
2. `.agents/skills/unity-vcs-evidence/`에 읽기 전용 증거 수집 스킬과 공용 실행 스크립트를 추가한다.
3. CLI 버전, 허용 명령, 인자 전달, JSON 처리에 대한 Node 자동화 테스트를 추가한다.
4. `evidence-analysis`, `plan-gate`, `verifier`, `unity-so-readout`의 기존 책임을 확장해 공용 계층으로 라우팅한다.
5. `Docs/Tech-Stack.md`에 역할과 증거 체인을 기록한다.
6. 임시 Git 저장소의 Scene 변경으로 실제 `unity vcs` 출력을 검증하고 전체 하네스·Unity 검증을 실행한다.

## 변경 예정 파일

- `.agents/skills/unity-vcs-evidence/SKILL.md`: E1 Scene·Prefab 증거의 정책과 라우팅을 소유하는 신규 스킬.
- `.agents/skills/unity-vcs-evidence/scripts/unity-vcs-evidence.js`: CLI 버전 검사, 읽기 전용 명령 제한, JSON 실행을 소유하는 신규 공용 계층.
- `.agents/skills/unity-vcs-evidence/scripts/unity-vcs-evidence.test.js`: 신규 판정 로직의 자동화 테스트.
- `.agents/skills/evidence-analysis/SKILL.md`: E1–E4 관측 계층과 Scene·Prefab 라우팅 추가.
- `.agents/skills/plan-gate/SKILL.md`: V0–V2와 E1–E4의 구분, 예상 직렬화 변경 계획 규칙 추가.
- `.agents/skills/verifier/SKILL.md`: Scene·Prefab 변경의 VCS 재수집과 승인 계획 대조 추가.
- `.agents/skills/unity-so-readout/SKILL.md`: 저장된 Scene·Prefab과 live Editor 상태의 도구 경계 명확화.
- `Docs/Tech-Stack.md`: Unity CLI beta.8 및 증거 수집 루프 기록.
- `.agents/skills/plan-critic/SKILL.md`: plan-gate의 V2 명칭과 설명을 동기화.
- `Docs/development-record/DEV-2026-008-unity-vcs-evidence-harness.md`: 승인 계획·실행·검증·결과 정본.
- `Docs/development-record/Index.md`: 개발 기록 포인터.

## 영향 범위

- Scene·Prefab이 포함된 조사와 완료 검증에서 `unity vcs` E1 증거가 추가된다.
- 계획 단계에서 Scene·Prefab의 예상 GameObject·Component·raw field 변경을 명시하게 된다.
- C# 전용 작업, SO readout, 기존 uloop Editor 조작과 Unity 런타임 코드는 바뀌지 않는다.

## 범위 제외 (Non-goals)

- Unity Pipeline 0.6 도입
- 자동 충돌 해결
- Git hook 자동 설치 또는 pre-commit 강제
- Unity CLI의 worktree 관리
- 예상 변경 계약과 실제 diff의 완전 자동 비교 엔진

## 구조·소유권 점검

- 관측 정책은 기존 `evidence-analysis`, 계획 위험도는 기존 `plan-gate`, 완료 재검증은 기존 `verifier`가 계속 소유한다.
- 저장된 Scene·Prefab VCS 증거의 실행·정규화 소유자는 검색 결과 존재하지 않아 `unity-vcs-evidence`를 신설한다.
- 실행 스크립트를 스킬 내부에 두어 세 기존 스킬에 CLI 호출·버전·안전 규칙을 복제하지 않는다(DRY·SRP).
- 초기 도입은 읽기 전용 수집까지만 포함하고 hook 강제와 자동 예상-delta 엔진은 제외한다(YAGNI·KISS).
- 이름은 도구와 책임을 그대로 드러내는 `unity-vcs-evidence`로 한다.

## 계획 검토

- `plan-critic`: **OKAY**. 기존 정책 소유자를 확장하고, 존재하지 않는 Unity VCS 실행 소유자만 공용 계층으로 신설한다. 자동화 테스트와 실제 beta.8 스모크 명령이 계획에 포함돼 실행 가능하다.
- 남은 미해소 항목 없음.

## 검증 계획

- 완료 검증 티어: **V2**. 작업 중 하향하지 않는다.
- 관측 증거: beta.8 실제 명령·JSON(E1), Unity Editor 컴파일·Console(E2/E3), EditMode 테스트(E3).
- `node --test .agents/skills/unity-vcs-evidence/scripts/unity-vcs-evidence.test.js`
- `node --test .codex/hooks/tests/*.test.js`
- `quick_validate.py .agents/skills/unity-vcs-evidence`
- 임시 Git 저장소에서 `unity vcs diff --format json` 실제 실행
- `uloop compile`
- `uloop run-tests --test-mode EditMode --filter-type all`
- `uloop get-logs --log-type Error --max-count 100`

## 사람 검수 항목

- 없음. 이번 작업은 CLI·정책·자동화 출력으로 판정한다.

# 실행 기록

| 시각 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 20:50 | 승인 계획 기록 | 성공 | 이 문서와 `Index.md` |
| 21:05 | Unity CLI 갱신·표면 확인 | 성공 | `unity --version` → `1.0.0-beta.8`; `unity vcs diff/conflicts/explain --help` |
| 21:27 | 공용 스킬·래퍼·테스트 구현 | 성공 | `.agents/skills/unity-vcs-evidence/` |
| 21:31 | 실제 Scene E1 스모크 | 성공 | `ba3554f^ → ba3554f`, 32 changes, Player의 `Rigidbody2D` 추가 식별 |
| 21:37 | 스킬·하네스 자동 검증 | 성공 | 신규 Node 7/7, 기존 훅 27/27, 스킬 6개 형식 유효 |
| 21:39 | Unity 검증자 재실행 | 성공 | compile 0 errors/0 warnings, EditMode 8/8, Error Console 0 |

# 발견 사항

- beta.8 실제 JSON의 raw 변경 필드 키는 사전 대화에서 가정한 `fields`가 아니라 `changedFields`다. 공용 계층은 이를 `normalizedChanges[].fields`로 정규화하고 Unity 원문은 손실 없이 보존한다.
- `ArchitectureSandbox.unity`는 Git 이력에서 추가 커밋 하나만 있어 부모→추가 커밋을 비교했다. 필드 수정 사례 대신 GameObject·Component 추가를 실제 CLI로 검증했고, raw 필드 매핑은 자동화 테스트로 검증했다.
- 개발 기록 인덱스에 기존 `DEV-2026-007` 에셋 작업이 있어 이번 기록 ID를 `DEV-2026-008`로 조정했다.
- `quick_validate.py` 실행 환경에 PyYAML이 없어 `/private/tmp/unity-vcs-validator-deps`에만 설치해 검증했다. 프로젝트 의존성은 바뀌지 않았다.

# 결정 사항

## DEC-001: 관측 계층과 완료 검증 티어를 별도 축으로 유지

### 맥락

기존 plan-gate의 티어는 작업 위험도와 필수 테스트를 뜻하고, 대화에서 정의한 E1–E4는 증거가 관측한 상태와 주장 상한을 뜻한다.

### 검토한 선택지

- 기존 `evidence-analysis`에 Unity CLI 명령을 직접 반복한다.
- `unity-vcs-evidence` 공용 계층을 두고 기존 스킬이 호출한다.
- pre-commit에서 즉시 강제한다.

### 결정

V0–V2 완료 검증 티어와 E1–E4 관측 증거 계층을 모두 유지한다. `unity-vcs-evidence`는 E1의 Scene·Prefab 증거 수집 실행을 소유한다.

### 영향

- 작업 위험도와 주장 가능 범위를 혼동하지 않는다.
- Unity CLI beta 출력과 안전 경계를 한 곳에서 관리한다.
- 초기에는 agent workflow에서만 적용하며 Git hook 강제는 후속 실측 뒤 판단한다.

# 변경 내용

- Unity CLI를 전역 `1.0.0-beta.8`로 갱신했다.
- `unity-vcs-evidence` 스킬과 Node 공용 실행 계층을 추가했다. `diff`, `conflicts`, `explain`만 허용하고 beta.8·JSON·비대화형 실행을 강제한다.
- Unity 원본 JSON과 최소 정규화 뷰를 함께 출력하고, CLI 프로세스 또는 JSON 의미 실패를 비정상 종료로 전달한다.
- 관측 계층 E1–E4와 완료 검증 티어 V0–V2를 별도 축으로 정의하고 `evidence-analysis`, `plan-gate`, `plan-critic`, `verifier`, `unity-so-readout`에 라우팅을 연결했다.
- `Docs/Tech-Stack.md`에 uloop·Unity VCS·Pipeline의 역할 경계와 조사–계획–구현–검증 루프를 기록했다.
- Scene·Prefab 에셋, Pipeline 패키지, Git hook, Unity 런타임 아키텍처는 변경하지 않았다.

# 검증

| 요구사항 | 관측 계층 | 명령·결과 |
| --- | --- | --- |
| beta.8 사용 가능 | E1 | `unity --version` → `1.0.0-beta.8` |
| 읽기 전용 공용 계층 | E1 | Node 테스트 7/7 통과; `resolve`·비 Scene/Prefab·출력 형식 재정의 거부 |
| 실제 의미 단위 diff | E1 | `unity-vcs-evidence.js diff ... --from ba3554f^ --to ba3554f` → 32 changes, Player/Rigidbody2D 식별, `uncertainMatches: 0`, `valuesTruncated: false` |
| 기존 하네스 회귀 없음 | 정적 | `node --test .codex/hooks/tests/*.test.js` → 27/27 통과; `git diff --check` 통과 |
| 스킬 형식 | 정적 | `quick_validate.py` → 수정·신규 스킬 6개 모두 `Skill is valid!` |
| Unity 프로젝트 건전성 | E3 | `uloop compile` → ErrorCount 0, WarningCount 0; EditMode 8/8; Error Console 0 |

완료 검증 티어 **V2**, 사용한 관측 계층 **E1·E3**. E2·E4는 이번 변경이 Editor 메모리 조작이나 대상 Player 동작을 추가하지 않아 요구하지 않았다.

# 최종 결과

PASS. Scene·Prefab 저장 변경을 Unity 의미 단위 E1 증거로 수집하는 읽기 전용 공용 계층을 도입했고, 기존 조사–계획–구현–검증 하네스가 이를 사용하도록 연결했다. V0–V2와 E1–E4는 서로 대체하지 않고 각각 검증량과 관측 범위를 표현한다.

# 후속 작업

- [ ] beta 안정화 후 pre-commit 강제 여부 재검토
- [ ] 실제 Prefab variant·override 사례가 생기면 출력 정규화 확장 여부 검토

# 다음 작업에서 재사용할 지식

- Scene·Prefab Git 전후 상태는 `node .agents/skills/unity-vcs-evidence/scripts/unity-vcs-evidence.js diff <path>`로 수집한다.
- 기계 검증에는 Unity 원본 `changedFields` 또는 공용 `normalizedChanges[].fields`의 raw 필드명을 사용한다.
- `uncertainMatches > 0` 또는 `valuesTruncated: true`이면 E1만으로 완료 판정하지 않는다.
- 현재 Editor 상태는 E2(uloop), 실제 동작은 E3/E4를 별도로 추가한다.
