import { expect, test } from 'bun:test';
import { X509Certificate } from 'node:crypto';

import { decodeSetupCode, generateIdentity, keyFingerprint } from '../index.ts';

test('a generated certificate is signed by its own key', async () => {
	const identity = await generateIdentity("Jackson's MacBook Pro");
	const certificate = new X509Certificate(identity.certificate);
	expect(certificate.verify(certificate.publicKey)).toBe(true);
	expect(certificate.subjectAltName).toContain("Jackson's MacBook Pro");
	expect(keyFingerprint(identity.certificate)).toMatch(/^[0-9a-f]{64}$/);
});

test('setup codes name a host, and a port only when it is not the default', () => {
	const code = (address: string) => Buffer.from(`key|${address}|fp`).toString('base64');
	expect(decodeSetupCode(code('10.0.0.2'))).toEqual({ key: 'key', host: '10.0.0.2', port: 3000, fingerprint: 'fp' });
	expect(decodeSetupCode(code('cohesion.example.com:8443')).port).toBe(8443);
	expect(decodeSetupCode(code('[fe80::1]:4000'))).toMatchObject({ host: 'fe80::1', port: 4000 });
	expect(decodeSetupCode(code('fe80::1'))).toMatchObject({ host: 'fe80::1', port: 3000 });
	expect(() => decodeSetupCode('bm90IGEgY29kZQ==')).toThrow();
});
