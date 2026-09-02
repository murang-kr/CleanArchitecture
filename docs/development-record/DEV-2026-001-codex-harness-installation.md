---
id: DEV-2026-001
title: Git 저장소 및 Codex 로컬 하네스 설치
status: completed
date: 2026-09-02
unity_version: 6000.3.20f1
platform: macOS arm64
related_issue:
related_commit:
tags: [tooling, codex, git]
---

# 목표

## 배경

초기 Unity 2D URP 프로젝트를 public GitHub 저장소로 관리하고, `Unity-Template`의 설치 가이드에 따라 프로젝트 로컬 Codex 하네스를 설치한다.

## 완료 조건

- 로컬 Git 저장소와 public GitHub 원격 저장소가 연결돼 있다.
- Unity 생성물을 제외하는 `.gitignore`가 있다.
- 템플릿의 `AGENTS.md`, 스킬, 훅, 개발 기록 문서가 설치돼 있다.
- 프로젝트 실제 상태를 반영한 `README.md`, `docs/Tech-Stack.md`, 하네스 바인딩이 있다.
- Unity batch mode 컴파일이 종료 코드 `0`으로 통과한다.

# 제약사항

- `commit`과 `push`는 이 작업 범위에 포함하지 않는다.
- 게임 코드, 씬, Unity 에셋, 패키지 의존성은 변경하지 않는다.
- 템플릿의 `.DS_Store`는 복사하지 않는다.

# 계획

1. Git 저장소와 public GitHub 원격 저장소를 생성·연결한다.
2. 템플릿 하네스를 복사하고 프로젝트 문서를 실제 상태로 갱신한다.
3. 정적 검사와 Unity batch mode 컴파일로 검증한다.

# 실행 기록

| 시각 | 작업 | 결과 | 증거 |
|---|---|---|---|
| 21:12 | 로컬 Git 저장소 초기화 | 성공, `main` 브랜치 생성 | `git rev-parse --show-toplevel` |
| 21:15 | public GitHub 저장소 생성 및 `origin` 연결 | 성공, `murang-kr/CleanArchitecture`, `PUBLIC` | `gh repo view`, `git remote get-url origin` |
| 21:18 | 프로젝트 로컬 하네스와 문서 설치 | 성공 | `.agents/`, `.codex/`, `docs/` |
| 21:18 | 템플릿 일치·JSON·JavaScript·Git ignore 검사 | 성공 | `TEMPLATE_FILES_MATCH`, `NO_DS_STORE`, `JSON_OK` |
| 21:18 | Unity batch mode 컴파일 | 대기, GUI 에디터가 동일 프로젝트를 열어 실행 차단 | Unity 종료 코드 1, `Multiple Unity instances cannot open the same project` |
| 21:26 | Unity batch mode 컴파일 재실행 | 성공 | 종료 코드 0, `Tundra build success`, `Exiting batchmode successfully now!` |
| 21:31 | public push 전 보안 검사 | PS4 자동 생성 passcode를 제거하고 초기 커밋 교체 결정 | `ProjectSettings/ProjectSettings.asset` |

# 발견 사항

- 설치 전 프로젝트는 Git 저장소가 아니어서 템플릿 훅의 `git rev-parse --show-toplevel` 명령을 사용할 수 없었다. Git 저장소 초기화 후 원본 훅을 수정 없이 사용할 수 있게 됐다.
- GitHub CLI의 기존 토큰이 만료돼 `murang-kr` 계정으로 기기 인증을 갱신했다.
- 프로젝트에는 C# 스크립트, asmdef, 테스트 케이스가 없다.
- Unity가 생성한 `ps4Passcode`는 현재 프로젝트에서 사용하지 않는 PS4 전용 설정이며, public 저장소에 credential 형태 값을 남기지 않도록 비웠다.

# 결정 사항

## DEC-001: 템플릿 훅을 수정하지 않고 Git 저장소를 먼저 구성

### 맥락

원본 훅은 Git 최상위 경로를 기준으로 프로젝트 루트를 찾는다.

### 검토한 선택지

- 훅 명령을 비-Git 경로에서도 동작하도록 수정한다.
- 프로젝트를 Git 저장소로 초기화하고 원본 훅을 유지한다.
- 훅을 비활성 상태로 복사한다.

### 결정

사용자 선택에 따라 프로젝트를 Git 저장소로 초기화하고 원본 훅을 유지했다.

### 영향

- 템플릿과 설치본의 훅 구성이 동일하게 유지된다.
- 프로젝트 루트에서 Git 명령이 정상 동작해야 훅이 실행된다.

# 변경 내용

- Unity용 `.gitignore` 생성
- `AGENTS.md`, `.agents/skills/`, `.codex/hooks.json`, `.codex/hooks/` 설치
- `.codex/harness-bindings.json` 생성
- `README.md`, `docs/Tech-Stack.md`를 실제 프로젝트 상태로 작성
- 개발 기록 형식과 인덱스 설치
- public GitHub 저장소 생성 및 `origin` 연결
- 사용하지 않는 PS4 passcode를 공개 전 제거

# 검증

- 템플릿 원본 대상 파일과 `cmp`: 통과
- 설치 경로의 `.DS_Store` 검색: 없음
- 모든 훅 JavaScript에 `node --check`: 통과
- `hooks.json`, `harness-bindings.json` JSON 파싱: 통과
- `harness-doctor.js`: 경고 없음
- Unity batch mode 컴파일: 종료 코드 0, 스크립트 컴파일 및 도메인 리로드 성공
- 종료 시 라이선스 클라이언트 재연결과 Rider build-server 관련 비치명 경고가 있었으나 Unity는 batch mode를 성공 종료했다.

# 최종 결과

Git 저장소 구성, 하네스 설치, 정적 검사와 티어 0 Unity 컴파일 검증을 완료했다.

# 후속 작업

- [x] Unity Editor를 닫은 뒤 `.codex/harness-bindings.json`의 `compile` 명령 재실행
- [ ] Codex에서 프로젝트를 신뢰한 뒤 `/hooks`에서 로컬 훅 6개 검토·승인
- [ ] 사용자가 원할 때 초기 커밋과 push를 별도 승인 후 실행

# 다음 작업에서 재사용할 지식

- Unity GUI가 프로젝트를 열고 있으면 같은 프로젝트 경로의 batch mode 검증은 즉시 차단된다.
- 프로젝트의 하네스 명령은 Unity 6000.3.20f1 설치 경로를 사용한다.
