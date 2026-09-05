---
id: DEV-2026-009
title: Treasure Hunters 플레이 데모
status: completed
verification_tier: 2
plan_review: okay
date: 2026-09-04
approved_at: 2026-09-04
completed_at: 2026-09-05
approval_required: false
authorization_basis: 2026-09-05 PPU 32·Scale 1 수정 요청에 이어 5번 씬 통합 커밋 한 건과 새 세션 인계를 명시적으로 승인; 후속 리팩터링과 push는 제외
unity_version: 6000.3.20f1
platform: macOS arm64
related_issue:
related_commit:
tags: [player, animation, tilemap, scene, treasure-hunters]
---

> 이 문서는 승인된 계획, 실행 기록, 검증, 최종 결과를 함께 관리하는 단일 정본이다. 별도 계획 문서를 만들지 않는다.

# 목표

## 배경

Player 이동·점프 세로 슬라이스는 구현됐지만 `ArchitectureSandbox`의 Player와 환경은 런타임 placeholder로 표시된다. 가져온 Treasure Hunters 원재료를 게임 소유 AnimationClip·AnimatorController·Tile과 씬 구성으로 조립해 실제로 조작 가능한 작은 데모가 필요하다.

## 완료 조건

- Palm Tree Island 배경·타일로 지면과 플랫폼이 보이는 16:9 데모 씬이 구성된다.
- Captain Clown Nose with Sword의 Idle·Run·Jump·Fall·Land가 10 FPS로 재생된다.
- 기존 Player 이동 흐름이 Animator 표현을 구동하며 착지 신호가 한 번만 발생한다.
- Play Mode에서 A·D·Space 입력으로 좌우 이동과 점프가 실제로 확인된다.
- EditMode·PlayMode 테스트, Unity 컴파일, Console, Scene E1 계약과 아키텍처 검사가 통과한다.
- 최종 Game View 스크린샷으로 결과를 확인할 수 있다.

# 제약사항

- ThirdParty PNG 바이트는 수정하지 않고 Unity import metadata만 대상 파일에 한정해 갱신한다.
- 기존 Domain·Application 이동 판정과 VContainer composition 참조를 유지한다.
- 공격·피격, 새 이동 능력, 카메라 추적, UI, Player Prefab과 Tile Palette는 만들지 않는다.
- Animation 상태를 물리 컴포넌트에서 다시 판정하지 않고 기존 Presentation 상태를 사용한다.
- 사용자 승인 없이 commit이나 push를 수행하지 않는다.

# 계획

1. 대상 캐릭터·배경·Terrain import 설정을 PPU 32, Point, 무압축, mipmap 해제로 맞추고 Terrain을 32×32 Grid로 분할한다.
2. Idle·Run·Jump·Fall·Land AnimationClip과 `CaptainLocomotion.controller`를 `Assets/Content/Game`에 생성한다.
3. `PlayerViewState`, `PlayerPresenter`, `PlayerVisualView`를 확장해 기존 이동 결과가 Animator를 구동하고 착지 순간이 한 번만 전달되게 한다.
4. Presentation 테스트 참조를 추가하고 착지 pulse EditMode 테스트와 데모 PlayMode 검증을 작성한다.
5. uloop Editor API로 `ArchitectureSandbox`의 placeholder 환경을 Palm Tree Island 배경·Tilemap·충돌 영역으로 교체하고 Player·Camera를 구성한다.
6. `Architecture.md`, 개발 기록과 인덱스를 갱신하고 V2 검증과 자동 입력·스크린샷을 수행한다.
7. 사용자 캡처와 원본 Sprite bounds를 대조해 공통 PPU와 화면 구성 오류를 진단한다.
8. 당시 타일·배경·캐릭터는 PPU 32를 유지하고 Player의 물리 루트와 2배 시각 자식을 분리했다. 이 배율 결정은 후속 Scale 1 요청으로 폐기했다.
9. Camera에 URP Pixel Perfect Camera를 384×216 기준으로 구성하고 배경을 원본 크기 레이어로 다시 조립한다.
10. 수정된 화면에서 A·D·Space 입력, 씬 계약, 자동 테스트와 최종 스크린샷을 다시 검증한다.

## 변경 예정 파일

- 대상 Captain Sword·Palm Tree Island PNG `.meta`: 프로젝트 import 설정
- `Assets/Content/Game/Player/Animations/*.anim`: 10 FPS 이동 AnimationClip
- `Assets/Content/Game/Player/Animator/CaptainLocomotion.controller`: 이동 시각 상태 머신
- `Assets/Content/Game/Environment/Tiles/*.asset`: 데모에서 사용하는 Palm Terrain Tile
- `Assets/Feature/Player/Presentation/PlayerViewState.cs`: 착지 순간 표시 상태
- `Assets/Feature/Player/Presentation/PlayerPresenter.cs`: 공중에서 접지로 바뀌는 착지 pulse 계산
- `Assets/Feature/Player/View/PlayerVisualView.cs`: Animator 파라미터와 방향 반전 적용
- `Assets/Tests/EditMode/Player/CleanArchitecture.Player.EditModeTests.asmdef`: Presentation 테스트 참조
- `Assets/Tests/EditMode/Player/PlayerPresenterTests.cs`: 착지 pulse 판정 테스트
- `Assets/Tests/PlayMode/Player/PlayerMovementSmokeTests.cs`: 실제 데모 조립, AnimationClip, Pixel Perfect와 시각 자식 검증
- `Assets/Scenes/ArchitectureSandbox.unity`: 원본 크기 배경·전경 야자수·Tilemap·충돌·Player 시각 자식·Pixel Perfect Camera 구성
- `Docs/Architecture.md`: 어셈블리 간선과 Player 시각 흐름·씬 composition 갱신
- `Docs/development-record/DEV-2026-009-treasure-hunters-playable-demo.md`: 계획·실행·검증 정본
- `Docs/development-record/Index.md`: DEV-009 포인터

## 영향 범위

- Player 표시 상태와 View 렌더링
- ArchitectureSandbox 씬의 외형·충돌·카메라
- Player EditMode·PlayMode 테스트 의존과 검증 범위
- 향후 전투 Animation을 추가할 Animator 기반

## 범위 제외 (Non-goals)

- 공격·피격·검 투척 구현
- 코요테 타임·입력 버퍼·벽 점프 등 이동 규칙 변경
- 카메라 추적과 방 전환
- Player Prefab과 Tile Palette 편집 도구
- 전체 Treasure Hunters 에셋 import 설정 일괄 변경

## 구조·소유권 점검

- 이동 결과의 표시 상태는 기존 `PlayerPresenter`와 `PlayerViewState`, Unity 표현은 기존 `PlayerVisualView`가 소유하므로 새 Animation View를 병렬 신설하지 않는다.
- ThirdParty는 원재료만 소유하고 AnimationClip·AnimatorController·Tile은 기존 `Assets/Content/Game` 경계가 소유한다.
- Terrain 전체 85칸 중 실제 데모에 필요한 Tile만 생성해 YAGNI를 지킨다.
- 현재 요청에 없는 Prefab·추적 카메라·공격 상태를 제외해 KISS를 지킨다.
- `PlayerPresenterTests`가 Presentation을 사용하므로 기존 EditMode 테스트 asmdef에 직접 참조를 추가하고 아키텍처 정본의 간선을 함께 갱신한다.

