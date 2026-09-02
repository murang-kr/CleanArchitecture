# CleanArchitecture

> 프로젝트 관련 문서는 [`Docs/`](Docs/)에서 관리한다.

Unity에서 모듈형 Clean Architecture를 학습하고 검증하기 위한 2D 프로젝트다. 현재는 Unity 6의 2D URP 템플릿을 생성한 초기 상태이며, 게임 기능과 세부 아키텍처는 아직 구현되지 않았다.

## 목표와 우선순위

1. Unity 엔진 의존성과 순수 C# 규칙을 분리할 수 있는 모듈 경계를 설계한다.
2. Assembly Definition으로 모듈 간 의존 방향을 컴파일 단계에서 검증한다.
3. 실제 기능을 구현하면서 구조의 테스트 가능성과 교체 가능성을 확인한다.

현재 확정되지 않은 게임 장르, 기능 목록, DI·반응형·비동기 라이브러리는 이 문서에서 채택된 것으로 간주하지 않는다. 패키지나 구조를 확정할 때 `Packages/manifest.json`, 이 문서, [`Docs/Tech-Stack.md`](Docs/Tech-Stack.md)를 같은 작업에서 갱신한다.

## 현재 프로젝트 구조

```text
Assets/
├── Scenes/
│   └── SampleScene.unity        # 현재 빌드에 등록된 샘플 씬
├── Settings/                    # URP 2D 렌더러와 파이프라인 설정
├── DefaultVolumeProfile.asset  # 기본 볼륨 프로필
├── InputSystem_Actions.inputactions
└── UniversalRenderPipelineGlobalSettings.asset
```

- 현재 `Assets/`에는 C# 스크립트, Assembly Definition, 자동화 테스트가 없다.
- `Assets/Scenes/SampleScene.unity`가 유일한 빌드 씬이다.
- 입력은 Unity Input System을 사용하도록 설정돼 있다.

## 아키텍처 구조 제안

> 아래 구조는 아직 확정되지 않았으며 폴더도 생성하지 않았다. 첫 기능 설계 시 모듈 경계와 이름을 검토한 뒤 확정한다.

```text
Assets/
├── Features/<FeatureName>/
│   ├── Domain/           # 순수 C# 규칙과 엔티티
│   ├── Application/      # 유스케이스와 포트
│   ├── Infrastructure/   # Unity 및 외부 시스템 구현
│   ├── Presentation/     # 표시 상태와 사용자 명령
│   └── Installer/        # 의존성 조립
├── Shared/               # 여러 기능이 공유하는 최소 계약
├── Core/                 # 앱 진입점과 씬 수명주기
├── Data/                 # 프로젝트 데이터 에셋
├── Settings/
└── Scenes/
```

제안 의존 방향은 `Infrastructure/Presentation → Application → Domain`이다. `Domain`은 Unity API를 참조하지 않고, 기능 간 직접 참조 대신 명시적인 계약을 사용한다. 실제 적용 시 asmdef의 `references`와 `noEngineReferences`로 규칙을 강제한다.

## 개발 환경

- Unity: 6000.3.20f1
- 렌더링: Universal Render Pipeline 17.3.0, 2D Renderer
- 입력: Input System 1.19.0
- 테스트: Unity Test Framework 1.6.0
- 로컬 IDE 설정: VS Code
- 저장소: https://github.com/murang-kr/CleanArchitecture

컴파일·테스트 명령과 패키지 버전은 [`Docs/Tech-Stack.md`](Docs/Tech-Stack.md)를 기준으로 한다.
