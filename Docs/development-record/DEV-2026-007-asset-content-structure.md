---
id: DEV-2026-007
title: 에셋 콘텐츠 구조와 출처 관리 준비
status: completed
verification_tier: 0
plan_review: not_required
date: 2026-09-04
approved_at: 2026-09-04
completed_at: 2026-09-04
unity_version: 6000.3.20f1
platform: macOS
related_issue:
related_commit:
tags: [assets, content, provenance, license, third-party]
---

> 이 문서는 승인된 계획, 실행 기록, 검증, 최종 결과를 함께 관리하는 단일 정본이다. 별도 계획 문서를 만들지 않는다.

# 목표

## 배경

무료 2D 에셋으로 `Treasure Hunters`와 `Ninja Adventure`를 선정했으며 다운로드 ZIP과 해제본이 로컬에 준비돼 있다. Unity가 import하는 런타임 리소스, 외부 원본, 게임이 직접 소유하는 조립 에셋과 생성형 리소스를 섞지 않는 간소화된 폴더 구조가 필요하다. 기존 `Docs/Thrid-Party-List.md`는 이름에 오타가 있고 출처 URL과 라이선스 이름만 있어 취득본과 실제 사용 범위를 재현할 수 없다.

## 완료 조건

- `Assets/Content` 아래에 ThirdParty, Generated, Game 소유권 경계가 준비된다.
- `Treasure Hunters`의 PNG와 `Ninja Adventure`의 FX·Items·Ui PNG만 Unity import 영역에 복사된다.
- 원본 ZIP은 `SourceAssets/ThirdParty`에 로컬 보존하되 Git에는 포함하지 않는다.
- 에셋별 출처, 제작자, 취득일, SHA-256, 라이선스, 원본·런타임 경로와 사용 범위를 문서화한다.
- 현재 구조를 `Docs/Architecture.md`에 반영하고 Unity 컴파일을 통과한다.

# 제약사항

- `/Users/murang/Downloads`의 원본 파일은 이동하거나 삭제하지 않고 복사만 한다.
- `Ninja Adventure`의 96MB Audio와 탑다운 Actor·Backgrounds는 아직 Unity에 가져오지 않는다.
- Aseprite 편집 원본과 GIF·미리보기·`.DS_Store`는 Unity import 영역에 복사하지 않는다.
- 게임플레이 코드, asmdef, 씬과 기존 Player 동작은 변경하지 않는다.
- 사용자 승인 없이 commit이나 push를 수행하지 않는다.

# 계획

1. 다운로드 ZIP과 해제본의 파일 수·확장자·크기·SHA-256을 기록한다.
2. `Assets/Content/ThirdParty`, `Generated`, `Game`과 `SourceAssets`의 간소화된 경계를 만든다.
3. `Treasure Hunters`의 PNG 전체와 `Ninja Adventure`의 FX·Items·Ui PNG만 원래 하위 구조를 유지해 복사한다.
4. 원본 ZIP을 `SourceAssets/ThirdParty`에 복사하고 Git 제외 규칙을 추가한다.
5. 출처 문서를 `Docs/Asset-Provenance.md`로 교체하고 라이선스 근거를 `Docs/licenses/assets/`에 보관한다.
6. Architecture.md, 개발 기록과 인덱스를 갱신하고 정적 검사와 Unity 컴파일을 실행한다.

## 변경 예정 파일

- `Assets/Content/ThirdParty/PixelFrog/TreasureHunters/`: 런타임 PNG 1,204개 복사
- `Assets/Content/ThirdParty/PixelBoy/NinjaAdventure/`: FX·Items·Ui 런타임 PNG 564개 복사
- `Assets/Content/Generated/`: 생성형 런타임 리소스 경계 준비
- `Assets/Content/Game/{Player,Enemy,Items,Environment,UI}/`: Prefab·Animator·Material·Tilemap 등 게임 조립 에셋 경계 준비
- `SourceAssets/ThirdParty/`: 다운로드 ZIP 로컬 보존 경계 준비
- `SourceAssets/Generated/`: 생성 원본·프롬프트·편집본 경계 준비
- `.gitignore`: `SourceAssets/ThirdParty`의 ZIP 제외 규칙 추가
- `Docs/Asset-Provenance.md`: 에셋 출처와 사용 상태의 단일 정본 신설
- `Docs/Thrid-Party-List.md`: 오타 난 임시 목록 제거 후 정본으로 내용 이관
- `Docs/licenses/assets/`: 다운로드에 포함된 라이선스와 웹 확인 근거 보관
- `Docs/Architecture.md`: Content와 SourceAssets 책임·파이프라인 반영
- `Docs/development-record/DEV-2026-007-asset-content-structure.md`: 계획·실행·결과 기록
- `Docs/development-record/Index.md`: DEV-007 포인터 추가
- Unity 생성 `.meta`: 신규 Assets 폴더와 리소스 GUID 보존

## 영향 범위

- 향후 Player·Enemy·Items·Environment·UI용 시각·음향 리소스 탐색과 교체
- 서드파티 라이선스 감사와 생성형 에셋 출처 추적
- Unity Asset Database의 신규 PNG import

