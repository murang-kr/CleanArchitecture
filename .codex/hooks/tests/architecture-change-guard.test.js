const assert = require('node:assert/strict');
const test = require('node:test');

const {
  classifyChange,
  evaluateChanges,
  parseNameStatus
} = require('../architecture-change-guard');

function change(status, file, oldPath) {
  return { status, rawStatus: status, path: file, oldPath };
}

test('Git name-status의 일반 변경과 이름 변경을 해석한다', () => {
  const changes = parseNameStatus([
    'M', 'README.md',
    'R100', 'Assets/Core/Old.cs', 'Assets/Core/New.cs',
    ''
  ].join('\0'));

  assert.deepEqual(changes, [
    { status: 'M', rawStatus: 'M', path: 'README.md' },
    {
      status: 'R',
      rawStatus: 'R100',
      oldPath: 'Assets/Core/Old.cs',
      path: 'Assets/Core/New.cs'
    }
  ]);
});

test('asmdef 변경을 구조 변경으로 분류한다', () => {
  const reasons = classifyChange(change(
    'M',
    'Assets/Feature/Player/Domain/CleanArchitecture.Player.Domain.asmdef'
  ));

  assert.deepEqual(reasons, ['assembly-definition']);
});

test('Core와 Feature 타입 추가 삭제 이동을 구조 변경으로 분류한다', () => {
  assert.deepEqual(
    classifyChange(change('A', 'Assets/Feature/Player/Domain/NewRule.cs')),
    ['type-ownership']
  );
  assert.deepEqual(
    classifyChange(change('D', 'Assets/Core/LegacyService.cs')),
    ['type-ownership']
  );
  assert.deepEqual(
    classifyChange(change(
      'R',
      'Assets/Feature/Player/Application/PlayerService.cs',
      'Assets/Feature/Player/Domain/PlayerService.cs'
    )),
    ['type-ownership']
  );
});

test('일반 타입 내부 수정은 균형형 게이트가 강제하지 않는다', () => {
  const reasons = classifyChange(change(
    'M',
    'Assets/Feature/Player/Domain/PlayerMotionRules.cs'
  ));

  assert.deepEqual(reasons, []);
});

test('Installer와 composition scene 변경을 구조 변경으로 분류한다', () => {
  assert.deepEqual(
    classifyChange(change('M', 'Assets/Feature/Player/Installer/PlayerInstaller.cs')),
    ['composition-code']
  );
  assert.deepEqual(
    classifyChange(change('M', 'Assets/Scenes/ArchitectureSandbox.unity')),
    ['composition-scene']
  );
});

test('구조 변경에 Architecture.md가 빠지면 거부 대상으로 판정한다', () => {
  const evaluation = evaluateChanges([
    change('A', 'Assets/Feature/Player/Domain/NewRule.cs')
  ]);

  assert.equal(evaluation.shouldValidate, true);
  assert.equal(evaluation.missingArchitectureUpdate, true);
});

test('구조 변경과 Architecture.md를 함께 stage하면 검증 대상으로 판정한다', () => {
  const evaluation = evaluateChanges([
    change('M', 'Assets/Feature/Player/Installer/PlayerInstaller.cs'),
    change('M', 'Docs/Architecture.md')
  ]);

  assert.equal(evaluation.shouldValidate, true);
  assert.equal(evaluation.missingArchitectureUpdate, false);
});

test('Architecture.md만 바뀌어도 정합성 검사를 실행한다', () => {
  const evaluation = evaluateChanges([
    change('M', 'Docs/Architecture.md')
  ]);

  assert.equal(evaluation.shouldValidate, true);
  assert.equal(evaluation.structuralChanges.length, 0);
});
