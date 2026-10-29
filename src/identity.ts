// A client's certificate: a P-256 key and a self-signed certificate for it,
// which pairing registers with cohesiond and every connection presents.

import { X509Certificate, createHash } from "node:crypto";
import {
  bits, dnsName, explicit, generalizedTime, integer, octets, oid, sequence, set, utf8,
} from "./der.ts";

const ECDSA = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" } as const;
const ECDSA_WITH_SHA256 = sequence(oid("1.2.840.10045.4.3.2"));

/** A client certificate and its private key, both PEM. */
export interface ClientIdentity {
  certificate: string;
  privateKey: string;
}

/** A new key, and a certificate for it naming the client `name`. */
export async function generateIdentity(name: string): Promise<ClientIdentity> {
  const keys = await crypto.subtle.generateKey(ECDSA, true, ["sign", "verify"]);
  const spki = new Uint8Array(await crypto.subtle.exportKey("spki", keys.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", keys.privateKey));
  const subject = sequence(set(sequence(oid("2.5.4.3"), utf8(name))));
  const now = Date.now();
  const tbs = sequence(
    explicit(0, integer(new Uint8Array([2]))),
    integer(crypto.getRandomValues(new Uint8Array(16))),
    ECDSA_WITH_SHA256,
    subject,
    sequence(generalizedTime(new Date(now - 60_000)), generalizedTime(new Date("9999-12-31T23:59:59Z"))),
    subject,
    spki,
    explicit(3, sequence(sequence(oid("2.5.29.17"), octets(sequence(dnsName(name)))))),
  );
  const raw = new Uint8Array(await crypto.subtle.sign(ECDSA, keys.privateKey, tbs));
  const signature = sequence(integer(raw.subarray(0, 32)), integer(raw.subarray(32)));
  const certificate = sequence(tbs, ECDSA_WITH_SHA256, bits(signature));
  return { certificate: pem("CERTIFICATE", certificate), privateKey: pem("PRIVATE KEY", pkcs8) };
}

/**
 * The lowercase hex SHA-256 of a certificate's public key (its
 * SubjectPublicKeyInfo), how cohesiond and its clients are identified: it
 * survives re-signing, as cohesiond does on every start.
 */
export function keyFingerprint(certificate: Uint8Array | string): string {
  const spki = new X509Certificate(certificate).publicKey.export({ type: "spki", format: "der" });
  return createHash("sha256").update(spki).digest("hex");
}

function pem(label: string, der: Uint8Array): string {
  const lines = Buffer.from(der).toString("base64").match(/.{1,64}/g)!;
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----\n`;
}

