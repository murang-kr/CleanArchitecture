#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ARCHITECTURE_PATH = 'Docs/Architecture.md';

function runGit(projectRoot, args) {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} 실행 실패`);
  }

  return result.stdout;
}

function shortAssemblyName(name) {
  return String(name).replace(/^CleanArchitecture\./u, '');
}

function parseAssemblyDiagram(document) {
  const section = document.match(
    /## 어셈블리 의존 관계[\s\S]*?```mermaid\n([\s\S]*?)```/u
  );
  if (!section) {
    return { error: '어셈블리 의존 관계 Mermaid 블록을 찾지 못했다.' };
  }

  const block = section[1];
  const nodes = new Map(
    [...block.matchAll(/^\s*([A-Za-z]\w*)\["([^"]+)"\]\s*$/gmu)]
      .map(match => [match[1], match[2]])
  );
  const edges = new Set();
  const errors = [];

  for (const match of block.matchAll(
    /^\s*([A-Za-z]\w*)\s*-->\s*([A-Za-z]\w*)\s*$/gmu
  )) {
    const source = nodes.get(match[1]);
    const target = nodes.get(match[2]);
    if (!source || !target) {
      errors.push(`어셈블리 간선의 노드 선언이 없다: ${match[1]} --> ${match[2]}`);
      continue;
    }
    edges.add(`${source}->${target}`);
  }

  return { nodes, edges, errors };
}

function parseAssemblyContract(document) {
  const section = document.match(
    /### 어셈블리 계약\n([\s\S]*?)(?=\n## )/u
  );
  if (!section) {
    return { rows: new Map(), error: '어셈블리 계약 표를 찾지 못했다.' };
  }

  const rows = new Map();
  for (const line of section[1].split('\n')) {
    if (!line.trim().startsWith('|') || /^\|\s*-+/u.test(line.trim())) {
      continue;
    }

    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    const assemblyName = cells[0]?.match(/^`([^`]+)`$/u)?.[1];
    if (assemblyName && cells.length >= 4) {
      rows.set(assemblyName, {
        engineReferencesBlocked: cells[3]
      });
    }
  }

  return { rows };
}