## 범위 제외 (Non-goals)

- Sprite Editor 슬라이스, Pixels Per Unit, Filter Mode 등 import 설정 확정
- AnimationClip, AnimatorController, Prefab, Tile Palette와 완성 맵 생성
- Ninja Adventure 전체 Actor·Backgrounds·Audio import
- Git LFS 도입과 원본 ZIP 버전 관리
- 실제 플레이어·적·UI에 새 에셋 연결

## 구조·소유권 점검

- 기존 `Assets/Feature`는 코드 계층, `Assets/Data`는 ScriptableObject 인스턴스를 소유하며 범용 콘텐츠 원재료 소유자는 없다. `Assets/Packages`는 NuGet 복원 경로이므로 확장하지 않는다.
- 출처별 원재료는 `Assets/Content/ThirdParty|Generated`, 게임 조립물은 `Assets/Content/Game`, Unity가 import할 필요 없는 원본은 `SourceAssets`가 소유한다.
- `Authored`는 직접 만든 순수 원재료가 생기기 전까지 만들지 않아 YAGNI를 지킨다.
- 동일 ZIP과 전체 해제본을 모두 Git에 중복 보관하지 않고 ZIP은 로컬 전용, 선별 런타임 파일만 Git 대상으로 삼아 저장소 크기를 제한한다.

## 계획 검토

에셋·문서·Git 제외 설정만 바꾸는 티어 0 작업이므로 `plan-critic` 대상이 아니다. 구조만 만들면 에셋을 바로 사용할 수 없고, 두 번들을 전부 import하면 96MB Audio와 불필요한 탑다운 리소스까지 들어온다. 승인된 간소화안에 따라 Treasure Hunters 전체 PNG와 Ninja Adventure의 보조 UI·아이템·FX만 import한다.

## 검증 계획

증거 티어 0으로 진행하며 하향하지 않는다.

```bash
find와 shasum으로 원본·복사본 파일 수와 SHA-256 대조
rg로 Assets/Content 아래 금지 확장자와 .DS_Store 부재 확인
node .codex/hooks/architecture-doc-check.js --working-tree
uloop compile
git diff --check
```

## 사람 검수 항목

- Project 창에서 출처별 에셋과 Game 조립 경계가 직관적으로 구분되는지
- PNG가 손상 없이 보이고 필요한 애니메이션 프레임과 UI 요소가 포함됐는지
- 실제 적용 시 픽셀 크기·Filter Mode·압축 설정이 게임 화면에 적합한지

# 실행 기록

| 시각 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 21:05 | 연결 대화와 현재 프로젝트 구조 확인 | 성공 | 승인된 간소화 구조와 기존 `Assets/Feature`, `Assets/Data`, `Assets/Packages` 소유권 대조 |
| 21:05 | 다운로드 원본 조사 | 성공 | Treasure Hunters ZIP 1,397,175 bytes·PNG 1,204개, Ninja Adventure ZIP 94,022,790 bytes·선별 런타임 PNG 564개 확인 |
| 21:18 | Content·SourceAssets 경계 생성과 에셋 복사 | 성공 | Treasure Hunters PNG 1,204개, Ninja Adventure FX 72개·Items 138개·Ui 354개 배치 |
| 21:22 | 미리보기와 비런타임 파일 정리 | 성공 | Ninja Adventure 미리보기 PNG 10개를 런타임 복사본에서 제외하고 ZIP 원본은 보존 |
| 21:26 | 출처·라이선스·아키텍처 문서 갱신 | 성공 | `Asset-Provenance.md`, 라이선스 근거, `Architecture.md`, 인덱스 갱신 |
| 21:31 | 원본 대조와 Unity 재컴파일 | 성공 | 선별 PNG 차이 없음, Error 0·Warning 0 |

# 발견 사항

- Treasure Hunters ZIP에는 별도 LICENSE·README 파일이 없으므로 공식 배포 페이지의 CC0 표시를 별도 문서 근거로 보존해야 한다.
- Ninja Adventure에는 CC0 1.0 원문 `LICENSE.txt`와 제작자·출처가 적힌 `README.md`가 포함돼 있다.
- Ninja Adventure 해제본 110MB 중 Audio가 96MB를 차지한다. 이번 구조 준비에서 Audio를 제외하면 Unity import와 저장소 증가를 크게 줄일 수 있다.
- 프로젝트에는 Aseprite Importer 3.0.2가 있지만 이번에는 PNG를 런타임 입력으로 사용하고 Aseprite는 원본 ZIP 안에만 보존한다.

# 결정 사항

## DEC-001: 선별 런타임 import와 로컬 원본 보존을 병행

### 맥락

구조만 만들면 준비된 에셋을 사용할 수 없고, 두 번들 전체를 Assets에 넣으면 사용하지 않는 파일까지 Unity가 import한다. Ninja Adventure ZIP은 94MB라 일반 Git blob으로 보존하기에도 부담이 크다.

### 검토한 선택지

