#!/usr/bin/env node
/**
 * Fetches all BSData wh40k-10e catalogues from GitHub and extracts
 * unit stat profiles into a compact lookup table.
 *
 * Output: src/data/unit-stats-db.json
 * Run with: node scripts/build-stats-db.mjs
 */

import { XMLParser } from 'fast-xml-parser';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../src/data/unit-stats-db.json');

const REPO = 'BSData/wh40k-10e';
const BRANCH = 'main';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Only list elements that appear MULTIPLE times inside a parent (not wrapper elements)
  isArray: (tag) =>
    ['selectionEntry', 'selectionEntryGroup', 'entryLink',
     'profile', 'characteristic', 'rule', 'categoryLink', 'cost'].includes(tag),
  textNodeName: '#text',
  ignoreDeclaration: true,
});

function toNum(raw) {
  if (raw == null) return 0;
  const s = String(raw).replace(/[^0-9]/g, '');
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

function extractStats(characteristics) {
  const chars = characteristics?.characteristic ?? [];
  const get = (name) => {
    const match = chars.find(c => c['@_name']?.toLowerCase() === name.toLowerCase());
    return match?.['#text'] ?? match ?? '';
  };
  return {
    M: toNum(get('M')),
    T: toNum(get('T')),
    Sv: toNum(get('Sv')),
    W: toNum(get('W')),
    Ld: toNum(get('Ld')),
    OC: toNum(get('OC')),
    BS: toNum(get('BS') || get('Ballistic Skill')),
    WS: toNum(get('WS') || get('Weapon Skill')),
  };
}

function isUnitProfile(profile) {
  const typeName = (profile?.['@_typeName'] ?? '').toLowerCase();
  return typeName === 'unit' || typeName.includes('model stat') || typeName === 'model';
}

function processProfiles(profiles, unitName, db) {
  const list = profiles?.profile ?? [];
  for (const p of list) {
    if (isUnitProfile(p)) {
      const stats = extractStats(p.characteristics);
      if (stats.T > 0 || stats.W > 0) {
        const key = normalise(unitName);
        if (!db[key]) db[key] = stats;
      }
    }
  }
}

function walkEntries(entries, db, parentUnitName = null) {
  if (!entries) return;
  const list = Array.isArray(entries) ? entries : [entries];
  for (const entry of list) {
    if (!entry) continue;
    const name = entry['@_name'];
    const type = (entry['@_type'] ?? '').toLowerCase();

    if (name) {
      // Index stats under this entry's own name
      processProfiles(entry.profiles, name, db);

      // If this entry has unit stats AND a parent unit, also index under parent name
      if (parentUnitName && parentUnitName !== name) {
        const profiles = entry.profiles?.profile ?? [];
        for (const p of profiles) {
          if (isUnitProfile(p)) {
            const stats = extractStats(p.characteristics);
            if (stats.T > 0 || stats.W > 0) {
              const pk = normalise(parentUnitName);
              if (!db[pk]) db[pk] = stats;
            }
          }
        }
      }
    }

    // Propagate parent: if this entry is a unit type, it becomes the parent for its children
    const nextParent = type === 'unit' ? (name ?? parentUnitName) : parentUnitName;

    walkEntries(entry.selectionEntries?.selectionEntry, db, nextParent);
    walkEntries(entry.selectionEntryGroups?.selectionEntryGroup, db, nextParent);
  }
}

function normalise(name) {
  return name
    .toLowerCase()
    .replace(/\s*\[.*?\]\s*/g, '')   // remove [...]
    .replace(/\s*\(.*?\)\s*/g, '')   // remove (...)
    .replace(/[^a-z0-9 '-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchCat(filename) {
  const url = RAW_BASE + encodeURIComponent(filename);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${filename}`);
  return resp.text();
}

async function processFile(filename, db) {
  process.stdout.write(`  Parsing ${filename}... `);
  const xml = await fetchCat(filename);
  const parsed = parser.parse(xml);

  const root = parsed?.catalogue ?? parsed?.gameSystem;
  if (!root) { console.log('skip (no root)'); return; }

  const before = Object.keys(db).length;

  // Top-level entries
  walkEntries(root.selectionEntries?.selectionEntry, db);

  // Shared entries
  walkEntries(root.sharedSelectionEntries?.selectionEntry, db);

  const added = Object.keys(db).length - before;
  console.log(`+${added} units`);
}

// Hardcoded from: curl https://api.github.com/repos/BSData/wh40k-10e/contents/
const CATALOGUE_FILES = [
  'Aeldari - Aeldari Library.cat',
  'Aeldari - Craftworlds.cat',
  'Aeldari - Drukhari.cat',
  'Aeldari - Ynnari.cat',
  'Chaos - Chaos Daemons Library.cat',
  'Chaos - Chaos Daemons.cat',
  'Chaos - Chaos Knights Library.cat',
  'Chaos - Chaos Knights.cat',
  'Chaos - Chaos Space Marines.cat',
  'Chaos - Death Guard.cat',
  'Chaos - Emperor\'s Children.cat',
  'Chaos - Thousand Sons.cat',
  'Chaos - World Eaters.cat',
  'Genestealer Cults.cat',
  'Imperium - Adepta Sororitas.cat',
  'Imperium - Adeptus Custodes.cat',
  'Imperium - Adeptus Mechanicus.cat',
  'Imperium - Agents of the Imperium.cat',
  'Imperium - Astra Militarum - Library.cat',
  'Imperium - Astra Militarum.cat',
  'Imperium - Black Templars.cat',
  'Imperium - Blood Angels.cat',
  'Imperium - Dark Angels.cat',
  'Imperium - Deathwatch.cat',
  'Imperium - Grey Knights.cat',
  'Imperium - Imperial Fists.cat',
  'Imperium - Imperial Knights - Library.cat',
  'Imperium - Imperial Knights.cat',
  'Imperium - Iron Hands.cat',
  'Imperium - Raven Guard.cat',
  'Imperium - Salamanders.cat',
  'Imperium - Space Marines.cat',
  'Imperium - Space Wolves.cat',
  'Imperium - Ultramarines.cat',
  'Imperium - White Scars.cat',
  'Leagues of Votann.cat',
  'Library - Titans.cat',
  'Library - Tyranids.cat',
  'Necrons.cat',
  'Orks.cat',
  'T\'au Empire.cat',
  'Tyranids.cat',
  'Unaligned Forces.cat',
  'Warhammer 40,000.gst',
];

async function main() {
  const catFiles = CATALOGUE_FILES;

  console.log(`Found ${catFiles.length} files. Processing...\n`);

  const db = {};

  for (const filename of catFiles) {
    try {
      await processFile(filename, db);
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
    }
  }

  console.log(`\nTotal units in database: ${Object.keys(db).length}`);

  const json = JSON.stringify(db, null, 0);
  writeFileSync(OUT_PATH, json, 'utf8');
  console.log(`Written to ${OUT_PATH} (${(json.length / 1024).toFixed(1)}KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