## 계획 검토

- 초기 `plan-critic`은 EditMode 테스트 asmdef가 Presentation을 참조하지 않아 `PlayerPresenterTests`가 컴파일되지 않는 블로커를 발견했다.
- 계획에 `CleanArchitecture.Player.Presentation` 참조와 Architecture 갱신을 추가한 뒤 재검토 결과 `OKAY`를 받았다.
- 사용자에게 Animator 연결 선택지 네 가지를 제시했고 기존 Presenter·VisualView 확장안을 승인받았다.
- 비율 교정 계획의 최초 검토에서는 PlayMode 테스트가 `PlayerVisualView`와 URP `PixelPerfectCamera`를 타입으로 직접 참조하지만 테스트 asmdef에 두 참조가 없다는 블로커를 발견했다.
- 새 런타임 참조를 늘리지 않고 Component의 전체 형식명과 reflection으로 씬 계약을 검사하도록 계획을 고친 뒤 재검토에서 `OKAY`를 받았다.

## 검증 계획

완료 검증 티어는 V2이며 작업 중 하향하지 않는다. 관측은 E1·E2·E3를 사용한다.

- E1: `node .agents/skills/unity-vcs-evidence/scripts/unity-vcs-evidence.js diff Assets/Scenes/ArchitectureSandbox.unity`
- E2: `uloop get-hierarchy`, 동적 읽기로 Player·Animator·import 상태 확인
- E3: `uloop compile`, EditMode·PlayMode 테스트, A·D·Space 자동 입력, Game View rendering screenshot
- `uloop get-logs --log-type Error --max-count 100`
- `node .codex/hooks/architecture-doc-check.js --working-tree`
- `git diff --check`

## Scene 예상 변화 계약

- `Ground`, `Left Platform`, `Right Platform` GameObject 제거
- `Main Camera`의 Transform 위치, Camera 직교 크기·배경과 URP `PixelPerfectCamera` 설정 변경
- `Environment` 아래 원본 크기 Background 레이어·조립식 Front Palm Trees·Grid/Palm Terrain·Collision과 관련 Renderer·Collider 추가
- `Player` Transform 위치와 BoxCollider2D size·offset 변경, 자식 `Visual`에 2배 SpriteRenderer·Animator·`PlayerVisualView` 추가
- Player 루트의 Rigidbody2D·입력·모터 컴포넌트는 유지하고 `GameLifetimeScope.playerVisualView`는 자식 View를 참조

## 사람 검수 항목

- 픽셀 아트의 구도·선명도와 배경·타일 조화
- Idle·Run·Jump·Fall·Land 전환의 자연스러움
- 실제 키보드 조작 시 이동 가속과 점프 높이 체감

# 실행 기록

| 시각 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 23:24 | 승인 계획 기록 | 성공 | 사용자 구현 시작 승인, 수정 계획 `plan-critic` OKAY |
| 23:29 | 대상 스프라이트 import 설정 | 성공 | Captain 17장·배경/야자수 4장·Terrain 1장에 PPU 32, Point, 무압축, mipmap 해제 적용 |
| 23:31 | 게임 소유 에셋 조립 | 성공 | 10 FPS AnimationClip 5개, AnimatorController 1개, Terrain Tile 3개 생성 |
| 23:33 | 데모 씬 구성 | 성공 | `Environment` 배경·장식·Tilemap·충돌과 Captain Player·16:9 Camera 구성 |
| 23:40 | 최초 자동 조작 점검 | 수정 필요 | 긴 좌측 입력으로 유한 지면 밖 낙하를 확인하고 좌·우 경계 Collider 추가 |
| 23:49 | 최초 점프 표현 점검 | 성공 | Space 입력, Rigidbody2D 상승, 초기 Land에서 Jump로 전환되는 경로 확인 |
| 23:52 | Scene E1·계층 E2 점검 | 성공 | 의미 변경 61건, 값 잘림 없음, 19개 노드의 최종 계층 확인 |
| 23:54 | 컴파일·자동 테스트 | 성공 | 컴파일 오류/경고 0, EditMode 8/8, PlayMode 1/1 |
| 23:59 | 최종 A·D·Space 자동 검증 | 성공 | D/A 위치 변화·좌우 반전, Space Presenter 도달·상승·Jump 상태 확인 |
| 00:01 | 하네스 최종 검사 | 성공 | Console 오류 0, Architecture 검사와 `git diff --check` 통과 |
| 01:13 | 비율·배경 교정 재개 | 진행 중 | 사용자 캡처와 실제 Sprite bounds·Camera 월드 크기, Unity 공식 Pixel Perfect 지침을 대조하고 수정 승인 수신 |
| 01:17 | 비율 교정 계획 검토 | 성공 | 누락 asmdef 참조 블로커를 reflection 기반 씬 계약으로 해소하고 `plan-critic` 재검토 `OKAY` |
| 01:20 | 추가 원재료 import 설정 | 성공 | Sky·Water·Cloud·Water Reflect·Front Palm을 PPU 32, Point, 무압축으로 설정하고 Palm parts 9칸 분할 |
| 01:23 | 씬 비율과 배경 재구성 | 성공 | 384×216 Pixel Perfect Camera, Player `Visual` 2배, 원본 크기 배경 레이어와 Front Palm 조립 |
| 01:25 | 교정 화면 시각 점검 | 성공 | 768×432 정수배 Game View에서 동일 픽셀 밀도와 전체 배경 프레이밍 확인 |
| 01:27 | 최종 A·D·Space 입력 점검 | 성공 | 좌우 위치·방향 반전과 점프 큐 전달, 수직 속도 10.31 확인 |
| 01:29 | 회귀 테스트 | 성공 | 컴파일 오류/경고 0, EditMode 8/8, PlayMode 1/1 |
| 01:30 | 최종 Scene E1·E2 점검 | 성공 | 의미 변경 97건, 불확실 매칭 0, 값 잘림 없음, Environment 25개 노드와 설정값 확인 |
| 01:48 | V2 독립 완료 검증 | 성공 | `verifier` PASS; 최신 접지 높이 assertion 포함 컴파일·테스트·E1·E2·E3 재실행 |

# 발견 사항

- 대상 캐릭터 PNG는 64×40, Terrain은 544×160으로 17×5 Grid에 정확히 맞는다.
- 대상 에셋은 현재 PPU 100·Bilinear·Compressed라 픽셀 데모용 import 갱신이 필요하다.
- 현재 `ArchitectureSandbox`는 6개 root와 placeholder 환경으로 구성되며 HEAD 대비 Scene 변경은 없다.
- 화면 양끝에 충돌 경계가 없으면 자동 입력처럼 키를 길게 누를 때 유한 지면 밖으로 이탈할 수 있어 데모 범위 경계가 필요하다.
- Terrain은 32×32·PPU 32라 1×1 Grid 셀과 일치하지만 Captain PNG의 64×40 캔버스 안 실제 불투명 영역은 대략 37×28px라 같은 Transform 배율에서는 타일보다 작게 보인다.
- 기존 Camera는 20×11.25 world unit을 표시했고 384×128 배경을 2배 확대해도 24×8만 채워 세로 여백과 큰 단색 띠가 생겼다.
- 에셋 페이지는 PNG·Sprite Sheet와 10 FPS를 제공하지만 Unity PPU나 카메라 값을 지정하지 않는다. PPU는 출처가 아닌 프로젝트의 공통 월드 스케일 계약으로 정해야 한다.
- Player 루트 전체를 키우면 Collider와 이동 공간도 함께 바뀐다. 물리 루트는 scale 1로 두고 `Visual`만 2배로 키우면 캐릭터 체형을 보정하면서 이동 로직과 속도를 유지할 수 있다.

