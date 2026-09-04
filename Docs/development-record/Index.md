# Development Record Index

<!--
이 파일은 개발 기록 탐색용 인덱스다.
각 기록을 다음 형식으로 한 줄씩 추가한다.

- [작업 제목](<파일명>.md) — 결과와 재사용 가치가 드러나는 한 줄 요약
-->

- [Git 저장소 및 Codex 로컬 하네스 설치](DEV-2026-001-codex-harness-installation.md) — public Git 저장소 연결, 하네스 설치, Unity batch mode 컴파일 검증을 완료했다.
- [Unity 기반 패키지 스택 설치](DEV-2026-002-package-stack-installation.md) — NuGetForUnity, R3, UniTask, VContainer, Unity CLI Loop, UI Toolkit과 Localization을 설치·확인했다.
- [Player 이동 Clean Architecture 세로 슬라이스](DEV-2026-003-player-walking-skeleton.md) — Player 이동·점프를 6계층과 VContainer로 조립하고 EditMode 8개·PlayMode 1개 테스트로 검증했다.
- [계획과 개발 기록 정본 통합](DEV-2026-004-document-source-unification.md) — 별도 계획 문서를 없애고 승인 계획부터 완료 결과까지 DEV 기록 하나에서 관리하도록 하네스를 정리했다.
- [커밋 메시지 규칙 하네스](DEV-2026-005-commit-message-policy-harness.md) — 명령형 제목과 본문 구조 규칙을 문서화하고 Git commit-msg 훅으로 자동 검사한다.
- [아키텍처 UML 정본과 구조 변경 게이트](DEV-2026-006-architecture-living-document.md) — 실제 asmdef와 Player 호출 경로를 Mermaid UML로 정본화하고 균형형 pre-commit 게이트로 구조 변경 시 동시 갱신을 강제한다.
- [에셋 콘텐츠 구조와 출처 관리](DEV-2026-007-asset-content-structure.md) — 서드파티·생성형·게임 조립 에셋을 분리하고 원본 해시와 라이선스를 추적하는 간소화된 콘텐츠 구조를 준비한다.
- [Unity VCS 증거 수집 하네스](DEV-2026-008-unity-vcs-evidence-harness.md) — 읽기 전용 공용 계층으로 Scene·Prefab Git 변경을 의미 단위 E1 증거로 수집하고 V0–V2 검증과 결합했다.
