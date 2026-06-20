# Rajadhaniya — Project Notes

## Overview
Historical isometric kingdom-building hybrid app. Flutter Web handles menus/map UI; Phaser 3 (v3.60.0) renders the 2.5D isometric game world inside a fullscreen overlay.

## Key Files

| File | Role |
|------|------|
| `web/index.html` | Host page. `#flutter-container` for Flutter UI, `#game-container` (z-index:1000) for Phaser canvas. Phaser CDN loaded here. |
| `web/game_bridge.js` | **All Phaser game logic**. Loading screen, isometric grid, tap movement, radial task menu, task validation, era completion. |
| `web/assets/game/images/loadingscreen.png` | Background image displayed during the loading screen. Replace with final artwork. |
| `lib/main.dart` | Flutter app entry. `_LandscapeWrapper` (16:9, max 960x540), `_onJsEvent` handler for JS bridge callbacks, version-mismatch dialog. |
| `lib/bridge/js_bridge.dart` | Conditional export: stub (non-web/WASM) or web implementation. |
| `lib/bridge/js_bridge_web.dart` | `dart:js` bridge: `callInitGameGrid`, `forceAssetUpdate`, `registerFlutterCallback`, `isGameActive`. |
| `lib/bridge/js_bridge_stub.dart` | No-op stubs for test runner / WASM builds. |
| `lib/screens/era_selection_screen.dart` | 3×2 era card grid. Era card layout: icon + English name + Sinhala name + period + bonus text. Includes static callbacks for JS bridge and CDN settings icon. |
| `lib/screens/language_selection_screen.dart` | Language selection screen shown on the first app launch. Persists selection using `shared_preferences`. |
| `lib/models/historical_era.dart` | `HistoricalEra` model + all 6 era constants. |
| `pubspec.yaml` | Deps: `flutter_map ^7.0.2`, `latlong2 ^0.9.1`. |

## Bridge Flow (Flutter ↔ JS)

```
Flutter: EraSelectionScreen → tap Era Card
  → JsBridge.callInitGameGrid(eraId, eraName, eraBonus, 0.0, 0.0)
  → JS: initGameGrid()
     ├─ Cache HIT  (stored === GAME_ASSET_VERSION)
     │   → hide Flutter, show Phaser, bootPhaserGame(false)
     │   → notifyFlutter({ type: 'game_started' })
     │   → Flutter: EraSelectionScreen.onGameStarted() → pushReplacement(KingdomViewScreen)
     └─ Cache MISS (stored !== GAME_ASSET_VERSION)
         → notifyFlutter({ type: 'version_mismatch' })
         → Flutter: show update dialog
         → User taps "Update & Continue"
         → JsBridge.forceAssetUpdate()
         → JS: hide Flutter, show Phaser, bootPhaserGame(true)
         → notifyFlutter({ type: 'game_started' })
         → Flutter: EraSelectionScreen.onGameStarted() → pushReplacement(KingdomViewScreen)
```

## Game Bridge API (`window.*`)

- **`initGameGrid(eraId, eraName, eraBonus, lat, lng)`** — Entry point from Flutter.
- **`forceAssetUpdate()`** — Clears cache key, swaps containers, boots Phaser with loading screen.
- **`showFlutterUi()`** — Destroys Phaser instance, hides game container, shows Flutter.
- **`notifyFlutter(payload)`** — Sends JSON payload to Flutter's registered callback.
  - `{ type: 'game_started' }` — fired after both cache-hit boot and forced-update boot.
  - `{ type: 'version_mismatch', storedVersion, expectedVersion }` — fired on cache miss.
  - `{ type: 'hud_update', tasks, config }` — fired every time game resources change to update the Flutter Dashboard.
- **`window.localPlayerData`** — Shared player state object.
- **`window.__gameActive`** — Boolean flag; true when Phaser is running.

## Phaser Game Architecture (`game_bridge.js`)

