import {
  PlayerConfig, PlanetPhysics, RaceSection, RaceSectionResult,
  RaceResult, CatapultResult, Potion, PerformanceOutput,
} from './types';
import { MUSCLE_EFFECTS, PLANETS } from './constants';

// ============================================================
// PERFORMANCE ENGINE
// Core science-driven simulation that calculates race outcomes
// ============================================================

/** Calculate catapult launch using projectile motion */
export function calculateCatapult(
  angle: number,
  force: number,
  gravity: number,
  mass: number
): CatapultResult {
  const angleRad = (angle * Math.PI) / 180;
  // Force maps to initial velocity (0-100 force → 5-30 m/s)
  const v0 = 5 + (force / 100) * 25;
  // Mass affects: heavier = slightly less distance (F=ma, so a = F/m)
  const massFactor = 70 / mass; // normalized around 70kg

  const vx = v0 * Math.cos(angleRad) * massFactor;
  const vy = v0 * Math.sin(angleRad) * massFactor;

  // Time of flight: t = 2 * vy / g
  const airTime = (2 * vy) / gravity;
  // Range: R = vx * t
  const distance = vx * airTime;
  // Max height: H = vy² / (2g)
  const maxHeight = (vy * vy) / (2 * gravity);

  // Head start converts distance to time advantage (1m ≈ 0.15s advantage)
  const headStart = Math.max(0, distance * 0.15);

  return {
    distance: Math.round(distance * 100) / 100,
    airTime: Math.round(airTime * 100) / 100,
    maxHeight: Math.round(maxHeight * 100) / 100,
    headStart: Math.round(headStart * 100) / 100,
  };
}

/** Get cumulative muscle multipliers for selected muscles */
function getMuscleMultipliers(config: PlayerConfig) {
  const multipliers = { sprint_speed: 1.0, swim_speed: 1.0, jump_height: 1.0, efficiency: 1.0 };
  const muscles = config.muscles;

  for (const [key, selected] of Object.entries(muscles)) {
    if (selected) {
      const effects = MUSCLE_EFFECTS[key as keyof typeof MUSCLE_EFFECTS];
      if (effects) {
        multipliers.sprint_speed *= effects.stats.sprint_speed;
        multipliers.swim_speed *= effects.stats.swim_speed;
        multipliers.jump_height *= effects.stats.jump_height;
        multipliers.efficiency *= effects.stats.efficiency;
      }
    }
  }

  return multipliers;
}

/** Calculate energy system contribution for a section type */
function getEnergyContribution(config: PlayerConfig, section: RaceSection): number {
  const { atpPc, anaerobic, aerobic } = config.energy;

  // Different sections rely on different energy systems
  const weights: Record<RaceSection, { atpPc: number; anaerobic: number; aerobic: number }> = {
    sprint: { atpPc: 0.5, anaerobic: 0.35, aerobic: 0.15 },
    jump: { atpPc: 0.6, anaerobic: 0.3, aerobic: 0.1 },
    swim: { atpPc: 0.15, anaerobic: 0.35, aerobic: 0.5 },
    obstacle: { atpPc: 0.3, anaerobic: 0.4, aerobic: 0.3 },
  };

  const w = weights[section];
  // Score: how well the player's allocation matches the section's needs
  const score = (atpPc * w.atpPc + anaerobic * w.anaerobic + aerobic * w.aerobic) / 100;
  // Returns a multiplier from 0.6 to 1.4
  return 0.6 + score * 0.8;
}

/** Calculate potion effects on performance */
function getPotionEffects(potions: Potion[]) {
  const effects = {
    speed: 0,
    stamina: 0,
    fatigue_reduction: 0,
    endurance: 0,
    explosive_power: 0,
    heat_resistance: 0,
    reaction_time: 0,
    anaerobic_capacity: 0,
    efficiency: 0,
    jump_power: 0,
    altitude_resistance: 0,
  };

  for (const potion of potions) {
    const stat = potion.stat as keyof typeof effects;
    if (stat in effects) {
      effects[stat] += potion.magnitude;
    }
  }

  return effects;
}

