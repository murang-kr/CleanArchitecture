# 프로젝트 아키텍처

> 이 문서는 프로젝트 아키텍처의 상세 정본이다.
>
> 최종 코드 검증일: 2026-09-05<br>
> Unity 버전: 6000.3.20f1<br>
> 현재 구현 범위: Player 수평 이동·접지 점프와 Treasure Hunters 시각 데모

## 문서 원칙

- 실제 asmdef 참조와 실행되는 코드만 **현재 구조**로 기록한다.
- 아직 구현하지 않은 Feature와 계층은 현재 다이어그램에 미리 추가하지 않는다.
- 의존 방향은 안쪽 계층을 향하며, Unity와 외부 프레임워크는 바깥 계층에서만 사용한다.
- 의존성 생성과 연결은 Installer와 composition root가 소유한다.

## 현재 디렉터리 구조

```text
Assets/
├─ Core/
│  └─ Installer/          # 애플리케이션 composition root
├─ Content/
│  ├─ ThirdParty/         # 제작자·배포 팩별 외부 런타임 원재료
│  ├─ Generated/          # 생성형 런타임 원재료
│  └─ Game/               # 게임이 소유하는 조립 에셋
│     ├─ Environment/
│     │  └─ Tiles/        # Palm Tree Island 데모 Tile
│     └─ Player/
│        ├─ Animations/   # 10 FPS 이동 AnimationClip
│        └─ Animator/     # Captain 이동 상태 머신
├─ Feature/
│  └─ Player/
│     ├─ Domain/          # 순수 이동 규칙과 값 객체
│     ├─ Application/     # 이동 유스케이스와 외부 포트
│     ├─ Presentation/    # View에 전달할 상태와 명령
│     ├─ Infrastructure/  # Physics2D와 ScriptableObject 어댑터
│     ├─ View/            # Input System 입력과 시각 표현
│     └─ Installer/       # Player 의존성 등록
├─ Data/
│  └─ Player/             # Player 설정 ScriptableObject 인스턴스
├─ Scenes/
│  └─ ArchitectureSandbox.unity
└─ Tests/
   ├─ EditMode/Player/
   └─ PlayMode/Player/

SourceAssets/
├─ ThirdParty/            # Unity가 import하지 않는 다운로드 원본
└─ Generated/             # 생성 원본·프롬프트·편집 파일
```

`Shared`를 포함한 다른 Feature 디렉터리는 아직 실제 공통 계약이나 유스케이스가 없으므로 생성하지 않았다.

## 에셋 콘텐츠 파이프라인

에셋 출처와 라이선스의 정본은 [`Asset-Provenance.md`](Asset-Provenance.md)다.

```text
외부 다운로드 또는 AI 생성
            │
            ▼
      SourceAssets
  Unity 비import 원본 보존
            │
        선별·Export
            │
            ▼
 Assets/Content/ThirdParty|Generated
       런타임 원재료
            │
   Prefab·Animator·Material 조립
            │
            ▼
     Assets/Content/Game
        게임 소유 에셋
```

서드파티 원재료는 제작자와 배포 팩의 경계를 유지하고 직접 수정하지 않는다. 생성형 원재료는 서드파티와 분리해 생성 도구·프롬프트·참조 원본을 추적한다. 최종 Player·Enemy·UI 구성물은 원재료 출처와 무관하게 `Assets/Content/Game/`에서 소유하며, 리소스를 교체할 때 원재료를 이동하지 않고 Unity 참조만 바꾼다.

## 어셈블리 의존 관계

화살표 `A → B`는 A의 asmdef가 B를 직접 참조한다는 뜻이다.