### Scene: `main`
```
preload()
  ├─ load.image('loading_bg', ...)       ← only real HTTP asset
  ├─ [if showLoader] create loading UI    ← solid background graphics
  │   (overlay, bar track, bar fill, Sinhala text)
  ├─ set up load.on('progress', ...)      ← tracks real loader progress
  ├─ set up load.once('complete', ...)    ← marks ui.ready = true
  ├─ generateTexture('grass_tile')        ← procedural
  ├─ generateTexture('player')            ← procedural, era-tinted
  ├─ generateTexture('tree')              ← procedural
  ├─ generateTexture('deer')              ← procedural
  └─ generateTexture('gem_rock')          ← procedural

create()
  ├─ [if showLoader] loaderSequence()     ← grace period + fade-out → buildGame
  └─ [if !showLoader] buildGame()         ← immediate

update()
  └─ (empty; movement is tween-based, not physics)
```

### Loading Screen (`loaderSequence`)
1. Swap solid background for loaded `loading_bg` image (now available in `create()`)
2. Timer ticks every 50ms (max ~2s)
3. Progress = max(native loader progress, elapsed/800ms grace period)
4. Updates bar fill + Sinhala percentage text
5. When grace ≥ 800ms AND loader ready (or 2s timeout), fade-out tween (400ms, Power2)
6. Calls `buildGame()`

### Isometric Grid
- `TILE_W = 64`, `TILE_H = 32`, `GRID = 10`
- `cartToIso(cx, cy)` converts grid coords → screen coords
- `isoToCart(ix, iy)` inverse for tap-to-move
- `tileToWorld(tx, ty, ox, oy)` / `worldToTile(wx, wy, ox, oy)` helpers
- Camera: follows player, zoom 1.5, bounds around grid

### Tap Gestures
- **Single tap**: 280ms delay to distinguish from double-tap. Converts screen → world → tile. Bresenham path → chained 120ms tweens move player tile-by-tile. Sprite flips to face direction.
- **Double tap** (< 280ms, < 30px distance): Stops movement, toggles radial task menu.

### Radial Task Menu (Phaser UI)
- Positioned at player's screen coordinates. `setScrollFactor(0)` elements.
- Three touch zones (80×70px): 🏹 Hunting, 🪵 Wood, 💎 Gem
- Shows progress counters per task. `✕` close button.
- On task tap: proximity check (≤2 tiles from matching resource), consume resource (fade-out animation), increment counter, float text animation (+1 in `#D4AF37`), update HUD.

### Task Config (Prehistoric Era)
| Task | Requirement | Resource Type |
|------|-------------|---------------|
| Hunting | 3 deer | `deer` |
| Wood Scraping | 10 trees | `tree` |
| Gem Mining | 5 gems | `gem_rock` |

### Resources
- Randomly placed on grid (avoiding player spawn).
- Trees: 6, Deer: 4, Gem rocks: 4.
- Subtle idle floating tween (Sine.easeInOut, random duration).

### Era Completion
When all tasks reach 100%:
- `localStorage.setItem('era_anuradhapura_unlocked', 'true')`
- Dark veil overlay + gold-bordered panel
- "යුගය ජයග්‍රහණය කරන ලදී! / Era Completed!" + "Return to Map" button
- Button calls `showFlutterUi()` → Anuradhapura era enabled in Flutter selection screen.

## Asset Version Cache
- Key: `rajadhaniya_asset_version`
- Value: `GAME_ASSET_VERSION = "v1.0.0"`
- Stored on successful boot (cache hit: preload, cache miss: after loading screen)
- On mismatch: Flutter dialog prompts user to update

## Important Constraints
- **Landscape-only**: `_LandscapeWrapper` enforces 16:9 with `ConstrainedBox(maxWidth: 960, maxHeight: 540)`.
- **Platform Views**: The Phaser canvas is now embedded in Flutter using `HtmlElementView`. It is registered conditionally via `platform_view_registry.dart` to prevent non-web build failures.
- **HUD Layering**: Flutter renders the HUD (`KingdomViewScreen`) *on top* of the Phaser canvas. Empty areas of the Flutter UI must be transparent and not consume gestures so taps pass through to Phaser.
- **No DB**: All persistence via `window.localStorage`.
- **Flutter Web only**: No mobile-only plugins (`webview_flutter` etc.).
- **WASM compatible**: Conditional imports (`dart.library.js_interop`) in bridge files and platform registries.
- **Phaser loading**: `loading_bg` image must exist at `assets/game/images/loadingscreen.png` before `buildGame()` runs.

