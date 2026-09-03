#!/usr/bin/env node
const path = require('path');
const { spawnSync } = require('child_process');
const architectureCheck = require('./architecture-doc-check');

const ARCHITECTURE_PATH = architectureCheck.ARCHITECTURE_PATH;
const COMPOSITION_SCENE = 'Assets/Scenes/ArchitectureSandbox.unity';

function parseNameStatus(output) {
  const fields = String(output).split('\0');
  const changes = [];
  let index = 0;

  while (index < fields.length && fields[index]) {
    const rawStatus = fields[index++];
    const status = rawStatus[0];
    if (status === 'R' || status === 'C') {
      const oldPath = fields[index++];
      const newPath = fields[index++];
      changes.push({ status, rawStatus, oldPath, path: newPath });
    } else {
      changes.push({ status, rawStatus, path: fields[index++] });
    }
  }

  return changes;
}

function isCoreOrFeatureCode(file) {
  return /^(Assets\/Core\/|Assets\/Feature\/).+\.cs$/u.test(file);
}

function isInstallerPath(file) {
  return /^Assets\/(?:Core|Feature\/.+)\/Installer\//u.test(file);
}

function classifyChange(change) {
  const paths = [change.oldPath, change.path].filter(Boolean);
  const reasons = [];

  if (paths.includes(ARCHITECTURE_PATH)) {
    reasons.push('architecture-document');
  }
  if (paths.some(file => file.endsWith('.asmdef'))) {
    reasons.push('assembly-definition');
  }
  if (
    ['A', 'D', 'R', 'C'].includes(change.status) &&
    paths.some(isCoreOrFeatureCode)
  ) {
    reasons.push('type-ownership');
  }
  if (paths.some(file => isInstallerPath(file) && !file.endsWith('.meta'))) {
    reasons.push('composition-code');
  }
  if (paths.includes(COMPOSITION_SCENE)) {
    reasons.push('composition-scene');
  }

  return reasons;
}

function evaluateChanges(changes) {
  const architectureStaged = changes.some(change =>
    [change.oldPath, change.path].includes(ARCHITECTURE_PATH)
  );
  const structuralChanges = changes
    .map(change => ({ change, reasons: classifyChange(change) }))
    .filter(item => item.reasons.some(reason => reason !== 'architecture-document'));

  return {
    architectureStaged,
    structuralChanges,
    shouldValidate: architectureStaged || structuralChanges.length > 0,
    missingArchitectureUpdate: structuralChanges.length > 0 && !architectureStaged
  };
}

function readStagedChanges(projectRoot) {
  const result = spawnSync(
    'git',
    ['diff', '--cached', '--name-status', '-z', '--find-renames'],
    { cwd: projectRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || 'staged 변경 목록을 읽지 못했다.');
  }
  return parseNameStatus(result.stdout);
}

function run(options = {}) {
  const projectRoot = options.projectRoot || path.resolve(__dirname, '..', '..');

  try {
    const changes = options.changes || readStagedChanges(projectRoot);
    const evaluation = evaluateChanges(changes);
    if (!evaluation.shouldValidate) {
      return 0;
    }

    if (evaluation.missingArchitectureUpdate) {
      console.error(
        `[architecture] 구조 변경이 감지됐지만 ${ARCHITECTURE_PATH}가 staged되지 않았다.`
      );
      for (const item of evaluation.structuralChanges) {
        const renamedFrom = item.change.oldPath
          ? ` (from ${item.change.oldPath})`
          : '';
        console.error(
          `- ${item.change.rawStatus} ${item.change.path}${renamedFrom}: ${item.reasons.join(', ')}`
        );
      }
      console.error(`${ARCHITECTURE_PATH}를 실제 코드와 동기화한 뒤 함께 stage한다.`);
      return 1;
    }

    return architectureCheck.run({ projectRoot, mode: 'staged' });
  } catch (error) {
    console.error(`[architecture] 구조 변경 게이트 실행 실패: ${error.message}`);
    return 2;
  }
}

if (require.main === module) {
  process.exitCode = run();
}

module.exports = {
  ARCHITECTURE_PATH,
  COMPOSITION_SCENE,
  classifyChange,
  evaluateChanges,
  isCoreOrFeatureCode,
  isInstallerPath,
  parseNameStatus,
  readStagedChanges,
  run
};
