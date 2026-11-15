// Vérifie que en.json a exactement les mêmes clés (et longueurs de tableaux) que fr.json, la référence.
// Usage : npm run i18n:check
import { readFileSync } from "node:fs";

const load = (l) => JSON.parse(readFileSync(new URL(`../src/i18n/dictionaries/${l}.json`, import.meta.url), "utf8"));
const ref = load("fr");
const problems = [];

function walk(a, b, path) {
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return problems.push(`${path} : tableau attendu`);
    if (a.length !== b.length) problems.push(`${path} : ${a.length} éléments en fr, ${b.length} en en`);
    a.forEach((v, i) => b[i] !== undefined && walk(v, b[i], `${path}[${i}]`));
    return;
  }
  if (a && typeof a === "object") {
    if (!b || typeof b !== "object") return problems.push(`${path} : objet attendu`);
    for (const k of Object.keys(a)) {
      if (!(k in b)) problems.push(`${path}.${k} : manquant en en`);
      else walk(a[k], b[k], `${path}.${k}`);
    }
    for (const k of Object.keys(b)) if (!(k in a)) problems.push(`${path}.${k} : en trop en en`);
    return;
  }
  if (typeof b !== "string") return problems.push(`${path} : texte attendu`);
  if (!b.trim()) problems.push(`${path} : vide en en`);
  const vars = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
  if (vars(a) !== vars(b)) problems.push(`${path} : variables différentes (${vars(a)} ≠ ${vars(b)})`);
}

walk(ref, load("en"), "");
if (problems.length) {
  console.error(`✗ ${problems.length} écart(s) entre fr.json et en.json :\n  ` + problems.join("\n  "));
  process.exit(1);
}
console.log("✓ fr.json et en.json ont les mêmes clés et les mêmes variables.");
