import { CareerTrackerStats, ScenarioPreset } from './types';

export type ConsoleHudThemeId =
  | 'ept-obsidian'
  | 'gt4-license'
  | 'mgs2-codec'
  | 'cod4-pit'
  | 'gta-sa-hud';

export interface ConsoleTutorialAestheticEntry {
  id: string;
  gameTitle: string;
  releaseYear: number;
  platforms: string[];
  eraCategory: '6th Gen (PS2 / Xbox / GC)' | '7th Gen (Xbox 360 / PS3)';
  signatureTutorialName: string;
  vibeTagline: string;
  colorPalette: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
    text: string;
  };
  typographyStyle: string;
  uiMotifs: string[];
  onboardingPsychology: string;
  controllerPrompts: {
    confirm: string;
    cancel: string;
    special: string;
    info: string;
  };
  eptAcademyAdaptation: string;
  linkedThemeId: ConsoleHudThemeId;
}

export const CONSOLE_TUTORIAL_AESTHETICS_DB: ConsoleTutorialAestheticEntry[] = [
  {
    id: 'gt4-license-center',
    gameTitle: 'Gran Turismo 3 & 4',
    releaseYear: 2004,
    platforms: ['PlayStation 2'],
    eraCategory: '6th Gen (PS2 / Xbox / GC)',
    signatureTutorialName: 'The License Center (B, A, IB, IA, S Licenses)',
    vibeTagline: 'Sterile, clinical telemetry & prestigious Bronze / Silver / Gold trophy trials.',
    colorPalette: {
      primary: '#38BDF8',
      secondary: '#FACC15',
      background: '#0F172A',
      accent: '#E2E8F0',
      text: '#F8FAFC',
    },
    typographyStyle: 'Crisp Eurostile / condensed technical sans-serif with digital millisecond readouts',
    uiMotifs: [
      'Tiered License Cards (National B → National A → International B → International A → Super License)',
      'Glossy Metallic Gold, Silver, and Bronze Trophy Stamps',
      'Pre-trial Instructor Demo Briefings with exact sector telemetry',
      'Brushed aluminum borders and royal navy-slate gradients',
    ],
    onboardingPsychology:
      'Turns fundamental mechanics into a high-status rite of passage. Players replay a 20-second corner dozens of times just to upgrade a Silver medal into an elusive Gold trophy.',
    controllerPrompts: {
      confirm: '[✕] Accelerate / Bet',
      cancel: '[□] Brake / Fold',
      special: '[△] Telemetry View',
      info: '[START] Instructor Brief',
    },
    eptAcademyAdaptation:
      'Powers the E.P.T. License Center Trials where players earn Bronze, Silver, and Gold License Trophies across B-License to S-License poker drills.',
    linkedThemeId: 'gt4-license',
  },
  {
    id: 'mgs2-vr-codec',
    gameTitle: 'Metal Gear Solid 2: Substance',
    releaseYear: 2002,
    platforms: ['PlayStation 2', 'Xbox'],
    eraCategory: '6th Gen (PS2 / Xbox / GC)',
    signatureTutorialName: 'VR Missions & Codec Transceiver (140.85)',
    vibeTagline: 'Phosphor-green CRT scanlines, wireframe grids, and military Codec briefings.',
    colorPalette: {
      primary: '#00FF66',
      secondary: '#00E5FF',
      background: '#03160D',
      accent: '#10B981',
      text: '#D1FAE5',
    },
    typographyStyle: 'Monospace military terminal & digital LCD frequency readouts (140.85 MHz)',
    uiMotifs: [
      'Dual-portrait Codec radio transceiver with green CRT scanlines and signal bars',
      'Neon cyan/emerald wireframe simulation grids stripped of distractions',
      'Tactical "CAUTION / EVASION / ALERT" status phase indicators',
      'Strict numeric rank scoring (Rank S / Rank A) after every simulation',
    ],
    onboardingPsychology:
      'Separates training into an explicit "VR Simulation" construct while providing on-demand mentor advice via the Codec radio frequency whenever the player gets stuck.',
    controllerPrompts: {
      confirm: '[○] Confirm Action',
      cancel: '[✕] Chaff / Fold',
      special: '[L2] Equip HUD',
      info: '[SELECT] Call Codec 140.85',
    },
    eptAcademyAdaptation:
      'Powers the Live Coach Codec Transceiver (140.85 MHz) on the Academy page and the Cyber-Grid VR simulation skin.',
    linkedThemeId: 'mgs2-codec',
  },
  {
    id: 'cod4-the-pit',
    gameTitle: 'Call of Duty 4: Modern Warfare',
    releaseYear: 2007,
    platforms: ['Xbox 360', 'PlayStation 3'],
    eraCategory: '7th Gen (Xbox 360 / PS3)',
    signatureTutorialName: '"F.N.G." — The SAS Cargo Ship Killhouse (The Pit)',
    vibeTagline: 'Gritty military stencil HUD, live objective checklists, and automated difficulty grading.',
    colorPalette: {
      primary: '#F59E0B',
      secondary: '#84CC16',
      background: '#141812',
      accent: '#D97706',
      text: '#FEF3C7',
    },
    typographyStyle: 'Military stencil headers with night-vision green & amber tactical HUD overlays',
    uiMotifs: [
      'Top-left live Objective Checklist with green [✓] completion ticks',
      'Accuracy & EV-Bonus time/score deductions for civilian/blunder mistakes',
      'End-of-course "Recommended Difficulty" evaluation banner from Captain Price / Gaz',
      'Tactical compass tape and high-contrast yellow-amber callout text',
    ],
    onboardingPsychology:
      'Evaluates the player’s actual speed and precision during the tutorial and automatically recommends which difficulty tier (Recruit, Regular, Hardened, Veteran) matches their skill.',
    controllerPrompts: {
      confirm: '[RT] Fire / Raise',
      cancel: '[B] Crouch / Fold',
      special: '[A] Sprint / Call',
      info: '[BACK] Tactical Objectives',
    },
    eptAcademyAdaptation:
      'Powers the Tactical Objective Checklist and the automated "Recommended Bot Difficulty Assessment" based on your Coach Grade %.',
    linkedThemeId: 'cod4-pit',
  },
  {
    id: 'gta-san-andreas-school',
    gameTitle: 'Grand Theft Auto: San Andreas & IV',
    releaseYear: 2004,
    platforms: ['PlayStation 2', 'Xbox', 'Xbox 360'],
    eraCategory: '6th Gen (PS2 / Xbox / GC)',
    signatureTutorialName: 'Top-Left CRT HUD Help Box & Driving/Flying School',
    vibeTagline: 'Iconic top-left black help overlay, stat upgrade bars, and gold completion stamps.',
    colorPalette: {
      primary: '#F97316',
      secondary: '#22C55E',
      background: '#09090B',
      accent: '#EAB308',
      text: '#FFFFFF',
    },
    typographyStyle: 'Heavy Gothic / Pricedown display headers paired with crisp CRT-safe sans-serif help boxes',
    uiMotifs: [
      'Opaque top-left black HUD box with crisp white/yellow controller instructions',
      'Dynamic RPG-style stat progress bars ("GAMBLING SKILL +", "RESPECT +")',
      'Driving/Boat/Flying School percentage scorecards (70% Bronze, 85% Silver, 100% Gold)',
      '"MISSION PASSED! +£500 / RESPECT +" celebratory screen stamp',
    ],
    onboardingPsychology:
      'Never interrupts gameplay with a blocking menu—instead, drops a high-contrast black instruction box in the top-left corner and rewards incremental practice with visible stat bar upgrades.',
    controllerPrompts: {
      confirm: '[✕ / A] Stake Chips',
      cancel: '[△ / Y] Leave Table / Fold',
      special: '[R1 / RB] Double Down',
      info: '[L1 / LB] Check Stats',
    },
    eptAcademyAdaptation:
      'Powers the non-intrusive Top-Left Tactical Help Box and the "POKER SKILL +" / "RESPECT +" progression bars.',
    linkedThemeId: 'gta-sa-hud',
  },
  {
    id: 'xbox360-nxe-achievements',
    gameTitle: 'Xbox 360 NXE / WSOP: Tournament of Champions',
    releaseYear: 2007,
    platforms: ['Xbox 360'],
    eraCategory: '7th Gen (Xbox 360 / PS3)',
    signatureTutorialName: 'Achievement Unlocked Toast & Tactile Glossy Prompts',
    vibeTagline: 'Skeuomorphic glass gel pills, colored ABXY orbs, and dopamine-inducing toast popups.',
    colorPalette: {
      primary: '#84CC16',
      secondary: '#D4AF37',
      background: '#18181B',
      accent: '#10B981',
      text: '#F4F4F5',
    },
    typographyStyle: 'Sleek humanist sans-serif (Segoe / Convection) on glossy metallic & glass surfaces',
    uiMotifs: [
      'Sliding pill toast notification: "🏆 ACHIEVEMENT UNLOCKED — 25G"',
      'Vibrant 3D-shaded controller button orbs: Green [A], Red [B], Blue [X], Amber [Y]',
      'ESPN-style broadcast poker telemetry bars showing Win Probability %',
      'Coach pro-tip cards with real pro player portraits',
    ],
    onboardingPsychology:
      'Uses tactile color-coding (Green = Go/Call, Red = Stop/Fold, Amber = Raise) so controller muscle memory becomes effortless within minutes.',
    controllerPrompts: {
      confirm: '(A) Call / Check',
      cancel: '(B) Fold Hand',
      special: '(Y) Raise Pot',
      info: '(X) Coach Advice',
    },
    eptAcademyAdaptation:
      'Powers the color-coded [A]/[B]/[X]/[Y] action prompts on the poker table and the Achievement Toast popups when unlocking License Medals.',
    linkedThemeId: 'ept-obsidian',
  },
  {
    id: 'thps3-goal-checklist',
    gameTitle: "Tony Hawk's Pro Skater 3 & Underground",
    releaseYear: 2001,
    platforms: ['PlayStation 2', 'GameCube', 'Xbox'],
    eraCategory: '6th Gen (PS2 / Xbox / GC)',
    signatureTutorialName: 'Career Goal Checklist & Balance Meter HUD',
    vibeTagline: 'High-energy arcade goal checklists, balance gauges, and combo multipliers.',
    colorPalette: {
      primary: '#EF4444',
      secondary: '#FBBF24',
      background: '#1C1917',
      accent: '#F97316',
      text: '#FAFAF9',
    },
    typographyStyle: 'Bold distressed arcade headers with high-visibility yellow/orange score multipliers',
    uiMotifs: [
      'Pause/Pre-run checklist of 5–10 concrete session goals with camera fly-bys',
      'Dynamic balance meter showing if you are leaning too far left (Tight) or right (Loose)',
      'Instant gold/orange text popups ("OPTIMAL LINE! +500") in the center of the screen',
      'Tape-deck progression unlocks',
    ],
    onboardingPsychology:
      'Breaks mastery into bite-sized, addictive checklists so the player always has a clear micro-goal on every run.',
    controllerPrompts: {
      confirm: '[✕] Ollie / Call',
      cancel: '[□] Flip / Fold',
      special: '[△] Grind / Raise',
      info: '[START] View Goals',
    },
    eptAcademyAdaptation:
      'Inspires our 2D Tight/Loose Balance Meter and the interactive Academy Session Goal Checklist.',
    linkedThemeId: 'ept-obsidian',
  },
];

