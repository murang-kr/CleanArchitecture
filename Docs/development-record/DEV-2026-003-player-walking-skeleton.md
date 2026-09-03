---
id: DEV-2026-003
title: Player 이동 Clean Architecture 세로 슬라이스
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
tags: [player, movement, clean-architecture, asmdef, vcontainer, input-system, physics2d, tests]
---

# 목표

## 배경

게임플레이 코드가 없는 초기 프로젝트에서 모든 Feature의 빈 구조를 먼저 만들지 않고, Player 이동 하나를 Domain부터 View까지 관통시켜 README의 Clean Architecture 의존 규칙을 실제 컴파일과 실행으로 검증한다.

## 완료 조건

- 수평 이동과 접지 점프가 가능한 단일 샌드박스 씬을 만든다.
- Domain, Application, Presentation에서 Unity 엔진 참조를 컴파일 단계로 차단한다.
- Input System, Physics2D, VContainer를 각 경계의 어댑터와 composition root에서 사용한다.
- 이동 판정과 유스케이스의 EditMode 테스트 및 씬 조립의 PlayMode 테스트를 통과한다.
- Unity 컴파일 오류·경고와 Error 콘솔 로그가 없다.

# 제약사항

- Combat, Enemy, Inventory, Map, 외부 에셋은 이번 범위에 포함하지 않는다.
- `Shared`와 범용 이벤트 버스를 미리 만들지 않는다.
- 기존 `InputSystem_Actions.inputactions`의 `Player/Move`, `Player/Jump`를 재사용한다.
- 사용자 승인 없는 git commit이나 push를 수행하지 않는다.

# 계획

1. Player 계층별 asmdef와 Unity 비의존 이동 판정 로직을 구현한다.
2. Input System View, Physics2D Infrastructure, Presentation을 VContainer로 조립한다.
3. 설정 에셋과 ArchitectureSandbox 씬을 생성한다.
4. EditMode·PlayMode 테스트와 실제 입력으로 검증한다.
5. 아키텍처·README·개발 기록을 현재 구현과 동기화한다.

## 변경 예정 파일

- `README.md`: 검증 중인 디렉터리 구조와 현재 구현 상태 갱신
- `Assets/Core/Installer/`: 루트 VContainer composition root 신설
- `Assets/Feature/Player/Domain/`: Unity 비의존 이동 상태와 판정 규칙 신설
- `Assets/Feature/Player/Application/`: 이동 유스케이스와 물리 포트 신설
- `Assets/Feature/Player/Presentation/`: View 명령과 표시 상태 신설
- `Assets/Feature/Player/Infrastructure/`: Physics2D·ScriptableObject 어댑터 신설
- `Assets/Feature/Player/View/`: Input System·SpriteRenderer 어댑터 신설
- `Assets/Feature/Player/Installer/`: Player Feature의 VContainer 등록 신설
- `Assets/Data/Player/PlayerMovementSettings.asset`: 이동 설정 에셋 신설
- `Assets/Scenes/ArchitectureSandbox.unity`: 이동 검증 씬 신설
- `ProjectSettings/EditorBuildSettings.asset`: 검증 씬 등록
- `Assets/Tests/EditMode/Player/`, `Assets/Tests/PlayMode/Player/`: 자동 테스트 신설
- `Docs/development-record/DEV-2026-003-player-walking-skeleton.md`, `Docs/development-record/Index.md`: 계획·실행·결과 정본과 인덱스 갱신

## 영향 범위

- Player 수평 이동·접지 점프와 시각 상태
- ArchitectureSandbox의 입력, Physics2D, VContainer 조립
- 후속 Feature가 참고할 asmdef 의존 기준

## 범위 제외 (Non-goals)

- Combat, Enemy, Inventory, Map, 카메라 추적, 실제 애니메이션, 외부 에셋
- `Shared`, 범용 이벤트 버스, Service Locator, 비동기 씬 로딩
- 코요테 타임, 점프 버퍼, 가변 점프, 벽 이동 등 이동 폴리시 확장

## 구조·소유권 점검

게임플레이 `.cs`, asmdef, 테스트가 없음을 검색으로 확인했으므로 기존 기능 소유자를 우회하지 않고 Player를 최초 소유자로 신설한다. 기존 `InputSystem_Actions.inputactions`의 `Player/Move`, `Player/Jump`는 새 입력 에셋을 만들지 않고 재사용한다. 실제 공통 소비자가 없는 `Shared`는 만들지 않는다.