/** Calculate performance for a single race section */
export function calculateSectionPerformance(
  config: PlayerConfig,
  planet: PlanetPhysics,
  section: RaceSection,
  currentFatigue: number,
  sectionIndex: number
): PerformanceOutput {
  const muscles = getMuscleMultipliers(config);
  const energy = getEnergyContribution(config, section);
  const potionFx = getPotionEffects(config.potions);
  const events: string[] = [];

  // Base times per section (seconds)
  const baseTimes: Record<RaceSection, number> = {
    sprint: 12,
    swim: 18,
    jump: 8,
    obstacle: 15,
  };

  let baseTime = baseTimes[section];

  // --- MUSCLE EFFECTS ---
  let speedMult = 1.0;
  if (section === 'sprint') {
    speedMult = muscles.sprint_speed;
    if (muscles.sprint_speed > 1.2) events.push('Quadriceps power driving strong knee extension!');
  } else if (section === 'swim') {
    speedMult = muscles.swim_speed;
    if (muscles.swim_speed > 1.2) events.push('Upper body propulsion boosting swim speed!');
  } else if (section === 'jump') {
    speedMult = muscles.jump_height;
    if (muscles.jump_height > 1.2) events.push('Calf muscles generating powerful plantar flexion!');
  } else {
    speedMult = (muscles.sprint_speed + muscles.efficiency) / 2;
  }

  // --- ENERGY SYSTEM ---
  const energyMult = energy;
  if (energyMult > 1.1) {
    events.push(`Energy systems well-matched for ${section} section`);
  } else if (energyMult < 0.8) {
    events.push(`Poor energy allocation for ${section} — wrong system dominant`);
  }

  // --- POTION EFFECTS ---
  let potionMult = 1.0;
  if (potionFx.speed > 0) {
    potionMult += potionFx.speed / 100;
    events.push('Speed potion active!');
  }
  if (section === 'jump' && potionFx.jump_power > 0) {
    potionMult += potionFx.jump_power / 100;
    events.push('Jump power potion active!');
  }
  if (potionFx.explosive_power > 0 && (section === 'sprint' || section === 'jump')) {
    potionMult += potionFx.explosive_power / 150;
    events.push('Phosphocreatine system boosting explosive actions!');
  }

  // --- FATIGUE ---
  let fatiguePenalty = 1 + (currentFatigue * 0.005);
  // Efficiency reduces fatigue impact
  fatiguePenalty /= muscles.efficiency;
  // Potion fatigue reduction
  if (potionFx.fatigue_reduction > 0) {
    fatiguePenalty *= 1 - (potionFx.fatigue_reduction / 200);
    events.push('Electrolytes reducing fatigue buildup');
  }
  if (potionFx.endurance > 0 && sectionIndex >= 2) {
    fatiguePenalty *= 1 - (potionFx.endurance / 200);
    events.push('Hemoglobin elixir sustaining oxygen delivery');
  }

  // --- PLANET EFFECTS ---
  let planetMult = 1.0;

  // Gravity effects
  if (section === 'jump') {
    // Lower gravity = easier jumps (less time)
    planetMult *= planet.gravity / 9.8;
    if (planet.gravity < 9.8) events.push(`Low gravity (${planet.gravity} m/s²) — higher jumps!`);
  } else if (section === 'sprint') {
    // Lower gravity = less traction, slightly slower
    const tractionFactor = 0.7 + (planet.gravity / 9.8) * 0.3;
    planetMult *= 1 / tractionFactor;
    if (planet.gravity < 5) events.push('Reduced traction in low gravity slowing acceleration');
  }

  // Heat effects (Mercury)
  if (planet.heatFactor > 1.5) {
    fatiguePenalty *= planet.heatFactor * 0.6;
    events.push('Extreme heat increasing fatigue rate!');
    if (potionFx.heat_resistance > 0) {
      fatiguePenalty *= 0.7;
      events.push('Hydration tonic mitigating heat effects');
    }
  }

  // Altitude / oxygen effects (Mars)
  if (planet.oxygenFactor < 0.8) {
    const oxygenPenalty = 1 + (1 - planet.oxygenFactor) * 0.4;
    fatiguePenalty *= oxygenPenalty;
    events.push(`Low oxygen (${Math.round(planet.oxygenFactor * 100)}%) accelerating fatigue`);
    // Aerobic allocation matters more
    if (config.energy.aerobic < 30) {
      events.push('WARNING: Low aerobic allocation in oxygen-poor environment!');
    }
    if (potionFx.altitude_resistance > 0) {
      fatiguePenalty *= 0.75;
      events.push('Altitude adaptor improving oxygen utilization');
    }
  }

  // --- MASS EFFECTS ---
  // Heavier = slower but more momentum
  const massFactor = config.mass / 70;
  let massMult = 1.0;
  if (section === 'sprint') {
    massMult = 0.85 + massFactor * 0.15; // heavier = slightly slower
  } else if (section === 'jump') {
    massMult = 0.7 + massFactor * 0.3; // heavier = harder to jump
  } else if (section === 'swim') {
    massMult = 0.9 + massFactor * 0.1;
  } else {
    massMult = 0.9 + massFactor * 0.1;
  }

  // --- FINAL CALCULATION ---
  const combinedMultiplier = speedMult * energyMult * potionMult;
  const sectionTime = (baseTime * fatiguePenalty * planetMult * massMult) / combinedMultiplier;

  // Fatigue accumulation
  let fatigueGain = 15 + sectionIndex * 5;
  fatigueGain *= planet.heatFactor > 1.5 ? 1.5 : 1.0;
  fatigueGain /= muscles.efficiency;
  if (potionFx.stamina > 0) fatigueGain *= 0.8;
  if (potionFx.efficiency > 0) fatigueGain *= 0.85;

  const speed = (100 / sectionTime) * 10; // arbitrary speed units

  return {
    speed: Math.round(speed * 100) / 100,
    jumpHeight: section === 'jump' ? Math.round((3 * muscles.jump_height * (9.8 / planet.gravity)) * 100) / 100 : 0,
    fatigueRate: Math.round(fatigueGain * 100) / 100,
    sectionTime: Math.round(Math.max(3, sectionTime) * 100) / 100,
    events,
  };
}