// ==========================================
// E.P.T. LICENSE CENTER TRIALS (Gran Turismo 4 + CoD4 Pit Style)
// ==========================================

export interface AcademyLicenseTest {
  id: string;
  licenseCode: 'B-1' | 'B-2' | 'A-1' | 'IB-1' | 'IA-1' | 'S-1';
  licenseClass: 'National B' | 'National A' | 'International B' | 'International A' | 'Super License';
  title: string;
  objective: string;
  instructorBrief: string;
  presetToLaunch: ScenarioPreset;
  medalStatus: (stats: CareerTrackerStats) => 'Gold' | 'Silver' | 'Bronze' | 'Locked';
  progressText: (stats: CareerTrackerStats) => string;
}

export const ACADEMY_LICENSE_TESTS: AcademyLicenseTest[] = [
  {
    id: 'lic-b1',
    licenseCode: 'B-1',
    licenseClass: 'National B',
    title: 'Zero Open-Limp Discipline',
    objective: 'Play at least 3 hands while keeping your open-limp count low and raising playable hands.',
    instructorBrief:
      'Welcome to National B-License training. Rule #1 of the E.P.T. felt: never open-limp when first into the pot. Enter with a 2.5x–3x BB raise or fold!',
    presetToLaunch: 'btn-vs-bb-3bet',
    medalStatus: (s) => {
      if (s.handsPlayed === 0) return 'Locked';
      const limpRate = s.vpipOpportunities > 0 ? s.limpCount / s.vpipOpportunities : 0;
      if (s.handsPlayed >= 5 && limpRate <= 0.08) return 'Gold';
      if (s.handsPlayed >= 3 && limpRate <= 0.2) return 'Silver';
      return 'Bronze';
    },
    progressText: (s) => `${s.handsPlayed}/5 Hands • ${s.limpCount} Limps`,
  },
  {
    id: 'lic-b2',
    licenseCode: 'B-2',
    licenseClass: 'National B',
    title: 'Wet Flop Pot-Odds Defense',
    objective: 'Complete hands in the Wet Board or Standard arena and earn A+ / B Coach Grades.',
    instructorBrief:
      'On coordinated flops, count your clean Outs and multiply by 4. Only call when your Win Equity % is greater than or equal to Required Pot Odds %!',
    presetToLaunch: 'wet-board-defense',
    medalStatus: (s) => {
      const aPlus = s.gradeCounts['A+'] || 0;
      if (aPlus >= 8) return 'Gold';
      if (aPlus >= 4) return 'Silver';
      if (aPlus >= 1) return 'Bronze';
      return 'Locked';
    },
    progressText: (s) => `${s.gradeCounts['A+'] || 0}/8 Optimal (A+) Moves`,
  },
  {
    id: 'lic-a1',
    licenseCode: 'A-1',
    licenseClass: 'National A',
    title: 'Pot-Limit Geometric Sizing',
    objective: 'Play hands in Pot-Limit Hold’em mode to master the Pot + 2×Call betting cap.',
    instructorBrief:
      'In Pot Limit, you cannot jam 100 BB pre-flop. Build the pot geometrically on the Flop and Turn when holding nut draws or top set!',
    presetToLaunch: 'multiway-pot-limit',
    medalStatus: (s) => {
      const plHands = s.handsByMode['pot-limit'] || 0;
      if (plHands >= 5) return 'Gold';
      if (plHands >= 3) return 'Silver';
      if (plHands >= 1) return 'Bronze';
      return 'Locked';
    },
    progressText: (s) => `${s.handsByMode['pot-limit'] || 0}/5 Pot-Limit Hands`,
  },
  {
    id: 'lic-ib1',
    licenseCode: 'IB-1',
    licenseClass: 'International B',
    title: 'Bounty Hunter (PKO) Headhunter',
    objective: 'Play Bounty Hunter mode and claim bounties by covering short-stack all-ins.',
    instructorBrief:
      'When you cover an all-in player, 50% of their bounty is added to the effective pot—allowing you to call ~8%–12% wider than normal!',
    presetToLaunch: 'bounty-short-stack',
    medalStatus: (s) => {
      const bhHands = s.handsByMode['bounty-hunter'] || 0;
      if (s.bountiesClaimed >= 2 || bhHands >= 6) return 'Gold';
      if (s.bountiesClaimed >= 1 || bhHands >= 3) return 'Silver';
      if (bhHands >= 1) return 'Bronze';
      return 'Locked';
    },
    progressText: (s) =>
      `${s.bountiesClaimed} KOs • ${s.handsByMode['bounty-hunter'] || 0}/6 Bounty Hands`,
  },
  {
    id: 'lic-ia1',
    licenseCode: 'IA-1',
    licenseClass: 'International A',
    title: '10 BB All-In or Fold Nash Clinic',
    objective: 'Master short-stack Push/Fold ranges in All-In or Fold mode.',
    instructorBrief:
      'At 10 BB, post-flop play disappears. Shove wide with Ace-blockers and pocket pairs from late position, and call tighter than you shove!',
    presetToLaunch: 'push-fold-clinic',
    medalStatus: (s) => {
      const aofHands = s.handsByMode['all-in-or-fold'] || 0;
      if (aofHands >= 5) return 'Gold';
      if (aofHands >= 3) return 'Silver';
      if (aofHands >= 1) return 'Bronze';
      return 'Locked';
    },
    progressText: (s) => `${s.handsByMode['all-in-or-fold'] || 0}/5 AoF Hands`,
  },
  {
    id: 'lic-s1',
    licenseCode: 'S-1',
    licenseClass: 'Super License',
    title: 'The E.P.T. Super License Trial',
    objective: 'Maintain an 80%+ overall Coach Grade across 10+ tracked hands with positive Net BB.',
    instructorBrief:
      'The ultimate test of an E.P.T. Championship contender. Combine positional discipline, pot-odds precision, and post-flop aggression!',
    presetToLaunch: 'free-play',
    medalStatus: (s) => {
      if (s.handsPlayed < 3) return 'Locked';
      const totalGraded = Math.max(1, s.totalDecisionsGraded);
      const pts =
        s.gradeCounts['A+'] * 100 +
        s.gradeCounts.B * 82 +
        s.gradeCounts.C * 60 +
        s.gradeCounts.D * 30;
      const acc = Math.round(pts / totalGraded);
      if (s.handsPlayed >= 10 && acc >= 80 && s.netBBWon > 0) return 'Gold';
      if (s.handsPlayed >= 5 && acc >= 70) return 'Silver';
      return 'Bronze';
    },
    progressText: (s) => `${s.handsPlayed}/10 Hands • Net: ${s.netBBWon >= 0 ? '+' : ''}${s.netBBWon} BB`,
  },
];

