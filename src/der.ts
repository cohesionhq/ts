// The little DER a self-signed client certificate needs.

function length(n: number): number[] {
  if (n < 0x80) return [n];
  const bytes: number[] = [];
  for (; n > 0; n >>= 8) bytes.unshift(n & 0xff);
  return [0x80 | bytes.length, ...bytes];
}

function tlv(tag: number, ...contents: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const size = contents.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array([tag, ...length(size)]);
  return concat(out, ...contents);
}

export function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

export const sequence = (...items: Uint8Array[]) => tlv(0x30, ...items);
export const set = (...items: Uint8Array[]) => tlv(0x31, ...items);
export const explicit = (n: number, item: Uint8Array) => tlv(0xa0 | n, item);
export const octets = (bytes: Uint8Array) => tlv(0x04, bytes);
export const bits = (bytes: Uint8Array) => tlv(0x03, new Uint8Array([0]), bytes);
export const utf8 = (text: string) => tlv(0x0c, new TextEncoder().encode(text));

/** A non-negative integer from its big-endian bytes. */
export function integer(bytes: Uint8Array): Uint8Array {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) start++;
  const trimmed = bytes.subarray(start);
  const pad = trimmed[0]! & 0x80 ? new Uint8Array([0]) : new Uint8Array();
  return tlv(0x02, pad, trimmed);
}

export function oid(dotted: string): Uint8Array {
  const [first, second, ...rest] = dotted.split(".").map(Number);
  const out = [first! * 40 + second!];
  for (const arc of rest) {
    const bytes = [arc & 0x7f];
    for (let n = arc >> 7; n > 0; n >>= 7) bytes.unshift(0x80 | (n & 0x7f));
    out.push(...bytes);
  }
  return tlv(0x06, new Uint8Array(out));
}

export function generalizedTime(date: Date): Uint8Array {
  const text = date.toISOString().replace(/[-:T]/g, "").replace(/\.\d+/, "");
  return tlv(0x18, new TextEncoder().encode(text));
}

/** A SAN entry: a dNSName. */
export const dnsName = (name: string) => tlv(0x82, new TextEncoder().encode(name));
