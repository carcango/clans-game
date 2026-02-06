# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev       # Vite dev server with HMR (localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview production build locally
```

No test framework is configured. No linter or formatter config exists.

## Tech Stack

- **React 19** + **TypeScript 5.7** (strict mode) + **Vite 6.1**
- **Three.js 0.182** for all 3D rendering (no R3F/react-three-fiber)
- **Tailwind CSS 4.0** via `@tailwindcss/vite` plugin
- No state management library — game state is plain objects passed by reference
- No physics engine — distance-based collision checks only

## Architecture

### Two-Phase App (`App.tsx`)

The app switches between two phases via React state:
1. **Character Select** — pick a hero class (1 of 6) and level (1–3)
2. **Battle** — real-time 3D gameplay with wave-based enemies

### Engine Layer (`src/engine/`)

`GameEngine` is the orchestrator. It owns the Three.js scene and delegates to subsystem classes:

- **PlayerController** — WASD movement, mouse-look (pointer lock), melee/ranged attacks, blocking, sprinting
- **AllyManager / EnemyManager** — AI behavior: targeting, pathfinding, melee/ranged combat, stun handling
- **WaveManager** — spawns enemies/allies per wave with scaling formulas
- **CombatSystem** — melee range+cone checks, ranged projectile collision, block chance, knockback
- **AbilitySystem** — class-specific abilities dispatched via switch on `classId`
- **ParticleSystem** — spawn/update/remove particle effects
- **VoxelCharacterBuilder** — constructs Minecraft-style voxel character meshes from class color palettes
- **TerrainBuilder** — procedural terrain with trees, rocks, banners
- **SceneSetup** — Three.js renderer, camera, lighting, shadows (2048x2048 shadow map)

### React–Three.js Bridge

React does NOT render the 3D scene. The pattern is:
- `useGameLoop` hook runs `requestAnimationFrame`, calls `GameEngine.update(dt)` and `GameEngine.render()`
- HUD state syncs from engine → React every 100ms (throttled to avoid re-render storms)
- `useInputManager` hook captures keyboard/mouse input into a plain `InputState` object the engine reads directly

### Unit Data Model

Characters (player, allies, enemies) are `THREE.Group` objects. Game data lives on `group.userData` as `UnitData` — health, attack state, team, arm references for animation, etc. Managers iterate arrays of groups and mutate `userData` directly.

### Class Definitions

6 hero classes defined in `src/constants/classes.ts` (visual config) and `src/constants/stats.ts` (gameplay stats). Classes scale by level multiplier (1.0 / 1.15 / 1.30). Adding a new class requires entries in both constants files plus an ability handler in `AbilitySystem`.

## Key Conventions

- Game constants (physics, spawn rates, combat tuning) live in `src/constants/game.ts`
- Types are in `src/types/` — `game.ts` (GameState, UnitData, InputState, HUDState) and `hero.ts` (HeroClass, color palettes)
- HUD components are in `src/components/battle/hud/` — each is a small focused component
- `MeshStandardMaterial` is used everywhere for consistent PBR look
- Delta time is clamped to `Math.min(dt, 0.05)` to prevent physics blowup on tab-switch
- Custom fonts: Cinzel (headings), MedievalSharp (flavor text) — loaded via Google Fonts in `index.html`