## Common Gotchas
- Never use `s.add.image('loading_bg')` in `preload()` — the image hasn't loaded yet. Use a `Graphics` solid background and swap in `create()`.
- Don't hide `flutter-container` before showing the version-mismatch dialog. Swap happens in `forceAssetUpdate()`.
- When regenerating procedural textures (`generateTexture`), always call `.destroy()` on the temp graphics object to avoid memory leaks.
- `NeverScrollableScrollPhysics()` + `shrinkWrap: true` on GridView can cause overflow errors with constrained layouts. Use scrollable GridView instead.
- `EraSelectionScreen` (public widget) holds the static callbacks `onGameStarted` and `onVersionMismatch`. `main.dart` references the public class to trigger UI transitions.
- `GAME_ASSET_VERSION` already includes the `v` prefix (e.g. `'v1.0.0'`). Do NOT add another `v` in console.log strings.

## After Every Game Change

When you modify `web/game_bridge.js` or any Phaser-related file, update this section with:
1. What changed
2. Why it changed
3. Any new APIs, config keys, or localStorage entries added
4. Side effects or edge cases to be aware of

### Change Log

**2026-06-20**: Firebase Cloud Saves & Google Sign-In Integration.
- **Dependencies**: Added `firebase_core`, `firebase_auth`, `google_sign_in`, and `cloud_firestore` to `pubspec.yaml` and set up the FlutterFire CLI configuration.
- **Authentication Flow**: Created a dedicated `LoginScreen` widget that strictly handles the new `google_sign_in` v7 API (`GoogleSignIn.instance.authenticate()`, `authentication.idToken`) and signs the user into Firebase before the game boots.
- **Firestore Service**: Created `FirestoreService` to handle pushing and pulling game data. Hooked into `_onJsEvent`'s `hud_update` to autosave the player's gold, tasks, and era progress to their Firebase User Document.
- **JS Bridge Cloud Sync**: Added generic `callJs` method to the bridge and exposed `window.restorePlayerData` in Phaser to inject cloud saves directly into `localPlayerData` upon startup.

**2026-06-20**: Micro-Grid Extreme Rendering Optimization.
- **Version Bump**: Incremented `GAME_ASSET_VERSION` to `v1.3.16`.
- **400x400 Micro-Grid**: Transitioned the game to an extreme `16x8` pixel micro-grid (`160,000` logical tiles) to allow hyper-granular movement and collision detection. 
- **Decoupled Visual Rendering**: Solved the catastrophic frame-rate collapse caused by the 160k grid by decoupling the visual assets (Grass, Border Forest, Fog of War) from the logical pathfinding grid. Visual assets now mathematically span `4x4` logical chunks, dropping the WebGL object count back down to 10,000 while maintaining the massive movement resolution.
- **Pathfinding Tune**: Increased A* scan depth and reduced tween duration to `30ms` per tile for a perfectly fluid, continuous movement feel.

**2026-06-20**: Stability Fixes & Harvesting UI Overhaul.
- **Version Bump**: Incremented `GAME_ASSET_VERSION` through `v1.3.11`.
- **WebGL Crash Fix**: Forced Flutter engine to use `renderer: 'html'` in `index.html`. This permanently solves the `WebGL Context lost` crash caused by CanvasKit and Phaser competing for context limits.
- **Sprite Scaling**: Standardized Deer and Cow asset scaling from `0.08` to `0.25` to perfectly match the player and NPC visual dimensions.
- **Harvest Interaction**: Replaced the previous double-tap requirement with an instant single-tap interaction for game grid objects. Tapping an object no longer moves the player character to that tile.
- **UI Redesign**: Completely overhauled the Contextual Popup Menu (`createContextualMenu`). Expanded the layout from 140x130 to 220x180. Added an aesthetic drop-shadow, a dedicated dark-brown top banner with a gold separator line, an interactive `✖` close button, and a clean tabular layout for Time/Yield data. Upgraded action buttons with distinct colors, strokes, and hover areas.
- **Click Bubbling Bug Fixed**: Resolved a critical interaction bug where tapping "Start Harvest" inside the popup would bubble down to the object underneath, causing the menu to instantly re-open and cover the progress bar. Fixed by applying `ev.stopPropagation()` to all popup interaction zones.
- **Progress Render Fix**: Prevented a silent WebGL crash/failure by enforcing a minimum width of `8` on the `fillRoundedRect` harvesting progress bar to satisfy its `4px` border radius requirement.

