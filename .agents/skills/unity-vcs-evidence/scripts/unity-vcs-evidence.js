#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const MINIMUM_VERSION = '1.0.0-beta.8';
const READ_ONLY_COMMANDS = new Set(['diff', 'conflicts', 'explain']);
const FORCED_FLAGS = ['--format', 'json', '--no-banner', '--no-pager', '--non-interactive'];

function parseVersion(value) {
  const match = String(value).trim().match(/(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc)\.(\d+))?/i);
  if (!match) {
    throw new Error(`Unity CLI 버전을 해석할 수 없습니다: ${value}`);
  }
  const stageRank = { alpha: 0, beta: 1, rc: 2 };
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    stage: match[4] ? stageRank[match[4].toLowerCase()] : 3,
    prerelease: match[5] ? Number(match[5]) : 0,
    text: match[0],
  };
}

function compareVersions(left, right) {
  const a = typeof left === 'string' ? parseVersion(left) : left;
  const b = typeof right === 'string' ? parseVersion(right) : right;
  for (const key of ['major', 'minor', 'patch', 'stage', 'prerelease']) {
    if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  }
  return 0;
}

function isSceneOrPrefab(path) {
  return typeof path === 'string' && /\.(unity|prefab)$/i.test(path);
}

function validateInvocation(args) {
  const [command, ...rest] = args;
  if (!READ_ONLY_COMMANDS.has(command)) {
    throw new Error(`읽기 전용 명령만 허용됩니다: ${[...READ_ONLY_COMMANDS].join(', ')}`);
  }
  if (rest.some((arg) => arg === '--format' || arg.startsWith('--format=') || arg === '--json')) {
    throw new Error('출력 형식은 공용 계층이 JSON으로 고정합니다.');
  }

  if (command === 'diff') {
    if (!isSceneOrPrefab(rest[0])) throw new Error('diff에는 .unity 또는 .prefab 경로가 필요합니다.');
    for (let index = 1; index < rest.length; index += 2) {
      if (!['--from', '--to'].includes(rest[index]) || !rest[index + 1]) {
        throw new Error('diff 추가 인자는 --from <ref>, --to <ref>만 허용됩니다.');
      }
    }
  } else if (command === 'explain') {
    if (rest.length !== 1 || !isSceneOrPrefab(rest[0])) {
      throw new Error('explain에는 .unity 또는 .prefab 경로 하나가 필요합니다.');
    }
  } else if (rest.length > 1 || (rest.length === 1 && !isSceneOrPrefab(rest[0]))) {
    throw new Error('conflicts에는 선택적으로 .unity 또는 .prefab 경로 하나만 지정할 수 있습니다.');
  }
  return { command, rest };
}

function buildUnityArgs(args) {
  const { command, rest } = validateInvocation(args);
  return ['vcs', command, ...rest, ...FORCED_FLAGS];
}

function pick(object, key) {
  return object && Object.prototype.hasOwnProperty.call(object, key) ? object[key] : null;
}

function normalizeChange(change) {
  const fields = Array.isArray(change?.changedFields)
    ? change.changedFields
    : (Array.isArray(change?.fields) ? change.fields : []);
  return {
    change: pick(change, 'change'),
    side: pick(change, 'side'),
    object: pick(change, 'object'),
    owner: pick(change, 'owner'),
    fields,
    fieldLabels: Array.isArray(change?.fieldLabels) ? change.fieldLabels : [],
    summary: pick(change, 'summary'),
  };
}

function normalizeEnvelope(unityCliVersion, requestedCommand, envelope) {
  const changes = Array.isArray(envelope?.data?.changes) ? envelope.data.changes : [];
  return {
    schemaVersion: 1,
    evidenceLayer: 'E1',
    source: 'unity-vcs',
    unityCliVersion,
    requestedCommand,
    success: envelope?.success === true,
    normalizedChanges: changes.map(normalizeChange),
    unity: envelope,
  };
}

function defaultRunner(binary, args) {
  return spawnSync(binary, args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    shell: false,
  });
}

function run(argv, options = {}) {
  const binary = options.binary || process.env.UNITY_VCS_BIN || 'unity';
  const runner = options.runner || defaultRunner;
  const requestedCommand = argv[0] || null;
  const unityArgs = buildUnityArgs(argv);

  const versionResult = runner(binary, ['--version']);
  if (versionResult.error) throw versionResult.error;
  if (versionResult.status !== 0) throw new Error(versionResult.stderr || 'unity --version 실패');
  const installed = parseVersion(versionResult.stdout);
  if (compareVersions(installed, MINIMUM_VERSION) < 0) {
    throw new Error(`Unity CLI ${MINIMUM_VERSION} 이상이 필요합니다. 현재: ${installed.text}`);
  }

  const result = runner(binary, unityArgs);
  if (result.error) throw result.error;
  let envelope;
  try {
    envelope = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`unity vcs JSON 파싱 실패: ${error.message}; stderr=${String(result.stderr).trim()}`);
  }
  const normalized = normalizeEnvelope(installed.text, requestedCommand, envelope);
  const processStatus = typeof result.status === 'number' ? result.status : 1;
  return { output: normalized, status: normalized.success ? processStatus : (processStatus || 1) };
}

function errorEnvelope(error, requestedCommand) {
  return {
    schemaVersion: 1,
    evidenceLayer: 'E1',
    source: 'unity-vcs',
    requestedCommand: requestedCommand || null,
    success: false,
    error: error.message,
  };
}

function main() {
  try {
    const result = run(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result.output, null, 2)}\n`);
    process.exitCode = result.status;
  } catch (error) {
    process.stdout.write(`${JSON.stringify(errorEnvelope(error, process.argv[2]), null, 2)}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  MINIMUM_VERSION,
  buildUnityArgs,
  compareVersions,
  errorEnvelope,
  normalizeChange,
  normalizeEnvelope,
  parseVersion,
  run,
  validateInvocation,
};
