// src/lib/rsa.js
// Server-side RSA / modular-arithmetic implementation.
// This mirrors the client-side math in App.jsx exactly, so results are
// identical whether a calculation happens in-browser or on the server.

export function modPow(base, exp, mod) {
  if (mod === 1n) return 0n;
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

export function gcd(a, b) {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function modInverse(e, phi) {
  let [oldR, r] = [e, phi];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return ((oldS % phi) + phi) % phi;
}

const SMALL_PRIMES = [
  2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n,
  59n, 61n, 67n, 71n, 73n, 79n, 83n, 89n, 97n, 101n, 103n, 107n, 109n, 113n,
  127n, 131n, 137n, 139n, 149n, 151n, 157n, 163n, 167n, 173n, 179n, 181n,
  191n, 193n, 197n, 199n, 211n, 223n, 227n, 229n, 233n, 239n, 241n, 251n,
  257n, 263n, 269n, 271n, 277n, 281n, 283n,
];

export function millerRabin(n) {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;
  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    r++;
  }
  for (const a of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    if (a >= n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let i = 0n; i < r - 1n; i++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

function randomBigInt(bits) {
  const bytes = Math.ceil(bits / 8);
  const arr = new Uint8Array(bytes);
  // Node 18+ has webcrypto on globalThis.crypto
  globalThis.crypto.getRandomValues(arr);
  arr[0] |= 0x80;
  arr[bytes - 1] |= 0x01;
  return BigInt(
    "0x" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("")
  );
}

export function generatePrime(bits = 64) {
  // Hard safety cap — this is an educational tool, not a production KMS.
  const safeBits = Math.min(Math.max(bits, 8), 128);
  while (true) {
    const candidate = randomBigInt(safeBits);
    if (millerRabin(candidate)) return candidate;
  }
}

export function generateRSAKeys(bits = 32) {
  let p, q;
  do {
    p = generatePrime(bits);
    q = generatePrime(bits);
  } while (p === q);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  let e = 65537n;
  while (gcd(e, phi) !== 1n) e += 2n;
  const d = modInverse(e, phi);
  return { p, q, n, e, d, phi };
}

export function rsaEncrypt(message, e, n) {
  return Array.from(new TextEncoder().encode(message)).map((b) =>
    modPow(BigInt(b), e, n).toString()
  );
}

export function rsaDecrypt(chunks, d, n) {
  return new TextDecoder().decode(
    new Uint8Array(chunks.map((c) => Number(modPow(BigInt(c), d, n))))
  );
}

export function modPowSteps(base, exp, mod) {
  const steps = [];
  let result = 1n;
  let b = base % mod;
  let e = exp;
  steps.push({ step: 0, result: result.toString(), action: "Initialize result = 1" });
  let i = 1;
  while (e > 0n) {
    const bit = e % 2n;
    if (bit === 1n) {
      const prev = result;
      result = (result * b) % mod;
      steps.push({
        step: i,
        result: result.toString(),
        action: `bit=1 → result=(${prev}×${b}) mod ${mod}=${result}`,
      });
    } else {
      steps.push({ step: i, result: result.toString(), action: `bit=0 → skip multiply, result stays ${result}` });
    }
    e = e / 2n;
    b = (b * b) % mod;
    i++;
    if (i > 18) break;
  }
  return steps;
}