```mermaid
flowchart LR
    CoreInstaller["Core.Installer"]

    subgraph PlayerFeature["Player Feature"]
        PlayerView["Player.View"]
        PlayerPresentation["Player.Presentation"]
        PlayerApplication["Player.Application"]
        PlayerDomain["Player.Domain"]
        PlayerInfrastructure["Player.Infrastructure"]
        PlayerInstaller["Player.Installer"]
    end

    InputSystem["Unity.InputSystem"]
    VContainer["VContainer"]

    PlayerView --> PlayerPresentation
    PlayerView --> InputSystem
    PlayerPresentation --> PlayerApplication
    PlayerApplication --> PlayerDomain
    PlayerInfrastructure --> PlayerApplication
    PlayerInfrastructure --> PlayerDomain

    PlayerInstaller --> PlayerDomain
    PlayerInstaller --> PlayerApplication
    PlayerInstaller --> PlayerPresentation
    PlayerInstaller --> PlayerInfrastructure
    PlayerInstaller --> PlayerView
    PlayerInstaller --> VContainer

    CoreInstaller --> PlayerInfrastructure
    CoreInstaller --> PlayerView
    CoreInstaller --> PlayerInstaller
    CoreInstaller --> VContainer
```

### 어셈블리 계약

| 어셈블리 | 책임 | 직접 참조 | Unity 엔진 참조 차단 |
|---|---|---|---|
| `Player.Domain` | 이동 상태·의도·설정·결정과 순수 판정 규칙 | 없음 | 예 |
| `Player.Application` | 이동 유스케이스와 `IPlayerMotor`, `IPlayerMotionSettings` 포트 | `Player.Domain` | 예 |
| `Player.Presentation` | 이동 결과·착지 순간을 표시 상태로 변환하고 View에 알림 | `Player.Application` | 예 |
| `Player.Infrastructure` | Rigidbody2D 모터와 설정 ScriptableObject | `Player.Application`, `Player.Domain` | 아니요 |
| `Player.View` | Input System 입력 수집과 SpriteRenderer·Animator 표시 | `Player.Presentation`, `Unity.InputSystem` | 아니요 |
| `Player.Installer` | Player 객체 등록과 View 초기화 | 모든 Player 계층, `VContainer` | 아니요 |
| `Core.Installer` | 씬 참조 검증과 루트 DI 조립 | `Player.Infrastructure`, `Player.View`, `Player.Installer`, `VContainer` | 아니요 |

`Player.Domain`, `Player.Application`, `Player.Presentation`은 asmdef의 `noEngineReferences: true`로 Unity API 직접 사용을 컴파일 단계에서 차단한다.

테스트 어셈블리는 런타임 의존 그래프에 포함하지 않는다. 현재 `CleanArchitecture.Player.EditModeTests`는 `Player.Domain`, `Player.Application`, `Player.Presentation`을 직접 참조해 순수 이동 규칙·유스케이스와 Presenter의 착지 pulse를 검증한다. `CleanArchitecture.Player.PlayModeTests`는 실제 씬에서 조립된 Tilemap·Animator·Rigidbody2D 경로를 검증한다.

## Player 주요 타입 UML

아래 클래스 다이어그램은 런타임 이동 경로와 DI 조립에 참여하는 주요 타입만 표시한다. 값 객체의 모든 필드와 Unity 내부 타입은 생략한다.

