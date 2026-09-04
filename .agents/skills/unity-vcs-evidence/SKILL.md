---
name: unity-vcs-evidence
description: Unity Scene·Prefab의 Git 저장 상태나 충돌을 GameObject·Component·직렬화 필드 단위로 조사·검증할 때 `unity vcs`의 읽기 전용 JSON 증거를 수집한다. 실행 중 Editor 상태나 ScriptableObject 값, 런타임 동작 검증에는 사용하지 않는다.
---

# Unity VCS 증거 수집

`unity vcs`를 Scene(`.unity`)·Prefab(`.prefab`)의 **E1 저장 직렬화 증거** 수집기로 사용한다. E1은 Git 기준 전후 상태를 Unity 의미 단위로 비교하지만, 현재 Editor 메모리나 런타임 동작을 증명하지 않는다.

## 허용 범위

- `diff`: 두 Git 상태 또는 Git 상태와 working tree 사이의 의미 단위 변경
- `conflicts`: 현재 Scene·Prefab 충돌 목록 조회
- `explain`: 충돌 내용을 GameObject·Component 단위로 설명

이 스킬은 읽기 전용이다. `resolve`, `hooks install`, `git worktree`, `doctor --fix` 등 파일·Git·설정을 바꾸는 명령은 실행하지 않는다.

## 공용 실행 계층

직접 `unity vcs`를 조립하지 말고 아래 래퍼를 사용한다.

```bash
node .agents/skills/unity-vcs-evidence/scripts/unity-vcs-evidence.js diff Assets/Scenes/Level.unity
```

기준을 명시하려면:

```bash
node .agents/skills/unity-vcs-evidence/scripts/unity-vcs-evidence.js diff Assets/Scenes/Level.unity --from main --to feature/physics
```

충돌 조사:

```bash
node .agents/skills/unity-vcs-evidence/scripts/unity-vcs-evidence.js conflicts Assets/Scenes/Level.unity
node .agents/skills/unity-vcs-evidence/scripts/unity-vcs-evidence.js explain Assets/Scenes/Level.unity
```

래퍼는 다음 계약을 강제한다.

- Unity CLI `1.0.0-beta.8` 이상
- `--format json --no-banner --no-pager --non-interactive`
- 셸 문자열 결합이 아닌 인자 배열 실행
- Unity 원본 JSON을 `unity`에 보존하고, 안정된 최소 뷰만 `normalizedChanges`에 별도 제공
- `.unity`·`.prefab` 외 경로와 쓰기 명령 거부

## 조사 단계

1. 조사할 asset과 비교 기준을 먼저 기록한다. 기본값은 `HEAD → working tree`다.
2. 래퍼로 `diff`를 실행한다.
3. `unity.data.changes`와 `normalizedChanges`에서 GameObject·Component·raw 직렬화 필드를 기록한다.
4. 현재 Editor 메모리 상태가 필요한 주장은 uloop 기반 E2 관측을 추가한다.
5. 동작 주장은 read site를 추적하고 E3 테스트 또는 E4 대상 런타임 증거를 추가한다.

`uncertainMatches > 0` 또는 `valuesTruncated: true`이면 완전한 증거로 취급하지 않는다. 결과를 `PARTIAL`로 표시하고 Editor 관측이나 제한된 raw 파일 확인 등 추가 조사를 수행한다.

## 계획 단계

Scene·Prefab을 바꾸는 계획에는 예상 변화 계약을 가능한 범위에서 적는다.

```text
asset     = Assets/Scenes/Level.unity
owner     = Player
component = Transform
field     = m_LocalPosition
change    = modified
```

기계 판정 키는 Unity 원본의 `changedFields`에 있는 raw 직렬화 필드명을 사용한다. 공용 출력에서는 이를 `normalizedChanges[].fields`로 노출한다. `fieldLabels`와 `summary`는 제공될 때 사람·LLM 표시용으로만 쓰고 기계 계약으로 삼지 않는다.

## 검증 단계

1. 구현 전과 같은 비교 기준으로 `diff`를 다시 수집한다.
2. 승인된 예상 변화와 실제 `asset / owner / component / raw field / change kind`를 대조한다.
3. 예상 누락과 예상 밖 변화는 모두 실패 또는 검토 대상으로 보고한다.
4. E1 통과 뒤에도 선언한 완료 검증 티어(V0–V2)의 컴파일·테스트·Console 검증은 별도로 실행한다.

## 실패와 폴백

- CLI 미설치·구버전·명령 실패·JSON 파싱 실패를 조용히 YAML 직독으로 대체하지 않는다.
- 실패 원문과 확인하지 못한 범위를 보고한다.
- raw YAML이 꼭 필요하면 보조 진단임을 명시하고, Unity 의미 단위 검증을 통과한 것처럼 서술하지 않는다.
