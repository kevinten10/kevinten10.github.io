import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  findSuspiciousSecrets,
  validateAuditDocument,
  verifyMaintenanceAudits
} from '../../scripts/verify-maintenance-audits.mjs';

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe('maintenance audit verification', () => {
  it('validates check-count, completion, and worker startup audits', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'maintenance-audits-'));
    tempDirs.push(dir);

    await writeFile(join(dir, 'preview.json'), JSON.stringify({
      schemaVersion: 1,
      startedAt: '2026-06-28T00:00:00.000Z',
      completedAt: '2026-06-28T00:00:01.000Z',
      ready: true,
      totalChecks: 1,
      passedChecks: 1,
      failedChecks: 0,
      checks: [
        { name: 'worker health', status: 'ok' }
      ]
    }));

    await writeFile(join(dir, 'worker-startup.json'), JSON.stringify({
      schemaVersion: 1,
      checkedAt: '2026-06-28T00:00:00Z',
      wranglerVersion: '4.104.0',
      commands: ['dry-run', 'startup'],
      dryRun: {
        status: 'passed',
        bundle: 'output/wrangler/worker.bundle.mjs'
      },
      startupProfile: {
        status: 'passed',
        profile: 'output/wrangler/worker-startup.cpuprofile',
        durationMs: 1
      }
    }));

    await writeFile(join(dir, 'completion.json'), JSON.stringify({
      schemaVersion: 1,
      checkedAt: '2026-06-28T00:00:00Z',
      status: 'not_complete',
      goalFile: 'docs/goals/comprehensive-explore-optimize.md',
      totalRequirements: 2,
      satisfiedRequirements: 1,
      blockedRequirements: 1,
      incompleteRequirements: 0,
      requirements: [
        {
          id: 'verify',
          requirement: 'npm run verify passes',
          status: 'satisfied',
          evidence: ['npm run verify passed']
        },
        {
          id: 'cutover',
          requirement: 'production cutover is ready',
          status: 'blocked',
          classification: 'external blocker',
          evidence: ['Cloudflare zone is initializing'],
          nextAction: 'Wait for Cloudflare activation'
        }
      ]
    }));

    await expect(verifyMaintenanceAudits({ dir })).resolves.toEqual([
      { file: join(dir, 'completion.json'), type: 'completion' },
      { file: join(dir, 'preview.json'), type: 'checks' },
      { file: join(dir, 'worker-startup.json'), type: 'worker-startup' }
    ]);
  });

  it('rejects inconsistent pass/fail counts', () => {
    expect(() => validateAuditDocument({
      schemaVersion: 1,
      startedAt: '2026-06-28T00:00:00.000Z',
      completedAt: '2026-06-28T00:00:01.000Z',
      ready: true,
      totalChecks: 2,
      passedChecks: 1,
      failedChecks: 0,
      checks: [
        { name: 'worker health', status: 'ok' }
      ]
    }, 'bad.json')).toThrow(/totalChecks/);
  });

  it('rejects completion audits that claim complete while requirements are blocked', () => {
    expect(() => validateAuditDocument({
      schemaVersion: 1,
      checkedAt: '2026-06-28T00:00:00Z',
      status: 'complete',
      goalFile: 'docs/goals/comprehensive-explore-optimize.md',
      totalRequirements: 1,
      satisfiedRequirements: 0,
      blockedRequirements: 1,
      incompleteRequirements: 0,
      requirements: [
        {
          id: 'cutover',
          requirement: 'production cutover is ready',
          status: 'blocked',
          classification: 'external blocker',
          evidence: ['Cloudflare zone is initializing'],
          nextAction: 'Wait for Cloudflare activation'
        }
      ]
    }, 'completion.json')).toThrow(/complete audit/);
  });

  it('detects high-risk credential patterns without flagging ordinary URLs', () => {
    expect(findSuspiciousSecrets('https://kevinten-api-preview.wshten.workers.dev/api/config')).toEqual([]);
    expect(findSuspiciousSecrets('Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456')).toContain('Bearer credential');
    expect(findSuspiciousSecrets('whsec_abcdefghijklmnopqrstuvwxyz123456')).toContain('Stripe webhook secret');
  });
});
