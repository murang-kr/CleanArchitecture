---
id: DEV-2026-010
title: GPT-6 Astra 하네스 마이그레이션
status: completed
verification_tier: V1
plan_review: not_required
date: 2026-09-05
approval_required: true
authorization_basis: 사용자의 B안 명시 승인
approved_at: 2026-09-05
completed_at: 2026-09-05
unity_version: 6000.3.20f1
platform: macOS
tags: [harness, astra, skills, hooks]
---

# 목표

## 배경

사용자가 GPT-5.6 Sol에서 GPT-6 Astra로 주력 모델을 전환하며 하네스 감사를 요청했고, 감사 후 제안한 B안(위험에 따른 절차 축소)을 명시적으로 승인했다. 전역 모델 설정은 이미 `gpt-6-astra`, reasoning `high`, service tier `default`다.

공식 근거: [Astra 마이그레이션](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra), [Codex Hooks](https://learn.chatgpt.com/docs/hooks). Astra가 특정 하네스를 완전히 대체한다는 가정은 하지 않는다. 관측한 중복·충돌을 줄이고 행동 효과는 별도로 평가한다.

## 완료 조건

- 통상적 변경의 중복 승인과 매 요청 작업 게이트 주입을 제거한다.
- 편집 횟수 알림이 도구 결과를 차단·대체하지 않고 스킬 경로를 제외한다.
- 검증량을 변경 대상과 위험에 맞추고 Git 승인·Unity 관측 계약을 보존한다.
- 기존 테스트와 추가 회귀 테스트, 스킬·훅 정적 검사를 통과한다.
- Astra/high의 기존·수정 하네스 비교 증거와 한계를 기록한다.
- 검증된 공통 변경을 Unity-Template에 이식하고 프로젝트 고유 계약을 침범하지 않는다.

# 제약사항

- 기존 Assets·Packages·ProjectSettings 변경과 DEV-009 작업을 보존한다.
- commit·push·reset·revert는 실행하지 않는다.
- 전역 기본 모델은 재작성하지 않는다. 플러그인 캐시·공식 스킬도 수정하지 않는다.

# 계획

사용자가 선택한 B안의 승인 계획:

1. AGENTS.md·plan-gate·socratic-interview의 지시·승인 경계를 정리한다. 승인된 범위의 통상적 구현 판단은 진행하며 범위 확대·중요 계약 변경·명시된 Git 명령에 확인을 집중한다. 대안 개수 의무·모호성 점수를 제거한다.
2. hooks.json의 작업 게이트 주입 등록과 전용 inject-work-gate.js·ambiguity-check.md를 제거한다. edit-loop-guard는 additionalContext 알림으로 변경하고 제외 경로를 맞춘다. invariant-audit는 실제 반복 실패 진단으로 수정한다.
3. plan-gate·verifier·evidence-analysis·개발 기록 양식의 검증 범위를 일치시킨다. Tech-Stack·검증 바인딩에 하네스 Node 검사 경로를 반영한다. SO 스킬의 없는 참조를 정리한다.
4. 기존 로직 수정 V1로 회귀 검증한다. Astra/high에서 기존·수정 하네스의 같은 과제를 비교하고 완료 품질·승인·중복 테스트·시간·토큰을 관측 가능한 범위에서 기록한다.
5. 프로젝트 검증 뒤 템플릿 대응 파일에 공통 변경만 이식한다. 그대로 복사하는 설치 계약은 유지한다.

## 변경 예정 파일

- `AGENTS.md`: 작업 분류·승인 경계의 정본, 자율 작업의 기록 수명주기.
- `.agents/skills/{plan-gate,socratic-interview,invariant-audit,verifier,evidence-analysis,unity-so-readout}/SKILL.md`: 위 계획에 해당하는 절차·참조 수정.
- `.codex/hooks.json`: 작업 게이트 등록 제거, 알림 명칭.
- `.codex/hooks/{inject-work-gate.js,ambiguity-check.md}`: 전용 중복 주입 경로 제거.
- `.codex/hooks/edit-loop-guard.js`: 비차단 출력과 메타 경로 제외.
- `.codex/hooks/tests/edit-loop-guard.test.js`: 기존 편집 가드의 회귀 테스트. 기존 테스트 디렉터리에 추가하며 별도 판정 시스템을 만들지 않는다.
- `.codex/harness-bindings.json`, `Docs/Tech-Stack.md`: 하네스용 검증 명령.
- `Docs/Development-Record-Format.md`: 승인 필요 여부·검증 범위·증거 재사용 기준.
- 이 DEV 기록, `Docs/development-record/Index.md`: 계획·증거·결과의 단일 정본.
- `Unity-Template/project-template/`의 대응 파일: 공통 변경만 이식. 프로젝트 전용 Unity VCS 스킬·아키텍처 검사기는 복사하지 않는다.

## 영향 범위와 Non-goals

향후 에이전트의 작업 분류·승인·검증·편집 알림에 영향을 준다. 게임 코드·씬·asmdef·런타임 흐름은 바꾸지 않으므로 `Docs/Architecture.md` 동시 변경은 필요하지 않다. 새로운 하네스 라우터, 모델 라우팅, API 앱 마이그레이션은 범위 밖이다.

## 구조·소유권 점검

AGENTS.md:5가 작업 분류를, plan-gate가 승인·검증을, edit-loop-guard가 편집 횟수를 소유한다. `rg`로 inject-work-gate → ambiguity-check 및 hooks.json 등록 체인을 확인했다. 기존 소유자 내부 수정과 중복 경로 제거로 진행한다. 새 테스트는 `.codex/hooks/tests/`의 기존 검증 책임을 확장한다. 별도 시스템·소유권 이관 없이 YAGNI·KISS·DRY·SRP를 유지한다.

## 계획 검토

V1 기존 하네스 수정으로 plan-critic 의무 대상이 아니다. 2026-09-05 사용자: “b안으로 진행해”. 추가 승인 없이 이 범위를 실행한다.

## 검증 계획

- 정적 파일·호출 경로는 E1. 실제 Node 테스트 출력으로 훅 동작을 검증한다. Unity E2–E4 또는 실제 Codex 호스트의 통합 실행으로 확대 주장하지 않는다.
- `node --test .codex/hooks/tests/*.test.js .agents/skills/unity-vcs-evidence/scripts/unity-vcs-evidence.test.js`
- 추가 가드 테스트의 수정 전 실패와 수정 후 통과를 보관한다.
- `node --check`로 훅·테스트 구문 검사, hooks.json·bindings JSON 파싱, 스킬 frontmatter 검사, 삭제 경로의 활성 참조 검사, `git diff --check`.
- Git 승인 입력 판정은 실제 Git 변경 없이 실행한다. 프로젝트·템플릿 원본 사본과 보호 대상 해시를 대조한다.
- 격리 작업공간에서 Astra/high 비교 평가. 모델 실행 불가·실측 누락은 결과에서 명확히 구분한다.

## 사람 검수 항목

짧아진 승인·보고 절차의 사용감과 장기 작업에서의 반복 질문 빈도.

# 실행 기록

| 단계 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 감사 | 공식 문서와 로컬 하네스 대조 | 중복 승인·작업 분류, 과도한 검증, 편집 가드 오탐 확인 | 이전 대화의 코드·공식 문서 인용 |
| 기준선 | 기존 하네스 검증 | 테스트 39개 통과, JS 11개·JSON 2개 정상, doctor 경고 없음 | 감사 턴 도구 출력 |
| 승인 | B안 착수 | 프로젝트·템플릿 사본 및 게임 파일 해시 보존 | 임시 작업 디렉터리 |
| 재현 | 실제 편집 가드 본문을 메모리 파일시스템에서 실행 | 새 회귀 테스트 5개 중 2개 실패 | [RED 출력](artifacts/astra-harness/edit-loop-red.txt) |
| 구현 | 승인 경계·검증 범위·중복 주입·편집 알림 수정 | 프로젝트 테스트 44개 통과 | [프로젝트 테스트](artifacts/astra-harness/project-tests.txt) |
| 이식 | 프로젝트 고유 검사를 보존하고 템플릿 공통 변경 이식 | 템플릿 테스트 5개 통과 | [템플릿 테스트](artifacts/astra-harness/template-tests.txt) |
| 평가 | 독립 Astra/high 2개에 같은 요청 6종 적용 | 관측 표본에서 양쪽 모두 요청 경계 준수 | [행동 평가](artifacts/astra-harness/behavior-evaluation.json) |
| 최종 대조 | 소스·설정·게임 파일·스킬 검사 | 게임 파일 4,182개 해시 동일, 정적 검사 통과 | [검증 보고서](artifacts/astra-harness/verification.json) |

# 발견 사항

- 편집 가드는 실패 여부를 읽지 않고 파일별 서로 다른 턴 수를 센다. 같은 턴의 반복 실패 탐지기로 사용해서는 안 된다.
- 기존 block 출력은 완료된 도구 결과를 대체한다. Node VM 격리 실행에서 정상 3턴과 `.agents` 경로에 block이 나왔다.
- 템플릿은 Git 저장소가 아니며 프로젝트 전용 문서·Unity VCS 확장과 다르다.
- 기존 Tech-Stack은 uloop 명령과 batch mode 바인딩이 동일하다고 적었으나 실제 값이 달라 이번 검증 경로 정리에서 구분했다. 기존 batch mode compile·test 값은 보존했다.
- 공식 quick_validate.py는 호스트 PyYAML 부재로 실행되지 않았다. 설치를 추가하지 않고 Ruby YAML 파서와 동일한 이름·description·허용 키·미완성 placeholder 조건으로 17개 스킬을 대체 검사했다.

# 결정 사항

## DEC-001: 기존 소유자 안에서 절차 축소

### 검토한 선택지

- A: 모든 승인 절차를 유지하고 중복·잘못된 참조만 수정. 변경 비용은 낮지만 중단 원인이 남는다.
- B: 프로젝트 계약을 유지하고 통상적 작업의 승인·검증을 축소. 기존 소유자 내부 수정으로 진행하며 경계 준수 평가가 필요하다.
- C: 일반 게이트·진단 절차를 대부분 제거. 변경 비용과 보호 기능 손실 위험이 높다.

### 결정과 영향

사용자가 B를 선택했다. 편집 횟수 카운터는 유지하되 참고 알림으로만 사용하고, 실제 반복 실패 판단은 invariant-audit에 남겼다. 새로운 실패 분류기나 실행 라우터는 추가하지 않았다. 기존 Bash·apply_patch matcher와 command 입력은 공식 호스트 계약에 부합하므로 교체하지 않았다.

템플릿에는 공통 승인·기록·검증 정책만 이식했다. 프로젝트 전용 Commit-Message-Policy·Architecture 계약, Git 검사기, Unity VCS 스킬·래퍼를 새로 복사하지 않았다. Install-Guide의 변경 없는 전체 복사 계약도 유지했다.

# 변경 내용

- AGENTS.md에 작업 분류 예외와 승인 경계를 모으고 요청에 따른 자율 작업의 기록 수명주기를 명시했다.
- plan-gate의 일괄 사전 승인·대안 개수 의무·일괄 컴파일과 verifier의 무조건 재실행을 없앴다. 중요한 계약·소유권 변경, 증거 불일치 및 실패의 검증은 유지한다.
- socratic-interview의 모호성 점수를 없애고 결과를 크게 바꾸는 요구만 확인한다. evidence-analysis는 주장에 해당하는 검사와 최신 증거 재사용을 명시한다.
- 작업 게이트의 훅 등록과 전용 파일 2개를 제거했다. 편집 훅은 additionalContext만 출력하고 .agents를 제외한다. 같은 턴의 반복 실패 탐지기로 과장하지 않는다.
- SO 스킬의 없는 uloop-execute-dynamic-code 참조를 실제 도구 확인 안내로 교체했다.
- 개발 기록 양식·Tech-Stack·oracle.harness를 동기화하고 공통 변경을 템플릿에 반영했다.
- 수정한 AGENTS.md·스킬 6개 합산 문자 수: 프로젝트 22,391 → 18,541(17.2% 감소), 템플릿 18,884 → 17,299(8.4% 감소). 문자 수이며 실제 입력 토큰 절감량은 아니다. 스킬 전체가 매 턴 주입되는 것도 아니다. [크기 측정](artifacts/astra-harness/instruction-size.json)

# 검증

## 요구사항별 증거

| 요구사항 | 검증 | 결과 |
|---|---|---|
| 중복 승인·주입 축소 | 활성 지침 잔존 검색, hooks.json → 실행 파일 대조 | 삭제 경로 참조 없음, 등록 훅 6개 → 5개 |
| 편집 결과 보존·스킬 제외 | 실제 훅 본문 실행 회귀 테스트 | 수정 전 실패 2개 → 수정 후 5개 모두 통과 |
| 기존 계약 보존 | 이전 파일과 바이트 대조, 원본 테스트 실행 | Git·아키텍처 검사기, delegation·plan-critic·Unity VCS 보존 |
| 프로젝트 정합성 | Node 테스트·구문·JSON·doctor | 테스트 44개, JS 14개 정상; doctor 경고 없음 |
| 템플릿 이식 | 공통 파일 바이트 일치·독립 테스트 | 테스트 5개, JS 6개 정상; 프로젝트 전용 파일 추가 없음 |
| 스킬 형식 | Ruby YAML 및 frontmatter 조건 검사 | 프로젝트 9개·템플릿 8개 통과 |
| 사용자 기존 변경 보존 | Assets·Packages·ProjectSettings 전체 파일 집합과 해시 대조 | 4,182개 모두 동일; 기존 Architecture.md와 DEV-009도 보존 |
| Astra 행동 비교 | 같은 요청 6종의 독립 실행·산출물 대조 | 관측 사례에서 회귀 없음; 효과 차이 입증 안 됨 |

원본: [검증 JSON](artifacts/astra-harness/verification.json), [스킬 검사](artifacts/astra-harness/skill-validation.json), [Git 승인 입력 5종](artifacts/astra-harness/git-gate-checks.json), [행동 산출물](artifacts/astra-harness/behavior-artifacts.json), [기존 하네스 예제 테스트](artifacts/astra-harness/before-fixture-tests.txt), [수정 하네스 예제 테스트](artifacts/astra-harness/after-fixture-tests.txt).

## 행동 평가 해석과 한계

두 평가 에이전트는 gpt-6-astra/high로 실행했고 각자의 이전·수정 하네스 사본을 읽었다. 오타 수정, 빈 배열 버그, 반복 추가 요청, Editor 미연결 실효값 조회, 공개 계약 변경 계획, 후속 수정과 곁질문을 처리했다. 양쪽 모두 통상적 수정에 승인 질문 없이 진행했으며, 기존 테스트 보존과 미관측 값 보고, 계획 단계의 변경 보류를 지켰다.

소규모 단일 경로 비교이므로 속도·성공률·승인 횟수 개선을 입증하지 않는다. 공통 Codex 상위 지침도 함께 적용된 환경이다. 에이전트 토큰과 모델 전체 실행 시간은 도구가 제공하지 않아 미측정이며 Node 테스트 시간으로 대체하지 않았다. 후속 수정은 후속 요청으로 검사했으며 실제 스트리밍 중간 개입·compaction은 시험하지 않았다.

초기 검증에서는 Codex 앱의 새 세션 훅 신뢰·로딩과 원본 도구 결과 보존까지 통합 실행하지 않았다. 아래 후속 진단에서 동일 설치본 app-server의 첫 턴 인덱스 주입을 추가 검증했다. 원본 도구 결과 보존과 데스크톱 UI 생성 경로 전체의 검증은 여전히 별개다. Unity 코드·에셋 변경이 없어 Unity Editor·Player 검증은 이번 하네스 완료 근거에 포함하지 않는다.

## SessionStart 출력 실패 재현과 수정

- 사용자가 앱 재시작 후에도 누락을 보고한 세션은 `01a06f7c-3421-7c11-af6e-24810624d87e`다. 초기 컨텍스트에 인덱스가 없고 턴 상태는 생성됐다. 앱 로그의 `usedPrewarmedThread=true`만으로 원인을 판단할 수 없었으며, 사전 생성 경로를 사용하지 않는 직접 app-server 검사에서도 실패가 재현돼 재시작·사전 생성 가설을 원인으로 채택하지 않았다.
- 설치된 CLI 0.153.3의 app-server 프로토콜로 `hooks/list` → 임시 `thread/start` → 첫 `turn/start`를 실행했다. 첫 턴까지 진행해야 `hook/started`·`hook/completed`를 관측할 수 있었다. `thread/start`만 확인하거나 롤아웃의 developer 메시지만 검색하는 것으로는 실행 성공·실패를 판별할 수 없었다.
- 수정 전: 다섯 훅 모두 `trusted`·`enabled: true`. 닥터와 턴 훅은 `completed`, 인덱스 훅은 실행 후 `failed`였으며 실제 오류는 `hook returned invalid session start JSON output`이었다. 모델은 인덱스 수신 질문에 `NO`라고 답했다.
- 기존 `[development-record]` 접두사의 일반 텍스트가 설치본의 JSON 파싱 경로에서 거부됐다. 일반 텍스트 지원이라는 문서 설명만으로 이 출력을 유효하다고 판정했던 이전 설명을 정정한다. 정확한 첫 문자 분기 구현은 설치본 소스로 확인하지 않았으므로 대괄호 판별 방식 자체는 추정이며, 해당 출력의 JSON 파싱 거부는 실제 오류로 확인했다.
- `development-record-load.js`의 정상·인덱스 없음 출력을 `hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: ...}` JSON으로 감쌌다. 동일한 대괄호 접두사를 쓰는 `harness-doctor.js`의 경고 출력도 JSON으로 감싸고 정상 무출력은 유지했다. 등록 명령과 hooks.json은 이번 수정에서 변경하지 않았다.
- 새 회귀 테스트는 수정 전 5개 중 4개 실패, 수정 후 모두 통과했다. 관련 전체 테스트 49개 및 두 훅의 Node 구문 검사도 통과했다.
- 동일 app-server·동일 요청 재실행에서 시작 훅 2개와 턴 훅 1개 모두 `completed`. 인덱스 훅의 `context` 출력 1,778자가 당시 `Index.md` 전체 본문을 포함함을 코드로 대조했다. 모델은 도구 호출 없이 `YES`로 응답했고 턴도 정상 완료됐다. 수정 후에도 5개 훅은 `trusted`여서 추가 신뢰 변경은 필요하지 않았다.
- 근거: [실행 이벤트와 전후 비교](artifacts/astra-harness/session-start-diagnosis.json), [수정 전 회귀 실패](artifacts/astra-harness/session-start-red.txt), [수정 후 테스트 49개](artifacts/astra-harness/session-start-project-tests.txt). UI에서 생성하는 새 작업을 다시 시험한 것은 아니며, 데스크톱이 사용하는 동일 실행 바이너리의 app-server 첫 턴 경로를 검증했다.

# 최종 결과

B안의 프로젝트·템플릿 변경과 V1 회귀 검증, 제한된 Astra 행동 비교를 완료했다. 승인·관측 계약을 보존하며 결정적으로 재현된 중복 주입·편집 차단 문제를 해결했다. 모델 성능 향상이나 실제 앱 전체 통합 동작까지 검증 완료로 주장하지 않는다.

후속 진단에서는 프로젝트 SessionStart 인덱스의 실제 JSON 파싱 실패를 재현·수정하고 첫 턴 모델 수신까지 확인했다. 이번 출력 수정은 현재 프로젝트에 적용했으며 템플릿에는 아직 반영하지 않았다.

# 후속 작업

2026-09-05 후속 진단: 사용자가 앱 재시작 후에도 SessionStart 인덱스가 누락됨을 보고하고 원인 진단을 명시 요청했다. 기존 승인 범위의 후속 조사로 진행한다. 실패 세션 `01a06f7c-3421-7c11-af6e-24810624d87e`와 별도 CLI/app-server 실행을 대조하여 등록·실행·stdout·컨텍스트 전달을 각각 관측한다. 설정 변경 전 실패 재현을 확보하며 Unity 아키텍처 변경은 없다.

- [x] 프로젝트·템플릿 적용과 검증
- [x] Astra 비교 평가 및 실제 호스트 검증 범위 기록
- [x] 2026-09-05 사용자 요청으로 프로젝트 훅 5개 본문을 검토하고 CLI v0.153.3의 훅 관리 화면에서 신뢰 승인했다. 승인 전 Installed 5 / Active 0 / Review 5였으며, 승인 후 별도 CLI 세션의 `/hooks`에서도 SessionStart 2개·UserPromptSubmit 1개·PreToolUse 1개·PostToolUse 1개가 모두 Active로 유지됨을 확인했다. 훅 정의와 템플릿의 신뢰 상태는 변경하지 않았다. 이 검증은 신뢰 저장·활성 상태에 한정하며 실제 앱의 인덱스 주입·턴 상태 생성·도구 결과 보존 검증과 구분한다.
- [x] 동일 설치본 app-server 첫 턴의 시작 훅 실행·인덱스 컨텍스트 전달과 모델 수신 검증
- [ ] 이후 실제 작업에서 불필요한 질문·반복 검증 빈도와 원본 도구 결과 보존을 관찰한다.
- [ ] 프로젝트에서 수정한 SessionStart JSON 출력을 템플릿에도 반영한다.

# 다음 작업에서 재사용할 지식

- 편집 횟수는 실패 횟수가 아니다. PostToolUse의 block은 관측 알림에 사용하지 않는다.
- 하네스 검증은 oracle.harness를, Unity 변경은 해당 Editor·batch mode 경로를 선택한다.
- 템플릿 이식 시 프로젝트 고유 계약과 공통 정책을 파일 단위로 대조한다.
