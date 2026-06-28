import { describe, expect, it } from 'vitest';
import {
  createCutoverAudit,
  describePagesDomains,
  describeExpectedPagesDnsRecords,
  finalizeCutoverAudit,
  hasActivePagesDomains,
  hasCloudflareAccessMarker,
  hasCloudflareNameservers,
  hasExpectedPagesDnsRecords,
  hasGithubPagesAddress,
  includesAll,
  isAuthoritativeDnsReady,
  isCloudflareAccessProtected,
  isProductionHttpReady,
  auth0ChildEnv,
  auth0Executable,
  auth0AppShowArgs,
  normalizeHostname,
  normalizeNameservers,
  parseDigResponse,
  parseCurlResponseOutput,
  parseNslookupResponse,
  recordCutoverCheck
} from '../../scripts/verify-cutover-readiness.mjs';

describe('production cutover readiness helpers', () => {
  it('detects Cloudflare nameservers for apex cutover readiness', () => {
    expect(hasCloudflareNameservers(['ada.ns.cloudflare.com', 'bob.ns.cloudflare.com'])).toBe(true);
    expect(hasCloudflareNameservers(['dns13.hichina.com', 'dns14.hichina.com'])).toBe(false);
  });

  it('normalizes nameservers from registrar and recursive DNS output', () => {
    expect(normalizeHostname(' Kevinten-Interactive-Preview.Pages.Dev. ')).toBe('kevinten-interactive-preview.pages.dev');
    expect(normalizeNameservers(['Chip.NS.Cloudflare.com.', ' faye.ns.cloudflare.com '])).toEqual([
      'chip.ns.cloudflare.com',
      'faye.ns.cloudflare.com'
    ]);
  });

  it('requires Cloudflare DNS CNAME records to target the Pages project through the proxy', () => {
    const records = [
      {
        name: 'kevinten.com',
        type: 'CNAME',
        content: 'kevinten-interactive-preview.pages.dev',
        proxied: true
      },
      {
        name: 'www.kevinten.com',
        type: 'CNAME',
        content: 'Kevinten-Interactive-Preview.Pages.Dev.',
        proxied: true
      }
    ];
    expect(hasExpectedPagesDnsRecords(records, ['kevinten.com', 'www.kevinten.com'])).toBe(true);
    expect(hasExpectedPagesDnsRecords([
      { name: 'kevinten.com', type: 'A', content: '185.199.108.153', proxied: false },
      { name: 'www.kevinten.com', type: 'CNAME', content: 'kevinten10.github.io', proxied: false }
    ], ['kevinten.com', 'www.kevinten.com'])).toBe(false);
  });

  it('requires Pages custom domains to be active for every production host', () => {
    expect(hasActivePagesDomains([
      { name: 'kevinten.com', status: 'active' },
      { domain: 'www.kevinten.com', status: 'active' }
    ], ['kevinten.com', 'www.kevinten.com'])).toBe(true);
    expect(hasActivePagesDomains([
      { name: 'kevinten.com', status: 'pending' },
      { domain: 'www.kevinten.com', status: 'active' }
    ], ['kevinten.com', 'www.kevinten.com'])).toBe(false);
  });

  it('describes Pages custom domain status for cutover diagnostics', () => {
    expect(describePagesDomains([
      { name: 'kevinten.com', status: 'pending' }
    ], ['kevinten.com', 'www.kevinten.com'])).toEqual([
      'kevinten.com:pending',
      'www.kevinten.com:missing'
    ]);
  });

  it('describes Cloudflare DNS record mismatches for cutover diagnostics', () => {
    expect(describeExpectedPagesDnsRecords([
      { name: 'kevinten.com', type: 'CNAME', content: 'kevinten10.github.io', proxied: false }
    ], ['kevinten.com', 'www.kevinten.com'])).toEqual([
      'kevinten.com:CNAME->kevinten10.github.io:dns-only:target-mismatch',
      'www.kevinten.com:missing'
    ]);
  });

  it('detects GitHub Pages addresses that still serve the current production domain', () => {
    expect(hasGithubPagesAddress(['185.199.108.153'])).toBe(true);
    expect(hasGithubPagesAddress(['104.21.1.1'])).toBe(false);
  });

  it('builds a structured cutover audit summary from readiness checks', () => {
    const audit = createCutoverAudit({
      startedAt: '2026-06-28T00:00:00.000Z',
      apiBaseUrl: 'https://kevinten-api-preview.wshten.workers.dev',
      pagesUrl: 'https://kevinten-interactive-preview.pages.dev',
      productionOrigins: ['https://kevinten.com', 'https://www.kevinten.com']
    });

    recordCutoverCheck(audit, 'worker health', true, 'ok');
    recordCutoverCheck(audit, 'Cloudflare zone status active', false, 'initializing');

    const finalAudit = finalizeCutoverAudit(audit, false, '2026-06-28T00:01:00.000Z');

    expect(finalAudit.ready).toBe(false);
    expect(finalAudit.totalChecks).toBe(2);
    expect(finalAudit.passedChecks).toBe(1);
    expect(finalAudit.failedChecks).toBe(1);
    expect(finalAudit.checks).toEqual([
      { name: 'worker health', status: 'ok', detail: 'ok' },
      { name: 'Cloudflare zone status active', status: 'not_ready', detail: 'initializing' }
    ]);
  });

  it('parses authoritative dig output and requires an active non-GitHub answer', () => {
    const refused = parseDigResponse(';; ->>HEADER<<- opcode: QUERY, status: REFUSED, id: 1\n');
    expect(refused.status).toBe('REFUSED');
    expect(isAuthoritativeDnsReady(refused)).toBe(false);

    const github = parseDigResponse([
      ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 2',
      'kevinten.com. 300 IN A 185.199.108.153'
    ].join('\n'));
    expect(github.addresses).toEqual(['185.199.108.153']);
    expect(isAuthoritativeDnsReady(github)).toBe(false);

    const cloudflare = parseDigResponse([
      ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 3',
      'kevinten.com. 300 IN A 104.21.1.1'
    ].join('\n'));
    expect(isAuthoritativeDnsReady(cloudflare)).toBe(true);

    const pages = parseDigResponse([
      ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4',
      'www.kevinten.com. 300 IN CNAME kevinten-interactive-preview.pages.dev.'
    ].join('\n'));
    expect(pages.cnames).toEqual(['kevinten-interactive-preview.pages.dev']);
    expect(isAuthoritativeDnsReady(pages)).toBe(true);
  });

  it('parses nslookup output for Windows cutover diagnostics', () => {
    const registry = parseNslookupResponse([
      'Server:  UnKnown',
      'Address:  192.5.6.30',
      '',
      'kevinten.com nameserver = chip.ns.cloudflare.com',
      'kevinten.com nameserver = faye.ns.cloudflare.com',
      'chip.ns.cloudflare.com internet address = 173.245.59.84'
    ].join('\n'));
    expect(registry.nameservers).toEqual([
      'chip.ns.cloudflare.com',
      'faye.ns.cloudflare.com'
    ]);

    const refused = parseNslookupResponse([
      'Server:  chip.ns.cloudflare.com',
      'Address:  173.245.59.84',
      '',
      "*** chip.ns.cloudflare.com can't find kevinten.com: Query refused"
    ].join('\n'));
    expect(refused.status).toBe('REFUSED');
    expect(isAuthoritativeDnsReady(refused)).toBe(false);

    const cloudflare = parseNslookupResponse([
      'Server:  chip.ns.cloudflare.com',
      'Address:  173.245.59.84',
      '',
      'Name:    kevinten.com',
      'Address: 104.21.1.1'
    ].join('\n'));
    expect(isAuthoritativeDnsReady(cloudflare)).toBe(true);
  });

  it('requires production HTTP responses to come from Cloudflare Pages, not GitHub Pages', () => {
    expect(isProductionHttpReady({
      status: 200,
      server: 'cloudflare',
      cfRay: 'abc',
      bodyText: '<script src="/assets/js/cloudflare-runtime.js"></script>'
    })).toBe(true);
    expect(isProductionHttpReady({
      status: 200,
      server: 'GitHub.com',
      githubRequestId: '123',
      bodyText: '<script src="/assets/js/cloudflare-runtime.js"></script>'
    })).toBe(false);
    expect(isProductionHttpReady({
      status: 200,
      server: 'cloudflare',
      cfRay: 'abc',
      bodyText: '<html>No runtime config</html>'
    })).toBe(false);
  });

  it('parses curl fallback headers from the final response without losing the body', () => {
    const parsed = parseCurlResponseOutput([
      'HTTP/2 301',
      'server: cloudflare',
      'location: https://www.kevinten.com/',
      '',
      'HTTP/2 200',
      'server: cloudflare',
      'cf-ray: abc123',
      '',
      '<script src="/assets/js/cloudflare-runtime.js"></script>',
      '__STATUS__:200'
    ].join('\n'));
    expect(parsed.status).toBe(200);
    expect(parsed.headers.get('server')).toBe('cloudflare');
    expect(parsed.headers.get('cf-ray')).toBe('abc123');
    expect(parsed.headers.get('location')).toBeNull();
    expect(parsed.text).toContain('/assets/js/cloudflare-runtime.js');
    expect(isProductionHttpReady({
      status: parsed.status,
      server: parsed.headers.get('server') || '',
      cfRay: parsed.headers.get('cf-ray') || '',
      bodyText: parsed.text
    })).toBe(true);
  });

  it('detects Cloudflare Access protection for production admin paths', () => {
    expect(hasCloudflareAccessMarker({
      bodyText: '<title>Cloudflare Access</title><a href="https://team.cloudflareaccess.com">Log in</a>'
    })).toBe(true);
    expect(isCloudflareAccessProtected({
      status: 200,
      server: 'cloudflare',
      cfRay: 'abc',
      bodyText: '<title>Cloudflare Access</title>'
    })).toBe(true);
    expect(isCloudflareAccessProtected({
      status: 302,
      server: 'cloudflare',
      location: '/cdn-cgi/access/login/kevinten'
    })).toBe(true);
    expect(isCloudflareAccessProtected({
      status: 200,
      server: 'GitHub.com',
      bodyText: '<script src="/assets/js/admin.js"></script>'
    })).toBe(false);
  });

  it('checks required Auth0 and Pages domain lists exactly enough for readiness', () => {
    expect(includesAll(['https://kevinten.com/', 'https://www.kevinten.com/'], [
      'https://kevinten.com/',
      'https://www.kevinten.com/'
    ])).toBe(true);
    expect(includesAll(['https://kevinten.com/'], [
      'https://kevinten.com/',
      'https://www.kevinten.com/'
    ])).toBe(false);
  });

  it('runs Auth0 app inspection without interactive prompts', () => {
    expect(auth0AppShowArgs('client_123')).toEqual([
      'apps',
      'show',
      'client_123',
      '--json',
      '--no-input',
      '--no-color'
    ]);
  });

  it('allows an explicit Auth0 CLI executable path for automation', () => {
    expect(auth0Executable({ AUTH0_CLI_PATH: 'C:\\Tools\\Auth0CLI\\auth0.exe' }))
      .toBe('C:\\Tools\\Auth0CLI\\auth0.exe');
  });

  it('preserves an explicit Auth0 config directory for child processes', () => {
    expect(auth0ChildEnv({ XDG_CONFIG_HOME: 'C:\\Auth0Config' }).XDG_CONFIG_HOME)
      .toBe('C:\\Auth0Config');
  });
});
