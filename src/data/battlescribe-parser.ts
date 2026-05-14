import { XMLParser } from 'fast-xml-parser';
import { decompressSync } from 'fflate';
import { ArmyList, Datasheet, WeaponProfile } from '../types/army';
import { UnitStats, DEFAULT_STATS } from '../types/game';
import { lookupStats } from './lookup-stats';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (tagName) =>
    ['selection', 'selections', 'profile', 'profiles', 'characteristic', 'characteristics', 'rule', 'rules', 'category', 'categories'].includes(tagName),
  textNodeName: '#text',
});

function toNum(val: string | undefined): number {
  if (!val) return 0;
  const n = parseInt(val.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function extractCharacteristic(chars: any[], name: string): string {
  const match = chars?.find?.((c: any) => c['@_name']?.toLowerCase() === name.toLowerCase());
  return match?.['#text'] ?? match ?? '';
}

function parseStatline(profile: any): UnitStats {
  const chars: any[] = profile?.characteristics?.characteristic ?? [];
  const get = (n: string) => toNum(String(extractCharacteristic(chars, n)));
  return {
    M: get('M'),
    T: get('T'),
    Sv: get('Sv'),
    W: get('W'),
    Ld: get('Ld'),
    OC: get('OC'),
    BS: get('BS') || get('Ballistic Skill'),
    WS: get('WS') || get('Weapon Skill'),
    invulSv: null,
  };
}

function parseWeapon(profile: any): WeaponProfile | null {
  const typeName: string = profile?.['@_typeName'] ?? '';
  if (!typeName.toLowerCase().includes('weapon') && !typeName.toLowerCase().includes('ranged') && !typeName.toLowerCase().includes('melee')) {
    return null;
  }
  const chars: any[] = profile?.characteristics?.characteristic ?? [];
  const get = (n: string) => String(extractCharacteristic(chars, n));
  return {
    name: profile?.['@_name'] ?? 'Unknown',
    range: get('Range'),
    attacks: get('A') || get('Attacks'),
    bs: get('BS') || get('Ballistic Skill') || get('WS') || get('Weapon Skill'),
    strength: toNum(get('S') || get('Strength')),
    ap: toNum(get('AP')),
    damage: get('D') || get('Damage'),
    abilities: [],
    keywords: [],
  };
}

function collectProfilesRecursive(selection: any): any[] {
  const profiles: any[] = selection?.profiles?.profile ?? [];
  const subSelections: any[] = selection?.selections?.selection ?? [];
  const childProfiles = subSelections.flatMap(collectProfilesRecursive);
  return [...profiles, ...childProfiles];
}

function collectRulesRecursive(selection: any): string[] {
  const rules: any[] = selection?.rules?.rule ?? [];
  const subSelections: any[] = selection?.selections?.selection ?? [];
  const names = rules.map((r: any) => r?.['@_name'] ?? '');
  const childNames = subSelections.flatMap(collectRulesRecursive);
  return [...names, ...childNames].filter(Boolean);
}

function parseSelection(selection: any): Datasheet | null {
  const name: string = selection?.['@_name'] ?? 'Unknown';
  const type: string = selection?.['@_type'] ?? '';

  // Only process unit-level selections (not model/upgrade sub-selections at top level)
  if (type !== 'unit' && type !== 'model') return null;

  const allProfiles = collectProfilesRecursive(selection);

  // Find the unit stat profile
  const statProfile = allProfiles.find((p: any) => {
    const typeName: string = p?.['@_typeName'] ?? '';
    return typeName.toLowerCase().includes('unit') || typeName.toLowerCase().includes('model stat');
  });

  const parsedStats = statProfile ? parseStatline(statProfile) : null;
  const hasRealStats = parsedStats && (parsedStats.T > 0 || parsedStats.W > 0);
  const stats: UnitStats = hasRealStats ? parsedStats! : (lookupStats(name) ?? { ...DEFAULT_STATS });

  // Collect weapon profiles
  const weapons: WeaponProfile[] = allProfiles
    .map(parseWeapon)
    .filter((w): w is WeaponProfile => w !== null);

  // Collect ability names from rules
  const abilities = collectRulesRecursive(selection);

  // Points cost
  const costs: any[] = selection?.costs?.cost ?? [];
  const ptsCost = costs.find((c: any) => c?.['@_name']?.toLowerCase().includes('pt'));
  const pointsCost = toNum(ptsCost?.['@_value'] ?? '0');

  // Model count
  const modelCount = toNum(selection?.['@_number'] ?? '1');

  return {
    id: selection?.['@_id'] ?? name,
    name,
    stats,
    weapons,
    abilities,
    keywords: [],
    pointsCost,
    modelCount: Math.max(1, modelCount),
  };
}

export async function parseRosFile(base64OrUri: string, isUri = false): Promise<ArmyList> {
  let xmlText: string;

  if (isUri) {
    // Fetch the file as a blob
    const resp = await fetch(base64OrUri);
    const arrayBuffer = await resp.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Try decompression (.rosz = gzip)
    try {
      const decompressed = decompressSync(uint8);
      xmlText = new TextDecoder().decode(decompressed);
    } catch {
      // Not compressed — plain .ros XML
      xmlText = new TextDecoder().decode(uint8);
    }
  } else {
    xmlText = base64OrUri;
  }

  const parsed = parser.parse(xmlText);
  const roster = parsed?.roster ?? parsed?.Roster;

  if (!roster) throw new Error('Invalid Battlescribe file — roster element not found.');

  const forces: any[] = roster?.forces?.force ?? [];
  const faction: string = forces[0]?.['@_catalogueName'] ?? 'Unknown Faction';
  const detachment: string = forces[0]?.['@_name'] ?? '';

  const allSelections: any[] = forces.flatMap(
    (f: any) => f?.selections?.selection ?? [],
  );

  const units: Datasheet[] = allSelections
    .map(parseSelection)
    .filter((d): d is Datasheet => d !== null);

  const costs: any[] = roster?.costs?.cost ?? [];
  const ptsCost = costs.find((c: any) => c?.['@_name']?.toLowerCase().includes('pt'));
  const totalPoints = toNum(ptsCost?.['@_value'] ?? '0');

  return { faction, detachment, totalPoints, units, importedAt: Date.now() };
}
