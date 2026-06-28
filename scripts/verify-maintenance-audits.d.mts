export function findSuspiciousSecrets(text: string): string[];

export function validateCheckAudit(data: unknown, file?: string): void;

export function validateWorkerStartupAudit(data: unknown, file?: string): void;

export function validateCompletionAudit(data: unknown, file?: string): void;

export function validateAuditDocument(data: unknown, file?: string): 'checks' | 'completion' | 'worker-startup';

export function verifyMaintenanceAudits(options?: {
  dir?: string;
}): Promise<Array<{
  file: string;
  type: 'checks' | 'completion' | 'worker-startup';
}>>;
