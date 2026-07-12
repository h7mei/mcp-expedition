import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { getRepoRoot, resolveWorkspaceServerEntry } from '../presentation/paths.js';
import { printHeading, printKeyValue } from '../presentation/output.js';

const execFileAsync = promisify(execFile);

interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
  required: boolean;
}

async function checkNodeVersion(): Promise<DoctorCheck> {
  const major = Number(process.versions.node.split('.')[0]);
  return {
    name: 'Node.js >= 22',
    ok: major >= 22,
    detail: `detected ${process.versions.node}`,
    required: true,
  };
}

async function checkPnpm(): Promise<DoctorCheck> {
  try {
    const { stdout } = await execFileAsync('pnpm', ['-v']);
    return {
      name: 'pnpm available',
      ok: true,
      detail: `detected ${stdout.trim()}`,
      required: true,
    };
  } catch {
    return {
      name: 'pnpm available',
      ok: false,
      detail: 'pnpm was not found on PATH',
      required: true,
    };
  }
}

async function checkBuildArtifacts(): Promise<DoctorCheck> {
  const entry = resolveWorkspaceServerEntry();
  try {
    await access(entry);
    return {
      name: 'workspace server build',
      ok: true,
      detail: entry,
      required: true,
    };
  } catch {
    return {
      name: 'workspace server build',
      ok: false,
      detail: 'missing dist/main.js — run `pnpm build`',
      required: true,
    };
  }
}

async function checkSampleWorkspace(): Promise<DoctorCheck> {
  const sample = join(getRepoRoot(), 'examples/sample-workspace/README.md');
  try {
    await access(sample);
    return {
      name: 'sample workspace',
      ok: true,
      detail: sample,
      required: true,
    };
  } catch {
    return {
      name: 'sample workspace',
      ok: false,
      detail: 'examples/sample-workspace is missing',
      required: true,
    };
  }
}

export async function runDoctor(): Promise<number> {
  printHeading('expedition doctor');
  const checks = await Promise.all([
    checkNodeVersion(),
    checkPnpm(),
    checkBuildArtifacts(),
    checkSampleWorkspace(),
  ]);

  for (const check of checks) {
    printKeyValue(check.ok ? 'PASS' : 'FAIL', `${check.name} (${check.detail})`);
  }

  const failedRequired = checks.some((check) => check.required && !check.ok);
  return failedRequired ? 1 : 0;
}
