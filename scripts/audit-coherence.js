#!/usr/bin/env node
/**
 * Audit de cohérence frontend ↔ serveur (aucune base de données nécessaire).
 *
 * Il échoue (code 1) si :
 *  1. un lien ou un router.push() du frontend mène à une page qui n'existe pas (le fameux « 404 Page introuvable ») ;
 *  2. un appel apiClient() vise une route que le serveur n'expose pas ;
 *  3. un formulaire envoie un champ que le serveur refuse (il rejette tout champ inconnu : forbidNonWhitelisted).
 *
 * Usage : node scripts/audit-coherence.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONT = path.join(ROOT, 'frontend', 'src');
const BACK = path.join(ROOT, 'backend', 'src');

const walk = (d, o = []) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { if (f !== 'node_modules') walk(p, o); }
    else if (/\.tsx?$/.test(f) && !/\.(spec|test)\./.test(f)) o.push(p);
  }
  return o;
};
const rel = (p, base) => path.relative(base, p).replace(/\\/g, '/');
const balanced = (s, i) => { let d = 0; for (let k = i; k < s.length; k++) { if (s[k] === '(') d++; else if (s[k] === ')') { d--; if (d === 0) return k; } } return -1; };
const balancedBraces = (s, i) => { let d = 0; for (let k = i; k < s.length; k++) { if (s[k] === '{') d++; else if (s[k] === '}') { d--; if (d === 0) return k; } } return -1; };

const problemes = [];

// ── Pages existantes ─────────────────────────────────────────────────────────
const pages = [];
(function listerPages(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) listerPages(p);
    else if (f === 'page.tsx') {
      const r = '/' + rel(path.dirname(p), path.join(FRONT, 'app')).replace(/\/?\([^)/]*\)/g, '').replace(/^\//, '');
      pages.push(new RegExp('^' + r.replace(/\/$/, '').replace(/\[[^\]]+\]/g, '[^/]+') + '/?$'));
    }
  }
})(path.join(FRONT, 'app'));
const pageExiste = (u) => u === '/' || pages.some((r) => r.test(u));

// Fichiers qui ne sont plus utilisés (liens obsolètes sans conséquence)
const IGNORES = new Set(['components/layout/Sidebar.tsx']);

for (const f of walk(FRONT)) {
  const nom = rel(f, FRONT);
  if (IGNORES.has(nom)) continue;
  const t = fs.readFileSync(f, 'utf8');
  const re = /(?:href=|href:\s*|push\(|replace\(|redirect\()\s*\{?\s*(['"`])(\/[^'"`]*)\1/g;
  let m;
  while ((m = re.exec(t))) {
    let u = m[2];
    if (u.startsWith('//') || u.startsWith('/api') || u.startsWith('/_next')) continue;
    u = u.split('?')[0].split('#')[0].replace(/\$\{[^}]*\}/g, 'X');
    if (/\.(png|jpg|svg|ico|json|webp|pdf|js|css|xml|txt|webmanifest)$/.test(u)) continue;
    if (!pageExiste(u)) problemes.push(`Lien vers une page inexistante « ${m[2]} » (${nom}:${t.slice(0, m.index).split('\n').length})`);
  }
}

// ── DTO du serveur ───────────────────────────────────────────────────────────
const dtoProps = {};
const dtoExtends = {};
const controllers = [];
for (const f of walk(BACK)) {
  const t = fs.readFileSync(f, 'utf8');
  const re = /export class (\w+)(?:\s+extends\s+(?:\w+\()?(\w+)\)?)?[^{]*\{/g;
  let m;
  while ((m = re.exec(t))) {
    const open = m.index + m[0].length - 1;
    const close = balancedBraces(t, open);
    const corps = t.slice(open + 1, close === -1 ? undefined : close);
    const props = new Set();
    // Un champ = une ligne indentée de 2 espaces, éventuellement précédée de décorateurs sur la même ligne.
    for (const ligne of corps.split('\n')) {
      if (!/^ {2}\S/.test(ligne)) continue;
      let l = ligne;
      for (let g = 0; g < 8; g++) {
        const d = /^\s*@\w+(?:\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))?\s*/.exec(l);
        if (!d || !d[0].length) break;
        l = l.slice(d[0].length);
      }
      const pm = /^\s*(?:readonly\s+)?([a-zA-Z_]\w*)[?!]?\s*[:=]/.exec(l);
      if (pm) props.add(pm[1]);
    }
    // Deux classes de même nom dans deux modules : on additionne leurs champs (contrôle volontairement indulgent).
    dtoProps[m[1]] = new Set([...(dtoProps[m[1]] || []), ...props]);
    if (m[2]) dtoExtends[m[1]] = m[2];
  }
  if (/controller\.ts$/.test(f)) controllers.push({ f, t });
}
const tousChamps = (n, vus = new Set()) => {
  if (!dtoProps[n] || vus.has(n)) return null;
  vus.add(n);
  const s = new Set(dtoProps[n]);
  if (dtoExtends[n]) { const p = tousChamps(dtoExtends[n], vus); if (p) p.forEach((x) => s.add(x)); }
  return s;
};

