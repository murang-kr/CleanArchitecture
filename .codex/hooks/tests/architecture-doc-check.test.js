const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  readWorkingTreeSnapshot,
  validateArchitecture
} = require('../architecture-doc-check');

const projectRoot = path.resolve(__dirname, '..', '..', '..');

function validateDocument(transform = document => document) {
  const snapshot = readWorkingTreeSnapshot(projectRoot);
  return validateArchitecture({
    ...snapshot,
    document: transform(snapshot.document)
  });
}

function includesError(errors, text) {
  return errors.some(error => error.includes(text));
}

test('현재 작업 트리의 아키텍처 정본이 asmdef와 일치한다', () => {
  const result = validateDocument();

  assert.deepEqual(result.errors, []);
  assert.equal(result.assemblyCount, 7);
  assert.equal(result.edgeCount, 16);
  assert.equal(result.mermaidBlockCount, 4);
});

test('실제 asmdef 간선이 문서에서 빠지면 거부한다', () => {
  const result = validateDocument(document =>
    document.replace('    PlayerView --> PlayerPresentation\n', '')
  );

  assert.equal(
    includesError(result.errors, 'Player.View->Player.Presentation'),
    true
  );
});

test('실제 asmdef 또는 외부 참조가 없는 노드를 거부한다', () => {
  const result = validateDocument(document =>
    document.replace(
      '    VContainer["VContainer"]',
      '    VContainer["VContainer"]\n    LegacyFeature["Legacy.Feature"]'
    )
  );

  assert.equal(includesError(result.errors, '없는 노드가 문서에 있다'), true);
});

test('noEngineReferences 계약 값이 다르면 거부한다', () => {
  const result = validateDocument(document =>
    document.replace(
      '| `Player.Domain` | 이동 상태·의도·설정·결정과 순수 판정 규칙 | 없음 | 예 |',
      '| `Player.Domain` | 이동 상태·의도·설정·결정과 순수 판정 규칙 | 없음 | 아니요 |'
    )
  );

  assert.equal(
    includesError(result.errors, 'Player.Domain의 Unity 엔진 참조 차단 값이 다르다'),
    true
  );
});

test('Git이 관리하지 않는 로컬 링크를 거부한다', () => {
  const result = validateDocument(document =>
    document.replace(
      '../Assets/Core/Installer/GameLifetimeScope.cs',
      '../Assets/Core/Installer/MissingLifetimeScope.cs'
    )
  );

  assert.equal(includesError(result.errors, 'Git index에 없는 로컬 문서 링크'), true);
});

test('닫히지 않은 Mermaid 블록을 거부한다', () => {
  const result = validateDocument(document =>
    `${document}\n\`\`\`mermaid\nflowchart LR\n    A --> B\n`
  );

  assert.equal(includesError(result.errors, '완결되지 않은 Mermaid 블록'), true);
});
