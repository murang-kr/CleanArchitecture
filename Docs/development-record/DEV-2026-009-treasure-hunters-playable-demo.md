---
id: DEV-2026-009
title: Treasure Hunters 플레이 데모
status: in_progress
verification_tier: 2
plan_review: okay
date: 2026-09-04
approved_at: 2026-09-04
completed_at:
approval_required: false
authorization_basis: 데모 구현 승인에 이어 2026-09-05 사용자가 2·3·4번 커밋을 각각 승인
unity_version: 6000.3.20f1
platform: macOS arm64
related_issue:
related_commit:
tags: [player, animation, tilemap, scene, treasure-hunters]
---

> 계획·실행·검증을 함께 보관하는 단일 기록이다. 분리 커밋이 진행 중이므로 이 시점에는 포함된 변경만 결과로 기록한다.

# 목표

Treasure Hunters로 작은 이동 데모를 구성한다. 픽셀 아트는 PPU 32·Scale 1, 화면은 16:9·384×216 기준 정수배 출력, 이동 애니메이션은 10 FPS를 사용한다.

# 제약사항

- PNG 원본과 기존 Sprite 참조를 보존하고 임포트 메타데이터를 수정한다.
- 기존 Domain·Application 이동 판정을 유지한다.
- 스크린샷은 `artifacts/local/DEV-2026-009/`에 로컬 보관하고 Git에 포함하지 않는다.
- 사용자 승인 없이 commit·push를 수행하지 않는다.

# 계획

1. 스크린샷 로컬 보관 정책을 별도 커밋한다.
2. ThirdParty 임포트 메타데이터와 자동 임포트 정책을 커밋한다.
3. AnimationClip·AnimatorController·Tile 조립 에셋을 커밋한다.
4. Player 표현 로직과 EditMode 테스트를 커밋한다.
5. 씬 통합·PlayMode 검증 및 최종 문서를 별도 승인 후 커밋한다.

Architecture.md와 에셋 출처 문서는 각 단계의 실제 구조·사용 범위만 반영한다. 계층 책임·주요 호출 흐름을 설명하는 문서 변경은 해당 코드와 같이 포함한다.

# 실행 기록

| 단계 | 반영 내용 | 상태 |
|---|---|---|
| 1 | 스크린샷 7개 로컬 이동·Git 제외·공용 기록 정책 | f06a29e 완료 |
| 2 | ThirdParty PPU 32·Point·무압축·mipmap 해제·NPOT 원본 유지 | a52a5db 완료 |
| 3 | 10 FPS AnimationClip 5개·Animator 1개·Tile 3개와 .meta | 44ccbbd 완료 |
| 4 | Player 표시 상태·Animator 연결·EditMode 테스트 | 이 커밋에 포함 |

# 변경 내용

- Treasure Hunters 1,204개와 Ninja Adventure 564개의 PNG 임포트 메타데이터를 통일한다.
- Terrain·야자수 부품의 데모용 Sprite 분할을 포함하며 PNG 바이트는 바꾸지 않는다.
- `Assets/Editor/PixelArtTexturePostprocessor.cs`가 Content 경로의 새 텍스처에도 같은 기준을 적용한다.
- Editor 기본 어셈블리의 임포트 정책만 추가하며 런타임 계층과 asmdef 의존은 유지한다.

# 검증

- 변경된 ThirdParty 파일 1,768개는 모두 PNG의 .meta이며 PPU 32·Point·mipmap 해제·NPOT 유지·무압축 설정을 검사했다.
- 이전 구현 검증에서 로드된 텍스처 1,768개·Sprite 2,985개에 PPU 오류·해상도 축소·플랫폼 override가 없음을 확인했다. 이번 단계에서 임포터 코드와 에셋 설정을 추가 변경하지 않고 검증한 결과물을 분리한다.
- 스크린샷 7개는 로컬에서 보존되며 Git 제외 규칙을 유지한다.
- staged 범위·whitespace·Architecture 문서 검사와 Git 커밋 훅으로 포함 범위를 검증한다.

## 게임 조립 에셋

- `Assets/Content/Game/Player/Animations/`에 Idle·Run·Jump·Fall·Land 5개 AnimationClip을 10 FPS로 구성한다.
- `Assets/Content/Game/Player/Animator/CaptainLocomotion.controller`로 이동 상태 머신을 구성한다.
- `Assets/Content/Game/Environment/Tiles/`에 Palm Ground 좌·중·우 Tile 3개를 둔다.
- 원재료는 ThirdParty에 유지하고 조립 에셋 및 파일·폴더 메타데이터 21개를 함께 포함한다.
- AnimationClip의 10 FPS와 AnimationClip·Controller의 외부 GUID가 존재함을 정적으로 확인했다. 이 단계는 씬 연결이나 전체 플레이 동작을 새로 검증했다는 뜻이 아니다.

## Player 표현 로직

- `PlayerViewState`에 JustLanded를 추가하고 Presenter에서 공중→접지 전환에만 한 번 전달한다.
- `PlayerVisualView`가 방향 반전과 Animator의 속도·접지·착지 파라미터를 갱신한다. AnimatorController가 없으면 애니메이션 처리는 건너뛴다.
- EditMode 테스트 어셈블리에 Presentation 참조를 추가하고 착지 신호의 일회성 전달을 회귀 검사한다.
- `uloop run-tests --test-mode EditMode --filter-type assembly --filter-value CleanArchitecture.Player.EditModeTests --unsaved-changes fail`: 2026-09-05 14:11 선행 컴파일 성공, 8/8 통과, Fail·Skip 0.
- 검사 시작 때 Unity의 외부 씬 변경 알림이 컴파일 응답을 막았다. 현재 메모리 상태를 보존하는 Ignore로 알림만 닫고 같은 검사 요청이 완료되는 것을 확인했다.
- 검사는 현재 작업 디렉터리에서 수행했으며 다른 커밋의 씬 변경을 빌드 검증한 것으로 주장하지 않는다. Scene·PlayMode 파일은 이 커밋에서 제외한다.
- 기존 모터의 방향을 구분하지 않는 접지 판정은 수정하지 않았다.

# 최종 결과

에셋 임포트 기반·게임 조립 에셋·Player 표현 로직을 순서대로 반영했다. 씬 통합과 PlayMode 회귀 검사 및 최종 기록은 5번 커밋으로 남긴다.

# 후속 작업

- [x] 게임 조립 에셋을 커밋한다.
- [x] Player 표현 로직의 승인된 커밋을 진행한다.
- [ ] 5번 씬 통합·PlayMode·최종 기록 커밋은 별도 승인을 받는다.