// ==========================================
// CONSOLE HUD THEME CONFIGURATIONS
// ==========================================

export const CONSOLE_HUD_THEMES: Record<
  ConsoleHudThemeId,
  {
    id: ConsoleHudThemeId;
    name: string;
    eraBadge: string;
    inspiration: string;
    bannerBg: string;
    borderColor: string;
    accentColor: string;
    codecTitle: string;
    codecFrequency: string;
    topLeftHudTitle: string;
  }
> = {
  'ept-obsidian': {
    id: 'ept-obsidian',
    name: 'E.P.T. Obsidian & Gold',
    eraBadge: '2026 Default',
    inspiration: 'Xbox 360 NXE / WSOP Broadcast Gold',
    bannerBg: 'from-charcoal via-[#1a160d] to-black',
    borderColor: 'border-gold/40',
    accentColor: '#D4AF37',
    codecTitle: 'E.P.T. COACH COMMS',
    codecFrequency: 'CH-2026',
    topLeftHudTitle: 'E.P.T. TACTICAL HELP BOX',
  },
  'gt4-license': {
    id: 'gt4-license',
    name: 'GT4 License Telemetry',
    eraBadge: '2004 PS2',
    inspiration: 'Gran Turismo 4 License Center',
    bannerBg: 'from-[#0f172a] via-[#1e293b] to-[#020617]',
    borderColor: 'border-sky-400/50',
    accentColor: '#38BDF8',
    codecTitle: 'LICENSE INSTRUCTOR BRIEF',
    codecFrequency: 'SECTOR-A1',
    topLeftHudTitle: 'GT TELEMETRY READOUT',
  },
  'mgs2-codec': {
    id: 'mgs2-codec',
    name: 'MGS2 Codec & VR Grid',
    eraBadge: '2001 PS2',
    inspiration: 'Metal Gear Solid 2 VR Missions',
    bannerBg: 'from-[#021c11] via-[#042f1d] to-black',
    borderColor: 'border-emerald-400/60',
    accentColor: '#00FF66',
    codecTitle: 'CODEC TRANSCEIVER // PTT',
    codecFrequency: '140.85 MHz',
    topLeftHudTitle: 'VR SIMULATION RADAR',
  },
  'cod4-pit': {
    id: 'cod4-pit',
    name: 'CoD4 "The Pit" Tactical',
    eraBadge: '2007 Xbox 360',
    inspiration: 'Call of Duty 4 F.N.G. Killhouse',
    bannerBg: 'from-[#1a1d14] via-[#262b1c] to-[#0c0e09]',
    borderColor: 'border-amber-500/50',
    accentColor: '#F59E0B',
    codecTitle: 'SAS KILLHOUSE BRIEFING',
    codecFrequency: 'BRAVO-6',
    topLeftHudTitle: 'OBJECTIVE CHECKLIST',
  },
  'gta-sa-hud': {
    id: 'gta-sa-hud',
    name: 'San Andreas School HUD',
    eraBadge: '2004 PS2 / Xbox',
    inspiration: 'GTA: San Andreas Driving School & Casino',
    bannerBg: 'from-zinc-950 via-[#1f1209] to-black',
    borderColor: 'border-orange-500/50',
    accentColor: '#F97316',
    codecTitle: 'FOUR DRAGONS CASINO BOSS',
    codecFrequency: 'LAS VENTURAS',
    topLeftHudTitle: 'GAMBLING SCHOOL TIP',
  },
};