**2026-06-20**: Sena Kanda (Training Barracks) Dashboard Integration.
- **Flutter UI**: Created `SenaKandaScreen` as a modal bottom sheet to act as the troop training interface.
- **Data Models**: Converted troop JSON data into a strongly-typed `lib/models/troop.dart` constant list for synchronous rendering.
- **Queueing Mechanics**: Implemented a dynamic layout comprising a Top Status Bar (tracking Housing Space and Total Queue Time), a GridView of troop cards with `+/-` selectors, and an Active Training Queue displaying progress bars for currently queued batches.
- **HUD Update**: Added a new "Train" button (shield icon) to `KingdomViewScreen` to launch the dashboard.

**2026-06-20**: AI Asset Replacements & Fences.
- **Version Bump**: Incremented `GAME_ASSET_VERSION` to `v1.3.0`.
- **Fences**: Added `fence` to `BUILDINGS_CONFIG` (Cost: 2 Wood). Fences can be placed via the Flutter Build Menu and act as 1x1 markers. Added a new Contextual Menu option for fences that allows players to "Remove" them, which destroys the sprite, clears the occupied matrix, and refunds 1 Wood to the player.
- **AI Assets**: Completely stripped out all procedural `Graphics` generation for buildings and resources. Replaced them with HTTP-loaded AI-generated PNG sprite assets (`s.load.image`) stored in `assets/game/images/sprites/`.
- **Sprite Scaling**: Rebalanced `.setScale()` calculations in `placeResources`, `startConstruction`, and `placeBorderForest` to accurately map the high-resolution AI images to the 64x32 isometric grid structure.

**2026-06-20**: HUD Responsiveness & Construction Timers.
- **Version Bump**: Incremented `GAME_ASSET_VERSION` to `v1.2.1`.
- **Responsive Layout**: Wrapped `KingdomViewScreen` elements inside `FittedBox` constraints to prevent `RenderFlex` overflow errors on smaller devices. The Build Menu (BottomSheet) now uses `isScrollControlled: true` and a `SingleChildScrollView` constrained to 90% screen height to prevent overlapping.
- **Construction System**: Replaced instant building mechanics with a "Clash of Clans" style construction phase. Placing a building now turns the sprite grey and triggers a 5-second construction progress bar.
- **Load Speed**: Reduced the artificial loading screen `grace` period in `game_bridge.js` from 800ms to 100ms for instantaneous game initialization.

**2026-06-19**: Initial rewrite — integrated loading screen, asset caching, tap-to-move, radial task menu, era completion.
- `GAME_ASSET_VERSION = "v1.0.0"`, cache key `rajadhaniya_asset_version`
- Loading screen: solid bg → loaded image swap, grace period, fade-out
- Single-tap: isometric movement via Bresenham path + tweens
- Double-tap: radial task menu (Hunting / Wood / Gem)
- Task validation: proximity check, resource consumption, float text animation
- Era completion: localStorage unlock, overlay, "Return to Map"

**2026-06-20**: Bug fixes — navigation race condition & console log double-v.
- **Bug fixed**: `_onBeginKingdom()` was unconditionally popping the map screen after 800ms, even on `version_mismatch`. Now navigation only happens when JS fires `{ type: 'game_started' }`.
- **New JS event**: `notifyFlutter({ type: 'game_started' })` fired from both `initGameGrid` (cache-hit) and `forceAssetUpdate` (post-update).
- **Flutter**: `MapInitializationScreen` now exposes two static callbacks: `onGameStarted` (triggers pop) and `onVersionMismatch` (resets spinner). Both registered in `initState`, cleared in `dispose`.
- **Bug fixed**: Console was printing `[Bridge] vv1.0.0 loaded` (double-v). Fixed by removing the redundant `'v'` prefix in the log string.
- **Added**: Noto Sans Sinhala font loaded via Google Fonts in `index.html` — fixes Flutter's "Could not find Noto fonts" warning for Sinhala characters.
- No new localStorage keys or window APIs added.