# 결정 사항

## DEC-001: 기존 표시 경로가 Animator를 소유

### 맥락

Animator 상태를 새 컴포넌트나 Rigidbody 직접 조회로 만들면 기존 Presentation 결과와 표시 판정이 중복된다.

### 검토한 선택지

- 기존 `PlayerPresenter`와 `PlayerVisualView` 확장
- 별도 `PlayerAnimationView` 신설
- `Animator.Play` 직접 상태 전환
- StateMachineBehaviour에서 Rigidbody 직접 조회

### 결정

기존 Presenter가 착지 pulse를 만들고 기존 VisualView가 Animator 파라미터를 갱신한다.

### 영향

- 현재 의존 방향과 시각 표현 소유권이 유지된다.
- Animator 파라미터 이름은 View와 Controller 사이의 Unity 전용 계약이 된다.

## DEC-002: 공통 PPU와 Player 시각 배율을 분리

> 과거 구현 결정이다. 2026-09-05 후속 요청에서 사용자가 픽셀 아트 Scale 1 고정을 명시했으므로, 2배 시각 배율은 앞으로 적용할 기준에서 제외한다. 아래 추가 조사에 현재 위반 상태와 수정 대상을 기록했다.

### 맥락

모든 Sprite에 같은 PPU 32를 적용해도 Captain의 불투명 픽셀 영역이 타일 한 칸보다 작고, 배경 Transform을 2배로 확대하면 16:9 카메라를 정확히 채우지 못했다. 시각 크기 보정이 물리 루트까지 영향을 주면 기존 이동과 충돌 계약도 달라진다.

### 검토한 선택지

- Captain만 더 낮은 PPU로 다시 import
- Player 루트 Transform 전체 확대
- 공통 PPU 32 유지 후 시각 자식만 확대

### 결정

당시 데모에 사용한 원재료는 PPU 32를 적용하고 Player 루트 아래 `Visual`을 만들어 2배 확대했다. Camera는 384×216 Pixel Perfect 기준을 사용하고 배경은 원본 크기와 타일링으로 화면을 채웠다.

### 영향

- 임포트 PPU는 같지만 Scale 2인 캐릭터·야자수의 원본 픽셀은 Scale 1인 타일·배경보다 화면에서 2배 크게 표시된다. 종전의 '동일한 픽셀 밀도' 설명은 오류였다.
- 캐릭터의 화면상 체형만 보정되고 Rigidbody2D·Collider·이동 속도는 독립적으로 유지된다.
- 향후 캐릭터를 교체할 때 시각 자식 배율은 아트 디렉션 값으로 재검토해야 한다.

# 변경 내용

- Captain Sword Idle 5장, Run 6장, Jump 3장, Fall 1장, Land 2장과 Palm Tree Island 배경·야자수·Terrain의 import metadata를 픽셀 아트용으로 한정 조정했다. 원본 PNG 바이트는 변경하지 않았다.
- `Assets/Content/Game/Player`에 `Captain_Idle`, `Captain_Run`, `Captain_Jump`, `Captain_Fall`, `Captain_Land` 10 FPS 클립과 `CaptainLocomotion.controller`를 만들었다.
- Animator는 `HorizontalSpeed`, `VerticalSpeed`, `IsGrounded`, `Land` 파라미터로 다섯 상태를 전환한다.
- `PlayerPresenter`가 공중에서 접지로 바뀐 순간만 `JustLanded` pulse를 만들고, `PlayerVisualView`가 방향 반전과 Animator 파라미터 갱신을 담당하도록 기존 표시 경로를 확장했다.
- Palm Terrain 85칸 중 데모에 필요한 왼쪽·가운데·오른쪽 Tile 3개만 게임 소유 에셋으로 만들었다.
- `ArchitectureSandbox`를 Sky·Base·Clouds·Water 원본 크기 배경, 조립식 Front Palm Trees, 지면·플랫폼 Tilemap, 대응 BoxCollider2D와 화면 양끝 경계가 있는 384×216 논리 해상도 플레이 데모로 교체했다.
- Main Camera에 URP `PixelPerfectCamera`를 추가해 PPU 32, 참조 해상도 384×216, `UpscaleRenderTexture`, Point 필터를 적용했다.
- Player의 Rigidbody2D·입력·모터는 scale 1 루트에 유지하고, SpriteRenderer·Animator·`PlayerVisualView`를 자식 `Visual`로 옮겨 2배 시각 배율을 적용했다. `GameLifetimeScope`는 이 자식 View를 참조한다.
- Presenter 착지 pulse EditMode 테스트와 실제 씬의 Tilemap·Animator·5개 10 FPS 클립, Pixel Perfect 설정·시각 계층을 확인하는 PlayMode 검증을 추가했다.
- `CleanArchitecture.Player.EditModeTests`에 Presentation 참조를 추가하고 `Architecture.md`의 현재 구조·시퀀스·씬 composition을 실제 코드에 맞춰 갱신했다.

# 검증

| 계층 | 검증 | 결과 | 근거 |
|---|---|---|---|
| E1 | Scene Git 의미 diff | 통과 | `unity-vcs evidence diff`: 성공, 정규화 변경 97건, 불확실 매칭 0, 값 잘림 없음 |
| E2 | Editor 계층 | 통과 | root 4개, Environment 25개 노드; Background·Front Palm Trees·Grid/Tilemap·Collision 존재 |
| E2 | import 설정 | 통과 | PPU 32, Point, Uncompressed, mipmap false, Terrain 85 sprites와 Front Palm parts 9 sprites |
| E2 | 화면 스케일 계약 | 통과 | Camera 3.375, PPU 32, 384×216, UpscaleRenderTexture; Player root scale 1, Visual local scale 2 |
| E2 | Animator 계약 | 통과 | Idle·Run·Jump·Fall·Land와 5개 10 FPS 클립, 4개 파라미터, Player Controller 할당 확인 |
| E3 | Unity 컴파일 | 통과 | 오류 0, 경고 0 |
| E3 | EditMode 테스트 | 통과 | `CleanArchitecture.Player.EditModeTests` 8/8 |
| E3 | PlayMode 테스트 | 통과 | `CleanArchitecture.Player.PlayModeTests` 1/1 |
| E3 | D 자동 입력 | 통과 | X `-5.00 → -1.42`, `Captain_Run`, 입력 edge 확인 |
| E3 | A 자동 입력 | 통과 | X `-1.42 → -3.85`, `SpriteRenderer.flipX=True` |
| E3 | Space 자동 입력 | 통과 | `PlayerInputView.FixedUpdate`에서 `_jumpQueued=True`, 적용 직후 상승 속도 `10.31` 확인 |
| E3 | Unity Console | 통과 | Error 0건 |
| E3 | 아키텍처 정합성 | 통과 | 7 assemblies, 16 edges, 4 Mermaid blocks matched |
| E3 | Git whitespace | 통과 | `git diff --check` 출력 없음 |
| V2 | 독립 완료 검증 | 통과 | `verifier`가 E1·E2·E3를 재수집해 `PASS — V2` 판정 |

