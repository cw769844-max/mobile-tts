import { CombatInput, CombatResult, CombatStepResult } from '../types/game';
import { rollD6, rollNd6, applyRerolls } from './dice';

export function woundThreshold(strength: number, toughness: number): number {
  if (strength >= toughness * 2) return 2;
  if (strength > toughness) return 3;
  if (strength === toughness) return 4;
  if (strength * 2 <= toughness) return 6;
  return 5;
}

export function effectiveSave(sv: number, ap: number, invul: number | null): number {
  const modified = sv + Math.abs(ap);
  if (invul !== null) return Math.min(modified, invul);
  return modified;
}

export function resolveCombat(input: CombatInput): CombatResult {
  // Step 1: Hit rolls
  let hitRolls = rollNd6(input.attacks);
  hitRolls = applyRerolls(hitRolls, input.rerollHits, rollD6);

  const critHits = hitRolls.filter((r) => r === 6);
  const normalHits = hitRolls.filter((r) => r >= input.skill && r < 6);

  const lethalAutoWounds = input.lethalHits ? critHits.length : 0;
  const sustainedBonus = input.sustainedHits > 0 ? critHits.length * input.sustainedHits : 0;
  const totalHits = normalHits.length + critHits.length + sustainedBonus;

  const hitStep: CombatStepResult = {
    rolls: hitRolls,
    successes: totalHits,
    label: `${totalHits} hit${totalHits !== 1 ? 's' : ''}`,
  };

  // Step 2: Wound rolls (lethal hits skip this)
  const woundTarget = woundThreshold(input.strength, input.targetT);
  const hitsToWound = totalHits - lethalAutoWounds;
  let woundRolls = rollNd6(Math.max(0, hitsToWound));
  woundRolls = applyRerolls(woundRolls, input.rerollWounds, rollD6);

  const critWounds = woundRolls.filter((r) => r === 6);
  const normalWounds = woundRolls.filter((r) => r >= woundTarget && r < 6);

  const devastatingMortals = input.devastatingWounds ? critWounds.length : 0;
  const successWounds = normalWounds.length + critWounds.length + lethalAutoWounds;

  const woundStep: CombatStepResult = {
    rolls: woundRolls,
    successes: successWounds,
    label: `${successWounds} wound${successWounds !== 1 ? 's' : ''}`,
  };

  // Step 3: Save rolls (devastating wounds skip saves)
  const svTarget = effectiveSave(input.targetSv, input.ap, input.targetInvul);
  const woundsToSave = successWounds - devastatingMortals;
  const saveRolls = rollNd6(Math.max(0, woundsToSave));
  // Unmodified 1 always fails save
  const failedSaves = saveRolls.filter((r) => r === 1 || r < svTarget).length;
  const totalFailed = failedSaves + devastatingMortals;

  const saveStep: CombatStepResult = {
    rolls: saveRolls,
    successes: totalFailed,
    label: `${totalFailed} unsaved wound${totalFailed !== 1 ? 's' : ''}`,
  };

  const totalDamage = totalFailed * input.damage;

  return { hitStep, woundStep, saveStep, totalDamage, mortals: devastatingMortals };
}
