# CleanArchitecture

> 프로젝트 관련 문서는 `@Docs/` 경로에서 관리한다.

Unity 기반 **2D 메트로베니아(Metroidvania)** 게임을 만들면서 모던 Unity 기술 스택과 아키텍처 설계를 학습하는 프로젝트.

---

## 개요

- **목적**: 상업적 출시가 아니라 **기술 스택 학습**이 목적이다.
- **소재**: 학습 대상을 실제로 굴려보기 위한 소재로 2D 메트로베니아 게임을 제작한다. 탐색·전투·성장·백트래킹 등 장르 특성상 다양한 시스템이 필요해 아키텍처 검증에 적합하다.
- **리소스**: 아트·사운드 등 게임 리소스는 **무료로 배포되는 리소스**를 찾아서 사용한다. 리소스 제작은 학습 범위 밖이다.

---

## 학습 목표 (우선순위)

### 1순위 — 모듈형 아키텍처 설계

`Feature/` 경로 아래 **기능 중심(Feature-based) 구조**를 설계해, Unity 프로젝트에서 **SOLID 원칙을 준수한 Clean Architecture**를 구현하는 것.

- 기능 단위로 폴더·어셈블리를 분리해 모듈 간 의존 방향을 명시적으로 통제한다.
- 도메인 로직이 Unity 엔진 API에 직접 의존하지 않도록 계층을 분리한다.
- DI(VContainer)로 의존성을 조립해 구현 교체와 테스트가 가능한 구조를 만든다.

> 이 프로젝트의 **성패는 이 항목으로 판단한다.** 기능이 많은 것보다 구조가 깨끗한 것이 우선이다.

### 2순위 — 기술 스택을 활용한 기능 구현

아래 스택을 실제로 사용해 게임 기능을 구현한다.

- 전투 (공격 / 피격 / 판정 / 상태이상)
- 아이템 & 인벤토리
- UI (HUD, 인벤토리 화면, 메뉴)
- 적 AI, 맵 탐색 및 진행도 관리

---

## 디렉터리 구조 (제안)

> ⚠️ 아직 **설계 전 단계의 제안**이다. 1순위 목표의 결과물로 확정되며, 확정 시 이 섹션을 갱신한다.

```
Assets/
├─ Feature/                  # 기능 단위 모듈 — 이 프로젝트의 핵심
│  ├─ Combat/
│  │  ├─ Domain/             # 순수 C# — 규칙·엔티티. Unity API 의존 없음
│  │  ├─ Application/        # 유스케이스 — 도메인 조합
│  │  ├─ Infrastructure/     # Unity 구현체 — MonoBehaviour, SO 접근
│  │  ├─ Presentation/       # View에 표시 상태·명령 전달. UI 프레임워크 의존 없음
│  │  ├─ View/               # UI Toolkit 기반 렌더링·입력·바인딩
│  │  └─ Installer/          # VContainer 등록
│  ├─ Inventory/
│  ├─ Item/
│  ├─ Player/
│  ├─ Enemy/
│  └─ Map/
├─ Shared/                   # 여러 Feature가 공유하는 계약·유틸
├─ Core/                     # 앱 진입점, 루트 DI 스코프, 씬 로딩
├─ Data/                     # ScriptableObject 데이터 에셋
├─ Art/                      # 무료 리소스 (스프라이트, 아틀라스)
├─ Settings/                 # URP 렌더 파이프라인 설정
└─ Scenes/
```

**의존 규칙 (목표)**

```
View ──▶ Presentation ──▶ Application ──▶ Domain
Infrastructure ──▶ Application ──▶ Domain
```

- `Domain`은 아무것도 의존하지 않는다. Unity 참조도 없다.
- `Presentation`은 View에 무엇을 표시할지 상태와 명령으로 전달하며, UI Toolkit 같은 UI 프레임워크를 참조하지 않는다.
- `View`는 UI Toolkit, UXML·USS, 사용자 입력과 바인딩을 소유하고 `Presentation`이 제공한 상태를 실제 화면에 그린다.
- Feature 간 직접 참조를 금지하고, 필요하면 `Shared`의 인터페이스를 경유한다.
- Assembly Definition으로 위 규칙을 컴파일 단계에서 강제한다.

의존 방향은 규약이 아니라 **컴파일러가 강제하는 사실**로 만든다. 수단은 asmdef의 두 필드다.

- `"references"` — 참조 화이트리스트. 목록에 없는 어셈블리의 타입을 쓰면 컴파일 에러
- `"noEngineReferences": true` — 해당 어셈블리에서 `UnityEngine`을 아예 못 쓰게 한다. `Domain`·`Application`에 걸면 "도메인이 엔진에 의존하지 않는다"가 컴파일 단계에서 보장된다

---

Domain은 참조가 하나도 없다. `Infrastructure`와 `Presentation`은 서로를 보지 못하며, `View`만 `Presentation`을 참조한다. **Domain·Application은 VContainer도 모른다** — 특성 없는 순수 생성자로 두고 `Installer`가 조립한다.

> 새 `.cs` 파일을 대량 추가한 뒤 참조 측에서 CS0246이 나면, 코드를 의심하기 전에 `CompilationPipeline.GetAssemblies().sourceFiles`를 확인한다. Unity 에셋 DB가 일부 파일을 컴파일 소스 목록에서 누락하는 경우가 있고, **에디터 재시작 외에는 복구되지 않는다.**