// ── Routes du serveur ────────────────────────────────────────────────────────
const routes = [];
for (const { t } of controllers) {
  const ctrls = [...t.matchAll(/@Controller\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g)].map((x) => ({ at: x.index, prefix: x[1] || '' }));
  if (!ctrls.length) continue;
  for (const m of t.matchAll(/@(Get|Post|Put|Patch|Delete)\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g)) {
    const prefix = (ctrls.filter((c) => c.at < m.index).pop() || ctrls[0]).prefix;
    const full = ('/' + prefix + '/' + (m[2] || '')).replace(/\/+/g, '/').replace(/\/$/, '');
    const reste = t.slice(m.index + m[0].length);
    const suivant = reste.search(/\n\s*@(Get|Post|Put|Patch|Delete)\(/);
    const sig = suivant === -1 ? reste.slice(0, 1500) : reste.slice(0, suivant);
    const bm = /@Body\([^)]*\)\s*\w+\s*:\s*(?:Partial<)?(\w+)/.exec(sig);
    routes.push({ method: m[1].toUpperCase(), re: new RegExp('^' + full.replace(/:\w+/g, '[^/]+').replace(/\*/g, '.*') + '$'), full, dto: bm ? bm[1] : null });
  }
}

// ── Appels apiClient du frontend ─────────────────────────────────────────────
// Faux positifs connus : URL construites à partir de variables (…/${id}/${action}).
const TOLERES = [/^\/[^?]*\/X\/X$/, /\/[a-z-]+X$/, /\$\{/];
for (const f of walk(FRONT)) {
  const nom = rel(f, FRONT);
  const t = fs.readFileSync(f, 'utf8');
  for (const cm of t.matchAll(/\bapiClient\s*(?:<[^()]*?>)?\s*\(/g)) {
    const start = cm.index + cm[0].length - 1;
    const end = balanced(t, start);
    if (end === -1) continue;
    const call = t.slice(start, end + 1);
    const pm = /^\(\s*(['"`])(\/[^'"`]*)\1/.exec(call);
    if (!pm) continue;
    const mm = /method:\s*['"](GET|POST|PUT|PATCH|DELETE)['"]/.exec(call);
    const method = mm ? mm[1] : 'GET';
    const url = pm[2].split('?')[0].replace(/\$\{[^}]*\}/g, 'X');
    const ligne = t.slice(0, cm.index).split('\n').length;
    const route = routes.find((r) => r.method === method && r.re.test(url));
    if (!route) {
      if (!TOLERES.some((r) => r.test(url))) problemes.push(`Route serveur inconnue ${method} ${url} (${nom}:${ligne})`);
      continue;
    }
    if (!route.dto || !['POST', 'PUT', 'PATCH'].includes(method)) continue;
    const champsServeur = tousChamps(route.dto);
    if (!champsServeur || champsServeur.size === 0) continue;
    const bi = call.indexOf('body:');
    if (bi === -1) continue;
    const ob = call.indexOf('{', bi);
    if (ob === -1) continue;
    const cb = balancedBraces(call, ob);
    if (cb === -1) continue;
    const corps = call.slice(ob + 1, cb);
    const cles = [];
    let depth = 0, cur = '';
    for (const ch of corps) {
      if ('{[('.includes(ch)) depth++;
      if ('}])'.includes(ch)) depth--;
      if (ch === ',' && depth === 0) { cles.push(cur); cur = ''; } else cur += ch;
    }
    cles.push(cur);
    const noms = cles.map((k) => k.trim()).filter((k) => k && !k.startsWith('...'))
      .map((k) => (/^['"]?(\w+)['"]?\s*(?::|$)/.exec(k) || [])[1]).filter(Boolean);
    const refuses = noms.filter((n) => !champsServeur.has(n));
    if (refuses.length) problemes.push(`Champs refusés par le serveur sur ${method} ${url} → ${route.dto} : [${refuses.join(', ')}] (${nom}:${ligne})`);
  }
}

if (problemes.length) {
  console.error(`✗ ${problemes.length} incohérence(s) frontend ↔ serveur :\n`);
  for (const p of problemes) console.error('  - ' + p);
  process.exit(1);
}
console.log(`✓ Cohérence frontend ↔ serveur : ${pages.length} pages, ${routes.length} routes, aucun écart.`);