```mermaid
classDiagram
    class IPlayerMotor {
        <<interface>>
        +ReadState() PlayerMotionState
        +Apply(PlayerMotionDecision)
    }

    class IPlayerMotionSettings {
        <<interface>>
        +MotionConfig PlayerMotionConfig
    }

    class PlayerMotionRules {
        +Decide(state, intent, config, deltaTime) PlayerMotionDecision
    }

    class UpdatePlayerMotionUseCase {
        +Execute(input, deltaTime) PlayerMotionResult
    }

    class PlayerPresenter {
        +ViewState PlayerViewState
        +UpdateMotion(horizontalInput, jumpPressed, deltaTime)
        +ViewStateChanged
    }

    class PlayerViewState {
        +HorizontalSpeed float
        +VerticalSpeed float
        +IsGrounded bool
        +JustLanded bool
        +FacingDirection int
    }

    class Rigidbody2DPlayerMotor {
        +ReadState() PlayerMotionState
        +Apply(PlayerMotionDecision)
    }

    class PlayerMovementSettings {
        +MotionConfig PlayerMotionConfig
    }

    class PlayerInputView {
        +Initialize(PlayerPresenter)
    }

    class PlayerVisualView {
        +Initialize(PlayerPresenter)
        -SpriteRenderer spriteRenderer
        -Animator animator
    }

    class PlayerInstaller {
        +Install(IContainerBuilder)
    }

    class GameLifetimeScope {
        +ConfigureScene(settings, motor, inputView, visualView)
        #Configure(IContainerBuilder)
    }

    IPlayerMotor <|.. Rigidbody2DPlayerMotor
    IPlayerMotionSettings <|.. PlayerMovementSettings
    UpdatePlayerMotionUseCase --> PlayerMotionRules
    UpdatePlayerMotionUseCase --> IPlayerMotor
    UpdatePlayerMotionUseCase --> IPlayerMotionSettings
    PlayerPresenter --> UpdatePlayerMotionUseCase
    PlayerPresenter --> PlayerViewState : create
    PlayerInputView --> PlayerPresenter
    PlayerVisualView --> PlayerPresenter
    PlayerVisualView --> PlayerViewState : render
    PlayerInstaller ..> PlayerMotionRules : register
    PlayerInstaller ..> UpdatePlayerMotionUseCase : register
    PlayerInstaller ..> PlayerPresenter : register
    PlayerInstaller ..> Rigidbody2DPlayerMotor : bind
    PlayerInstaller ..> PlayerMovementSettings : bind
    GameLifetimeScope --> PlayerInstaller : compose
```

## Player 이동 런타임 시퀀스

```mermaid
sequenceDiagram
    participant InputSystem as Unity Input System
    participant InputView as PlayerInputView
    participant Presenter as PlayerPresenter
    participant UseCase as UpdatePlayerMotionUseCase
    participant Motor as Rigidbody2DPlayerMotor
    participant Settings as PlayerMovementSettings
    participant Rules as PlayerMotionRules
    participant Visual as PlayerVisualView

    InputView->>InputSystem: Update에서 Move와 Jump 읽기
    InputSystem-->>InputView: 수평 입력과 점프 입력
    InputView->>Presenter: FixedUpdate에서 UpdateMotion 호출
    Presenter->>UseCase: Execute(PlayerMotionInput, deltaTime)
    UseCase->>Motor: ReadState()
    Motor-->>UseCase: PlayerMotionState
    UseCase->>Settings: MotionConfig 읽기
    Settings-->>UseCase: PlayerMotionConfig
    UseCase->>Rules: Decide(state, intent, config, deltaTime)
    Rules-->>UseCase: PlayerMotionDecision
    UseCase->>Motor: Apply(decision)
    Motor-->>UseCase: Rigidbody2D 속도 반영
    UseCase-->>Presenter: PlayerMotionResult
    opt PlayerViewState가 변경됨
        Presenter-->>Visual: ViewStateChanged
        Visual->>Visual: 방향 반전과 Animator 파라미터 갱신
        opt JustLanded
            Visual->>Visual: Land trigger 1회 설정
        end
    end
```

`PlayerInputView.Update`는 입력을 수집하고 점프를 큐에 보관한다. 물리 상태 변경은 `FixedUpdate`에서 시작되며, Domain의 `PlayerMotionRules`가 속도와 점프 가능 여부를 결정한다. Infrastructure는 결정을 Rigidbody2D에 적용하고, Presentation은 결과를 `PlayerViewState`로 바꿔 View에 알린다. `PlayerPresenter`는 직전 공중 상태에서 접지 상태로 바뀐 순간만 `JustLanded`로 표시하며, `PlayerVisualView`는 이동 속도·수직 속도·접지 여부·착지 pulse를 `CaptainLocomotion.controller`에 전달한다. AnimationClip은 에셋 페이지 기준 10 FPS를 사용한다.