function countMermaidBlocks(document) {
  const openings = [...document.matchAll(/^```mermaid\s*$/gmu)].length;
  const completeBlocks = [...document.matchAll(/```mermaid\n[\s\S]*?```/gu)].length;
  return { openings, completeBlocks };
}

function collectLocalLinkTargets(document) {
  const targets = [];
  for (const match of document.matchAll(/\]\(([^)]+)\)/gu)) {
    const rawTarget = match[1].split('#', 1)[0];
    if (!rawTarget || /^[a-z]+:/iu.test(rawTarget)) {
      continue;
    }

    const decodedTarget = decodeURIComponent(rawTarget.replace(/^<|>$/gu, ''));
    const repositoryPath = path.posix.normalize(
      path.posix.join(path.posix.dirname(ARCHITECTURE_PATH), decodedTarget)
    );
    targets.push(repositoryPath);
  }
  return targets;
}

function validateArchitecture({ document, assemblies, indexFiles }) {
  const errors = [];
  const diagram = parseAssemblyDiagram(document);
  if (diagram.error) {
    errors.push(diagram.error);
  } else {
    errors.push(...diagram.errors);
  }

  const contract = parseAssemblyContract(document);
  if (contract.error) {
    errors.push(contract.error);
  }

  const expectedAssemblyNames = new Set(
    assemblies.map(assembly => shortAssemblyName(assembly.name))
  );
  const expectedNodeLabels = new Set([
    ...expectedAssemblyNames,
    ...assemblies.flatMap(assembly =>
      (assembly.references || []).map(shortAssemblyName)
    )
  ]);
  const expectedEdges = new Set(
    assemblies.flatMap(assembly =>
      (assembly.references || []).map(reference =>
        `${shortAssemblyName(assembly.name)}->${shortAssemblyName(reference)}`
      )
    )
  );

  if (!diagram.error) {
    const diagramLabels = new Set(diagram.nodes.values());
    for (const assemblyName of expectedAssemblyNames) {
      if (!diagramLabels.has(assemblyName)) {
        errors.push(`어셈블리 다이어그램에 노드가 없다: ${assemblyName}`);
      }
    }
    for (const label of diagramLabels) {
      if (!expectedNodeLabels.has(label)) {
        errors.push(`실제 asmdef 또는 외부 참조가 없는 노드가 문서에 있다: ${label}`);
      }
    }

    for (const edge of expectedEdges) {
      if (!diagram.edges.has(edge)) {
        errors.push(`어셈블리 다이어그램에 간선이 없다: ${edge}`);
      }
    }
    for (const edge of diagram.edges) {
      if (!expectedEdges.has(edge)) {
        errors.push(`실제 asmdef에 없는 간선이 문서에 있다: ${edge}`);
      }
    }
  }

  if (!contract.error) {
    for (const assembly of assemblies) {
      const name = shortAssemblyName(assembly.name);
      const row = contract.rows.get(name);
      if (!row) {
        errors.push(`어셈블리 계약 표에 행이 없다: ${name}`);
        continue;
      }

      const expectedValue = assembly.noEngineReferences ? '예' : '아니요';
      if (row.engineReferencesBlocked !== expectedValue) {
        errors.push(
          `${name}의 Unity 엔진 참조 차단 값이 다르다: 문서=${row.engineReferencesBlocked}, asmdef=${expectedValue}`
        );
      }
    }

    for (const name of contract.rows.keys()) {
      if (!expectedAssemblyNames.has(name)) {
        errors.push(`실제 런타임 asmdef가 없는 계약 표 행이 있다: ${name}`);
      }
    }
  }

  const mermaidBlocks = countMermaidBlocks(document);
  if (mermaidBlocks.openings !== mermaidBlocks.completeBlocks) {
    errors.push(
      `완결되지 않은 Mermaid 블록이 있다: 시작=${mermaidBlocks.openings}, 완료=${mermaidBlocks.completeBlocks}`
    );
  }

  for (const target of collectLocalLinkTargets(document)) {
    if (!indexFiles.has(target)) {
      errors.push(`Git index에 없는 로컬 문서 링크다: ${target}`);
    }
  }

  return {
    errors,
    assemblyCount: assemblies.length,
    edgeCount: expectedEdges.size,
    mermaidBlockCount: mermaidBlocks.completeBlocks
  };
}

function readIndexSnapshot(projectRoot) {
  const indexFiles = new Set(
    runGit(projectRoot, ['ls-files', '--cached', '-z'])
      .split('\0')
      .filter(Boolean)
  );
  if (!indexFiles.has(ARCHITECTURE_PATH)) {
    throw new Error(`${ARCHITECTURE_PATH}가 Git index에 없다.`);
  }

  const document = runGit(projectRoot, ['show', `:${ARCHITECTURE_PATH}`]);
  const assemblyPaths = [...indexFiles]
    .filter(file => file.endsWith('.asmdef'))
    .filter(file => !file.startsWith('Assets/Tests/'))
    .sort();
  const assemblies = assemblyPaths.map(assemblyPath => ({
    path: assemblyPath,
    ...JSON.parse(runGit(projectRoot, ['show', `:${assemblyPath}`]))
  }));

  return { document, assemblies, indexFiles };
}

function readWorkingTreeSnapshot(projectRoot) {
  const repositoryFiles = runGit(
    projectRoot,
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z']
  )
    .split('\0')
    .filter(Boolean)
    .filter(file => fs.existsSync(path.join(projectRoot, file)));
  const indexFiles = new Set(repositoryFiles);
  const assemblyPaths = repositoryFiles
    .filter(file => file.endsWith('.asmdef'))
    .filter(file => !file.startsWith('Assets/Tests/'))
    .sort();
  const assemblies = assemblyPaths.map(assemblyPath => ({
    path: assemblyPath,
    ...JSON.parse(fs.readFileSync(path.join(projectRoot, assemblyPath), 'utf8'))
  }));

  return {
    document: fs.readFileSync(path.join(projectRoot, ARCHITECTURE_PATH), 'utf8'),
    assemblies,
    indexFiles
  };
}

function checkSnapshot(snapshot) {
  return validateArchitecture(snapshot);
}

function run(options = {}) {
  const projectRoot = options.projectRoot || path.resolve(__dirname, '..', '..');
  const mode = options.mode || 'staged';

  try {
    const snapshot = mode === 'working-tree'
      ? readWorkingTreeSnapshot(projectRoot)
      : readIndexSnapshot(projectRoot);
    const result = checkSnapshot(snapshot);
    if (result.errors.length > 0) {
      console.error('[architecture] Architecture.md 정합성 검사에 실패했다.');
      for (const error of result.errors) {
        console.error(`- ${error}`);
      }
      return 1;
    }

    console.log(
      `[architecture] ${result.assemblyCount} assemblies, ${result.edgeCount} edges, ` +
      `${result.mermaidBlockCount} Mermaid blocks matched`
    );
    return 0;
  } catch (error) {
    console.error(`[architecture] 검사 실행 실패: ${error.message}`);
    return 2;
  }
}

if (require.main === module) {
  const mode = process.argv.includes('--working-tree') ? 'working-tree' : 'staged';
  process.exitCode = run({ mode });
}

module.exports = {
  ARCHITECTURE_PATH,
  checkSnapshot,
  collectLocalLinkTargets,
  countMermaidBlocks,
  parseAssemblyContract,
  parseAssemblyDiagram,
  readIndexSnapshot,
  readWorkingTreeSnapshot,
  run,
  shortAssemblyName,
  validateArchitecture
};