/** Run a complete race for a player on a planet */
export function simulateRace(config: PlayerConfig, planetKey: string): RaceResult {
  const planet = PLANETS[planetKey];
  if (!planet) throw new Error(`Unknown planet: ${planetKey}`);

  // Calculate catapult
  const catapultResult = calculateCatapult(
    config.catapult.angle,
    config.catapult.force,
    planet.gravity,
    config.mass
  );

  let currentFatigue = 0;
  const sections: RaceSectionResult[] = [];

  for (let i = 0; i < planet.terrain.length; i++) {
    const section = planet.terrain[i];
    const perf = calculateSectionPerformance(config, planet, section, currentFatigue, i);

    sections.push({
      section,
      time: perf.sectionTime,
      speed: perf.speed,
      fatigue: currentFatigue + perf.fatigueRate,
      events: perf.events,
    });

    currentFatigue += perf.fatigueRate;
  }

  const racingTime = sections.reduce((sum, s) => sum + s.time, 0);
  const totalTime = Math.max(0, racingTime - catapultResult.headStart);

  // Generate educational feedback
  const feedback = generateFeedback(config, planet, planetKey, sections, catapultResult);

  return {
    planet: planetKey as any,
    sections,
    totalTime: Math.round(totalTime * 100) / 100,
    catapultResult,
    feedback,
  };
}

/** Generate educational feedback explaining performance */
function generateFeedback(
  config: PlayerConfig,
  planet: PlanetPhysics,
  planetKey: string,
  sections: RaceSectionResult[],
  catapult: CatapultResult
): string[] {
  const feedback: string[] = [];
  const selectedMuscles = Object.entries(config.muscles).filter(([, v]) => v).map(([k]) => k);

  // Catapult feedback
  const optimalAngle = 45;
  const angleDiff = Math.abs(config.catapult.angle - optimalAngle);
  if (angleDiff < 5) {
    feedback.push(`Excellent launch angle (${config.catapult.angle}°)! Near the optimal 45° for maximum range on ${planet.name} (gravity: ${planet.gravity} m/s²).`);
  } else if (angleDiff < 15) {
    feedback.push(`Good launch angle (${config.catapult.angle}°), but ${optimalAngle}° maximizes horizontal range. The range formula R = v²sin(2θ)/g peaks at 45°.`);
  } else {
    feedback.push(`Launch angle of ${config.catapult.angle}° significantly reduced your distance. At 45°, sin(2θ) = 1, giving maximum range. Your angle gave ${Math.round(catapult.distance)}m vs potential ${Math.round(catapult.distance / Math.sin(2 * config.catapult.angle * Math.PI / 180))}m.`);
  }

  // Muscle feedback
  const hasSprint = planet.terrain.includes('sprint');
  const hasSwim = planet.terrain.includes('swim');
  const hasJump = planet.terrain.includes('jump');

  if (hasSprint && !config.muscles.quadriceps) {
    feedback.push('You skipped Quadriceps training — knee extension is critical for sprint speed. The quadriceps are the primary movers in the push-off phase of running.');
  }
  if (hasSwim && !config.muscles.upperBody) {
    feedback.push('No Upper Body training hurt your swim performance. Arm propulsion through latissimus dorsi and deltoid activation drives swim speed.');
  }
  if (hasJump && !config.muscles.calves) {
    feedback.push('Without Calf training, jump height suffered. Plantar flexion (pushing off with calves/gastrocnemius) is the final explosive action in jumping.');
  }
  if (selectedMuscles.length < 3) {
    feedback.push(`Only ${selectedMuscles.length} muscle groups selected. You can train 3 — more specialization means better section performance.`);
  }

  // Energy system feedback
  if (planetKey === 'mercury' && config.energy.aerobic < 30) {
    feedback.push('Low aerobic allocation on Mercury was costly. In extreme heat, your body relies heavily on aerobic metabolism for sustained effort and thermoregulation.');
  }
  if (config.energy.atpPc < 20 && (hasSprint || hasJump)) {
    feedback.push('The ATP-PC (phosphocreatine) system powers explosive actions lasting 0-10 seconds. Low allocation reduced your sprint/jump performance.');
  }

  // Planet-specific feedback
  if (planetKey === 'mars') {
    feedback.push(`Mars gravity (${planet.gravity} m/s²) is 38% of Earth's. This means jumps go ${Math.round(9.8/3.7 * 100)/100}x higher but reduced surface friction affects sprint traction.`);
  }
  if (planetKey === 'mercury') {
    feedback.push('Mercury\'s surface temperature reaches 430°C. Your body must divert blood to the skin for cooling, reducing oxygen delivery to muscles and increasing fatigue rate.');
  }

  // Potion feedback
  if (config.potions.length === 0) {
    feedback.push('No potions used! Chemistry-based enhancements can significantly improve performance through real biochemical pathways.');
  }

  return feedback;
}
