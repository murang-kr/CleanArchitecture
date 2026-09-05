# 에셋 출처 및 라이선스

이 문서는 프로젝트에 가져온 서드파티·생성형 에셋의 출처, 라이선스와 실제 사용 범위를 관리하는 정본이다.

## 관리 원칙

- 서드파티 원재료는 제작자와 배포 팩 기준으로 `Assets/Content/ThirdParty/`에 둔다.
- 생성형 원재료는 기능 기준으로 `Assets/Content/Generated/`에 두고 생성 도구·프롬프트·참조 원본을 기록한다.
- Prefab, AnimatorController, AnimationClip, Material, Tile Palette처럼 게임이 조립한 에셋은 `Assets/Content/Game/`에 둔다.
- Unity가 import할 필요가 없는 ZIP과 생성 원본은 `SourceAssets/`에 두며, 대용량 서드파티 ZIP은 Git에 포함하지 않는다.
- 서드파티 파일은 원본을 직접 수정하지 않는다. 수정본이 필요하면 Game 산출물이나 별도 생성형 원재료로 만들고 파생 출처를 기록한다.
- 새 팩을 가져오거나 사용 범위를 바꾸면 이 문서와 `Docs/licenses/assets/`의 근거를 함께 갱신한다.

## 공통 픽셀 아트 규칙

- `Assets/Content/`의 모든 픽셀 아트는 출처와 사용처에 관계없이 **PPU 32**를 사용한다. 32×32px 타일은 1×1 Unity 유닛이다.
- Sprite 및 모든 부모의 `localScale`·최종 `lossyScale`은 `(1,1,1)`로 고정한다. 코드·AnimationClip에서 배율을 변경하거나 개별 PPU로 크기를 보정하지 않는다. 좌우 반전은 `SpriteRenderer.flipX`로 처리한다.
- [`PixelArtTexturePostprocessor.cs`](../Assets/Editor/PixelArtTexturePostprocessor.cs)가 임포트 시 Sprite·PPU 32·Point·무압축·mipmap 해제·NPOT 원본 유지를 적용한다. 기존 Sprite Mode·분할·피벗은 변경하지 않는다. 패키지와 Unity 기본 리소스는 이 경로 밖이므로 적용 대상이 아니다.
- ThirdParty PNG 바이트는 그대로 보관하고 Unity `.meta`에 프로젝트 임포트 설정을 기록한다. 현재 Treasure Hunters 1,204개와 Ninja Adventure 564개에 같은 정책을 적용한다.
- 카메라 기준은 384×216·16:9·PPU 32다. 화면 전체의 정수 확대만 허용하며 FHD는 5배, 768×432는 2배다. 배경 크기는 원본 레이어 배치·타일 반복으로 맞춘다.
- 같은 PPU라도 원본 자체의 픽셀 표현 단위가 다르면 아트 정합성 검토가 필요하다. 향후 UI는 PPU 외에도 레이아웃·출력 배율을 따로 확인하며 개별 이미지 Stretch를 크기 보정 수단으로 사용하지 않는다.

## 출처 목록

| ID | 상태 | 출처 유형 | 에셋 | 제작자 | 라이선스 | 런타임 경로 |
|---|---|---|---|---|---|---|
| `TP-001` | 가져옴 | ThirdParty | Treasure Hunters | Pixel Frog | CC0-1.0 | `Assets/Content/ThirdParty/PixelFrog/TreasureHunters/` |
| `TP-002` | 일부 가져옴 | ThirdParty | Ninja Adventure Asset Pack | Pixel-Boy, AAA | CC0-1.0 | `Assets/Content/ThirdParty/PixelBoy/NinjaAdventure/` |

아직 등록된 Generated 에셋은 없다.

## TP-001: Treasure Hunters

- 상태: 가져옴
- 원본 URL: <https://pixelfrog-assets.itch.io/treasure-hunters>
- 출처 확인일: 2026-09-04
- 다운로드 파일명: `Treasure Hunters.zip`
- 원본 SHA-256: `24411442b64cbe6c50048d34bfff41a7748cefc3f17de048aeb7ea5908542a35`
- 라이선스: CC0 1.0 Universal
- 라이선스 근거: [`licenses/assets/TP-001-Treasure-Hunters.md`](licenses/assets/TP-001-Treasure-Hunters.md)
- 로컬 원본: `SourceAssets/ThirdParty/PixelFrog/TreasureHunters/Original.zip`
- 런타임 경로: `Assets/Content/ThirdParty/PixelFrog/TreasureHunters/`
- 가져온 범위: 해제본의 PNG 1,204개
- 제외한 범위: Aseprite 21개, `.DS_Store`, ZIP 메타데이터
- 현재 용도: 횡스크롤 Player, Enemy, 함정, 아이템, 환경 타일과 UI 후보
- 수정 사항: PNG 원본 변경 없음. 전체 Unity 임포트 PPU 32 및 공통 픽셀 아트 설정, 데모 Terrain·야자수 부품 Sprite 분할 적용
- 크레딧 의무: 없음
- 자발적 크레딧: Pixel Frog와 원본 URL 표기 예정

## TP-002: Ninja Adventure Asset Pack

- 상태: 일부 가져옴
- 원본 URL: <https://pixel-boy.itch.io/ninja-adventure-asset-pack>
- 출처 확인일: 2026-09-04
- 다운로드 파일명: `Ninja Adventure - Asset Pack.zip`
- 원본 SHA-256: `95a06f4fdcfd1882f061a45ff313b7c905dbe2de1e8512b281d7937df62a7b15`
- 라이선스: CC0 1.0 Universal
- 라이선스 근거: [`LICENSE.txt`](licenses/assets/TP-002-Ninja-Adventure/LICENSE.txt), [`README.md`](licenses/assets/TP-002-Ninja-Adventure/README.md)
- 로컬 원본: `SourceAssets/ThirdParty/PixelBoy/NinjaAdventure/Original.zip`
- 런타임 경로: `Assets/Content/ThirdParty/PixelBoy/NinjaAdventure/`
- 가져온 범위: `FX` PNG 72개, `Items` PNG 138개, `Ui` PNG 354개
- 제외한 범위: Actor, Audio, Backgrounds, Font, GIF, 미리보기 이미지, 루트 Palette, 문서
- 현재 용도: 공격·피격·상태이상 VFX, 인벤토리 아이콘과 UI 후보
- 수정 사항: PNG 원본 변경 없음. 전체 Unity 임포트 PPU 32 및 공통 픽셀 아트 설정 적용
- 크레딧 의무: 없음
- 자발적 크레딧: Pixel-Boy, AAA와 원본 URL 표기 예정

## Generated 에셋 등록 형식

생성형 에셋을 처음 추가할 때 아래 항목으로 `GEN-001`부터 등록한다.

```text
ID:
상태:
에셋 이름:
생성 서비스와 모델:
생성일:
프롬프트 기록 경로:
입력 참조와 해당 라이선스:
생성 당시 서비스 약관 URL:
편집 원본 경로:
런타임 경로:
후처리 담당자와 변경 내용:
실제 사용 범위:
```

## 재취득과 검증

로컬 ZIP이 없거나 새 버전을 받았다면 원본 URL에서 다시 다운로드하고 다음 명령의 결과가 위 SHA-256과 같은지 확인한다.

```bash
shasum -a 256 <다운로드한 ZIP 경로>
```

해시가 다르면 기존 파일을 조용히 덮어쓰지 않고 새 취득본으로 간주해 날짜, 해시, 변경 범위와 실제 사용 파일을 다시 기록한다.