- 폴더와 문서만 만들고 에셋은 복사하지 않음
- 필요한 런타임 파일만 Assets에 복사하고 ZIP은 Git 제외된 SourceAssets에 보존
- 두 번들의 해제본과 ZIP을 모두 Git에 포함

### 결정

두 번째 방식을 채택한다. Treasure Hunters PNG 전체와 Ninja Adventure의 FX·Items·Ui PNG를 Unity에 복사하고, ZIP은 로컬 `SourceAssets`에 복사하되 SHA-256과 출처만 Git 문서에 기록한다.

### 영향

- 에셋을 바로 탐색할 수 있으면서 Unity import와 저장소 크기를 제한한다.
- 새 clone에서는 SourceAssets ZIP이 복원되지 않으므로 출처 URL과 SHA-256으로 다시 받아야 한다.
- 다른 Ninja Adventure 범주가 필요해지면 명시적으로 추가 import하고 출처 문서의 사용 범위를 갱신해야 한다.

# 변경 내용

- `Assets/Content/ThirdParty`를 제작자와 배포 팩 기준으로 만들고 두 에셋의 선별된 PNG 1,768개를 원래 하위 구조를 유지해 복사했다.
- `Assets/Content/Generated`와 `Assets/Content/Game/{Player,Enemy,Items,Environment,UI}`를 만들어 생성 원재료와 게임 조립 에셋의 소유권을 분리했다.
- 다운로드 ZIP 두 개를 `SourceAssets/ThirdParty`에 복사하고 `.gitignore`로 ZIP만 로컬 보존하도록 했다. 생성형 편집 원본을 위한 `SourceAssets/Generated`도 준비했다.
- 오타 난 임시 목록 `Docs/Thrid-Party-List.md`를 제거하고, 재취득 가능한 출처·SHA-256·사용 범위를 갖춘 `Docs/Asset-Provenance.md`로 교체했다.
- Ninja Adventure 배포본의 `LICENSE.txt`와 `README.md`, Treasure Hunters 공식 배포 페이지의 라이선스 확인 기록을 `Docs/licenses/assets/`에 보존했다.
- `Docs/Architecture.md`에 Content와 SourceAssets의 책임 및 원본에서 게임 조립물로 이어지는 에셋 흐름을 추가했다.

# 검증

| 검증 항목 | 결과 | 증거 |
|---|---|---|
| 런타임 PNG 수 | 통과 | Treasure Hunters 1,204개, Ninja Adventure FX 72개·Items 138개·Ui 354개, 합계 1,768개 |
| 선별 원본 바이트 대조 | 통과 | `rsync -rcnm` 체크섬 dry-run에서 네 복사 범주 모두 차이 없음 |
| 금지 파일 부재 | 통과 | `Assets/Content`에서 Aseprite·GIF·ZIP·`.DS_Store`·미리보기 검색 결과 0개 |
| 원본 ZIP 무결성 | 통과 | Treasure Hunters `24411442...8542a35`, Ninja Adventure `95a06f4f...2a7b15`로 취득본과 일치 |
| 대표 이미지 육안 확인 | 통과 | Player idle 프레임, Terrain 시트, CircularSlash 시트를 원본 해상도로 열어 손상 없음 확인 |
| Unity 컴파일 | 통과 | `uloop compile`: ErrorCount 0, WarningCount 0 |
| 아키텍처 문서 검사 | 통과 | 작업 트리 기준 asmdef 7개·간선 16개·Mermaid 블록 4개 일치 |
| Git diff 형식 | 통과 | `git diff --check` 오류 없음 |

# 최종 결과

Unity가 사용하는 선별 런타임 리소스, Git에서 제외한 원본 ZIP, 생성형 원본과 게임 조립 에셋을 서로 다른 책임 경계로 준비했다. 두 서드파티 팩은 라이선스와 취득본 해시까지 추적할 수 있으며, 불필요한 Audio·탑다운 Actor·Backgrounds·편집 파일은 아직 Unity import 비용을 발생시키지 않는다. 게임플레이 코드와 기존 Player 동작은 변경하지 않았다.

# 후속 작업

- [ ] 실제 기능 연결 시 Sprite import 설정과 AnimationClip 생성 규칙을 확정한다.
- [ ] 큰 원본을 저장소에서 재현해야 할 필요가 생기면 Git LFS 도입을 검토한다.

# 다음 작업에서 재사용할 지식

- 외부 파일은 `ThirdParty/<제작자>/<팩>` 경계를 유지해야 팩 단위 교체와 라이선스 감사가 쉽다.
- 생성형 원재료는 `Generated`, Prefab·AnimationClip처럼 프로젝트가 조립한 결과는 `Game`이 소유한다.
- Ninja Adventure의 추가 범주를 도입할 때는 전체 ZIP을 다시 복사하지 말고 필요한 런타임 파일만 선별한 뒤 `Asset-Provenance.md`의 가져온 범위를 갱신한다.
- Sprite import 설정은 에셋 연결 작업에서 실제 화면을 기준으로 확정해야 하며, 이번 준비 단계의 기본 import 결과를 최종 규칙으로 간주하지 않는다.
