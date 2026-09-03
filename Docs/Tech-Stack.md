# 기술 스택

이 문서는 현재 프로젝트에서 확인된 기술만 설치 스택으로 기록한다. UPM의 정본은 `Packages/manifest.json`, 해석 결과는 `Packages/packages-lock.json`, NuGet의 정본은 `Assets/packages.config`다.

## 현재 사용 중인 스택

| 분류 | 기술 | 버전 | 용도 |
| --- | --- | --- | --- |
| 엔진 | Unity | 6000.3.20f1 | 게임 엔진 및 에디터 |
| 아키텍처·DI | Clean Architecture + VContainer | 1.19.0 | 계층 구조와 의존성 주입 |
| 반응형 | R3 / R3.Unity | 1.3.1 | 반응형 데이터 흐름 |
| 비동기 | UniTask | 2.5.11 | Unity PlayerLoop 기반 비동기 작업 |
| UI | UI Toolkit / Unity UI | 내장 1.0.0 / 2.0.0 | 런타임·에디터 UI |
| 렌더링 | Universal Render Pipeline | 17.3.0 | 2D 렌더링 파이프라인 |
| 2D | 2D Animation 외 2D 패키지군 | Animation 13.0.5 | 스프라이트·애니메이션·타일맵 제작 |
| 입력 | Input System | 1.19.0 | 입력 액션과 런타임 입력 |
| 현지화 | Unity Localization | 1.5.9 | 문자열·에셋·로케일 관리 |
| 테스트 | Unity Test Framework | 1.6.0 | EditMode·PlayMode 테스트; 현재 테스트 없음 |
| 데이터 | ScriptableObject | Unity 6000.3 내장 | 게임 데이터 자산 |
| 패키지 관리 | NuGetForUnity | 4.5.0 | Unity용 NuGet 패키지 복원 |
| 개발 루프 | [Unity CLI Loop](https://github.com/hatayama/unity-cli-loop) | 패키지 3.2.1 / 디스패처 3.2.2 | CLI 기반 컴파일·테스트·로그 조회 |

## 설치된 직접 패키지

### 외부 패키지

| 관리 방식 | 패키지 ID | 버전 |
| --- | --- | --- |
| UPM Git | `com.github-glitchenzo.nugetforunity` | 4.5.0 |
| UPM Git | `com.cysharp.r3` | 1.3.1 |
| UPM Git | `com.cysharp.unitask` | 2.5.11 |
| UPM Git | `jp.hadashikick.vcontainer` | 1.19.0 |
| UPM Git | `io.github.hatayama.uloopmcp` | 3.2.1 |
| NuGet | `R3` | 1.3.1 |

### Unity 제공 패키지

| 패키지 ID | 버전 | 역할 |
| --- | --- | --- |
| `com.unity.2d.animation` | 13.0.5 | 2D 스켈레탈 애니메이션 |
| `com.unity.2d.aseprite` | 3.0.2 | Aseprite 임포트 |
| `com.unity.2d.psdimporter` | 12.0.2 | PSD 임포트 |
| `com.unity.2d.sprite` | 1.0.0 | 스프라이트 편집 |
| `com.unity.2d.spriteshape` | 13.0.0 | SpriteShape 제작 |
| `com.unity.2d.tilemap` | 1.0.0 | Tilemap |
| `com.unity.2d.tilemap.extras` | 6.0.2 | 추가 Tilemap 도구 |
| `com.unity.2d.tooling` | 1.0.3 | 공용 2D 도구 |
| `com.unity.collab-proxy` | 2.12.4 | Version Control 연동 |
| `com.unity.ide.rider` | 3.0.40 | Rider 연동 |
| `com.unity.ide.visualstudio` | 2.0.26 | Visual Studio 연동 |
| `com.unity.inputsystem` | 1.19.0 | 입력 시스템 |
| `com.unity.localization` | 1.5.9 | 문자열·에셋 현지화 |
| `com.unity.multiplayer.center` | 1.0.1 | Multiplayer Center |
| `com.unity.render-pipelines.universal` | 17.3.0 | URP |
| `com.unity.test-framework` | 1.6.0 | Unity Test Framework |
| `com.unity.timeline` | 1.8.12 | Timeline |
| `com.unity.ugui` | 2.0.0 | Unity UI |
| `com.unity.visualscripting` | 1.9.11 | Visual Scripting |

### Unity 6 내장 모듈

아래 모듈은 모두 `1.0.0` 직접 의존성이며 Unity 에디터 버전과 함께 관리된다.

```text
accessibility, adaptiveperformance, ai, androidjni, animation,
assetbundle, audio, cloth, director, imageconversion, imgui,
jsonserialize, particlesystem, physics, physics2d, screencapture,
terrain, terrainphysics, tilemap, ui, uielements, umbra,
unityanalytics, unitywebrequest, unitywebrequestassetbundle,
unitywebrequestaudio, unitywebrequesttexture, unitywebrequestwww,
vectorgraphics, vehicles, video, vr, wind, xr
```

UI Toolkit은 `com.unity.modules.uielements`로 설치되어 있다. 별도 외부 UPM 패키지를 추가하지 않으며, 실제 기능 버전은 Unity 에디터 버전과 함께 관리한다.

## Localization 전이 의존성

Localization 1.5.9 설치 후 Unity Package Manager가 다음 버전으로 해석했다.

| 패키지 ID | 해석된 버전 | 깊이 |
| --- | --- | --- |
| `com.unity.localization` | 1.5.9 | 직접 의존성 |
| `com.unity.addressables` | 2.9.1 | 전이 1단계 |
| `com.unity.scriptablebuildpipeline` | 2.6.1 | 전이 2단계 |
| `com.unity.profiling.core` | 1.0.3 | 전이 2단계 |
| `com.unity.nuget.newtonsoft-json` | 3.2.2 | 공유 전이 의존성 |

## R3는 2단계 설치가 필요하다

R3의 Unity 패키지(`com.cysharp.r3`)는 **래퍼일 뿐이고 코어는 NuGet에 있다.** git 패키지만 넣으면 `TimeProvider` / `ITimer`를 못 찾아 컴파일이 깨진다.

코어는 NuGetForUnity가 `Assets/packages.config`를 보고 `Assets/Packages/`로 복원한다:

| NuGet 패키지 | 버전 | 역할 |
| --- | --- | --- |
| `R3` | 1.3.1 | 코어 |
| `Microsoft.Bcl.TimeProvider` | 8.0.0 | `TimeProvider` / `ITimer` |
| `Microsoft.Bcl.AsyncInterfaces` | 6.0.0 | 전이 의존 |
| `System.ComponentModel.Annotations` | 5.0.0 | 〃 |
| `System.Runtime.CompilerServices.Unsafe` | 6.0.0 | R3가 요구하지만 Unity 내장 어셈블리로 충족되어 별도 복원되지 않음 |
| `System.Threading.Channels` | 8.0.0 | R3.dll이 참조 |

전이 의존의 버전은 손으로 정하지 않는다 — R3의 nuspec이 범위가 아닌 **고정 버전**을 선언하므로, NuGetForUnity가 복원할 때 그 값으로 맞춘다.

## 두 버전은 반드시 함께 올린다

`com.cysharp.r3`의 `package.json`은 코어 R3 버전을 의존성으로 **선언하지 않는다.** UPM이 짝을 검사할 방법이 없다는 뜻이다. 게다가 `R3.Unity.asmdef`는 `precompiledReferences`로 파일 이름(`R3.dll`)만 보고 링크하므로, `Assets/Packages/`에 어떤 버전이 있든 그대로 물린다.

따라서 **한쪽만 올리면 조용히 어긋난다.** 버전을 바꿀 때는 `Packages/manifest.json`의 git 태그와 `Assets/packages.config`의 `R3` 버전을 항상 같이 고친다.

## 검증 시 주의

`System.Threading.Channels`가 빠지면 **컴파일은 통과하는데 Unity가 R3.dll 로드를 거부한다.** 이 실패는 컴파일 에러가 아니라 콘솔 로그로만 나타나므로, 패키지를 건드린 뒤에는 `uloop compile`뿐 아니라 `uloop get-logs`도 함께 확인해야 한다.

복원은 Unity의 `NuGet > Restore Packages` 메뉴가 수행한다. `packages.config`를 직접 편집한 경우 자동 복원되지 않으므로 이 메뉴를 실행해야 한다.

---

# 개발 루프 — uloop cli

[unity-cli-loop](https://github.com/hatayama/unity-cli-loop)은 Unity 에디터를 CLI로 조작해 컴파일·테스트·로그 조회를 수행하는 도구다. 에디터 UI를 열지 않고도 코드 변경의 결과를 **기계가 읽을 수 있는 증거**로 확인할 수 있어, "빌드가 되는지"를 사람 눈으로 확인하는 과정을 없앤다.

## 설치

V3 디스패처 (macOS, 전역 1회):

```bash
brew install hatayama/tap/uloop
```

Unity 패키지는 `Packages/manifest.json`에 3.2.1 태그로 고정되어 있으므로 에디터를 열면 자동으로 임포트된다. V3 디스패처는 프로젝트에 맞는 runner를 자동으로 선택하며, 현재 선택된 3.1.1은 `.uloop/project-runner-pin.json`에 기록해 팀에서 공유한다. 프로젝트 설정은 `UserSettings/UnityCliLoopSettings.json`에 저장된다.

## 주요 명령

| 목적 | 명령 |
| --- | --- |
| 컴파일 | `uloop compile` |
| 도메인 리로드를 기다리지 않고 컴파일 | `uloop compile --no-wait-for-domain-reload` |
| 전체 테스트 실행 | `uloop run-tests --filter-type all` |
| 최근 콘솔 로그 조회 | `uloop get-logs --max-count 10` |
| 에디터 실행 | `uloop launch` |

명령은 현재 디렉터리에서 Unity 프로젝트를 자동 탐지한다. 다른 경로를 대상으로 하려면 `--project-path`를 지정한다.

## 검증 기준

이 프로젝트의 변경은 아래 두 명령으로 검증한다. `harness-bindings.json`에도 동일하게 정의돼 있다.

```bash
uloop compile
```

```bash
uloop run-tests
```

패키지를 건드린 변경은 여기에 콘솔 확인을 더한다. **어셈블리 로드 실패는 컴파일 에러로 잡히지 않기 때문이다** — `ErrorCount: 0`인데 DLL이 로드되지 않은 상태가 실제로 발생한다.

```bash
uloop get-logs --max-count 30
```
