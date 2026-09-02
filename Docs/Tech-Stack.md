# 기술 스택

이 문서는 현재 프로젝트 파일에서 확인된 기술과 검증 명령만 기록한다. 도입 제안은 설치된 기술과 구분한다.

## 개발 환경

| 분류 | 기술 | 버전 | 용도 | 상태 |
| --- | --- | --- | --- | --- |
| 엔진 | Unity | 6000.3.20f1 | 게임 엔진 및 에디터 | 설치됨 |
| 렌더링 | Universal Render Pipeline | 17.3.0 | 2D 렌더링 파이프라인 | 설치됨 |
| 입력 | Input System | 1.19.0 | 입력 액션과 런타임 입력 | 설치됨 |
| 테스트 | Unity Test Framework | 1.6.0 | EditMode·PlayMode 테스트 | 설치됨, 프로젝트 테스트 없음 |
| 2D | 2D Animation | 13.0.5 | 2D 애니메이션 도구 | 설치됨 |
| 2D | 2D Aseprite Importer | 3.0.2 | Aseprite 파일 임포트 | 설치됨 |
| 2D | 2D PSD Importer | 12.0.2 | PSD 파일 임포트 | 설치됨 |
| 2D | 2D SpriteShape | 13.0.0 | SpriteShape 제작 | 설치됨 |
| 2D | 2D Tilemap Extras | 6.0.2 | 추가 Tilemap 도구 | 설치됨 |
| UI | Unity UI | 2.0.0 | 런타임 UI | 설치됨 |
| 시퀀싱 | Timeline | 1.8.12 | 타임라인 연출 | 설치됨 |
| 비주얼 스크립팅 | Visual Scripting | 1.9.11 | 그래프 기반 로직 | 설치됨 |
| IDE 연동 | Rider Editor | 3.0.40 | Rider 프로젝트 연동 | 설치됨 |
| IDE 연동 | Visual Studio Editor | 2.0.26 | Visual Studio 프로젝트 연동 | 설치됨 |

패키지의 정본은 `Packages/manifest.json`, 해석된 의존성 정본은 `Packages/packages-lock.json`이다. VContainer, R3, UniTask, LitMotion 등 아키텍처 보조 라이브러리는 현재 설치되지 않았으며 도입이 확정되지 않았다.

## 패키지 설치와 변경

- Unity 6000.3.20f1로 프로젝트를 열면 Package Manager가 `Packages/manifest.json`을 기준으로 패키지를 복원한다.
- 직접 의존성을 바꿀 때는 `manifest.json`과 자동 갱신된 `packages-lock.json`을 함께 검토한다.
- Unity 버전이나 패키지 버전을 변경하면 `ProjectSettings/ProjectVersion.txt`, 이 문서, 하네스 명령의 Unity 실행 경로를 함께 갱신한다.
- 패키지 변경 후에는 컴파일뿐 아니라 Unity 로그에 어셈블리 로드·패키지 해석 오류가 없는지도 확인한다.

## 검증 명령

아래 명령은 `.codex/harness-bindings.json`과 동일하다. 실행 전에 이 프로젝트를 연 Unity Editor를 종료해야 한다. 동일 프로젝트를 GUI와 batch mode에서 동시에 열 수 없기 때문이다.

### 컴파일

```bash
/Applications/Unity/Hub/Editor/6000.3.20f1/Unity.app/Contents/MacOS/Unity -batchmode -quit -projectPath /Users/murang/Developer/Unity/CleanArchitecture -logFile -
```

성공 기준은 프로세스 종료 코드 `0`이며, 출력 로그에 C# 컴파일·패키지 로드 오류가 없어야 한다.

### EditMode 테스트

```bash
/Applications/Unity/Hub/Editor/6000.3.20f1/Unity.app/Contents/MacOS/Unity -batchmode -projectPath /Users/murang/Developer/Unity/CleanArchitecture -runTests -testPlatform EditMode -testResults /Users/murang/Developer/Unity/CleanArchitecture/Logs/EditModeTestResults.xml -logFile -
```

현재 프로젝트에는 테스트 어셈블리와 테스트 케이스가 없다. 테스트를 추가한 뒤에는 결과 XML에서 실패·오류가 `0`인지 확인한다.

## 기술 도입 검증 기준

- 새 패키지는 사용 목적, 정확한 버전, 의존성, 제거 방법을 이 문서에 기록한다.
- Clean Architecture 계층을 추가할 때는 asmdef 참조 방향과 순수 C# 계층의 Unity 비의존성을 자동화 테스트 또는 컴파일 제약으로 검증한다.
- 패키지를 교체·제거할 때는 manifest와 lockfile에 잔여 직접·전이 의존성이 없는지 확인한다.