```text
Player.View → Player.Presentation → Player.Application → Player.Domain
Player.Infrastructure → Player.Application → Player.Domain
Player.Installer → 모든 Player 계층 + VContainer
Core.Installer → Player Installer와 씬의 Unity 어댑터 + VContainer
```

`Player.Domain`, `Player.Application`, `Player.Presentation`에는 `noEngineReferences: true`를 적용한다.

## 계획 검토

`plan-critic`: **OKAY**. 기존 Input Actions, VContainer, Input System, Unity Test Framework, uloop의 실존을 확인했고 모든 신규 경로를 신설 대상으로 명시했다.

## 검증 계획

증거 티어 2로 진행하며 속도 제한, 가속·감속, 점프 가능 조건, 유스케이스에서 모터로의 전달, 씬 로드, VContainer 조립을 자동 검증한다.

```bash
uloop compile
uloop run-tests --test-mode EditMode --filter-type all
uloop run-tests --test-mode PlayMode --filter-type all
uloop get-logs --log-type Error --max-count 100
```

## 사람 검수 항목

- 수평 이동 반응과 정지 감각
- 점프 높이와 반응성
- 실제 키보드·게임패드 바인딩 체감
- 목표 화면 비율에서 플레이스홀더 가시성

# 실행 기록

| 시각 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 21:14 | Player 6계층, Core Installer, EditMode·PlayMode 테스트 생성 | 성공 | `Assets/Feature/Player/`, `Assets/Core/Installer/`, `Assets/Tests/` |
| 21:15 | 첫 Unity 컴파일 | 실패 후 해소 | `GameLifetimeScope.cs`가 네임스페이스 없는 기본 stub인 실제 파일 상태를 발견해 승인된 구현으로 복원; 이후 Error 0, Warning 0 |
| 21:17 | 설정 에셋과 ArchitectureSandbox 씬 생성 | 성공 | `Assets/Data/Player/PlayerMovementSettings.asset`, `Assets/Scenes/ArchitectureSandbox.unity` |
| 21:18 | 최초 자동 테스트 | 성공 | EditMode 8/8, PlayMode 1/1 |
| 21:19 | 런타임 collider bounds 검사 | 문제 발견 후 해소 | 내장 UISprite의 native size 때문에 0.16배 크기로 생성됨; SpriteRenderer와 BoxCollider2D에 명시 크기 적용 |
| 21:22 | 실제 D 입력 0.5초 | 성공 | x 위치 0에서 3.238로 이동, 입력 종료 후 velocity 0, grounded true |
| 21:24 | 점프 PlayMode 기능 테스트 강화 | RED→GREEN | 첫 FixedUpdate의 접촉 캐시를 관측한 뒤 0.5초 제한 내 실제 접촉 해제를 기다리도록 시간 모델 수정 |
| 21:26 | 최종 티어 2 검증 | 성공 | compile 0/0, EditMode 8/8, PlayMode 1/1, Error 로그 0 |
| 21:29 | verifier 독립 재검증 | PASS | compile 0/0, EditMode 8/8, PlayMode 1/1, Error 로그 0; 범위 밖 자동 생성 설정 복원 |

# 발견 사항

- `CompilationPipeline.GetAssemblies()`에는 모든 신규 소스가 포함되어 있었지만, 첫 컴파일 시 `GameLifetimeScope.cs`의 실제 내용은 계획한 구현이 아닌 네임스페이스 없는 기본 stub이었다. 파일 본문을 다시 확인한 뒤 복원해야 했다.
- Unity 내장 `UI/Skin/UISprite.psd`의 native world size는 1유닛 정사각형으로 가정할 수 없다. 플레이스홀더에서도 `SpriteRenderer.size`와 `BoxCollider2D.size`를 명시해야 시각과 물리가 일치한다.
- 점프 속도를 적용한 첫 FixedUpdate 직후에는 `Collider2D.IsTouchingLayers`가 이전 접촉을 한 프레임 더 보고할 수 있다. PlayMode 테스트는 임의 프레임 수가 아니라 제한 시간 내 실제 상태 전이를 관측해야 안정적이다.

# 결정 사항

## DEC-001: 수평 기능별 골격 대신 Player 세로 슬라이스를 먼저 구현

### 맥락

