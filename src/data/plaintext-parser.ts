import { ArmyList, Datasheet } from '../types/army';
import { DEFAULT_STATS } from '../types/game';
import { lookupStatsOrDefault } from './lookup-stats';

// Handles the most common plain text formats:
//  - Official GW app export
//  - ITC / BCP tournament format
//  - New Recruit text export
//  - Warhammer Community / Reddit / Discord freeform lists

const SECTION_HEADERS = /^[+]{1,3}\s*(.*?)\s*[+]{1,3}$/;
const UNIT_LINE = /^[-·•*]?\s*(.+?)\s*[\[(](\d+)\s*(?:pts?|points?)[\])]/i;
const UNIT_LINE_TRAILING = /^(.+?)\s*[-–—]\s*(\d+)\s*(?:pts?|points?)$/i;
const FACTION_LINE = /^(?:army\s+faction|faction|army)\s*[:\-]\s*(.+)$/i;
const DETACHMENT_LINE = /^detachment\s*[:\-]\s*(.+)$/i;
const TOTAL_PTS = /^total\s*[:\-]\s*(\d+)\s*pts?$/i;
const PTS_IN_HEADER = /[\[(](\d+)\s*(?:pts?|points?)[\])]/i;

function extractPoints(text: string): number {
  const m = text.match(/[\[(](\d+)\s*(?:pts?|points?)[\])]/i)
    ?? text.match(/[-–—]\s*(\d+)\s*(?:pts?|points?)/i)
    ?? text.match(/(\d+)\s*(?:pts?|points?)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function cleanUnitName(raw: string): string {
  // Remove trailing bracketed info, leading bullets, section prefixes
  return raw
    .replace(/[\[(][^\])]*/g, '')   // remove [...] and (...)
    .replace(/^[-·•*\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeUnit(name: string, pts: number, index: number): Datasheet {
  return {
    id: `txt-${index}-${name.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}`,
    name,
    stats: lookupStatsOrDefault(name),
    weapons: [],
    abilities: [],
    keywords: [],
    pointsCost: pts,
    modelCount: 1,
  };
}

// Detect if a line looks like a unit rather than a section header or wargear line
function isUnitLike(line: string): boolean {
  if (!line.trim()) return false;
  if (line.startsWith('  ') || line.startsWith('\t')) return false; // indented = wargear
  if (SECTION_HEADERS.test(line)) return false;
  const pts = extractPoints(line);
  return pts > 0;
}

export function parsePlainText(text: string): ArmyList {
  const lines = text.split(/\r?\n/);

  let faction = 'Unknown Faction';
  let detachment = '';
  let totalPoints = 0;
  const units: Datasheet[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Faction line
    const factionMatch = line.match(FACTION_LINE);
    if (factionMatch) { faction = factionMatch[1].trim(); continue; }

    // Detachment line
    const detachMatch = line.match(DETACHMENT_LINE);
    if (detachMatch) { detachment = detachMatch[1].trim(); continue; }

    // Total points
    const totalMatch = line.match(TOTAL_PTS);
    if (totalMatch) { totalPoints = parseInt(totalMatch[1], 10); continue; }

    // Section header like ++ HQ ++ or + TROOPS + — try to extract faction from header too
    const sectionMatch = line.match(SECTION_HEADERS);
    if (sectionMatch) {
      const inner = sectionMatch[1];
      // Headers often contain army info: "Patrol Detachment [500pts] (Space Marines)"
      const factionInParen = inner.match(/\(([^)]+)\)$/);
      if (factionInParen && faction === 'Unknown Faction') {
        faction = factionInParen[1].trim();
      }
      // Extract detachment type from header
      if (!detachment && /detachment/i.test(inner)) {
        detachment = cleanUnitName(inner.replace(PTS_IN_HEADER, '').replace(/\([^)]*\)/g, ''));
      }
      if (totalPoints === 0) {
        const ptsMatch = inner.match(PTS_IN_HEADER);
        if (ptsMatch) totalPoints = parseInt(ptsMatch[1], 10);
      }
      continue;
    }

    if (isUnitLike(line)) {
      const pts = extractPoints(line);
      const name = cleanUnitName(line.replace(/[\[(]\d+\s*pts?[\])]/gi, '').replace(/[-–—]\s*\d+\s*pts?$/i, ''));
      if (name) {
        units.push(makeUnit(name, pts, units.length));
      }
    }
  }

  // If we never found a total, sum from units
  if (totalPoints === 0) {
    totalPoints = units.reduce((s, u) => s + u.pointsCost, 0);
  }

  if (units.length === 0) {
    throw new Error('No units found in this list. Check the format and try again.');
  }

  return { faction, detachment, totalPoints, units, importedAt: Date.now() };
}
