---
id: DEV-2026-011
title: Player R3 표현 상태와 수동 출력 View
status: completed
verification_tier: 2
plan_review: okay
date: 2026-09-05
approval_required: true
authorization_basis: 사용자가 조사 후 제시한 변경 계획에 "계획대로 진행해"로 구현 승인; commit과 push는 제외
approved_at: 2026-09-05
completed_at: 2026-09-05
unity_version: 6000.3.20f1
platform: macOS arm64
related_commit: fef3bdc664189b5c32dd5a92bdc6193bbd0a8993
tags: [player, presentation, r3, animation, lifetime]
---

# 목표

[DEV-009의 새 세션 재개 계약](DEV-2026-009-treasure-hunters-playable-demo.md#새-세션-재개-계약)을 이어서, Presentation이 의미상의 표현 상태를 결정하고 R3로 발행하며 출력 View는 읽기 전용 흐름을 구독하도록 변경한다.

## 완료 조건

- 기존 PlayerPresenter가 Idle·Run·Jump·Fall과 방향을 결정하고 private ReactiveProperty로 발행한다.
- 착지는 지속 상태와 분리한 비재전달 신호이며 최초 접지에서 발생하지 않고 공중→접지마다 한 번 발생한다.
- PlayerVisualView는 Presenter와 변경 가능한 상태를 받지 않고 두 Observable만 구독한다.
- 초기화·재초기화·비활성화·재활성화·파괴·소스 종료의 구독 수명이 검증된다.
- PlayerInputView의 입력 수집·점프 큐·FixedUpdate 전달과 기존 이동·점프·10 FPS·PPU 32·Scale 1·16:9를 유지한다.
- Architecture를 실제 코드와 대조하여 갱신하고 V2 검증을 통과한다.

# 제약사항

- Domain·Application·Infrastructure의 이동·접지 로직은 변경하지 않는다. 플랫폼 옆면을 접지로 해석하는 IsTouchingLayers 문제는 별도 작업이다.
- AnimationClip·PNG·import 설정·Scene·카메라·충돌체·Transform은 변경하지 않는다.
- commit·push는 명령별 별도 사용자 승인 후에만 수행한다.

# 계획

1. PlayerViewState를 PlayerLocomotion과 방향의 불변 값으로 바꾸고 기존 Presenter에서 속도 기준 0.05·0.01과 방향 deadzone 0.0001을 적용한다. 경계값에서 같은 상태군의 이전 상태를 유지하고 새 상태군 진입은 Idle/Fall을 기본값으로 한다.
2. 내부 ReactiveProperty와 Subject<Unit>를 AsObservable로 감싸 공개한다. 최신 지속 상태를 먼저 반영한 뒤 착지 신호를 발행한다. 첫 샘플 접지는 신호를 만들지 않는다.
3. VisualView가 초기화되고 활성화된 동안만 구독하도록 바꾼다. 재구독 첫 상태는 Animator를 최신 기본 상태로 동기화하고 지난 착지·pending trigger를 버린다. Presenter는 IDisposable로 자신이 소유한 R3 객체를 해제한다.
4. Presentation에 IPlayerInputCommands 계약을 두고 기존 PlayerInputView에는 이 명령 포트만 전달한다. 입력 수집 주기·큐 소비·비활성화 초기화는 유지한다. 기존 Installer가 같은 Presenter를 입력 포트와 출력 흐름으로 연결한다.
5. 기존 CaptainLocomotion.controller의 물리값 판정을 의미상의 Locomotion 조건으로 교체한다. 착지 시작은 Landed 신호를 Land trigger로 매핑하고 기존 클립·0.05초 전환·Land 0.9 exit time을 유지한다. 공중 표현은 착지 재생을 중단한다.
6. Presenter 기능 테스트, 출력 View 수명·Animator 통합 테스트, 실제 Input System 경로의 큐 테스트를 추가한다. 기존 데모 회귀 검증을 유지한다.
7. Architecture와 이 기록·Index를 갱신하고 컴파일·자동 테스트·실제 입력·화면 계약을 검증한다.

## 변경 예정 파일

- Assets/Feature/Player/Presentation/PlayerPresenter.cs, PlayerViewState.cs, IPlayerInputCommands.cs와 새 파일 meta
- Assets/Feature/Player/View/PlayerVisualView.cs, PlayerInputView.cs
- Assets/Feature/Player/Installer/PlayerInstaller.cs
- Assets/Content/Game/Player/Animator/CaptainLocomotion.controller
- Assets/Tests/EditMode/Player/PlayerPresenterTests.cs와 테스트 asmdef
- Assets/Tests/PlayMode/Player/의 출력 수명·Animator·입력 테스트와 테스트 asmdef
- Docs/Architecture.md, 이 기록, Index.md

## 구조·소유권 점검

기존 Presenter의 표현 판정 책임을 확장한다. 새 병렬 Presenter나 입력 루프를 만들지 않는다. 새 명령 인터페이스는 입력 소비자가 표현 상태 변경 권한을 받지 않도록 Presentation에 소유한다. 출력 View만 수동 출력이며 Player.View 어셈블리는 입력과 출력 Unity 어댑터를 함께 소유한다.

R3 NuGet와 Unity 패키지는 모두 1.3.1이다. 설치 DLL의 실제 선언과 임시 객체 실행에서 ReactiveProperty의 최신값 전달·동일 값 억제, Subject의 비재전달, AsObservable 래퍼의 변경·Dispose 권한 차단을 확인했다. 기존 Presentation 컴파일 rsp는 이미 R3.dll을 참조한다. 테스트 어셈블리는 자동 참조가 포함되지 않아 실제 컴파일 실패를 확인한 뒤 두 테스트 asmdef에 R3.dll·nunit.framework.dll을 명시했다. R3.Unity나 새 런타임 asmdef 간선을 추가하지 않고 noEngineReferences를 유지한다.

VContainer 1.19.0 Container.cs의 IDisposable singleton 추적과 LifetimeScope.OnDestroy의 컨테이너 종료를 직접 확인했다. Presenter 소스 수명은 컨테이너, 출력 구독 수명은 View 활성 기간이 소유한다.

## 계획 검토

구현 승인 전 plan-critic 독립 검토: OKAY. Presenter·View·Installer·테스트·asmdef·DEV-009 계약을 직접 확인했고 실행 블로커가 없었다. 사용자가 지속 4상태 + 착지 신호, 입력 어댑터 유지, 활성 기간 구독 정책을 포함한 계획을 승인했다.

## 검증 계획

V2, 관측 E1·E2·E3. 대상 빌드 E4는 이번 범위에 포함하지 않는다.

- `uloop compile`
- `uloop run-tests --test-mode EditMode --filter-type assembly --filter-value CleanArchitecture.Player.EditModeTests --unsaved-changes fail`
- `uloop run-tests --test-mode PlayMode --filter-type assembly --filter-value CleanArchitecture.Player.PlayModeTests --unsaved-changes fail`
- `uloop get-logs --log-type Error --max-count 100`
- `node .codex/hooks/architecture-doc-check.js --working-tree`
- `git diff --check`
- E2: Controller의 의미 상태 조건·클립·전환 시간, Scene의 PPU·Scale·카메라 계약 조회
- E3: A·D·Space 실제 입력과 지면 점프·착지, 768×432 및 FHD 화면 검증
- Scene·원재료·클립·설정에 의도하지 않은 변경이 없는지 Git·해시 대조. Scene 변경이 생기면 unity-vcs-evidence로 조사한다.

## 사람 검수 항목

이동·점프 체감과 애니메이션 전환 미감. 자동 검사로 주관적 품질을 단정하지 않는다.

# 실행 기록

| 시점 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 승인 전 | 코드·Git·Editor 기준점 재확인 | 성공 | main fef3bdc, clean, Scene dirty=false, 5개 10 FPS 클립, Scale·PPU 위반 0, 384×216 Windowbox |
| 구현 착수 | 승인 계획 기록 | 진행 중 | 사용자 명시 승인, plan-critic OKAY |
| 15:14 | 의미 상태·발행 계약 EditMode 검증 | 24/24 통과 | 사전 컴파일 포함, 실패·생략 0 |
| 15:16 | 첫 PlayMode 검증 | 14/15 통과 | 실제 입력 테스트에서 press edge 전달 실패 |
| 15:19 | 입력 테스트 환경 교정 | 2/2 통과 | Editor 비활성·키보드 포커스 설정을 확인; InputSettings 복제본으로 합성 입력을 격리하고 종료 시 원본 복원, 두 테스트에 실제 입력 수신 전제 assertion 추가 |
| 15:20 | 전체 PlayMode 검증 | 15/15 통과 | 기존 씬·출력 수명·입력·Animator 모두 통과 |
| 15:21 | 완료 검토 중 비활성 소스 종료 재현 | 2/2 실패 재현 | state 소스 종료 시 ObjectDisposedException, landing 소스 종료 시 부분 state 구독 잔류 |
| 15:22 | 재구독 수명 보완 | 17/17 통과 | 구독 시 ObjectDisposedException에 한정해 종료 처리·부분 구독 해제; 재현 assertion은 유지 |
| 실제 입력 조사 | uloop D·A·Space와 임시 프레임 관측 | 부분 확인 | 좌우 속도 ±6.72532·flip 양방향 확인, Space edge·Jump 전달 확인. 창 포커스로 프레임 관측이 끊겨 점프 완료 증거는 자동 통합 검사로 보완 |
| 15:31 | 실제 씬 Space 통합 검사 | 기본 위치에서 실패 | X=-5의 Player가 Left Platform 아래에 걸려 Y=-1.5475→-1.45246만 상승. Left Platform bounds X=[-5,-2], Y=[-1,0]를 E2에서 확인 |
| 15:34 | 장애물 없는 기존 지면 X=-1.5에서 같은 검사 | 18/18 통과 | 실제 Space→물리 상승 0.5유닛 초과·수직 속도 5 초과·원래 높이 복귀·Jump/Fall/Land/Idle 재생 검증; 씬·접지·물리·클립 변경 없음 |
| 15:36 | FHD·768×432 동일 프레임 캡처 | 통과 | 5배·2배 픽셀 블록 위반 0, 384×216 정규화 이미지 차이 0픽셀 |
| 최종 | 범위·설정·형식 정리 | 통과 | 원재료 metadata 1,768개는 공백만 달라 HEAD 바이트로 복원. 도구의 임시 Play 옵션·background·자동 생성 기본 설정 복원. Controller 줄 끝 공백만 정리하고 정규화 동일성 확인 |
| 최종 | 완료 검토 | PASS V2 | 원본 테스트 JSON·E2·이미지 비교·소스 본문과 보호 경로 Git 대조, Architecture·whitespace 통과 |

# 발견 사항

- 현재 ReadOnlyReactiveProperty도 IDisposable을 노출하고 ToReadOnlyReactiveProperty는 같은 객체를 반환한다. 출력 계약에는 AsObservable 래퍼를 사용한다.
- 기존 Land 클립 길이는 0.3초이며 지상 전환의 exit time은 정규화 0.9다. Presentation에 클립 시간을 하드코딩하지 않는다.
- 기본 Player 시작점 X=-5는 Left Platform 아래에 걸친다. Collider 반폭 0.3125 때문에 플랫폼 아랫면 Y=-1과 겹치며 자유 점프 높이 검증에 적합하지 않다. 저장된 배치를 바꾸지 않고 기존 플랫폼 사이 빈 지면 X=-1.5를 테스트 시작 위치로 사용한다.
- 모든 이동 클립의 실제 바인딩은 SpriteRenderer.m_Sprite뿐이다. Transform·Rigidbody 곡선은 없으며 물리/접지 변경이 애니메이션으로 우회 도입되지 않았다.
- 입력 자동 테스트는 프로젝트 InputSettings를 복제해 포커스 영향만 격리하고 임시 키보드를 사용한다. 실제 InputAction press edge를 assertion으로 확인하며 Application.runInBackground와 설정 원본·Time.timeScale·장치를 종료 시 복원한다. 플레이어의 입력 수집·물리·표현 판정은 실제 코드로 실행한다.

# 결정 사항

- 지속 표현과 일회성 착지를 분리하고 지나간 착지는 재구독 시 재생하지 않는다.
- 입력은 Player.View의 입력 어댑터로 유지하며 출력 전용 경계는 PlayerVisualView에 적용한다.
- 접지 판정 오류를 Presentation에서 별도 조건으로 가리지 않는다.

# 변경 내용

- 기존 Presenter에서 의미 상태와 방향을 판정하고 private R3 ReactiveProperty·Subject를 읽기 전용 Observable로 공개한다.
- 기존 VisualView를 두 흐름의 출력 구독자로 바꾸고 활성 기간·재초기화·완료·파괴를 처리한다. 비활성 중 소스 종료도 정상 종료로 취급하며 부분 구독을 해제한다.
- 입력 어댑터는 새 명령 인터페이스만 받는다. Update/FixedUpdate·점프 큐는 유지하며 Installer가 같은 Presenter의 입력·출력을 연결한다.
- Controller의 속도·접지 조건을 의미 상태 매핑으로 교체했다. 기존 클립·FPS·블렌딩·착지 종료 시점은 유지한다.
- Presenter 테스트를 확장하고 입력·출력 수명·실제 Animator·실제 씬 키보드 점프 테스트를 추가했다. 테스트 DLL 참조를 명시하고 Architecture를 갱신했다.

# 검증

| 관측 | 결과 | 원본 증거 |
|---|---|---|
| E3 컴파일·EditMode | 24/24 통과, 실패·생략 0 | [EditMode 결과](artifacts/DEV-2026-011/editmode.json) |
| E3 컴파일·PlayMode | 18/18 통과, 실패·생략 0 | [최종 PlayMode 결과](artifacts/DEV-2026-011/playmode.json) |
| E2 표현·씬 계약 | 의미 상태 조건만 존재, 모든 전환 0.05초, Land 지상 복귀 0.9, 5개 10 FPS 클립 | [Editor 계약](artifacts/DEV-2026-011/editor-contract.json) |
| E2 PPU·Scale·16:9 | SpriteRenderer 16개·Tile 21칸 PPU 위반 0, 전체 Transform 배율 위반 0, Grid 1, 32 PPU·384×216·Windowbox | 같은 Editor 계약과 기존 PlayMode 씬 assertion |
| E3 실제 입력 경로 | D/A press edge·좌우 속도·반전 관측; 자동 입력 큐 1회 소비·비활성 초기화; 실제 씬 Space→상승·낙하·Land→Idle | 최종 PlayMode의 PlayerInputViewTests와 실행 기록 |
| 화면 | FHD 1920×1080=5배, 768×432=2배, 블록 위반 0·동일 논리 프레임 차이 0 | [픽셀 비교](artifacts/DEV-2026-011/pixel-comparison.json) |
| E1 변경 범위 | Scene·원재료·클립·환경·Domain·Application·Infrastructure·ProjectSettings가 HEAD와 동일 | [최종 검사와 소스 해시](artifacts/DEV-2026-011/final-verification.json) |
| 문서·Console | Architecture 7 assemblies·16 edges·4 Mermaid blocks, whitespace 통과, Console Error 0 | 최종 검사, 실행 도구 출력 |
| 검증 후 형식 변경 | Controller의 줄 끝 공백만 제거, 정규화 내용 동일 | [Controller 형식 대조](artifacts/DEV-2026-011/controller-format.json) |

첫 자유 점프 검사는 기존 시작점 위 플랫폼 때문에 실패했다. [최초 결과](artifacts/DEV-2026-011/keyboard-jump-initial-ceiling-failure.json)를 보존하며, 상승·애니메이션 assertion을 완화하지 않고 장애물 없는 기존 구간을 테스트 전제로 명시한 뒤 전체 18개가 통과했다.

스크린샷은 로컬 전용·Git 미포함이다. `artifacts/local/DEV-2026-011/Rendering_20260905_153559_609.png`(FHD), `artifacts/local/DEV-2026-011/Rendering_20260905_153645_506.png`(768×432)를 직접 열어 확인했다. 검증 후 Game View는 기존 FHD, Editor는 정지·dirty=false로 복귀했다. CLI Play 중 임시 runInBackground=True가 E2 증거에 남아 있지만 종료 뒤 False·Play Mode 옵션 None으로 복원했으며 최종 ProjectSettings는 HEAD와 같다.

## 요구사항과 완료 증거

- Presentation의 의미 상태·읽기 전용 발행: PlayerPresenterTests의 상태·경계·방향·중복 억제·재전달·변경 권한·종료 검사. E2의 컴파일된 Presentation 참조는 netstandard·Application·R3이며 Unity 참조가 없다.
- 착지 1회와 상태/신호 순서: 공중→접지 반복 전이 테스트, 첫 접지·점프 오신호 억제, 재구독 비재전달 검사. 기존 접지 결과 자체의 정확성은 수정하지 않았다.
- 구독 수명: 초기화 순서·중복 초기화·소스 교체·비활성화·재활성화·파괴·활성/비활성 중 소스 종료·VContainer 해제 검사.
- Unity 출력: Land 종료·Jump/Fall 중단·pending trigger 제거, Run 중 방향 변경 시 클립 재시작 방지, 실제 씬 입력부터 Animator까지 통합 검사.
- 이동·시각 유지: 기존 물리·설정·클립·씬의 Git 동일성, 기존 씬 스모크 assertion과 픽셀 비교.

`verifier` 스킬의 별도 검토 패스로 코드 본문과 위 원본 증거를 대조해 PASS — V2로 판정했다. Presenter 관련 코드는 EditMode 검증 후 바뀌지 않았고, 최종 PlayMode 이후 런타임 의미 변경은 없다. Controller 공백 정리와 검증 부수효과 복원은 정규화·Git 동일성으로 검증했다. standalone Player(E4)와 사람의 조작감·전환 미감은 이번에 검증하지 않았다.

# 최종 결과

승인된 R3 전환·표현 책임 분리·입력 명령 경계·구독 수명 구현을 완료했다. 컴파일과 EditMode 24개·PlayMode 18개, 기존 화면 계약과 문서 검사가 통과했다. 접지 방향 판정과 기본 시작점 위 플랫폼 배치는 기존 상태로 유지했다. commit·push·stage는 수행하지 않았다.

# 후속 작업

- [ ] 바닥 방향을 구분하는 접지 판정을 별도 이동 로직 작업에서 검토한다.
- [ ] 사용자 승인 후 필요한 commit·push를 각각 수행한다.


# 다음 작업에서 재사용할 지식

- R3 core는 NuGet DLL이며 Unity 패키지 asmdef와 구분한다. 테스트 어셈블리에는 실제 컴파일 결과를 보고 DLL 참조를 명시한다.
- 비활성 View는 소스 완료 알림도 받지 않는다. 재구독 중 소스 종료와 두 번째 구독 실패에 따른 부분 연결 해제까지 확인한다.
- 자유 점프 테스트는 기존 빈 지면 X=-1.5를 사용한다. X=-5에서는 왼쪽 플랫폼 아랫면에 머리가 걸리므로 최대 점프 높이를 측정할 수 없다.
- 화면 비교는 Play Mode를 멈춘 같은 프레임을 두 정수배 해상도로 캡처하고 원본 픽셀 블록과 논리 프레임을 대조한다.