**2026-06-20**: Era Progression & New Buildings.
- **Version Bump**: Incremented `GAME_ASSET_VERSION` to `v1.1.12`.
- **New Buildings**: Added `workers_hut`, `temple`, `boat_house`, and `lake` to `BUILDINGS_CONFIG` with procedural graphics.
- **Lake Interaction**: A placed `lake` building can now be tapped to open a contextual menu to "Harvest Fish" (`startHarvest`), bridging the building and resource systems.
- **Era Progression**: Replaced the basic "gather 3 resources" logic with an actual city-building task list. The HUD now tracks building placements and fish harvesting to unlock the next era.
- **Flutter UI**: Expanded the Build Menu to a `Wrap` layout to support all 7 building types, and added a secondary `_buildTaskBar` to the HUD to display the new era tasks.

**2026-06-20**: Character Sprite Animation & Web Assets.
- **Version Bump**: Incremented `GAME_ASSET_VERSION` to `v1.1.11`.
- **Sprite Sheet Integration**: Removed the legacy `s.add.graphics()` procedural player logic. Replaced with `scene.load.spritesheet('player')`.
- **Custom Slicing**: Sliced the 1408x768 AI-generated sprite sheet into 352x256 frames, applying `setScale(0.25)` to fit the isometric bounds.
- **Animation Hook**: Created `walk-down` global animation. Hooked `.play()` and `.stop()` into the `nextStep` tween callback for both the Player and the autonomous NPCs.
- **Bug Fix**: Transformed `scene.add.image` NPCs into `scene.add.sprite` to prevent the `npc.play is not a function` TypeError during AI routing.
- **Architecture**: Migrated the HUD (Heads-Up Display) from Phaser to Flutter. Created `KingdomViewScreen` to overlay a premium Flutter UI on top of the Phaser game.
- **Platform Views**: Embedded the Phaser canvas inside Flutter using `HtmlElementView(viewType: 'phaser-game')`. Created `platform_view_registry.dart` with conditional imports (`web.dart` / `stub.dart`) to handle registration.
- **JS Bridge Updates**: `game_bridge.js` no longer hides the Flutter container. Replaced `drawHud` with a new bridge event `window.notifyFlutter({ type: 'hud_update' })` which passes task progress back to Flutter.
- **Phaser 3.60 Fix**: Replaced removed `cameras.main.getScreenPoint` method in radial menu with manual `scrollX`/`scrollY` camera math to fix a crash on double-tap.
- **UI Fixes**: Fixed `RenderFlex` overflow in `EraSelectionScreen` by changing GridView `childAspectRatio` to `1.0`. Fixed deprecated `withOpacity` to `withValues(alpha:)` in map screen.
- **Assets**: Added `assets/images/` to `pubspec.yaml` and generated a high-detail anime avatar (`avatar_temp.png`) for the new player profile HUD.

**2026-06-20**: Onboarding Flow Streamlined.
- **Removed**: `MapInitializationScreen`. The map selection step was removed to allow users to directly enter the game from the Era selection.
- **Added**: `LanguageSelectionScreen`. A first-time launch screen to choose the language, persisted via `shared_preferences`.
- **UI Update**: Added a CDN-loaded settings icon to `EraSelectionScreen` for changing language.
- **Architecture**: Moved JS bridge event listeners (`onGameStarted`, `onVersionMismatch`) to `EraSelectionScreen`.

**2026-06-20**: Clash of Clans Advanced Build System
- **Version Bump**: Incremented `GAME_ASSET_VERSION` to `v1.1.9`.
- **Flutter UI Menu**: Replaced instant-build button with a Flutter Bottom Sheet `_showBuildMenu` in `KingdomViewScreen`. Displays House, Farm, and Mine cards with dynamically checked resource costs.
- **Resource Management**: Flutter verifies if `_hudData` contains enough Gold/Wood/Gems before allowing placement.
- **New Buildings**: Added procedural generation for `farm` and `mine` textures. Updated `BUILDINGS_CONFIG` with their costs and dimensions.
- **Placement Confirmation**: Modified `pointerdown` and `pointermove`. Tapping the grid now locks the ghost building and opens a floating `showBuildConfirmUI` (✅ / ❌). Confirming permanently deducts resources and saves to `localStorage`.