### 시각 증거

- 비율 교정 후 768×432 데모 화면 (로컬 전용·Git 미포함): `artifacts/local/DEV-2026-009/Rendering_20260905_012525_184.png`

## 요구사항-증거 매핑

| 완료 조건 | 자동 증거 | 사람 검수 |
|---|---|---|
| Palm Tree Island 지면·플랫폼·배경 | PlayMode 씬 계층 assertion, E1/E2 Scene 증거 | 최종 Game View 스크린샷 |
| 10 FPS Idle·Run·Jump·Fall·Land | PlayMode 5개 상태·클립명·frameRate assertion | 전환 자연스러움은 후속 수동 검수 |
| 기존 이동 결과가 Animator 구동 | Presenter EditMode 테스트, PlayMode Controller·View 조립 assertion | Run 방향 반전 화면 확인 |
| A·D·Space 실제 입력 | uloop 키 입력 후 좌우 좌표·flipX, 점프 큐·수직 속도 관측 | 실제 키감은 후속 수동 검수 |
| 픽셀 비율과 카메라 보정 | PlayMode PixelPerfect·Visual 계약 assertion, E2 설정값 | 768×432 스크린샷 |
| 하네스와 회귀 검사 | 컴파일, EditMode 8/8, PlayMode 1/1, Console·Architecture·whitespace | 해당 없음 |

# 최종 결과

`ArchitectureSandbox`는 Treasure Hunters 원재료를 사용한 작은 플레이 데모가 됐다. **최종 기준은 전체 픽셀 아트 PPU 32, 모든 Transform Scale `(1,1,1)`, 16:9·384×216 기준의 정수배 출력이다.** 이전 Player·야자수 Scale 2 보정은 제거했다. Captain의 10 FPS 이동 5종과 기존 이동 로직을 유지하고, 원본 크기에 맞춰 발 위치·충돌체·야자수·플랫폼을 조정했다.

전체 텍스처 1,768개·로드된 Sprite 2,985개를 검사했고, EditMode 8개와 PlayMode 1개가 통과했다. 실제 키 입력으로 좌우 이동·점프·중앙 플랫폼 접촉 착지를 확인했다. FHD와 768×432 캡처는 각각 정확한 5배·2배 픽셀 블록이며 같은 384×216 프레임으로 일치한다. 구체적 결과와 기존 접지 판정의 한계는 아래 공통 PPU 적용 결과에 기록한다.

> 위 완료 결과와 V2 검증은 01:48 당시의 구현을 대상으로 한다. 이후 명시된 Scale 1 규칙과 전체 에셋 PPU 통일을 충족했다는 뜻은 아니다.

# 추가 조사: 프로젝트 픽셀 아트 기준

## 요청과 범위

- 2026-09-05 사용자 확정: 게임 화면은 16:9, 주 출력 해상도는 FHD 1920×1080, 픽셀 아트의 Transform Scale 변경은 금지하고 1로 고정한다.
- 사용자 요청: Pixel Frog 원본을 분석해 프로젝트 전체 픽셀 아트에 적용할 PPU를 제안한다.
- 이번 후속의 완료 범위는 원본·현재 상태 조사, PPU 권고와 기록 정정이다. 분석과 문서 정정은 명확히 요청된 범위라 재승인 없이 수행했다. 씬 수정과 전체 임포터 일괄 변경은 수행하지 않았다.

## 조사 계획과 관측

1. 로컬 PNG 1,768개의 캔버스 크기와 저장된 `.meta` PPU를 집계하고 대표 PNG의 알파 영역을 직접 측정한다.
2. Pixel Frog 배포 페이지와 프로젝트 설치본 URP 17.3.0의 PixelPerfectCamera 계산식을 대조한다.
3. Unity Editor에서 현재 카메라와 SpriteRenderer의 local/lossy Scale을 읽기 전용으로 확인한다.
4. 기존 기록의 잘못된 픽셀 밀도 주장을 정정하고 실제 구현과 권고 기준을 분리한다.

## 원본 측정 결과

| 대상 | 원본 PNG 크기 | PPU 판단 근거 |
|---|---|---|
| Palm Tree Island Terrain | 544×160 | 32×32 셀의 17×5 시트 |
| Pirate Ship Terrain and Back Wall | 608×416 | 32×32 규격 시트, 캔버스 19×13셀 |
| Front Palm Bottom and Grass | 96×96 | 32×32 셀의 3×3 시트 |
| Captain Idle Sword 01 | 캔버스 64×40, 알파 영역 37×28 | PPU 32에서 실제 그림 높이 0.875유닛, 32px 타일 높이의 87.5% |
| Front Palm Tree Top 01 | 39×32 | 모든 이미지 크기가 2의 거듭제곱인 것은 아님 |
| BG Image | 384×128 | 가로 384px 기준 구도와 자연스럽게 대응하며, 16:9의 세로 부족분은 배경 레이어로 구성 |
| Ninja Adventure LifePot / GoldCoin | 9×11 / 7×7 | 작은 아이템도 공통 PPU를 사용해야 원본 픽셀의 표시 크기가 같음 |

대표 파일은 `Assets/Content/ThirdParty/PixelFrog/TreasureHunters/`와 `Assets/Content/ThirdParty/PixelBoy/NinjaAdventure/`의 원본 PNG를 Pillow로 읽어 측정했다. Captain 알파 경계는 좌상단 기준 `(20, 4)–(57, 32)`다. 원본 PNG는 변경하지 않았다.

## PPU 권고: 32

PPU는 원본 픽셀을 Unity 월드 거리로 변환하는 비율이며 이미지 해상도나 출력 해상도가 아니다. 32px 타일을 1×1유닛으로 다룰 수 있고 기존 Grid·이동 수치와도 맞는 PPU 32를 권고한다. Pixel Frog가 전체 팩의 공식 Unity PPU를 지정했다는 뜻은 아니다. 확인한 Treasure Hunters 배포 페이지에는 Unity PPU 지정이 없다.

PPU는 반드시 2의 거듭제곱일 필요가 없다. 프로젝트 설치본 `PixelPerfectCamera.assetsPPU`는 양의 정수를 허용한다. 16·32·64는 타일 규격을 월드 단위로 표현하기 편한 선택지이며 이 프로젝트는 32px 타일이 기준이다.

| 공통 PPU | 32px 타일의 월드 크기 | 384×216 기준 카메라 직교 Size | FHD의 타일 표시 크기 |
|---|---|---|---|
| 16 | 2×2유닛 | 6.75 | 160×160px |
| 32 | 1×1유닛 | 3.375 | 160×160px |
| 64 | 0.5×0.5유닛 | 1.6875 | 160×160px |

이 표는 모든 Sprite와 Camera PPU를 함께 바꾸고 Scale 1·같은 기준 해상도를 유지한 경우다. 공통 PPU만 바꿔서는 캐릭터와 타일의 상대 크기를 바꿀 수 없다. 작은 Sprite만 PPU를 다르게 지정하는 것도 금지된 개별 Scale 보정과 같은 픽셀 밀도 불일치를 만든다.

## 권고하는 렌더링 계약

