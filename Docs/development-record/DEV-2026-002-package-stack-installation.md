---
id: DEV-2026-002
title: Unity 기반 패키지 스택 설치
status: completed
date: 2026-09-03
unity_version: 6000.3.20f1
platform: macOS
related_issue:
related_commit:
tags: [packages, nuget, r3, unitask, vcontainer, uloop, ui-toolkit, localization]
---

# 목표

## 배경

Clean Architecture 프로젝트에서 사용할 반응형, 비동기, DI 라이브러리와 에디터 자동화 도구를 실제 프로젝트 의존성으로 설치한다.

## 완료 조건

- NuGetForUnity를 먼저 설치하고 R3 코어를 NuGet으로 복원한다.
- R3.Unity, UniTask, VContainer를 공식 Unity 패키지 경로로 설치한다.
- Unity 6 내장 UI Toolkit 모듈의 설치 상태를 확인한다.
- Unity Localization 최신 안정 패키지를 설치한다.
- Unity CLI Loop의 최신 안정 Unity 패키지와 V3 디스패처를 설치한다.
- 모든 패키지를 포함한 Unity 컴파일이 오류와 경고 없이 통과한다.

# 제약사항

- 기존 `README.md`와 `Docs/Tech-Stack.md`의 사용자 작성 내용은 보존한다.
- 직접 의존성은 재현 가능하도록 안정 릴리스 태그로 고정한다.
- 사용자 승인 없이 git commit이나 push를 수행하지 않는다.

# 계획

1. NuGetForUnity를 UPM Git 의존성으로 설치한다.
2. R3 코어와 전이 의존성을 NuGetForUnity로 복원한다.
3. R3.Unity, UniTask, VContainer를 UPM Git 의존성으로 설치한다.
4. Unity CLI Loop 패키지를 3.2.1로, V3 디스패처를 Homebrew 최신 안정판으로 설치한다.
5. 기술 스택 문서와 패키지 잠금 파일을 확인하고 `uloop`로 컴파일한다.

# 실행 기록

| 시각 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 07:28 | NuGetForUnity 4.5.0 설치 | 성공 | `Packages/manifest.json`, `Packages/packages-lock.json` |
| 07:35 | Unity CLI Loop 2.2.0 패키지와 전역 CLI 설치 | 성공 | `uloop -v` 출력 `2.2.0` |
| 07:37 | R3 1.3.1 코어 및 전이 의존성 복원 | 성공 | `Assets/packages.config`, `Assets/Packages/` |
| 07:38 | R3.Unity 1.3.1, UniTask 2.5.11, VContainer 1.19.0 설치 | 성공 | `Packages/packages-lock.json` |
| 07:39 | 전체 패키지 컴파일 | 성공 | `uloop compile --wait-for-domain-reload true`: ErrorCount 0, WarningCount 0 |
| 07:42 | Unity 재시작 후 최종 컴파일과 오류 로그 확인 | 성공 | 컴파일 ErrorCount 0, WarningCount 0; 콘솔 Error TotalCount 0 |
| 07:53 | 안정 릴리스 재확인 및 Unity CLI Loop V3 전환 | 성공 | Unity 패키지 3.2.1, Homebrew 디스패처 3.2.2, project runner 3.1.1 |
| 07:54 | V3 CLI 전체 테스트 탐색 | 테스트 없음 | `NoTestsFound`, 발견된 테스트 0개, 사전 컴파일 성공 |
| 08:00 | UI Toolkit 내장 모듈 설치 상태 확인 | 성공 | manifest·lockfile·PackageCache에서 `com.unity.modules.uielements` 1.0.0 확인 |
| 08:00 | Tech Stack을 현재 직접 의존성과 동기화 | 성공 | 외부 5개, Unity 제공 18개, 내장 모듈 34개 및 NuGet 구성 반영 |
| 08:06 | Unity Localization 1.5.9 설치 | 성공 | manifest·lockfile·PackageCache에서 확인; Addressables 2.9.1로 해석 |
| 08:07 | Localization 포함 전체 컴파일·오류 로그 확인 | 성공 | ErrorCount 0, WarningCount 0, Error 로그 0건 |

# 발견 사항

