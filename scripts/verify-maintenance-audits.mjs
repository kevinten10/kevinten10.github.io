import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultAuditDir = 'docs/maintenance';
const validStatuses = new Set(['ok', 'not_ready']);
const validRequirementStatuses = new Set(['satisfied', 'blocked', 'incomplete']);
const secretPatterns = [
  { name: 'Stripe API key', pattern: /\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { name: 'Stripe webhook secret', pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/ },
  { name: 'Bearer credential', pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/i },
  { name: 'JWT credential', pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/ },
  { name: 'named credential field', pattern: /"(?:CLOUDFLARE_API_TOKEN|CF_API_KEY|client_secret|oauth_token|authorization)"\s*:\s*"[^"]+"/i }
];

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

export function findSuspiciousSecrets(text) {
  const source = String(text || '');
  return secretPatterns
    .filter(({ pattern }) => pattern.test(source))
    .map(({ name }) => name);
}

export function validateCheckAudit(data, file = 'audit.json') {
  assertCondition(data?.schemaVersion === 1, `${file}: schemaVersion must be 1`);
  assertCondition(typeof data.startedAt === 'string' && data.startedAt, `${file}: startedAt is required`);
  assertCondition(typeof data.completedAt === 'string' && data.completedAt, `${file}: completedAt is required`);
  assertCondition(typeof data.ready === 'boolean', `${file}: ready must be boolean`);
  assertCondition(Array.isArray(data.checks), `${file}: checks must be an array`);

  for (const check of data.checks) {
    assertCondition(typeof check?.name === 'string' && check.name, `${file}: every check needs a name`);
    assertCondition(validStatuses.has(check?.status), `${file}: invalid check status for ${check?.name || 'unknown'}`);
  }

  const passedChecks = data.checks.filter((item) => item.status === 'ok').length;
  const failedChecks = data.checks.filter((item) => item.status !== 'ok').length;
  assertCondition(data.totalChecks === data.checks.length, `${file}: totalChecks does not match checks length`);
  assertCondition(data.passedChecks === passedChecks, `${file}: passedChecks does not match checks`);
  assertCondition(data.failedChecks === failedChecks, `${file}: failedChecks does not match checks`);
  assertCondition(data.passedChecks + data.failedChecks === data.totalChecks, `${file}: pass/fail counts do not sum to total`);
  if (data.ready) {
    assertCondition(data.failedChecks === 0, `${file}: ready audit cannot have failed checks`);
  } else {
    assertCondition(data.failedChecks > 0, `${file}: not-ready audit should identify at least one failed check`);
  }
}

export function validateWorkerStartupAudit(data, file = 'worker-startup.json') {
  assertCondition(data?.schemaVersion === 1, `${file}: schemaVersion must be 1`);
  assertCondition(typeof data.checkedAt === 'string' && data.checkedAt, `${file}: checkedAt is required`);
  assertCondition(typeof data.wranglerVersion === 'string' && data.wranglerVersion, `${file}: wranglerVersion is required`);
  assertCondition(Array.isArray(data.commands) && data.commands.length >= 2, `${file}: commands must include dry-run and startup checks`);
  assertCondition(data.dryRun?.status === 'passed', `${file}: dryRun.status must be passed`);
  assertCondition(typeof data.dryRun?.bundle === 'string' && data.dryRun.bundle, `${file}: dryRun.bundle is required`);
  assertCondition(data.startupProfile?.status === 'passed', `${file}: startupProfile.status must be passed`);
  assertCondition(typeof data.startupProfile?.profile === 'string' && data.startupProfile.profile, `${file}: startupProfile.profile is required`);
  assertCondition(Number(data.startupProfile?.durationMs || 0) >= 0, `${file}: startupProfile.durationMs must be non-negative`);
}

export function validateCompletionAudit(data, file = 'completion-audit.json') {
  assertCondition(data?.schemaVersion === 1, `${file}: schemaVersion must be 1`);
  assertCondition(typeof data.checkedAt === 'string' && data.checkedAt, `${file}: checkedAt is required`);
  assertCondition(data.status === 'complete' || data.status === 'not_complete', `${file}: status must be complete or not_complete`);
  assertCondition(typeof data.goalFile === 'string' && data.goalFile, `${file}: goalFile is required`);
  assertCondition(Array.isArray(data.requirements), `${file}: requirements must be an array`);
  assertCondition(data.requirements.length > 0, `${file}: requirements must not be empty`);

  for (const requirement of data.requirements) {
    assertCondition(typeof requirement?.id === 'string' && requirement.id, `${file}: every requirement needs an id`);
    assertCondition(typeof requirement?.requirement === 'string' && requirement.requirement, `${file}: every requirement needs text`);
    assertCondition(validRequirementStatuses.has(requirement?.status), `${file}: invalid requirement status for ${requirement?.id || 'unknown'}`);
    assertCondition(Array.isArray(requirement.evidence) && requirement.evidence.length > 0, `${file}: ${requirement.id} needs evidence`);
    if (requirement.status !== 'satisfied') {
      assertCondition(typeof requirement.nextAction === 'string' && requirement.nextAction, `${file}: ${requirement.id} needs a nextAction`);
      assertCondition(typeof requirement.classification === 'string' && requirement.classification, `${file}: ${requirement.id} needs a classification`);
    }
  }

  const satisfied = data.requirements.filter((item) => item.status === 'satisfied').length;
  const blocked = data.requirements.filter((item) => item.status === 'blocked').length;
  const incomplete = data.requirements.filter((item) => item.status === 'incomplete').length;
  assertCondition(data.totalRequirements === data.requirements.length, `${file}: totalRequirements does not match requirements length`);
  assertCondition(data.satisfiedRequirements === satisfied, `${file}: satisfiedRequirements does not match requirements`);
  assertCondition(data.blockedRequirements === blocked, `${file}: blockedRequirements does not match requirements`);
  assertCondition(data.incompleteRequirements === incomplete, `${file}: incompleteRequirements does not match requirements`);
  assertCondition(satisfied + blocked + incomplete === data.totalRequirements, `${file}: requirement counts do not sum to total`);
  if (data.status === 'complete') {
    assertCondition(blocked === 0 && incomplete === 0, `${file}: complete audit cannot have blocked or incomplete requirements`);
  } else {
    assertCondition(blocked > 0 || incomplete > 0, `${file}: not_complete audit should identify blocked or incomplete requirements`);
  }
}

export function validateAuditDocument(data, file = 'audit.json') {
  if (Array.isArray(data?.checks)) {
    validateCheckAudit(data, file);
    return 'checks';
  }
  if (Array.isArray(data?.requirements)) {
    validateCompletionAudit(data, file);
    return 'completion';
  }
  if (data?.dryRun || data?.startupProfile) {
    validateWorkerStartupAudit(data, file);
    return 'worker-startup';
  }
  throw new Error(`${file}: unknown maintenance audit shape`);
}

export async function verifyMaintenanceAudits({ dir = defaultAuditDir } = {}) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => join(dir, entry.name))
    .sort();

  assertCondition(files.length > 0, `${dir}: no maintenance audit JSON files found`);

  const results = [];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const secretMatches = findSuspiciousSecrets(text);
    assertCondition(secretMatches.length === 0, `${file}: suspicious credential pattern(s): ${secretMatches.join(', ')}`);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error(`${file}: invalid JSON: ${err.message}`);
    }

    const type = validateAuditDocument(data, file);
    results.push({ file, type });
  }
  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const results = await verifyMaintenanceAudits({ dir: process.env.MAINTENANCE_AUDIT_DIR || defaultAuditDir });
    console.log(JSON.stringify({
      ok: true,
      files: results.length,
      audits: results
    }, null, 2));
  } catch (err) {
    console.error(`maintenance audit verification failed: ${err.message}`);
    process.exitCode = 1;
  }
}