- 모든 게임 픽셀 아트의 Sprite PPU와 PixelPerfectCamera Assets PPU: 32.
- 픽셀 아트 오브젝트·조상의 localScale 및 최종 lossyScale: `(1, 1, 1)`. 애니메이션과 코드로 Scale을 변경하지 않으며 좌우 반전은 `SpriteRenderer.flipX`로 처리한다.
- 화면 비율: 16:9. 기준 해상도: 384×216. FHD 출력: 5배, uloop 768×432 출력: 2배. 개별 오브젝트 확대가 아니라 렌더링된 화면 전체를 정수배 확대한다.
- 카메라 월드 범위: 12×6.75유닛, 직교 Size 3.375. FHD에서 32px 타일은 160px, Captain Idle의 실제 그림 높이 28px는 140px로 표시된다.
- 고정된 구도와 정수배를 모두 유지하려면 `UpscaleRenderTexture`와 `CropFrame.Windowbox`를 권고한다. 비정수배 해상도에서는 같은 16:9 출력이어도 여백이 생길 수 있다. 예: 1280×720에 3배 적용 시 활성 화면은 1152×648이다. FHD와 768×432에서는 여백이 없다.
- Point 필터·무압축·mipmap 해제·원본 NPOT 크기 유지. 패턴이 있는 배경을 늘리지 않고 타일링·레이어 조립으로 채운다.
- 다른 출처나 AI 생성 에셋도 동일 PPU를 적용한다. 같은 PPU라도 원본에 이미 확대된 픽셀 블록이 있으면 아트 자체의 해상도 정합성을 별도로 확인한다.
- 픽셀 UI는 PPU만으로 화면 크기가 정해지지 않으므로 UI 레이아웃과 표시 배율도 같은 원본 픽셀→화면 픽셀 계약에 맞춘다. 개별 아이콘 Stretch로 크기를 보정하지 않는다.

## 적용 전 상태와 차이 (13:12 조사 당시)

13:12 기준 읽기 전용 조사 결과:

- 저장된 `.meta`: Treasure Hunters 1,204개 중 PPU 32는 27개, PPU 100은 1,177개. Ninja Adventure 564개는 모두 PPU 100이다. 전체 통일 시 현재 PPU 100인 1,741개가 변경 대상이다.
- Editor: Camera PPU 32, Reference 384×216, `UpscaleRenderTexture`, `CropFrame.None`, 직교 Size 3.375.
- Editor: `Player/Visual`, 좌우 Front Palm의 `Trunk`와 `Crown` 등 5개 SpriteRenderer는 local/lossy Scale이 모두 `(2, 2, 1)`로 새 규칙에 어긋난다.
- `PlayerMovementSmokeTests`는 현재 Visual Scale 2를 기대한다. 새 규칙을 적용할 때 Scale 1과 실제 접지 정렬을 검증하도록 함께 바꿔야 한다.
- Scale 1 적용은 시각 배율뿐 아니라 발 위치·콜라이더 크기·야자수 조립 간격을 원본 기준으로 다시 맞추는 작업을 포함한다. 소스 이미지의 캔버스 크기로 충돌체를 그대로 지정하지 않는다.
- 이번 조사에서는 Scene·임포터·테스트를 변경하거나 FHD Play Mode 검증을 새로 실행하지 않았다. 위 FHD 표시 크기는 원본 측정치와 설치본의 계산식으로 산출한 값이다.

## 근거

