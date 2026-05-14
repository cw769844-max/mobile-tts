import { UnitStats, DEFAULT_STATS } from '../types/game';
import DB from './unit-stats-db.json';

type DbEntry = { M: number; T: number; Sv: number; W: number; Ld: number; OC: number; BS: number; WS: number };
const STATS_DB = DB as Record<string, DbEntry>;

function toStats(e: DbEntry): UnitStats {
  return { ...e, invulSv: null };
}

const STRIP_SUFFIXES = [
  'squad', 'pack', 'mob', 'unit', 'team', 'brood', 'coven',
  'band', 'host', 'horde', 'detachment', 'warband', 'patrol',
  'strike team', 'kill team', 'combat patrol',
];

function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\[.*?\]\s*/g, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/[^a-z0-9 '-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripSuffix(name: string): string {
  for (const suffix of STRIP_SUFFIXES) {
    if (name.endsWith(' ' + suffix)) {
      return name.slice(0, name.length - suffix.length - 1).trim();
    }
  }
  return name;
}

function singularize(name: string): string {
  if (name.endsWith('boyz')) return name.slice(0, -4) + 'boy';
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
  if (name.endsWith('ves')) return name.slice(0, -3) + 'f';
  if (name.endsWith('men')) return name.slice(0, -3) + 'man';
  if (name.endsWith('es') && name.length > 4) return name.slice(0, -2);
  if (name.endsWith('s') && name.length > 3) return name.slice(0, -1);
  return name;
}

export function lookupStats(rawName: string): UnitStats | null {
  const key = normalise(rawName);
  if (!key) return null;

  // 1. Exact match
  if (STATS_DB[key]) return toStats(STATS_DB[key]);

  // 2. Strip suffix then exact
  const stripped = stripSuffix(key);
  if (stripped !== key && STATS_DB[stripped]) return toStats(STATS_DB[stripped]);

  // 3. Singularize then exact
  const singular = singularize(key);
  if (singular !== key && STATS_DB[singular]) return toStats(STATS_DB[singular]);

  // 4. Singularize stripped
  const singularStripped = singularize(stripped);
  if (singularStripped !== stripped && STATS_DB[singularStripped]) return toStats(STATS_DB[singularStripped]);

  // 5. Prefix match (DB key starts with lookup key or vice versa)
  for (const dbKey of Object.keys(STATS_DB)) {
    if (dbKey.startsWith(key) || key.startsWith(dbKey)) {
      return toStats(STATS_DB[dbKey]);
    }
  }

  // 6. Word-set overlap: all words in lookup present in DB key
  const words = key.split(' ').filter(w => w.length > 2);
  if (words.length >= 2) {
    for (const dbKey of Object.keys(STATS_DB)) {
      if (words.every(w => dbKey.includes(w))) {
        return toStats(STATS_DB[dbKey]);
      }
    }
  }

  // 7. Strip first word (faction qualifier like "ork", "space marine", etc.) and retry
  const spaceIdx = key.indexOf(' ');
  if (spaceIdx > 0) {
    const withoutFirst = key.slice(spaceIdx + 1);
    const result = lookupStats(withoutFirst);
    if (result) return result;
  }

  return null;
}

export function lookupStatsOrDefault(rawName: string): UnitStats {
  return lookupStats(rawName) ?? { ...DEFAULT_STATS };
}
