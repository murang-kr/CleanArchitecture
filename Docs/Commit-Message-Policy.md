# 커밋 메시지 규칙

이 문서는 이 프로젝트에서 새로 생성하는 커밋 메시지 형식의 정본이다. 기존 커밋 이력에는 소급 적용하지 않는다.

## 기본 구조

- **제목**: 변경 사항을 요약한 짧은 문장
- **본문**: 무엇을, 왜 변경했는지 설명하는 내용이며 필요할 때 작성

본문을 작성하면 제목 다음에 빈 행을 하나 이상 둔다.

```text
Add player movement rules

Player 이동 판정 로직을 Domain으로 분리한다.
Unity 의존성 없이 규칙을 테스트하기 위해 변경한다.
```

## 작성 규칙

1. 제목과 본문은 빈 행으로 구분한다.
2. 제목은 Unicode 문자 기준 50자 이내로 작성한다.
3. 제목은 영어 동사원형으로 시작하고 과거형을 사용하지 않는다.
4. 제목 끝에는 마침표(`.`, `。`, `．`)를 사용하지 않는다.
5. 본문을 작성할 때는 변경한 내용과 변경 이유를 설명한다.

## 허용하는 시작 동사

자동 검사는 제목의 첫 단어가 아래 목록에 있는지 대소문자를 구분해 확인한다.

```text
Add
Fix
Update
Remove
Refactor
Move
Rename
Document
Test
Configure
Enable
Disable
Improve
Simplify
Prevent
Enforce
Unify
Connect
Replace
Create
Implement
Support
Handle
Use
Align
Clean
Extract
Introduce
Separate
Restore
Validate
Guard
Change
Set
Bump
Merge
Revert
```

필요한 동사가 목록에 없으면 검사기를 우회하지 말고 이 문서와 검사기의 목록을 함께 변경한다.

## 자동 검사 범위

`.githooks/commit-msg`는 새 커밋이 생성되기 전에 다음 항목을 검사한다.

- 제목 존재 여부
- 제목 길이
- 허용 동사 시작 여부
- 제목 끝 마침표 여부
- 본문 앞 빈 행 여부

본문이 실제로 변경 내용과 이유를 설명하는지는 기계적으로 판정하지 않는다. 작성자와 검토자가 확인한다.

Git이 생성한 `Merge`와 `Revert` 제목은 허용 동사 규칙을 만족하면 통과한다. `fixup!`과 `squash!` 형식은 현재 허용하지 않는다.

## 활성화

clone마다 한 번 다음 명령으로 저장소가 버전 관리하는 Git 훅을 활성화한다.

```bash
git config --local core.hooksPath .githooks
```

세션 시작 시 하네스 닥터가 이 설정과 훅 진입점의 존재 여부를 검사한다.