- [Pixel Frog Treasure Hunters 배포 페이지](https://pixelfrog-assets.itch.io/treasure-hunters): 제공 파일 형식·10 FPS 확인, Unity PPU 지정 없음.
- [Unity Sprite import 설정](https://docs.unity3d.com/6000.0/Documentation/Manual/texture-type-sprite.html): PPU의 월드 단위 정의.
- [Unity Pixel Perfect Camera](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/2d-pixelperfect-ref.html): Sprite와 Camera PPU 일치, 기준 해상도·정수 확대·Crop Frame.
- 설치본: `Packages/packages-lock.json`의 URP 17.3.0, `Library/PackageCache/com.unity.render-pipelines.universal@37e06a5b08b3/Runtime/2D/PixelPerfectCamera.cs`의 `assetsPPU`, `PixelPerfectCameraInternal.cs`의 `CalculateCameraProperties`.

# 공통 PPU·Scale 1 적용

## 공통 PPU·Scale 1 적용 계획 (2026-09-05 승인)

사용자가 공통 PPU 32와 Scale `(1,1,1)`을 확정하고 카메라·에셋·씬 전체 수정을 명시적으로 요청했다. 기존 데모의 연속 작업으로 재승인 없이 진행한다.

1. `Assets/Content/`의 픽셀 이미지 1,768개를 PPU 32·Point·무압축·mipmap 해제·원본 NPOT 크기로 통일한다. 기존 Sprite Mode·분할·GUID·원본 PNG는 보존한다.
2. 기존 에셋 임포트 정책을 소유하는 Editor 코드가 없음을 확인했다. `Assets/Editor/PixelArtTexturePostprocessor.cs`에 Content 경로로 한정한 임포트 정책을 추가해 새 에셋도 같은 기준을 적용한다. 런타임 계층과 asmdef 참조는 추가하지 않는다.
3. `ArchitectureSandbox`의 Camera는 384×216·PPU 32·Windowbox로 고정하고 FHD 기본 출력값을 설정한다. Player Visual과 야자수 Scale 2를 제거하고 원본 크기의 발 위치·Collider·줄기 반복 조립을 맞춘다. 현재 점프 높이로 오를 수 있게 플랫폼을 1유닛 높이 차이로 배치한다.
4. PlayMode 검사에 Sprite·부모·Tilemap의 Scale 1과 공통 PPU, Crop 정책, 접지 정렬을 반영한다. 실제 A·D·Space 입력 및 플랫폼 착지, 768×432/FHD 화면을 관측한다.
5. `Architecture.md`, `Asset-Provenance.md`, DEV 기록과 Index를 현재 상태로 갱신한다. 컴파일·관련 테스트·E1 Scene diff·에셋 설정 전수 검사·원본 무변경·문서 검사를 수행한다.

씬 예상 변화: `Main Camera/PixelPerfectCamera`의 `m_CropFrame`, `Player/Transform`의 `m_LocalPosition`, `Player/Visual/Transform`의 `m_LocalScale`·`m_LocalPosition`, `Player/BoxCollider2D`의 `m_Size`·`m_Offset`, Front Palm Transform과 반복 Trunk 추가, Tilemap 셀 및 해당 Collision 위치. 기존 입력·이동 계층과 composition 참조는 유지한다.

신규 핵심 로직은 없으며 이전 데모 검증 증거를 이어 사용하되, 이번에 영향을 받는 임포트·씬·테스트는 새로 검증한다. 동일 테스트의 불필요한 반복 실행은 하지 않는다.

## 적용 결과와 검증 (2026-09-05)

| 대상 | 최종 변경·확인 결과 | 증거 |
|---|---|---|
| 이미지 임포트 | Treasure Hunters 1,204개·Ninja Adventure 564개, 합계 1,768개를 PPU 32·Point·무압축·mipmap 해제·NPOT 원본 유지로 통일 | Editor `TextureImporter` 전수 검사, 로드된 Sprite 2,985개 모두 PPU 32, 원본 대비 해상도 축소·플랫폼 override 0건 |
| 자동 임포트 | `Assets/Editor/PixelArtTexturePostprocessor.cs` 추가. 새 Content 텍스처에도 같은 정책 적용 | 컴파일 후 자동 재임포트가 수행됐고 후속 일괄 적용에서 추가 변경 0건 |
| 원본 보존 | PNG 파일 변경 0개. Sprite Mode·분할·피벗·GUID 보존, 기존 데모 분할 변경은 유지 | `git diff`와 임포터 검사; Multiple 1,743개·Single 25개 |
| Scale | 기존 Scale 2인 Player Visual·야자수 5곳 제거, 야자수 반복 Trunk 4개 추가 | 최종 씬 Transform 33개 local/lossy Scale 오류 0, SpriteRenderer 16개 PPU 오류 0, Scale AnimationCurve 0 |
| Player | Visual Y=-0.0625, BoxCollider2D 0.625×0.875·offset 0, 시작점 (-5,-1.5625) | PlayMode의 지면 접지·발 높이 검사 통과 |
| 환경 | 야자수마다 원본 크기 줄기 3개와 수관 1개. 지면·중앙·좌우 플랫폼 윗면 Y=-2·-1·0 | Editor 씬 저장과 Tilemap/Collider 배치 검증 |
| 카메라 | PPU 32·384×216·Windowbox·UpscaleRenderTexture, 직교 Size 3.375 | FHD `pixelRect=1920×1080`, `pixelRatio=5`; 768×432 `pixelRatio=2` |
| FHD 기본값 | 기존 `PlayerSettings`의 1920×1080 기본값을 확인·유지. 새 ProjectSettings 변경 불필요 | HEAD와 현재 파일 및 Editor 프로퍼티 대조 |
| 자동 테스트 | EditMode 8/8, PlayMode 1/1, Skip·Fail 0, 선행 컴파일 성공 | 13:30 `uloop run-tests`, 최종 Console Error 0 |
| 실제 D·A 입력 | D에서 X 속도 +0.63·flipX=false, A에서 X 속도 -3.13·flipX=true | `PlayerInputView.cs:69` 조건부 pause point, 캡처 입력 +1/-1과 실제 Rigidbody2D 관측 |
| 실제 Space·착지 | 지면에서 Y=-1.55→-0.65 상승, 수직 속도 +7.57. 이후 중앙 플랫폼 접촉·수직 속도 0 | Space 큐 true, 중앙 플랫폼 윗면 -1·발 -0.985·`IsTouching=True` (물리 접촉 여유 약 0.015유닛) |
| 저장 상태 | 편집 모드 복원, Scene dirty=false, Player 시작점 복원, Game View FHD 유지 | 최종 uloop E2 조회 |
| E1 구조 | HEAD→working tree 의미 변경 110개, uncertainMatches=0, valuesTruncated=false | `unity-vcs-evidence.js diff Assets/Scenes/ArchitectureSandbox.unity` |
| 아키텍처 | 런타임 asmdef 7개·간선 16개·Mermaid 4개 유지, Editor 임포트 정책과 현재 composition 설명 갱신 | `architecture-doc-check.js --working-tree` 통과 |

E1은 아직 커밋하지 않은 이전 데모 변경도 포함한다. 이번 추가분에서 Trunk 2·3의 GameObject·Transform·SpriteRenderer 12개와 카메라 보조 컴포넌트 `UniversalAdditionalCameraData` 저장을 확인했다. Player의 `m_Size`, `m_SpriteTilingProperty`, `m_LocalPosition`을 비롯한 변경은 원본 크기와 충돌체 조정에 해당한다. 새로 추가된 객체의 필드 값은 E1 diff에 나열되지 않으므로 저장 후 E2와 PlayMode로 보완했다. 기존 DI 참조·이동 계층은 이번 후속에서 변경하지 않았다.

### 출력 비교

다음 경로는 이 개발 기록 기준이며 모두 로컬 전용·Git 미포함 자료다. 이미지 없이도 아래 검증 수치와 결론을 읽을 수 있도록 관리한다.

- FHD 시작 화면: `artifacts/local/DEV-2026-009/Rendering_20260905_133112_504.png`
- 실제 Space 상승 관측: `artifacts/local/DEV-2026-009/Rendering_20260905_133425_946.png`
- 같은 일시정지 프레임의 FHD: `artifacts/local/DEV-2026-009/Rendering_20260905_133553_045.png`
- 같은 일시정지 프레임의 768×432: `artifacts/local/DEV-2026-009/Rendering_20260905_133553_845.png`

Pillow로 각 캡처를 384×216 최근접 샘플링한 뒤 원래 크기로 복원했다. 두 이미지 모두 원본 캡처와 바이트 단위 RGB 픽셀 차이가 없었고, 두 논리 프레임도 완전히 같았다. 따라서 FHD의 모든 원본 픽셀은 정확히 5×5, 768×432에서는 2×2 블록이다. `Screen.width/height`는 uloop 동적 실행 컨텍스트에서 다른 Editor 영역 크기를 반환한 관측이 있으므로, 출력 증거에는 렌더링 캡처 크기·Camera.pixelRect·PixelPerfectCamera.pixelRatio를 사용했다.

### 발견한 한계와 정리

- 기존 `Rigidbody2DPlayerMotor.ReadState()`는 `IsTouchingLayers`로 접지를 판단하며 바닥 접촉 방향을 구분하지 않는다. 중앙 플랫폼 옆면 근처의 점프 중 Y 속도 +7.57인데 Animator의 IsGrounded=true인 상태를 관측했다. 이로 인해 해당 접촉 프레임의 공중 애니메이션·착지 신호가 부정확할 수 있다. PPU·Scale 문제가 아니며 이동 판정 수정은 이번 범위에 넣지 않았다.
- 중앙→오른쪽 플랫폼 연속 키 입력 시도에서는 오른쪽 플랫폼에 안착한 상태를 확보하지 못했다. 따라서 전체 플랫폼 경로의 플레이 감각이나 전 구간 점프 성공을 검증했다고 주장하지 않는다. 지면→중앙 플랫폼 착지와 기하학적 1유닛 단차까지만 확인했다.
- 관측은 Unity Editor E2/E3다. FHD standalone 빌드(E4)와 향후 UI 출력은 이번에 검증하지 않았다.
- 검증 중 자동 생성된 기본 `SceneTemplateSettings.json`과 `EditorSettings.m_EnterPlayModeOptions` 변경은 작업 범위 밖이므로 제거·복원했다. 사용자 원본 에셋과 기존 변경은 삭제하지 않았다.

# 스크린샷 로컬 보관과 커밋 분리 (2026-09-05)

사용자가 스크린샷을 `Docs/development-record/artifacts/local/`로 옮겨 Git에서 제외하는 정책과 해당 변경의 커밋을 승인했다. `plan-gate`의 기존 목표 연속 작업이며 별도 계획 문서는 만들지 않는다. 이번 커밋은 5개 분리안 중 1번인 스크린샷 관리 정책만 대상으로 하고, 기존 에셋·로직·씬 변경은 후속 커밋에 남긴다.

계획: 미추적 스크린샷 7개의 해시·대상 충돌을 확인하고 `local/DEV-2026-009/`로 이동한다. `.gitignore`와 공용 개발 기록 포맷에 로컬 보관·텍스트 증거 유지 규칙을 추가하고, 이 기록의 기존 이미지 링크를 로컬 경로 안내로 바꾼다. 이동 후 해시·ignore 범위·잔여 이미지 참조·staged 파일 목록과 Git 훅을 검증한다. 이미지 자체를 삭제하거나 Git에 추가하지 않는다.

개발 기록은 아직 미추적 상태이고 이전 데모 전체 내용을 포함하므로 이번 정책 커밋에 통째로 넣지 않는다. 변경된 로컬 경로 안내와 이 실행 기록은 이후 데모 기록 커밋에 포함한다.

결과: 스크린샷 7개를 `artifacts/local/DEV-2026-009/`로 이동했고 이동 전후 SHA-256 7개가 모두 일치했다. 전부 `git check-ignore`에 포함되며 기존 경로의 파일은 남지 않았다. 기존 추적 중 텍스트·JSON 증거 14개는 보존했고, local 밖의 산출물과 게임 PNG가 ignore되지 않음을 음성 검사로 확인했다. 옛 이미지 링크 검색 결과는 0건이다.

`git diff --cached --check`와 구조 변경 게이트가 통과했고 staged 범위가 `.gitignore`, `Docs/Development-Record-Format.md` 두 파일뿐임을 확인한 뒤 `f06a29e` 커밋을 생성했다. commit-msg와 pre-commit을 우회하지 않았다. 스크린샷 바이너리는 커밋에 포함하지 않았으며 삭제하지 않았다. 런타임 코드·씬·임포터는 이번 정책 작업에서 수정하지 않았으므로 Unity 테스트를 반복하지 않았다. 나머지 4개 커밋과 push는 실행하지 않았다.

# 2·3·4번 커밋 실행 (2026-09-05)

사용자가 임포트 설정, 게임 조립 에셋, 플레이어 표현 로직의 세 커밋을 각각 명시적으로 승인했다. 승인 순서대로 세 번의 commit을 수행하며, 5번 씬 통합과 push는 범위에서 제외한다. 기존 작업 파일은 보존하고 staged snapshot의 문서만 각 커밋의 실제 포함 범위에 맞춰 나눈다. 같은 DEV-009 기록에 단계별 계획·결과를 반영하며 별도 계획 문서는 생성하지 않는다.

검증 계획: 2번은 `.meta`의 PPU·필터·압축 설정과 원본 PNG 미포함, 3번은 조립 에셋 및 `.meta`의 참조 준비, 4번은 관련 컴파일·EditMode 테스트를 확인한다. 모든 커밋에서 staged 파일 범위·whitespace·문서 정합성·커밋 메시지 훅을 검사한다. 아직 커밋하지 않을 씬과 PlayMode 테스트의 작업 파일은 변경하지 않는다.

| 순서 | 커밋 | 결과 |
|---|---|---|
| 2 | `a52a5db` 픽셀 아트 임포트 기준을 PPU 32로 통일 | 임포트 .meta 1,768개·Editor 정책 3개·관련 문서 4개, 합계 1,775개 파일 |
| 3 | `44ccbbd` Treasure Hunters 게임 조립 에셋을 추가 | 조립 에셋·메타데이터 21개·관련 문서 3개, 합계 24개 파일 |
| 4 | `9df5b9f` 플레이어 이동 상태와 애니메이션 표현을 연결 | 런타임 3개·테스트 3개·관련 문서 3개, 합계 9개 파일 |

- 단계별 staged 문서에서 아직 반영하지 않은 Scene·PlayMode 내용을 제외했고 각 커밋의 Architecture 검사(7 assemblies·16 edges·4 Mermaid blocks) 및 Git 훅이 통과했다.
- 2026-09-05 14:11 EditMode 재검증: 선행 컴파일 성공, 8/8 통과, Fail·Skip 0. 외부 씬 변경 알림이 컴파일 응답을 막았으나 Ignore로 알림만 닫고 같은 요청이 완료되는 것을 확인했다. 검사는 현재 작업 디렉터리에서 수행했으며 아직 커밋하지 않은 씬의 별도 검증으로 주장하지 않는다.
- 임포트 .meta 1,768개 설정 오류 0건, 조립 AnimationClip 5개의 10 FPS 및 Clip·Controller의 GUID 참조 49개 존재를 확인했다. PNG 원본과 스크린샷은 세 커밋에 포함하지 않았다.
- 테스트 이후 Unity가 .meta에 줄 끝 공백만 다시 기록했다. `git diff --ignore-space-at-eol`로 실질 변경 0건을 확인한 뒤 공백만 정리했다. 2번의 Editor 폴더 .meta에도 같은 공백 정리를 적용했다.
- 5번의 Scene·PlayMode·최종 문서 6개는 미커밋 상태로 보존했다. 이 작업의 결과 기록도 5번 최종 기록에 포함하며 추가 commit·amend·push는 수행하지 않았다.

# 5번 씬 통합 커밋과 새 세션 인계 (2026-09-05)

## 승인 범위와 실행 계획

사용자가 5번 커밋 완료까지만 요청했다. 기존 1~4번 커밋 위에 현재 데모를 기준점으로 보관하며, R3 전환·표현 책임 변경·하네스 개편·push는 이번에 수행하지 않는다. 승인된 작업의 연속이므로 계획 게이트를 반복하지 않는다. 이 절은 기존 DEV-009 안에서 커밋 실행과 후속 인계를 관리하며 별도 계획 문서는 만들지 않는다.

- 대상은 `ArchitectureSandbox.unity`, `PlayerMovementSmokeTests.cs`, `Architecture.md`, `Asset-Provenance.md`, 이 기록과 `Index.md`의 기존 변경 6개 파일이다.
- Scene·런타임·테스트 구현은 더 변경하지 않고 현재 한계와 후속 작업을 문서에 명시한다.
- Scene E1은 `HEAD → working tree`로 비교한다. 기존 placeholder 지면·플랫폼 제거, `Environment` 계층 추가, Camera의 `m_LocalPosition`·`orthographic size`·`m_BackGroundColor`, Player의 `m_LocalPosition`·Collider `m_Size`·`m_Offset`, `Visual` 추가와 composition root의 `playerVisualView` 참조 변경을 기존 최종 Scale 1 계약과 대조한다.
- `uloop run-tests --test-mode PlayMode --filter-type assembly --filter-value CleanArchitecture.Player.PlayModeTests --unsaved-changes fail`로 저장되지 않은 사용자 편집을 덮어쓰지 않고 씬 통합 검사를 수행한다. 선행 컴파일·테스트 결과와 검증 전후 Scene·테스트 해시를 확인한다.
- staged 범위·Architecture 정합성·whitespace·커밋 메시지 훅과 스크린샷 제외를 확인하고 승인된 commit 한 건만 수행한다.

## 검증 결과와 커밋 기준점

- 2026-09-05 14:39 KST: 위 PlayMode 명령의 선행 컴파일 성공, 테스트 1/1 통과, 실패·생략 0, `NoTestsFound=false`를 확인했다. 완료 시각 원문은 `2026-09-05T05:39:30.8380960Z`다. 이후 `uloop get-logs --log-type Error --max-count 100`은 Error 0건을 반환했다. 이번에는 수동 입력·캡처·standalone 검증을 반복하지 않았다.
- Scene E1은 Unity CLI `1.0.0-beta.8`에서 변경 110건(추가 89·제거 14·수정 7), 불확실 매칭 0을 반환했다. Player의 `m_Component`, Collider `m_Size`·`m_SpriteTilingProperty`, Transform `m_Children`·`m_LocalPosition`, Camera의 `m_Component`·`m_BackGroundColor`·`orthographic size`, composition root의 `playerVisualView`, SceneRoots의 `m_Roots` 변경을 확인했다. Camera 위치와 Collider offset은 HEAD 대비 변경 목록에 없으며 이를 변경했다고 주장하지 않는다.
- E1 상위 `valuesTruncated=false`와 달리 Player·Camera의 `m_Component` 및 Collider `m_SpriteTilingProperty` 세 값에는 개별 `truncated=true`가 있었다. 이 항목은 최초 PARTIAL로 취급하고 HEAD·working tree의 해당 필드 블록만 보조 직독해 누락 부분을 대조했다. Player의 기존 시각 컴포넌트 분리, Camera 보조 컴포넌트 추가, Collider의 Sprite 크기·border 캐시 차이로 확인했으며 실효 조립·PPU·Scale·충돌체 크기는 PlayMode 검사로 보완했다. raw 직독만으로 런타임 검증을 대체하지 않았다.
- 검증 전후 SHA-256은 Scene `c52cd1a65f74d61cbfb47d8d52120b014565fda76aa5860f033d15e3b26a6c70`, PlayMode 테스트 `2ef5c1305595b2a4ae7183357ae4833d364a49a9c49656d3e34d1f692d59707d`로 각각 동일했다.
- 검증 중 Unity가 기록한 PNG `.meta` 1,768개의 변경은 `git diff --ignore-space-at-eol`로 실질 차이가 없음을 확인한 뒤 줄 끝 공백만 정리했다. 이 요청 착수 때 없던 `EditorSettings`·`ProjectSettings` 변경과 기본 `SceneTemplateSettings.json` 생성은 검증 부수효과로 대조 후 복원·제거했으며 커밋 대상에 포함하지 않는다. 사용자 에셋이나 스크린샷은 삭제하지 않았다.
- `node .codex/hooks/architecture-doc-check.js --working-tree`는 7 assemblies·16 edges·4 Mermaid blocks 일치를 확인했다. 커밋은 기존 6개 파일과 새 세션 인계 설명으로 한정하며, 이 기록을 포함한 5번 커밋 식별자는 `git log --oneline -- Assets/Scenes/ArchitectureSandbox.unity`로 확인한다. 구현 완료 범위는 현재 이벤트 기반 데모이며 아래 리팩터링은 미구현 상태다.

## 현재 구조의 한계와 정정

- `PlayerPresenter.ViewStateChanged`는 R3가 아닌 C# `event Action<PlayerViewState>`다. `PlayerVisualView.Initialize`가 이벤트를 구독하고 초기 `ViewState`를 별도로 읽으며, `OnDestroy`에서 구독을 해제한다.
- Presentation은 View나 Unity API를 참조하지 않지만, 전달 상태는 속도·접지·방향·착지 pulse다. Idle·Run·Jump·Fall의 선택 조건과 Land 전환은 `CaptainLocomotion.controller`에 남아 있다. 따라서 현재 데모 완료를 사용자가 요구한 R3 기반 수동 View 구조의 완료로 해석하지 않는다.
- [DEV-003 DEC-002](DEV-2026-003-player-walking-skeleton.md#dec-002-프레임워크-채택은-실제-문제-발생-시점으로-제한)에서 HUD 단계로 연기한 것은 R3 도입이다. 표현 상태 선택을 HUD에서 Presentation으로 옮긴다는 계획은 확인되지 않았다. 두 항목을 함께 연기한 것처럼 설명한 이전 답변은 정정한다.

## 새 세션 재개 계약

1. 개편된 현재 `AGENTS.md`와 관련 스킬을 따르고, `Index.md`에서 이 기록의 인계 절과 `Docs/Architecture.md`를 읽는다. 과거 하네스 절차를 그대로 재현하지 않는다.
2. `git status`, `git log`와 실제 `PlayerPresenter`, `PlayerViewState`, `PlayerVisualView`, `PlayerInputView`, `PlayerInstaller`, `CaptainLocomotion.controller`, 관련 asmdef·테스트를 다시 확인한다. R3 설치 버전과 API는 프로젝트 설치본으로 검증한다.
3. 후속 목표는 Presentation이 의미상의 표시 상태를 결정하고 R3 `ReactiveProperty`로 발행하되 View를 모르며, View는 읽기 전용 상태 흐름을 구독하여 Unity 출력만 적용하도록 책임을 정리하는 것이다. 이 커밋에서 해당 구현을 시작하지 않는다.
4. 실제 클립·Animator API·SpriteRenderer 매핑은 View 쪽에 유지한다. 착지 같은 일회성 신호와 지속 상태의 구분, 최초 구독·재구독·파괴 시 수명 관리, 입력 어댑터인 `PlayerInputView`를 출력 전용 View 경계에서 어떻게 다룰지는 영향과 권고안을 제시해 확인한다. HUD까지 미루지 않되 계층·공개 계약 변경 승인은 현재 하네스에 따른다.
5. 후속 계획에는 표현 상태 선택·상태 전달·구독 수명 테스트와 기존 이동·점프·10 FPS·PPU 32·Scale 1·16:9 회귀 검증, Architecture 문서 갱신을 포함한다. 이번에 관측한 플랫폼 옆면 접지 판정 문제는 별도 범위이며 자동으로 합치지 않는다.
6. 새 작업의 계획·실행·검증은 개편된 개발 기록 규칙에 따라 관리하고, 이 DEV-009를 이전 데모 기준점으로 연결한다. 이번 commit 승인을 후속 commit·push 승인으로 이월하지 않는다.

# 후속 작업

- [x] 전체 픽셀 아트 PPU 32 및 신규 임포트 정책 적용
- [x] Scene Scale 1·발 위치·Collider·야자수 조립·PlayMode 검사 반영
- [x] 16:9 고정 Crop 및 FHD·768×432 정수배 출력 확인
- [ ] 새 세션에서 R3 상태 전달과 Presentation의 표현 상태 선택을 계획·승인 후 구현한다. 위 재개 계약을 따른다.
- [ ] 바닥 방향을 구분하는 접지 판정을 별도 이동 로직 작업에서 검토한다.
- [ ] 사람 검수로 이동·점프 체감과 애니메이션 전환 미감을 확인한다.
- [ ] 다음 세로 슬라이스에서 공격·피격 Animator 상태와 전투 판정을 추가한다.

# 다음 작업에서 재사용할 지식

- 외부 원재료의 import metadata는 `ThirdParty`에 두되 AnimationClip·AnimatorController·Tile처럼 프로젝트가 조립한 결과는 `Assets/Content/Game`이 소유한다.
- 반복 입력 상태는 Animator float/bool, 한 프레임 의미인 착지는 Presentation pulse와 Animator trigger로 나누면 물리 판정 중복 없이 표현할 수 있다.
- 단일 프레임 PNG 애니메이션도 AnimationClip `frameRate=10` 계약에 포함하면 상태 머신과 검증 코드를 동일하게 유지할 수 있다.
- Scene YAML fileID 재사용으로 E1 매칭이 불확실할 때는 실패로 단정하지 않고 `get-hierarchy`의 현재 소유 경로와 함께 판정한다.
