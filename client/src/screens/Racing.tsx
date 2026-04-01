import { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const CW = 800;          // canvas width
const CH = 400;          // canvas height
const GROUND_Y = 330;    // y where player's feet rest on the ground surface

const SPRITE_W = 100;    // drawn width  (sprites are 75px, drawn ~1.33×)
const SPRITE_H = 64;     // drawn height (sprites are 48px, drawn ~1.33×)

const HB_W = 38;         // hitbox half-width (left/right from worldX)
const HB_H = 58;         // hitbox height (feet = worldY, top = worldY - HB_H)

const PLANET_GRAV: Record<string, number> = {
  earth:   0.52,
  mars:    0.20,
  mercury: 0.22,
};

const PLANET_COLORS: Record<string, { sky1: string; sky2: string; ground: string; platform: string; accent: string }> = {
  earth:   { sky1: '#050514', sky2: '#0a0a28', ground: '#1a3a1a', platform: '#39ff14', accent: '#00d4ff' },
  mars:    { sky1: '#100508', sky2: '#200a0a', ground: '#3a1a0a', platform: '#ff6b35', accent: '#ff3366' },
  mercury: { sky1: '#050510', sky2: '#0a0a14', ground: '#1a1a2a', platform: '#aaaacc', accent: '#ccccff' },
};

const PLANET_LABELS: Record<string, string> = {
  earth:   'EARTH',
  mars:    'MARS',
  mercury: 'MERCURY',
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface GroundSeg  { x: number; w: number; }
interface Platform   { x: number; surfaceY: number; w: number; }
interface Obstacle   { x: number; y: number; w: number; h: number; type: 'spike' | 'block'; }
interface SectionTag { x: number; label: string; color: string; }
interface Level {
  groundSegs:   GroundSeg[];
  platforms:    Platform[];
  obstacles:    Obstacle[];
  finishX:      number;
  sectionTags:  SectionTag[];
}

// ─────────────────────────────────────────────────────────────────────────────
// LEVELS
// ─────────────────────────────────────────────────────────────────────────────
const LEVELS: Record<string, Level> = {
  earth: {
    groundSegs: [
      { x: 0,    w: 620 },
      { x: 780,  w: 470 },   // gap 620-780 (160px)
      { x: 1350, w: 520 },   // gap 1250-1350 (100px)
      { x: 1970, w: 480 },   // gap 1870-1970 (100px)
      { x: 2560, w: 480 },   // gap 2450-2560 (110px)
      { x: 3140, w: 460 },   // finish
    ],
    platforms: [
      { x: 640,  surfaceY: GROUND_Y - 80,  w: 160 },  // spans gap 1
      { x: 1270, surfaceY: GROUND_Y - 85,  w: 110 },  // spans gap 2
      { x: 1890, surfaceY: GROUND_Y - 80,  w: 110 },  // spans gap 3
      { x: 2460, surfaceY: GROUND_Y - 85,  w: 130 },  // spans gap 4
      { x: 3060, surfaceY: GROUND_Y - 80,  w: 120 },  // spans gap 5
      { x: 1450, surfaceY: GROUND_Y - 145, w: 90  },  // high bonus
      { x: 2200, surfaceY: GROUND_Y - 140, w: 90  },  // high bonus
    ],
    obstacles: [
      { x: 200,  y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 380,  y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 520,  y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 850,  y: GROUND_Y - 44, w: 38, h: 44, type: 'block' },
      { x: 1020, y: GROUND_Y - 52, w: 38, h: 52, type: 'block' },
      { x: 1140, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 1390, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 1500, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 1650, y: GROUND_Y - 58, w: 38, h: 58, type: 'block' },
      { x: 1760, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2060, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2160, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2310, y: GROUND_Y - 62, w: 38, h: 62, type: 'block' },
      { x: 2660, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2800, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2920, y: GROUND_Y - 50, w: 38, h: 50, type: 'block' },
      { x: 3100, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 3230, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 3360, y: GROUND_Y - 55, w: 38, h: 55, type: 'block' },
    ],
    finishX: 3500,
    sectionTags: [
      { x: 80,   label: 'SPRINT',   color: '#ff3366' },
      { x: 900,  label: 'HURDLES',  color: '#ffd700' },
      { x: 1700, label: 'JUMP',     color: '#39ff14' },
      { x: 2700, label: 'OBSTACLE', color: '#ff6b35' },
    ],
  },

  mars: {
    groundSegs: [
      { x: 0,    w: 520 },
      { x: 730,  w: 420 },   // gap 520-730 (210px — wider, low gravity)
      { x: 1270, w: 480 },   // gap 1150-1270 (120px)
      { x: 1960, w: 450 },   // gap 1750-1960 (210px)
      { x: 2600, w: 440 },   // gap 2410-2600 (190px)
      { x: 3150, w: 450 },
    ],
    platforms: [
      { x: 550,  surfaceY: GROUND_Y - 95,  w: 200 }, // wide bridge over big gap
      { x: 1180, surfaceY: GROUND_Y - 100, w: 120 },
      { x: 1790, surfaceY: GROUND_Y - 100, w: 190 }, // wide bridge
      { x: 2080, surfaceY: GROUND_Y - 175, w: 100 }, // high platform (reachable w/ mars gravity)
      { x: 2440, surfaceY: GROUND_Y - 95,  w: 185 },
      { x: 2840, surfaceY: GROUND_Y - 120, w: 100 },
      { x: 3020, surfaceY: GROUND_Y - 185, w: 100 }, // very high
    ],
    obstacles: [
      { x: 150,  y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 320,  y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 800,  y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 980,  y: GROUND_Y - 65, w: 42, h: 65, type: 'block' },
      { x: 1100, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 1380, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 1530, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 1660, y: GROUND_Y - 70, w: 42, h: 70, type: 'block' },
      { x: 2700, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2840, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 3200, y: GROUND_Y - 80, w: 42, h: 80, type: 'block' },
      { x: 3340, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 3460, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
    ],
    finishX: 3500,
    sectionTags: [
      { x: 80,   label: 'SPRINT',    color: '#ff6b35' },
      { x: 850,  label: 'LONG JUMP', color: '#ffd700' },
      { x: 1800, label: 'ASCENT',    color: '#ff3366' },
      { x: 2700, label: 'GAUNTLET',  color: '#ff073a' },
    ],
  },

  mercury: {
    groundSegs: [
      { x: 0,    w: 420 },
      { x: 540,  w: 360 },   // gap 420-540 (120px)
      { x: 1020, w: 340 },   // gap 900-1020 (120px)
      { x: 1520, w: 320 },   // gap 1360-1520 (160px)
      { x: 2040, w: 300 },   // gap 1840-2040 (200px)
      { x: 2540, w: 320 },   // gap 2340-2540 (200px)
      { x: 3060, w: 440 },
    ],
    platforms: [
      { x: 440,  surfaceY: GROUND_Y - 80,  w: 120 },
      { x: 920,  surfaceY: GROUND_Y - 88,  w: 120 },
      { x: 1380, surfaceY: GROUND_Y - 82,  w: 160 },
      { x: 1870, surfaceY: GROUND_Y - 80,  w: 190 },
      { x: 2370, surfaceY: GROUND_Y - 88,  w: 185 },
      { x: 2200, surfaceY: GROUND_Y - 160, w: 80  }, // high bonus
    ],
    obstacles: [
      // Dense obstacles — Mercury is extreme
      { x: 100,  y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 200,  y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 300,  y: GROUND_Y - 60, w: 42, h: 60, type: 'block' },
      { x: 580,  y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 680,  y: GROUND_Y - 68, w: 42, h: 68, type: 'block' },
      { x: 810,  y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 1060, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 1150, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 1260, y: GROUND_Y - 65, w: 42, h: 65, type: 'block' },
      { x: 1570, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 1680, y: GROUND_Y - 78, w: 42, h: 78, type: 'block' },
      { x: 1780, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2090, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2170, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2270, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2600, y: GROUND_Y - 80, w: 42, h: 80, type: 'block' },
      { x: 2720, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2840, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 2950, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 3100, y: GROUND_Y - 88, w: 42, h: 88, type: 'block' },
      { x: 3220, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 3340, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
      { x: 3440, y: GROUND_Y - 22, w: 22, h: 22, type: 'spike' },
    ],
    finishX: 3500,
    sectionTags: [
      { x: 50,   label: 'HEAT ZONE', color: '#ff6b35' },
      { x: 700,  label: 'INFERNO',   color: '#ff3366' },
      { x: 1400, label: 'MOLTEN',    color: '#ff073a' },
      { x: 2500, label: 'FURNACE',   color: '#ffd700' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getPlayerPhysics(config: any, planet: string) {
  const m  = config?.muscles  || {};
  const e  = config?.energy   || { atpPc: 33, anaerobic: 34, aerobic: 33 };
  const mass = config?.mass   || 70;
  const potions = config?.potions || [];

  // Speed: quadriceps and ATP-PC energy give more sprint
  const maxSpeed = (3.4 + (m.quadriceps ? 2.2 : 0) + (m.hamstrings ? 0.5 : 0) +
                   (e.atpPc > 50 ? 1.2 : 0)) * (70 / mass) * 0.38;

  // Jump force: calves are critical, hamstrings help
  const jumpForce = -(10.5 + (m.calves ? 3.5 : 0) + (m.hamstrings ? 1.2 : 0));

  // Gravity from planet
  const gravity = PLANET_GRAV[planet] || 0.52;

  // Acceleration: hamstrings improve it
  const accel = 0.32 + (m.hamstrings ? 0.14 : 0);

  // Friction / deceleration: core muscle improves control
  const friction = 0.80 + (m.core ? 0.11 : 0);

  // Stamina drain
  const staminaDrain = 0.11 - (e.aerobic > 50 ? 0.04 : 0) - (m.core ? 0.025 : 0);

  // Potion effects: speed boost, jump boost, stamina
  let potionSpeedMult = 1;
  let potionJumpMult  = 1;
  let potionStamina   = 0;
  for (const p of potions) {
    if (p.stat === 'speed'       || p.stat === 'explosive_power') potionSpeedMult += 0.15;
    if (p.stat === 'jump_power'  || p.stat === 'reaction_time')   potionJumpMult  += 0.12;
    if (p.stat === 'stamina'     || p.stat === 'fatigue_reduction'||
        p.stat === 'endurance'   || p.stat === 'anaerobic_capacity') potionStamina += 20;
  }

  return {
    maxSpeed:    Math.min(maxSpeed * potionSpeedMult, 7.5),
    jumpForce:   jumpForce * potionJumpMult,
    gravity,
    accel,
    friction,
    staminaDrain,
    startStamina: Math.min(100 + potionStamina, 100),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface Props { socket: any; }

export default function Racing({ socket }: Props) {
  const room         = socket.roomState;
  const me           = room?.players.find((p: any) => p.id === socket.playerId);
  const currentPlayer = room?.players.find((p: any) => p.id === room.currentPlayerId);
  const isMyTurn     = room?.currentPlayerId === socket.playerId;
  const planetKey    = room?.currentPlanet || 'earth';
  const colors       = PLANET_COLORS[planetKey] || PLANET_COLORS.earth;
  const level        = LEVELS[planetKey] || LEVELS.earth;
  const physics      = getPlayerPhysics(me?.config, planetKey);

  // ── React state (UI only) ────────────────────────────────────────────────
  const [gameStatus, setGameStatus] = useState<'waiting'|'countdown'|'playing'|'complete'>('waiting');
  const [serverResult, setServerResult]   = useState<any>(null);
  const [spritesReady, setSpritesReady]   = useState(false);
  const [hudData, setHudData]             = useState({ health: 100, stamina: 100, time: 0 });
  const [countdownNum, setCountdownNum]   = useState(3);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const lastTRef    = useRef<number>(0);
  const statusRef   = useRef<'waiting'|'countdown'|'playing'|'complete'>('waiting');
  const jumpRef     = useRef(false); // "jump was just pressed"
  const keysRef     = useRef(new Set<string>());

  const sprites = useRef<{
    idle: HTMLImageElement[];
    run:  HTMLImageElement[];
    jump: HTMLImageElement[];
    die:  HTMLImageElement[];
    bg:   HTMLImageElement | null;
    farB: HTMLImageElement | null;
    bldg: HTMLImageElement | null;
    fg:   HTMLImageElement | null;
    expl: HTMLImageElement[];
  }>({ idle:[], run:[], jump:[], die:[], bg:null, farB:null, bldg:null, fg:null, expl:[] });

  // player state in ref to avoid stale closures in game loop
  const pRef = useRef({
    worldX:  150,
    worldY:  GROUND_Y,
    vx:      0,
    vy:      0,
    onGround: true,
    facing:  1 as 1 | -1,
    frame:   0,
    frameTick: 0,
    state:   'idle' as 'idle'|'run'|'jump'|'die',
    health:  100,
    stamina: physics.startStamina,
    invincible: 0,
    alreadyJumped: false,
    lastSafeX: 150,
    startTime: 0,
    elapsed: 0,
    hits: 0,
    // explosion particles
    explosions: [] as { x: number; y: number; frame: number; timer: number }[],
  });

  // ── Sprite preload ────────────────────────────────────────────────────────
  useEffect(() => {
    const load = (src: string): Promise<HTMLImageElement> =>
      new Promise(res => { const img = new Image(); img.onload = () => res(img); img.src = src; });

    Promise.all([
      Promise.all([1,2,3,4].map(i => load(`/sprites/player/idle/idle${i}.png`))),
      Promise.all([1,2,3,4,5,6,7,8,9,10].map(i => load(`/sprites/player/run/run${i}.png`))),
      Promise.all([1,2,3,4,5,6].map(i => load(`/sprites/player/jump/jump-no-gun${i}.png`))),
      Promise.all([1,2,3].map(i => load(`/sprites/player/die/die${i}.png`))),
      load('/bg/bg.png').catch(() => null),
      load('/bg/far-buildings.png').catch(() => null),
      load('/bg/buildings.png').catch(() => null),
      load('/bg/skill-foreground.png').catch(() => null),
      Promise.all([1,2,3,4,5,6,7,8,9].map(i =>
        load(`/sprites/explosion/explosion-animation${i}.png`).catch(() => null as any)
      )),
    ]).then(([idle, run, jump, die, bg, farB, bldg, fg, expl]) => {
      sprites.current = {
        idle, run, jump, die,
        bg:   bg   as HTMLImageElement | null,
        farB: farB as HTMLImageElement | null,
        bldg: bldg as HTMLImageElement | null,
        fg:   fg   as HTMLImageElement | null,
        expl: expl.filter(Boolean) as HTMLImageElement[],
      };
      setSpritesReady(true);
    });
  }, []);

  // ── Keyboard / Touch input ────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
      keysRef.current.add(e.code);
      if (!e.repeat && (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW')) {
        jumpRef.current = true;
      }
    };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.code); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Start race ────────────────────────────────────────────────────────────
  const startRace = useCallback(async () => {
    // Countdown 3-2-1
    setGameStatus('countdown');
    statusRef.current = 'countdown';
    for (let i = 3; i >= 1; i--) {
      setCountdownNum(i);
      await new Promise(r => setTimeout(r, 900));
    }
    // Go!
    setGameStatus('playing');
    statusRef.current = 'playing';
    pRef.current.startTime = performance.now();

    // Fire off server race calc in parallel
    socket.runRace().then((res: any) => {
      if (res.success && res.result) setServerResult(res.result);
    });
  }, [socket]);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!spritesReady) return;

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    const GRAVITY = physics.gravity;

    // ── Update physics ────────────────────────────────────────────────────
    function update(dt: number) {
      const p   = pRef.current;
      const keys = keysRef.current;

      if (statusRef.current !== 'playing') return;

      const wRight = keys.has('ArrowRight') || keys.has('KeyD');
      const wLeft  = keys.has('ArrowLeft')  || keys.has('KeyA');
      const wJump  = jumpRef.current;

      // Stamina-based speed penalty
      const speedMult = p.stamina < 25 ? 0.55 : p.stamina < 50 ? 0.78 : 1;
      const ms = physics.maxSpeed * speedMult;

      // Horizontal movement
      if (wRight) {
        p.vx = Math.min(p.vx + physics.accel * dt, ms);
        p.facing = 1;
      } else if (wLeft) {
        p.vx = Math.max(p.vx - physics.accel * dt, -ms * 0.6);
        p.facing = -1;
      } else {
        p.vx *= Math.pow(physics.friction, dt);
        if (Math.abs(p.vx) < 0.05) p.vx = 0;
      }

      // Jump
      if (wJump && p.onGround && !p.alreadyJumped) {
        p.vy = physics.jumpForce;
        p.onGround = false;
        p.alreadyJumped = true;
        jumpRef.current = false;
      }
      if (!wJump) {
        p.alreadyJumped = false;
        jumpRef.current = false;
      }

      // Gravity + terminal velocity
      p.vy = Math.min(p.vy + GRAVITY * dt, 18);

      // Move
      p.worldX += p.vx * dt;
      p.worldY += p.vy * dt;

      // Keep from going left of start
      if (p.worldX < 50) { p.worldX = 50; p.vx = 0; }

      // ── Ground collision ─────────────────────────────────────────────────
      p.onGround = false;
      for (const seg of level.groundSegs) {
        if (p.worldX >= seg.x && p.worldX <= seg.x + seg.w && p.worldY >= GROUND_Y && p.vy >= 0) {
          p.worldY  = GROUND_Y;
          p.vy      = 0;
          p.onGround = true;
          if (p.vx > 0) p.lastSafeX = p.worldX; // track last safe ground position
          break;
        }
      }

      // ── Platform collision (land from above only) ─────────────────────────
      if (!p.onGround) {
        for (const plat of level.platforms) {
          const prevY = p.worldY - p.vy * dt;
          if (p.worldX >= plat.x && p.worldX <= plat.x + plat.w &&
              p.vy >= 0 && prevY <= plat.surfaceY && p.worldY >= plat.surfaceY) {
            p.worldY  = plat.surfaceY;
            p.vy      = 0;
            p.onGround = true;
            break;
          }
        }
      }

      // ── Fell into pit? ────────────────────────────────────────────────────
      if (p.worldY > CH + 80) {
        p.worldX   = Math.max(50, p.lastSafeX - 60);
        p.worldY   = GROUND_Y;
        p.vx = 0; p.vy = 0;
        if (!p.invincible) {
          p.health = Math.max(0, p.health - 20);
          p.hits++;
        }
        p.invincible = 100;
        p.explosions.push({ x: p.worldX, y: CH - 40, frame: 0, timer: 0 });
      }

      // ── Obstacle collision ────────────────────────────────────────────────
      if (!p.invincible) {
        for (const obs of level.obstacles) {
          const hLeft  = p.worldX - HB_W / 2;
          const hRight = p.worldX + HB_W / 2;
          const hTop   = p.worldY - HB_H;
          const hBot   = p.worldY;

          if (hRight > obs.x && hLeft < obs.x + obs.w && hBot > obs.y && hTop < obs.y + obs.h) {
            p.health = Math.max(0, p.health - 25);
            p.hits++;
            p.invincible = 80;
            p.vy = -7; // bounce up
            p.vx = p.facing === 1 ? -4 : 4; // knock back
            p.explosions.push({ x: p.worldX, y: p.worldY - 20, frame: 0, timer: 0 });
            break;
          }
        }
      }

      // ── Invincibility countdown ───────────────────────────────────────────
      if (p.invincible > 0) p.invincible = Math.max(0, p.invincible - dt);

      // ── Stamina ───────────────────────────────────────────────────────────
      const moving = Math.abs(p.vx) > 0.5;
      const drain  = moving ? physics.staminaDrain : physics.staminaDrain * 0.3;
      p.stamina = Math.max(0, p.stamina - drain * dt);

      // ── Animation state ───────────────────────────────────────────────────
      if (!p.onGround) p.state = 'jump';
      else if (Math.abs(p.vx) > 0.3) p.state = 'run';
      else p.state = 'idle';

      const frameRates: Record<string, number> = { idle: 7, run: 4, jump: 4, die: 8 };
      p.frameTick += dt;
      if (p.frameTick >= frameRates[p.state]) {
        p.frameTick = 0;
        const len = sprites.current[p.state].length;
        if (len > 0) p.frame = (p.frame + 1) % len;
      }

      // ── Explosions tick ───────────────────────────────────────────────────
      p.explosions = p.explosions.filter(ex => ex.frame < (sprites.current.expl.length || 9));
      for (const ex of p.explosions) {
        ex.timer += dt;
        if (ex.timer >= 4) { ex.timer = 0; ex.frame++; }
      }

      // ── Elapsed time ─────────────────────────────────────────────────────
      p.elapsed = (performance.now() - p.startTime) / 1000;

      // ── Check finish ──────────────────────────────────────────────────────
      if (p.worldX >= level.finishX && statusRef.current === 'playing') {
        statusRef.current = 'complete';
        setGameStatus('complete');
      }
    }

    // ── Draw ────────────────────────────────────────────────────────────────
    function draw() {
      const p      = pRef.current;
      const camX   = Math.max(0, p.worldX - 200);
      const sp     = sprites.current;

      ctx.clearRect(0, 0, CW, CH);

      // ── Sky gradient ───────────────────────────────────────────────────
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CH);
      skyGrad.addColorStop(0, colors.sky1);
      skyGrad.addColorStop(1, colors.sky2);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CW, CH);

      // ── Parallax background layers ────────────────────────────────────
      const tintAndDraw = (img: HTMLImageElement | null, parallax: number, yPos: number, drawH: number, tint?: string) => {
        if (!img) return;
        const scale  = drawH / img.height;
        const drawW  = img.width * scale;
        const offset = -(camX * parallax) % drawW;
        // tint layer
        if (tint) {
          ctx.save();
          ctx.globalCompositeOperation = 'multiply';
        }
        for (let x = offset; x < CW + drawW; x += drawW) {
          ctx.drawImage(img, x, yPos, drawW, drawH);
        }
        if (tint) ctx.restore();
      };

      tintAndDraw(sp.bg,   0.08, 0,           CH);
      tintAndDraw(sp.farB, 0.22, CH - 260,    250);
      tintAndDraw(sp.bldg, 0.45, CH - 290,    280);
      tintAndDraw(sp.fg,   0.80, CH - 140,    140);

      // Planet color tint overlay
      ctx.fillStyle = colors.sky1 + '55';
      ctx.fillRect(0, 0, CW, CH);

      // ── Grid scanline over sky ────────────────────────────────────────
      ctx.strokeStyle = 'rgba(0,212,255,0.04)';
      ctx.lineWidth = 1;
      for (let y = 0; y < GROUND_Y; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
      }

      // ── Section tags ──────────────────────────────────────────────────
      for (const tag of level.sectionTags) {
        const sx = tag.x - camX;
        if (sx < -100 || sx > CW + 100) continue;
        ctx.save();
        ctx.fillStyle = tag.color + 'aa';
        ctx.font = '7px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(tag.label, sx, GROUND_Y - 44);
        ctx.strokeStyle = tag.color + '33';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sx, GROUND_Y - 38);
        ctx.lineTo(sx, GROUND_Y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ── Platforms ─────────────────────────────────────────────────────
      for (const plat of level.platforms) {
        const px = plat.x - camX;
        if (px > CW + 100 || px + plat.w < -100) continue;
        // platform body
        ctx.fillStyle = colors.platform + '33';
        ctx.fillRect(px, plat.surfaceY, plat.w, 10);
        // platform top edge (neon line)
        ctx.fillStyle = colors.platform;
        ctx.fillRect(px, plat.surfaceY, plat.w, 3);
        // end caps
        ctx.fillStyle = colors.platform + 'cc';
        ctx.fillRect(px,              plat.surfaceY, 4, 10);
        ctx.fillRect(px + plat.w - 4, plat.surfaceY, 4, 10);
        // glow
        ctx.save();
        ctx.shadowColor = colors.platform;
        ctx.shadowBlur  = 8;
        ctx.fillStyle   = colors.platform;
        ctx.fillRect(px, plat.surfaceY, plat.w, 3);
        ctx.restore();
      }

      // ── Ground ────────────────────────────────────────────────────────
      for (const seg of level.groundSegs) {
        const sx = seg.x - camX;
        if (sx > CW + 200 || sx + seg.w < -200) continue;

        // Ground fill
        ctx.fillStyle = colors.ground;
        ctx.fillRect(sx, GROUND_Y, seg.w, CH - GROUND_Y);

        // Ground surface line (neon)
        ctx.fillStyle = colors.platform + 'cc';
        ctx.fillRect(sx, GROUND_Y, seg.w, 3);

        // Ground tile pattern
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let gx = Math.max(sx, 0); gx < Math.min(sx + seg.w, CW); gx += 16) {
          if (((gx + Math.floor(camX)) / 16 | 0) % 3 === 0) {
            ctx.fillRect(gx, GROUND_Y + 3, 16, 6);
          }
        }

        // Glow on top edge
        ctx.save();
        ctx.shadowColor = colors.platform;
        ctx.shadowBlur  = 6;
        ctx.fillStyle   = colors.platform;
        ctx.fillRect(sx, GROUND_Y, seg.w, 2);
        ctx.restore();
      }

      // ── Obstacles ─────────────────────────────────────────────────────
      for (const obs of level.obstacles) {
        const ox = obs.x - camX;
        if (ox > CW + 60 || ox + obs.w < -60) continue;

        if (obs.type === 'spike') {
          // Triangular spike
          const cx = ox + obs.w / 2;
          ctx.save();
          ctx.shadowColor = '#ff073a';
          ctx.shadowBlur  = 6;
          ctx.fillStyle   = '#cc0022';
          ctx.beginPath();
          ctx.moveTo(cx, obs.y);
          ctx.lineTo(ox, obs.y + obs.h);
          ctx.lineTo(ox + obs.w, obs.y + obs.h);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ff073a';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        } else {
          // Block obstacle
          ctx.save();
          ctx.shadowColor = '#ff6b35';
          ctx.shadowBlur  = 8;
          // Main body
          ctx.fillStyle = '#2a1a0a';
          ctx.fillRect(ox, obs.y, obs.w, obs.h);
          // Border
          ctx.strokeStyle = '#ff6b35';
          ctx.lineWidth = 2;
          ctx.strokeRect(ox + 1, obs.y + 1, obs.w - 2, obs.h - 2);
          // Warning stripes
          ctx.fillStyle = 'rgba(255,107,53,0.15)';
          for (let si = 0; si < obs.h; si += 10) {
            ctx.fillRect(ox, obs.y + si, obs.w, 5);
          }
          // Top cap
          ctx.fillStyle = '#ff6b35';
          ctx.fillRect(ox, obs.y, obs.w, 3);
          ctx.restore();
        }
      }

      // ── Finish line ───────────────────────────────────────────────────
      const fx = level.finishX - camX;
      if (fx > -20 && fx < CW + 20) {
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur  = 16;
        // Checkered pole
        for (let fy = GROUND_Y - 70; fy < GROUND_Y; fy += 8) {
          ctx.fillStyle = (fy / 8 | 0) % 2 === 0 ? '#ffd700' : '#ffffff';
          ctx.fillRect(fx - 2, fy, 4, 8);
        }
        // Horizontal tape
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(fx - 2, GROUND_Y - 70, 4, 8);
        // "FINISH" text
        ctx.fillStyle = '#ffd700';
        ctx.font = '9px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('FINISH', fx, GROUND_Y - 78);
        ctx.restore();
      }

      // ── Explosions ────────────────────────────────────────────────────
      for (const ex of p.explosions) {
        const img = sp.expl[Math.min(ex.frame, sp.expl.length - 1)];
        if (!img) continue;
        const ex_cx = ex.x - camX;
        ctx.drawImage(img, ex_cx - 24, ex.y - 24, 48, 48);
      }

      // ── Player sprite ─────────────────────────────────────────────────
      const pcx = p.worldX - camX;
      const pcy = p.worldY;

      const animFrames = sp[p.state];
      const frame      = animFrames[p.frame % Math.max(animFrames.length, 1)];

      ctx.save();
      ctx.translate(pcx, pcy);
      if (p.facing === -1) ctx.scale(-1, 1);

      // Flicker when invincible
      const visible = p.invincible > 0 ? (Math.floor(p.invincible / 8) % 2 === 0) : true;
      if (visible && frame) {
        ctx.drawImage(frame, -SPRITE_W / 2, -SPRITE_H, SPRITE_W, SPRITE_H);
      }
      ctx.restore();

      // ── HUD ───────────────────────────────────────────────────────────
      // Health bar
      const hpColor = p.health > 60 ? '#39ff14' : p.health > 30 ? '#ffd700' : '#ff073a';
      drawBar(ctx, 14, 14, 150, 12, p.health / 100, hpColor, 'HP');

      // Stamina bar
      const stColor = p.stamina > 50 ? '#00d4ff' : p.stamina > 25 ? '#ffd700' : '#ff6b35';
      drawBar(ctx, 14, 34, 150, 12, p.stamina / 100, stColor, 'EN');

      // Timer (top right)
      if (statusRef.current === 'playing' || statusRef.current === 'complete') {
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur  = 6;
        ctx.font = '9px "Press Start 2P"';
        ctx.textAlign = 'right';
        ctx.fillText(p.elapsed.toFixed(2) + 's', CW - 14, 24);
        ctx.restore();
      }

      // Planet label (top center)
      ctx.save();
      ctx.fillStyle = colors.accent;
      ctx.shadowColor = colors.accent;
      ctx.shadowBlur  = 8;
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(PLANET_LABELS[planetKey] || planetKey.toUpperCase(), CW / 2, 22);
      ctx.restore();

      // Controls hint (bottom, fade out after first jump)
      if (p.hits === 0 && p.elapsed < 6 && statusRef.current === 'playing') {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.elapsed / 5);
        ctx.fillStyle = 'rgba(0,212,255,0.8)';
        ctx.font = '7px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('[SPACE / UP] JUMP     [A / D  or  ARROWS] MOVE', CW / 2, CH - 10);
        ctx.restore();
      }

      // Countdown overlay
      if (statusRef.current === 'countdown') {
        ctx.save();
        ctx.fillStyle = 'rgba(5,5,20,0.65)';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur  = 20;
        ctx.font = '60px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(String(pRef.current.startTime === 0 ? countdownNum : ''), CW / 2, CH / 2 + 20);
        ctx.restore();
      }

      // Complete overlay
      if (statusRef.current === 'complete') {
        ctx.save();
        ctx.fillStyle = 'rgba(5,5,20,0.8)';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur  = 20;
        ctx.font = '20px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('FINISH!', CW / 2, CH / 2 - 20);
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.font = '11px "Press Start 2P"';
        ctx.fillText(p.elapsed.toFixed(2) + 's', CW / 2, CH / 2 + 10);
        ctx.restore();
      }

      // React HUD state update every ~6 frames
      if (Math.random() < 0.17) {
        setHudData({ health: p.health, stamina: p.stamina, time: p.elapsed });
      }
    }

    // ── RAF loop ─────────────────────────────────────────────────────────
    function loop(ts: number) {
      if (!lastTRef.current) lastTRef.current = ts;
      const dt = Math.min((ts - lastTRef.current) / 16.67, 3);
      lastTRef.current = ts;

      if (statusRef.current === 'playing') update(dt);
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spritesReady, planetKey]);

  // sync statusRef when state changes
  useEffect(() => { statusRef.current = gameStatus; }, [gameStatus]);

  // ── Spectator auto-play (draw loop when not my turn) ─────────────────────
  const specCanvasRef = useRef<HTMLCanvasElement>(null);
  const specFrameRef  = useRef(0);
  const specXRef      = useRef(100);
  const specTickRef   = useRef(0);

  useEffect(() => {
    if (isMyTurn || !spritesReady) return;
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const run = () => {
      ctx.clearRect(0, 0, CW, CH);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CH);
      skyGrad.addColorStop(0, colors.sky1);
      skyGrad.addColorStop(1, colors.sky2);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CW, CH);

      // Ground
      ctx.fillStyle = colors.ground;
      ctx.fillRect(0, GROUND_Y, CW, CH - GROUND_Y);
      ctx.save();
      ctx.shadowColor = colors.platform;
      ctx.shadowBlur  = 6;
      ctx.fillStyle   = colors.platform;
      ctx.fillRect(0, GROUND_Y, CW, 2);
      ctx.restore();

      // Spectator character
      specTickRef.current++;
      if (specTickRef.current >= 4) {
        specTickRef.current = 0;
        specFrameRef.current = (specFrameRef.current + 1) % sprites.current.run.length;
      }
      specXRef.current = (specXRef.current + 2.5) % (CW + 100);
      const runFrame = sprites.current.run[specFrameRef.current];
      if (runFrame) {
        ctx.drawImage(runFrame, specXRef.current - SPRITE_W / 2, GROUND_Y - SPRITE_H, SPRITE_W, SPRITE_H);
      }

      // Label
      ctx.fillStyle = '#ffffff66';
      ctx.font = '9px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText((currentPlayer?.name || 'OPPONENT').toUpperCase() + ' IS RACING...', CW / 2, CH / 2);

      raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [isMyTurn, spritesReady, colors, planetKey, currentPlayer]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  if (!isMyTurn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="mb-4">
          <p className="font-pixel text-xs text-retro-white/60 text-center mb-1">SPECTATING</p>
          <p className="font-pixel text-sm text-retro-cyan glow-text-cyan text-center animate-pixel-pulse">
            {(currentPlayer?.name || 'Opponent').toUpperCase()} IS RACING
          </p>
        </div>
        <div className="pixel-card w-full max-w-3xl overflow-hidden">
          <canvas
            ref={specCanvasRef}
            width={CW}
            height={CH}
            className="w-full"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        <p className="font-pixel text-[8px] text-retro-white/30 mt-4">
          {PLANET_LABELS[planetKey]} — YOUR TURN WILL COME
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-2 py-4">
      {/* Header */}
      <div className="flex items-center gap-6 mb-3 w-full max-w-3xl">
        <div>
          <p className="font-pixel text-[8px] text-retro-white/40">RACING ON</p>
          <p className="font-pixel text-sm glow-text-cyan" style={{ color: colors.accent }}>
            {PLANET_LABELS[planetKey]}
          </p>
        </div>
        <div className="flex-1" />
        {/* Live stats in header */}
        {gameStatus === 'playing' && (
          <>
            <div className="text-right">
              <p className="font-pixel text-[7px] text-retro-white/40">HEALTH</p>
              <div className="stat-bar w-28 mt-1">
                <div className="stat-bar-fill"
                  style={{ width: `${hudData.health}%`, background: hudData.health > 60 ? '#39ff14' : hudData.health > 30 ? '#ffd700' : '#ff073a' }} />
              </div>
            </div>
            <div className="text-right">
              <p className="font-pixel text-[7px] text-retro-white/40">ENERGY</p>
              <div className="stat-bar w-28 mt-1">
                <div className="stat-bar-fill"
                  style={{ width: `${hudData.stamina}%`, background: '#00d4ff' }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Canvas */}
      <div className="pixel-card p-1 w-full max-w-3xl mb-3 relative">
        {!spritesReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-retro-bg/90 z-10">
            <p className="font-pixel text-xs text-retro-cyan animate-blink">LOADING ASSETS...</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          className="w-full outline-none"
          style={{ imageRendering: 'pixelated' }}
          tabIndex={0}
        />
      </div>

      {/* Touch controls (mobile) */}
      {gameStatus === 'playing' && (
        <div className="flex justify-between items-end w-full max-w-3xl mb-3 md:hidden">
          <div className="flex gap-2">
            {[['ArrowLeft','LEFT'],['ArrowRight','RIGHT']].map(([code, label]) => (
              <button key={code}
                className="pixel-btn border-retro-border text-retro-white/60 px-4 py-4 text-[9px] select-none"
                onTouchStart={e => { e.preventDefault(); keysRef.current.add(code); }}
                onTouchEnd={e   => { e.preventDefault(); keysRef.current.delete(code); }}
              >{label}</button>
            ))}
          </div>
          <button
            className="pixel-btn border-retro-cyan text-retro-cyan px-6 py-4 text-[9px] select-none"
            onTouchStart={e => { e.preventDefault(); keysRef.current.add('Space'); jumpRef.current = true; }}
            onTouchEnd={e   => { e.preventDefault(); keysRef.current.delete('Space'); }}
          >JUMP</button>
        </div>
      )}

      {/* Controls */}
      <div className="w-full max-w-3xl">
        {gameStatus === 'waiting' && spritesReady && (
          <div className="text-center">
            {/* Config summary */}
            {me?.config && (
              <div className="pixel-card mb-4 text-left">
                <p className="font-pixel text-[8px] text-retro-cyan mb-2">YOUR BUILD</p>
                <div className="grid grid-cols-2 gap-3 text-[7px]">
                  <div>
                    <p className="text-retro-white/40 mb-1">MUSCLES TRAINED</p>
                    {Object.entries(me.config.muscles || {}).filter(([,v]) => v).map(([k]) => (
                      <p key={k} className="text-retro-green">+ {k.toUpperCase()}</p>
                    ))}
                    {Object.values(me.config.muscles || {}).filter(Boolean).length === 0 && (
                      <p className="text-retro-white/30">NONE SELECTED</p>
                    )}
                  </div>
                  <div>
                    <p className="text-retro-white/40 mb-1">POTIONS</p>
                    {(me.config.potions || []).map((p: any, i: number) => (
                      <p key={i} className="text-retro-yellow">{p.name?.toUpperCase() || 'POTION'}</p>
                    ))}
                    {(me.config.potions || []).length === 0 && (
                      <p className="text-retro-white/30">NONE CRAFTED</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <button onClick={startRace} className="btn-pink text-lg px-10 py-4 animate-pixel-pulse">
              START RACE
            </button>
            <p className="font-pixel text-[7px] text-retro-white/30 mt-3">
              USE ARROW KEYS OR WASD + SPACE TO JUMP
            </p>
          </div>
        )}

        {gameStatus === 'countdown' && (
          <div className="text-center">
            <p className="font-pixel text-3xl text-retro-yellow glow-text-gold animate-pixel-pulse">
              {countdownNum}
            </p>
          </div>
        )}

        {gameStatus === 'complete' && (
          <div className="pixel-card">
            <p className="font-pixel text-sm text-retro-yellow glow-text-gold text-center mb-3">RACE COMPLETE</p>
            <div className="flex justify-center gap-8 mb-4">
              <div className="text-center">
                <p className="font-pixel text-[7px] text-retro-white/40">YOUR TIME</p>
                <p className="font-pixel text-xl text-retro-cyan glow-text-cyan">
                  {pRef.current.elapsed.toFixed(2)}s
                </p>
              </div>
              {serverResult && (
                <div className="text-center">
                  <p className="font-pixel text-[7px] text-retro-white/40">OFFICIAL TIME</p>
                  <p className="font-pixel text-xl text-retro-yellow glow-text-gold">
                    {serverResult.totalTime.toFixed(2)}s
                  </p>
                </div>
              )}
              <div className="text-center">
                <p className="font-pixel text-[7px] text-retro-white/40">HITS TAKEN</p>
                <p className="font-pixel text-xl text-retro-pink">
                  {pRef.current.hits}
                </p>
              </div>
            </div>

            {serverResult?.feedback && (
              <div className="border-t border-retro-border pt-3 mt-3 max-h-32 overflow-y-auto">
                {serverResult.feedback.slice(0, 3).map((fb: string, i: number) => (
                  <p key={i} className="font-pixel text-[6px] text-retro-cyan/80 mb-1">[ {fb} ]</p>
                ))}
              </div>
            )}

            {!serverResult && (
              <p className="font-pixel text-[8px] text-retro-white/40 text-center animate-blink">
                CALCULATING OFFICIAL TIME...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── HUD bar helper ────────────────────────────────────────────────────────────
function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  pct: number, color: string, label: string,
) {
  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y, w, h);
  // Fill
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur  = 6;
  ctx.fillStyle   = color;
  ctx.fillRect(x, y, w * pct, h);
  ctx.restore();
  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(x, y, w, h);
  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font      = '6px "Press Start 2P"';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 3, y + h - 2);
}