README의 Feature 구조는 제안 단계였고 게임플레이 코드와 테스트가 없었다. 전체 Feature와 빈 계층을 먼저 만들면 실제 의존 문제를 검증하지 못한 채 추상화만 늘어날 위험이 있었다.

### 검토한 선택지

- 모든 Feature와 계층의 asmdef를 먼저 생성
- Player 이동 하나를 모든 계층으로 구현
- MonoBehaviour 프로토타입을 먼저 만든 뒤 리팩터링

### 결정

Player 이동을 Domain부터 View까지 관통하는 세로 슬라이스로 구현했다. 이후 Feature도 실제 유스케이스가 생길 때만 필요한 계층을 추가한다.

### 영향

- 의존 방향, DI, Unity 어댑터, 테스트 전략을 실행 가능한 기준 구현으로 확보했다.
- 아직 두 Feature가 공유하는 계약이 없으므로 `Shared`는 생성하지 않았다.

## DEC-002: 프레임워크 채택은 실제 문제 발생 시점으로 제한

### 맥락

설치된 기술을 한 번에 모두 사용하면 Player 이동과 무관한 추상화가 생긴다.

### 검토한 선택지

- R3와 UniTask까지 첫 슬라이스에 모두 사용
- VContainer와 Input System만 현재 문제에 사용하고 나머지는 연기
- 프레임워크 없이 구현

### 결정

DI에는 VContainer, 입력에는 Input System을 사용했다. R3는 관측 가능한 UI 상태 흐름이 생기는 전투 HUD 단계로, UniTask는 비동기 씬 로딩 단계로 연기했다.

### 영향

- 첫 슬라이스의 책임과 의존성이 작고 명확하다.
- 후속 기능에서 기술 도입 시 해당 Feature의 계획과 테스트가 별도로 필요하다.

# 변경 내용

- Player의 Domain, Application, Presentation, Infrastructure, View, Installer 어셈블리와 코드를 추가했다.
- Core의 `GameLifetimeScope` composition root를 추가했다.
- Player 이동 설정 ScriptableObject와 ArchitectureSandbox 씬을 추가하고 빌드 씬 목록 첫 항목으로 등록했다.
- 이동 판정·유스케이스 EditMode 테스트 8개와 씬·DI·착지·점프 PlayMode 테스트 1개를 추가했다.
- 계층 책임과 asmdef 참조 계약을 이 개발 기록의 승인 계획에 보존했다.
- README의 디렉터리 구조 상태와 현재 구현 상태를 갱신했다.

# 검증

- `uloop compile`: `Success: true`, `ErrorCount: 0`, `WarningCount: 0`
- `uloop run-tests --test-mode EditMode --filter-type all`: 8 passed, 0 failed
- `uloop run-tests --test-mode PlayMode --filter-type all`: 1 passed, 0 failed
- `uloop get-logs --log-type Error --max-count 100`: `TotalCount: 0`
- 실제 Input System D 입력 0.5초: Player x 위치 `0 → 3.238`, 입력 종료 후 수평 속도 `0`, 접지 `true`
- Game View 캡처: `.uloop/outputs/Screenshots/Rendering_20260903_212322_333.png`

# 최종 결과

Player 이동·점프의 첫 Clean Architecture 세로 슬라이스와 실행 가능한 샌드박스를 완성했다. asmdef 의존 규칙, VContainer 조립, Unity 어댑터 및 자동 테스트가 모두 최종 검증을 통과했다.

# 후속 작업

- [ ] 사람이 이동 응답성, 점프 높이, 키보드·게임패드 체감을 검수한다.
- [ ] 검수 결과를 반영해 최소 이동 폴리시 범위를 결정한다.
- [ ] 플레이어와 타일 크기에 맞는 무료 에셋을 라이선스 기준으로 조사한다.
- [ ] 다음 세로 슬라이스로 기본 전투를 계획한다.

# 다음 작업에서 재사용할 지식

- 새 asmdef를 대량 추가한 직후 타입을 못 찾으면 실제 파일 본문과 `CompilationPipeline.GetAssemblies().sourceFiles`를 함께 확인한다.
- 플레이스홀더 스프라이트도 native size를 가정하지 말고 renderer와 collider 크기를 명시한다.
- Physics2D 접촉 상태 전이는 고정 프레임 수보다 제한 시간 내 상태 변화로 테스트한다.
- 후속 Feature는 이 기록의 Player asmdef 의존 계약을 기준으로 삼되 빈 계층은 만들지 않는다.
