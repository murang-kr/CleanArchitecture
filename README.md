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

## 아키텍처

상세 구조, asmdef 의존 관계, Player 타입 UML과 런타임 시퀀스의 정본은 [`Docs/Architecture.md`](Docs/Architecture.md)에서 관리한다.

현재 구현 상태:

- `Player` 이동·점프 세로 슬라이스가 Domain부터 View까지 구현돼 있다.
- `Player.Domain`, `Player.Application`, `Player.Presentation`은 `noEngineReferences: true`로 Unity API 의존을 차단한다.
- `Core.Installer`가 VContainer composition root를 소유하며 `ArchitectureSandbox` 씬에서 Player Feature를 조립한다.
- 아직 공통 계약이 없으므로 `Shared`는 생성하지 않았다.

> 새 `.cs` 파일을 대량 추가한 뒤 참조 측에서 CS0246이 나면, 코드를 의심하기 전에 `CompilationPipeline.GetAssemblies().sourceFiles`를 확인한다. Unity 에셋 DB가 일부 파일을 컴파일 소스 목록에서 누락하는 경우가 있고, **에디터 재시작 외에는 복구되지 않는다.**
