// src/lib/caesar.js

export function caesarShift(text, n, encrypt) {
  const s = (((encrypt ? n : -n) % 26) + 26) % 26;
  return text
    .split("")
    .map((ch) => {
      if (/[a-zA-Z]/.test(ch)) {
        const base = ch >= "a" ? 97 : 65;
        return String.fromCharCode(((ch.charCodeAt(0) - base + s) % 26) + base);
      }
      return ch;
    })
    .join("");
}

export function bruteForceAll(text) {
  return Array.from({ length: 26 }, (_, i) => ({
    shift: i,
    text: caesarShift(text, i, false),
  }));
}

export function letterFrequency(text) {
  const freq = {};
  for (const ch of text.toUpperCase()) {
    if (/[A-Z]/.test(ch)) freq[ch] = (freq[ch] || 0) + 1;
  }
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => ({
    letter: c,
    count: freq[c] || 0,
  }));
}