- R3의 Unity 사용에는 NuGet 코어와 `com.cysharp.r3` 패키지가 모두 필요하다.
- R3 1.3.1의 nuspec은 `System.Runtime.CompilerServices.Unsafe` 6.0.0을 요구하지만 NuGetForUnity는 Unity가 이미 제공하는 어셈블리로 판정하여 `Assets/Packages`에 중복 복원하지 않았다.
- 공식 Git 태그와 V3 문서를 다시 대조한 결과 Unity 패키지 3.2.1이 최신 안정판이었다. 릴리스 인덱스만 보고 2.2.0을 선택한 기존 판단을 바로잡았다.
- V3는 전역 npm CLI 대신 Homebrew 디스패처를 사용하고 프로젝트별 runner 버전을 `.uloop/project-runner-pin.json`으로 고정한다.
- Unity 6000.3의 UI Toolkit은 별도 외부 패키지가 아니라 `com.unity.modules.uielements` 내장 모듈로 제공되며 이미 직접 의존성으로 설치되어 있었다.
- Localization 1.5.9는 Addressables 1.25.0을 의존성으로 선언하지만, 현재 프로젝트 lockfile에서는 호환되는 Addressables 2.9.1로 해석됐다.
- 패키지를 열린 에디터에서 실시간 임포트할 때 Unity Package Manager 내부 `ScriptableSingleton already exists` 로그가 일시적으로 발생했으며 에디터 정상 재시작 후 재발하지 않았다.

# 결정 사항

## DEC-001: Unity 라이브러리는 공식 권장 배포 경로 사용

### 맥락

UniTask의 NuGet 배포물은 .NET Core용 부분 집합이며 Unity PlayerLoop 기능이 빠진다. R3는 반대로 Unity 래퍼 외에 NuGet 코어도 필요하다.

### 검토한 선택지

- 모든 라이브러리를 NuGet으로 설치
- 모든 라이브러리를 UPM Git으로 설치
- 각 프로젝트가 공식 문서에서 지정한 NuGet/UPM 조합 사용

### 결정

R3 코어만 NuGetForUnity로 설치하고 R3.Unity, UniTask, VContainer는 공식 UPM Git 패키지로 설치한다.

### 영향

- Unity 전용 API와 통합 기능을 온전히 사용할 수 있다.
- R3 업데이트 시 NuGet 코어와 Unity 패키지 태그를 함께 올려야 한다.

# 변경 내용

- `Packages/manifest.json`에 다섯 개 직접 의존성을 추가했다.
- Unity가 `Packages/packages-lock.json`을 해석된 버전과 커밋 해시로 갱신했다.
- NuGetForUnity가 `Assets/NuGet.config`, `Assets/packages.config`, `Assets/Packages/`를 생성했다.
- 기존 전역 npm `uloop-cli` 2.2.0을 제거하고 Homebrew `uloop` 디스패처 3.2.2를 설치했다.
- Unity CLI Loop 패키지를 3.2.1로 올리고 `.uloop/` 런타임 파일은 제외하되 `project-runner-pin.json`은 버전 계약으로 추적하도록 설정했다.
- `Docs/Tech-Stack.md`에 UI Toolkit 내장 모듈 1.0.0의 설치 상태와 버전 관리 방식을 기록했다.
- `Docs/Tech-Stack.md`를 manifest와 NuGet 설정 기준으로 재구성하고 미설치 후보를 설치 스택에서 분리했다.
- `com.unity.localization` 1.5.9를 직접 UPM 의존성으로 추가하고 Tech Stack에 반영했다.
- `Docs/Tech-Stack.md`에 실제 설치 버전과 상태를 기록했다.

# 검증

- `uloop -v`: Homebrew 디스패처 `3.2.2`
- `.uloop/project-runner-pin.json`: project runner `3.1.1`
- `uloop compile`: `Success: true`, `ErrorCount: 0`, `WarningCount: 0`
- `uloop get-logs --log-type Error --max-count 100`: `TotalCount: 0`
- `uloop run-tests --filter-type all`: 테스트 어셈블리가 없어 `NoTestsFound`; 사전 컴파일은 성공
- `Packages/packages-lock.json`에서 모든 UPM 직접 의존성의 버전과 커밋 해시를 확인했다.
- `Assets/packages.config`와 실제 DLL 디렉터리에서 R3 및 전이 의존성 복원을 확인했다.
- `Packages/manifest.json`, `Packages/packages-lock.json`, `Library/PackageCache/com.unity.modules.uielements/package.json`에서 UI Toolkit 1.0.0을 확인했다.
- `Packages/packages-lock.json`과 PackageCache에서 Localization 1.5.9 및 Addressables 2.9.1 해석을 확인했다.

# 최종 결과

요청한 패키지 스택, Unity CLI Loop, UI Toolkit, Unity Localization을 설치·확인했고 전체 컴파일을 통과했다.

# 후속 작업

없음.

# 다음 작업에서 재사용할 지식

- R3 버전을 바꿀 때 `Assets/packages.config`의 R3와 `Packages/manifest.json`의 R3.Unity 태그를 함께 갱신한다.
- 패키지 변경 후에는 `uloop compile`뿐 아니라 `uloop get-logs`로 DLL 로드 실패도 확인한다.