**2026-06-20**: Building Persistence, Particles, & NPC AI
- **Version Bump**: Incremented `GAME_ASSET_VERSION` to `v1.1.8`.
- **Building Persistence**: Added `ghostBuilding._type` injection and saved placed buildings to `localStorage` under `rajadhaniya_buildings`. The `buildGame` boot sequence now reads this JSON and spawns all previously placed buildings automatically, applying `scene._occupied` to them.
- **Animated Particles**: Added procedural `leaf` (green) and `spark` (gold) textures. Created `playHarvestEffect()` to trigger a burst of 15 exploding particles (gravity + fadeout) when a resource finishes harvesting.
- **Autonomous NPC AI**: Spawned 5 "Citizen" NPCs randomly across the grid. Created a self-scheduling recursive loop (`scheduleNPCMove`) that picks a random valid tile and utilizes the custom A* pathfinding algorithm to navigate the grid dynamically, avoiding all buildings and resources.

**2026-06-20**: Grid Building System & A* Pathfinding.
- **Version Bump**: Incremented `GAME_ASSET_VERSION` to `v1.1.7`.
- **Bug Fix**: Removed arcade physics `collideWorldBounds` from the `playerSprite` because the physics engine bounds were snapping the player away from the tweened isometric coordinate, fixing the bug where the player couldn't move.
- **Visual UHD Mesh**: Increased `GRID` size to 100 (10,000 tiles). Added a procedural `shadow` texture and applied `setOrigin(0.5, 0.8)` to objects for realistic placement. Added an atmospheric fog gradient overlay to hide the edges of the grid. Scaled resource generation linearly with the grid size. Constrained camera bounds strictly to the inner area of the diamond, creating an "infinite" full-screen mesh illusion without visible edges. Added vibrant alternating grass shades to create a checkerboard grass mesh with procedural tufts. Added background colors to Flutter Scaffold and Phaser camera to prevent white borders on the edges.
- **Responsive Layout**: Replaced `_LandscapeWrapper`'s strict `ConstrainedBox` with a `LayoutBuilder`. The game now takes up the entire 100% width/height of the screen dynamically when in Landscape mode. If the device is held in Portrait mode, a custom "Please rotate your device" overlay is shown to strictly enforce landscape gameplay.
- **Camera Controls**: Added mouse-wheel and multi-touch pinch-to-zoom support (0.6x to 2.0x zoom limits).
- **Contextual Resource UI**: Replaced the player's double-tap radial menu with direct grid object tapping. Tapping any Tree, Rock, or Deer directly opens a contextual floating UI.
- **Harvest Timers & Gold Boost**: Added a 10-second harvesting timer state for objects with an animated progress bar. Added a "⚡ Boost" button that deducts 50 Gold from the player's balance and finishes the harvest instantly.
- **HUD Update Extension**: Expanded the JS bridge `hud_update` payload to include `localPlayerData.gold`, allowing the Flutter Dashboard to display real-time gold balances.
- **Build Mode**: Added `JsBridge.enterBuildMode(type)` to trigger a "Clash of Clans" style placement mode. Tapping the "Build" button in Flutter spawns a "Ghost Building" in Phaser.
- **Grid Occupancy**: Promoted `occupied` to a scene-level map (`scene._occupied`) to track placement of resources and buildings globally.
- **Isometric Sorting**: Upgraded `sprite.setDepth` logic across all entities (player, resources, buildings) to use `tx + ty + 1` for accurate front-to-back Z-sorting in 2.5D space.
- **Pathfinding**: Completely replaced the old Bresenham line algorithm in `getPath` with a proper **A* (A-Star)** algorithm that dynamically paths the player *around* obstacles and buildings in `scene._occupied`.
