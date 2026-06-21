// src/lib/password.js

const COMMON_PASSWORDS = [
  "password",
  "123456",
  "qwerty",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
];

export function analyzePassword(p) {
  const checks = {
    length8: p.length >= 8,
    length12: p.length >= 12,
    length16: p.length >= 16,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    digit: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
    noRepeat: !/(.)\1{2,}/.test(p),
    noCommon: !COMMON_PASSWORDS.includes(p.toLowerCase()),
  };

  const charset =
    (checks.upper ? 26 : 0) +
    (checks.lower ? 26 : 0) +
    (checks.digit ? 10 : 0) +
    (checks.special ? 32 : 0);

  const entropy = charset > 0 && p.length > 0 ? Math.round(p.length * Math.log2(charset)) : 0;

  const passedCount = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedCount / Object.keys(checks).length) * 100);

  let strength = "Very Weak";
  if (score >= 80) strength = "Very Strong";
  else if (score >= 65) strength = "Strong";
  else if (score >= 45) strength = "Moderate";
  else if (score >= 25) strength = "Weak";

  const crackTime =
    entropy < 28 ? "< 1 second" :
    entropy < 40 ? "Minutes" :
    entropy < 55 ? "Hours–Days" :
    entropy < 70 ? "Years" :
    entropy < 90 ? "Centuries" : "Astronomical";

  return { checks, entropy, score, strength, crackTime };
}