### 현재 표현 흐름의 한계

현재 상태 알림은 R3가 아니라 C# `event Action<PlayerViewState>`다. Presentation은 View를 참조하지 않으며, View가 이벤트를 구독하고 초기 상태를 별도로 읽는다. Idle·Run·Jump·Fall의 선택 조건과 Land 전환은 Unity의 `CaptainLocomotion.controller`가 소유한다. 따라서 현재 구현은 사용자가 요구한 R3 기반 상태 발행·수동 View 구조를 완성한 상태가 아니다.

R3 전환과 의미상의 표현 상태 선택을 Presentation으로 옮기는 작업은 새 세션에서 별도로 계획한다. 아직 구현하지 않은 구조이며, 위 UML은 현재 이벤트 기반 코드를 나타낸다. 인계 범위와 승인 경계는 [DEV-009](development-record/DEV-2026-009-treasure-hunters-playable-demo.md#새-세션-재개-계약)에 기록한다.

## Composition root

```mermaid
flowchart TD
    Scene["ArchitectureSandbox Scene"]
    Camera["Main Camera"]
    PixelPerfect["PixelPerfectCamera<br/>32 PPU · 384×216 · Windowbox"]
    Scope["GameLifetimeScope"]
    FeatureInstaller["PlayerInstaller"]
    Container["VContainer"]
    Settings["PlayerMovementSettings"]
    PlayerRoot["Player<br/>입력 · Rigidbody2D · Collider"]
    PlayerVisual["Player/Visual<br/>Scale 1 · 원본 픽셀 크기"]
    Motor["Rigidbody2DPlayerMotor"]
    InputView["PlayerInputView"]
    VisualView["PlayerVisualView"]
    Environment["Environment<br/>배경 · 전경 야자수 · Palm Terrain · 충돌"]
    Animator["CaptainLocomotion Animator"]

    Scene --> Camera
    Camera --> PixelPerfect
    Scene --> Scope
    Scene --> Settings
    Scene --> PlayerRoot
    PlayerRoot --> Motor
    PlayerRoot --> InputView
    PlayerRoot --> PlayerVisual
    PlayerVisual --> VisualView
    PlayerVisual --> Animator
    Scene --> Environment
    Scope --> FeatureInstaller
    FeatureInstaller --> Container
    Settings --> FeatureInstaller
    Motor --> FeatureInstaller
    InputView --> FeatureInstaller
    VisualView --> FeatureInstaller
    Animator --> VisualView
```

`GameLifetimeScope`는 씬에서 설정과 Unity 어댑터 참조를 받고 누락 여부를 검증한다. `PlayerInstaller`는 포트 구현체와 순수 객체를 VContainer에 등록한 뒤, 빌드 콜백에서 `PlayerInputView`와 `PlayerVisualView`에 `PlayerPresenter`를 주입한다.

`ArchitectureSandbox`는 32 PPU를 타일·배경·캐릭터의 공통 픽셀 밀도로 사용한다. `Main Camera`의 URP `PixelPerfectCamera`는 384×216 참조 해상도, `UpscaleRenderTexture`, `CropFrame.Windowbox`로 16:9 구도와 정수배 출력을 유지한다. 기본 출력은 FHD 1920×1080(5배)이며 uloop 768×432(2배)에서도 같은 12×6.75유닛 영역을 보여 준다. 비정수배 해상도에서는 남는 영역을 여백으로 처리한다.

같은 Camera에 URP 렌더링 보조 컴포넌트 `UniversalAdditionalCameraData`도 저장돼 있다. 게임 입력·물리·DI 계층에는 관여하지 않는다.

Player 루트는 입력·Rigidbody2D·BoxCollider2D를, 자식 `Visual`은 SpriteRenderer·Animator·PlayerVisualView를 소유한다. 루트와 시각 자식 모두 Scale `(1,1,1)`이며, Captain 원본의 투명 여백을 고려해 Visual의 로컬 Y는 -0.0625, 충돌체 크기는 0.625×0.875유닛으로 맞췄다. 크기를 바꾸려고 개별 PPU나 Transform 배율을 변경하지 않는다. 좌우 반전은 `SpriteRenderer.flipX`를 사용한다.

`Environment`는 `Background`의 Sky·Base·Clouds·Water 레이어, `Decorations`의 조립식 Front Palm Tree, 1×1 Grid의 Palm Terrain Tilemap, 별도 BoxCollider2D 충돌 영역을 소유한다. 배경은 원본 크기와 타일링으로 채우고, 야자수는 Scale 1의 줄기 세 개와 수관 한 개로 조립한다. 지면·중앙·좌우 플랫폼의 윗면은 각각 Y=-2·-1·0으로 기존 이동 로직의 점프 범위 안에서 연결한다.

### 픽셀 아트 임포트와 회귀 방지

[`PixelArtTexturePostprocessor`](../Assets/Editor/PixelArtTexturePostprocessor.cs)는 `Assets/Content/`의 텍스처를 Sprite·PPU 32·Point·무압축·mipmap 해제·NPOT 원본 유지로 임포트한다. 기존 분할·피벗·Sprite Mode는 보존한다. Unity의 기본 Editor 어셈블리에만 속하며 런타임 Feature 계층이나 asmdef 그래프에는 참여하지 않는다. 출처 팩과 생성형 에셋에 같은 기준을 적용하며 상세 관리 규칙은 [에셋 출처 문서](Asset-Provenance.md)에 둔다.

`PlayerMovementSmokeTests`는 씬의 모든 Transform과 부모 배율, Sprite·Tile의 PPU, Grid 셀 크기와 Tile 변환, 카메라 Crop, 접지 정렬을 검사한다. 배율을 런타임에서 몰래 덮어쓰는 보정 코드는 추가하지 않는다. 원본 측정·적용·검증 기록은 [DEV-2026-009](development-record/DEV-2026-009-treasure-hunters-playable-demo.md)에 보관한다.

## 의존 규칙

### 허용

```text
View ─────────▶ Presentation ─▶ Application ─▶ Domain
Infrastructure ───────────────▶ Application ─▶ Domain
Installer ─────▶ 필요한 Feature 계층과 DI 프레임워크
Core.Installer ─▶ Feature Installer와 씬 어댑터
```

### 금지

- Domain에서 Unity, VContainer 또는 바깥 계층 참조
- Application에서 Presentation, View, Infrastructure 또는 DI 프레임워크 참조
- Presentation에서 View, Infrastructure 또는 Unity UI 프레임워크 참조
- Infrastructure와 View 사이의 직접 참조
- View에서 Domain 규칙을 직접 실행하거나 Infrastructure 구현체를 직접 호출
- composition root 밖에서 임의로 Feature 객체 그래프 생성
- 실제 공유 계약 없이 `Shared`에 범용 타입을 선행 배치

새 Feature 간 협력이 필요하면 직접 구현체 참조를 먼저 추가하지 않는다. 소비자가 필요한 계약의 소유 위치와 composition root 조립 방식을 계획에서 결정하고, 실제 공통 소비자가 확인될 때만 공유 계층을 만든다.

## 코드 근거

| 문서 내용 | 현재 코드 근거 |
|---|---|
| 루트 composition | [`GameLifetimeScope.cs`](../Assets/Core/Installer/GameLifetimeScope.cs) |
| Player DI 등록 | [`PlayerInstaller.cs`](../Assets/Feature/Player/Installer/PlayerInstaller.cs) |
| 입력 진입점 | [`PlayerInputView.cs`](../Assets/Feature/Player/View/PlayerInputView.cs) |
| 표시 갱신 | [`PlayerVisualView.cs`](../Assets/Feature/Player/View/PlayerVisualView.cs) |
| Presentation 상태 변환 | [`PlayerPresenter.cs`](../Assets/Feature/Player/Presentation/PlayerPresenter.cs) |
| 표시 상태 값 | [`PlayerViewState.cs`](../Assets/Feature/Player/Presentation/PlayerViewState.cs) |
| Application 유스케이스 | [`UpdatePlayerMotionUseCase.cs`](../Assets/Feature/Player/Application/UpdatePlayerMotionUseCase.cs) |
| 외부 포트 | [`IPlayerMotor.cs`](../Assets/Feature/Player/Application/IPlayerMotor.cs) |
| 순수 이동 판정 | [`PlayerMotionRules.cs`](../Assets/Feature/Player/Domain/PlayerMotionRules.cs) |
| Physics2D 구현 | [`Rigidbody2DPlayerMotor.cs`](../Assets/Feature/Player/Infrastructure/Rigidbody2DPlayerMotor.cs) |
| 설정 구현 | [`PlayerMovementSettings.cs`](../Assets/Feature/Player/Infrastructure/PlayerMovementSettings.cs) |
| 데모 씬 | [`ArchitectureSandbox.unity`](../Assets/Scenes/ArchitectureSandbox.unity) |
| Captain Animator | [`CaptainLocomotion.controller`](../Assets/Content/Game/Player/Animator/CaptainLocomotion.controller) |

어셈블리 직접 참조의 최종 근거는 각 계층의 `.asmdef` 파일이다. 산문이나 다이어그램이 실제 코드와 다르면 asmdef와 실행 코드를 먼저 확인하고 이 문서를 수정한다.

## 유지보수 계약

다음 변경은 `Docs/Architecture.md` 갱신을 같은 작업의 완료 조건으로 포함한다.

- asmdef 추가·삭제·이름 변경
- asmdef `references` 또는 `noEngineReferences` 변경
- 계층의 책임이나 주요 타입 소유권 이동
- Feature 간 의존 추가·제거
- Installer 또는 composition root 조립 변경
- 입력부터 Domain·Infrastructure·View로 이어지는 주요 런타임 흐름 변경

### 자동 강제 범위

로컬 `.githooks/pre-commit`은 staged 변경을 기준으로 다음 구조 변경을 감지한다.

- 모든 `.asmdef` 변경
- `Assets/Core/`, `Assets/Feature/` 아래 C# 타입의 추가·삭제·이동·복사
- `Installer/` 아래 `.meta`가 아닌 파일 변경
- `Assets/Scenes/ArchitectureSandbox.unity` 변경

구조 변경이 감지되면 `Docs/Architecture.md`가 같은 커밋에 staged되어야 한다. 문서가 staged된 커밋에서는 Node 기본 모듈 기반 검사기가 staged snapshot의 런타임 asmdef와 문서를 비교해 다음 항목을 검증한다.

- 어셈블리 노드와 직접 참조 간선
- `noEngineReferences` 계약 표 값
- Mermaid 코드 블록의 닫힘 여부
- 문서의 로컬 코드 링크가 Git index에 존재하는지

일반 메서드 본문 수정이 계층 책임이나 주요 런타임 흐름을 바꾸는지는 정적 경로만으로 정확히 판별할 수 없다. 이 의미 기반 변경은 `AGENTS.md`의 계획·완료 검증 규칙이 보완한다.

Mermaid CLI와 npm 패키지는 설치하지 않는다. VS Code 미리보기로 시각적 배치와 가독성을 사람이 확인하며, 로컬 훅은 외부 렌더러 없이 구조적 정합성만 검사한다.

갱신할 때는 다음 순서를 지킨다.

1. 실제 asmdef와 코드 본문을 먼저 확인한다.
2. 현재 디렉터리, 의존 그래프, 계약 표, UML 중 영향을 받는 부분을 수정한다.
3. 문서 상단의 최종 코드 검증일과 현재 구현 범위를 갱신한다.
4. 구현하지 않은 예정 구조를 현재 구조와 분리한다.
5. 해당 작업의 개발 기록에 아키텍처 문서 변경과 검증 근거를 남긴다.
