(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════
     STEP 1 – Asset Version Control & Configuration
     ════════════════════════════════════════════════════════ */
  var GAME_ASSET_VERSION = 'v1.5.3';
  var STORAGE_KEY = 'rajadhaniya_asset_version';
  var ERA_UNLOCK_KEY = 'era_anuradhapura_unlocked';
  var MAX_W = 960;
  var MAX_H = 540;
  var TILE_W = 16;
  var TILE_H = 8;
  var GRID = 800;

  var TASKS_CONFIG = {};

  /* ════════════════════════════════════════════════════════
     Runtime State
     ════════════════════════════════════════════════════════ */
  var phaserInstance = null;
  var pendingEraId = 'prehistoric';
  var pendingLat = 0;
  var pendingLng = 0;
  var playerSprite = null;
  var hudText = null;
  var resourceSprites = [];
  var npcSprites = [];
  var taskProgress = { hunting: 10, wood: 15, gem: 5, house: 0, workers_hut: 0, temple: 0, boat_house: 0, lake: 0, fish: 0, fence: 0 };
  var radialMenuContainer = null;
  var radialMenuElements = null;
  var isMoving = false;
  var isMenuOpen = false;
  var activeFenceOverlay = null;
  var selectedUnit = null;
  var selectionRing = null;
  /* CoC Map Globals */
  var BORDER = 40;
  var FOG_RADIUS = 32;
  var fogSprites = {};
  var revealedTiles = {};
  var enemyKingdoms = [];
  var eraId = 'prehistoric';
  var eraName = '';
  var lat = 0;
  var lng = 0;
  var BUILDINGS_CONFIG = {
    house:       { w: 8, h: 8, texture: 'house',       costs: { gold: 50, wood: 5 }, name: 'House' },
    farm:        { w: 8, h: 8, texture: 'farm',        costs: { gold: 100, wood: 10 }, name: 'Farm' },
    mine:        { w: 8, h: 8, texture: 'mine',        costs: { gold: 150, wood: 5, gem: 5 }, name: 'Mine' },
    workers_hut: { w: 8, h: 8, texture: 'workers_hut', costs: { gold: 80, wood: 10 }, name: 'Workers Hut' },
    temple:      { w: 12, h: 12, texture: 'temple',      costs: { gold: 300, wood: 20, gem: 5 }, name: 'Temple' },
    lake:        { w: 16, h: 16, texture: 'lake',        costs: { gold: 50, wood: 5 }, name: 'Lake' },
    boat_house:  { w: 8, h: 8, texture: 'boat_house',  costs: { gold: 120, wood: 15 }, name: 'Boat House' },
    fence:       { w: 4, h: 4, texture: 'fence',       costs: { wood: 2 }, name: 'Fence' }
  };
  var currentBuildMode = null;
  var ghostBuilding = null;
  var buildConfirmElements = null;
  var GLOBAL_CONFIG = { treeClearCost: 100 };
  /* Drag-and-Drop Fences */
  var isDragBuilding = false;
  var dragStartTile = null;
  var dragFenceCoords = [];
  var dragFenceGhosts = [];
  var dragArrows = [];
  /* Edit / Drag-and-Drop globals */
  var editMode = null;        // holds the building object being repositioned
  var editGhost = null;       // ghost sprite shown while dragging
  var editValidOverlay = null;// green/red tint overlay
  var editOrigTx = 0;         // original tile position before move
  var editOrigTy = 0;
  var longPressTimer = null;  // Phaser timer for long-press detection
  var longPressPtr = null;    // pointer that triggered long-press

  var localPlayerData = {
    eraId: '', eraName: '', eraBonus: '', lat: 0, lng: 0,
    role: 'Citizen', gold: 500,
    inventory: { wood: 10, stone: 5, food: 20, meat: 0, milk: 0 },
    character: { name: '', avatar: '' },
    needs: { hunger: 100, thirst: 100, hygiene: 100, toilet: 100 },
    health: 100
  };
  window.localPlayerData = localPlayerData;

  window.restorePlayerData = function(payloadJson) {
    try {
      var cloudData = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson;
      if (cloudData && cloudData.health !== undefined) {
        localPlayerData.health = cloudData.health;
      }
      if (cloudData && cloudData.gold !== undefined) {
        localPlayerData.gold = cloudData.gold;
      }
      if (cloudData && cloudData.era_id) {
        localPlayerData.eraId = cloudData.era_id;
      }
      if (cloudData && cloudData.tasks) {
        Object.assign(taskProgress, cloudData.tasks);
      }
      if (cloudData && cloudData.needs) {
        Object.assign(localPlayerData.needs, cloudData.needs);
      }
      if (cloudData && cloudData.buildings) {
        localStorage.setItem('rajadhaniya_buildings', JSON.stringify(cloudData.buildings));
      }
      console.log('[Bridge] Restored player data from cloud save:', cloudData);
    } catch (e) {
      console.error('[Bridge] Failed to restore cloud data:', e);
    }
  };
  window.__gameActive = false;
  window.__forceSync = false;

  var eraCharacterMap = {
    prehistoric:   { name: '\u0D9C\u0DDD\u0DAD\u0DCA\u200D\u0DBB\u0DD2\u0D9A \u0DC0\u0DD0\u0DC3\u0DD2\u0DBA\u0DCF', en: 'Tribal Settler' },
    anuradhapura:  { name: '\u0DBB\u0DA2\u0DBB\u0DA7 \u0D9C\u0DDC\u0DC0\u0DD2\u0DBA\u0DCF', en: 'Rajarna Farmer' },
    polonnaruwa:   { name: '\u0DB4\u0DDC\u0DC5\u0DDC\u0DB1\u0DCA\u0DB1\u0DBB\u0DD4 \u0DC0\u0DD9\u0DC5\u0DD9\u0DB1\u0DCA\u0DAF\u0DCF', en: 'Polonnaruwa Trader' },
    transitional:  { name: '\u0DB8\u0DCF\u0DBA\u0DD2\u0DB8\u0DCA \u0DBB\u0D9A\u0DD2\u0DB1\u0DCA\u0DB1\u0DCF', en: 'Border Guardian' },
    colonial:      { name: '\u0DBA\u0DA7\u0DAD\u0DCA\u0DC0\u0DD0\u0DC3\u0DD2 \u0DC0\u0DD9\u0DC5\u0DD9\u0DB1\u0DCA\u0DAF\u0DCF', en: 'Colonial Merchant' },
    modern:        { name: '\u0DB1\u0DCF\u0D9C\u0DBB\u0DD2\u0D9A \u0DB4\u0DCA\u200D\u0DBB\u0DA2\u0DCF\u0DC0', en: 'Urban Citizen' },
  };

  var eraColors = {
    prehistoric: 0x8B4513, anuradhapura: 0x2E7D32, polonnaruwa: 0xD4A017,
    transitional: 0x6A5ACD, colonial: 0x1E3A5F, modern: 0x37474F,
  };

  /* ════════════════════════════════════════════════════════
     Flutter Bridge API
     ════════════════════════════════════════════════════════ */
  window.initGameGrid = function (eId, eName, eBonus, eLat, eLng, lang, configJson) {
    window.gameLanguage = lang || 'en';
    if (configJson) {
      try {
        var parsedConfig = JSON.parse(configJson);
        if (parsedConfig.buildings) {
          BUILDINGS_CONFIG = parsedConfig.buildings;
        }
        if (parsedConfig.global) {
          GLOBAL_CONFIG = parsedConfig.global;
        }
      } catch (e) {
        console.error('[Bridge] Failed to parse configJson:', e);
      }
    }
    console.log('[Bridge] initGameGrid era=' + eId + ' lat=' + eLat + ' lng=' + eLng + ' lang=' + lang);
    pendingEraId = eId;
    pendingLat = eLat;
    pendingLng = eLng;

    var ci = eraCharacterMap[eId] || eraCharacterMap.prehistoric;
    Object.assign(localPlayerData, {
      eraId: eId, eraName: eName, eraBonus: eBonus, lat: eLat, lng: eLng,
      role: 'Citizen',
      character: { name: ci.name, avatar: eId },
    });
    window.__gameState = { eraId: eId, originLat: eLat, originLng: eLng };

    var stored = localStorage.getItem(STORAGE_KEY);
    if (!stored || stored === GAME_ASSET_VERSION) {
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, GAME_ASSET_VERSION);
      }
      console.log('[Cache] match (' + GAME_ASSET_VERSION + ') – booting');
      bootPhaserGame(false);
      /* Notify Flutter that the game is starting (cache-hit path) */
      window.notifyFlutter({ type: 'game_started' });
    } else {
      console.log('[Cache] mismatch stored=' + (stored || 'none') + ' expected=' + GAME_ASSET_VERSION);
      /* keep flutter visible so the update dialog appears */
      window.notifyFlutter({
        type: 'version_mismatch',
        storedVersion: stored || 'none',
        expectedVersion: GAME_ASSET_VERSION,
      });
    }
  };

  window.showFlutterUi = function () {
    window.__gameActive = false;
    if (phaserInstance) { phaserInstance.destroy(true); phaserInstance = null; }
  };

  window.notifyFlutter = function (payload) {
    if (typeof window.FlutterBridge !== 'undefined') {
      window.FlutterBridge.postMessage(JSON.stringify(payload));
    } else if (typeof window._flutterCallback === 'function') {
      window._flutterCallback(JSON.stringify(payload));
    } else {
      console.warn('[Bridge] Flutter callback not registered');
    }
  };

  window.forceAssetUpdate = function () {
    console.log('[Cache] force update - reloading page');
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload(true);
  };

  window.checkAssetVersion = function () {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== GAME_ASSET_VERSION) {
      window.notifyFlutter({
        type: 'version_mismatch',
        storedVersion: stored || 'none',
        expectedVersion: GAME_ASSET_VERSION,
      });
    }
  };

  window.checkRemoteAssetVersion = function() {
    fetch('version.json?t=' + new Date().getTime())
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.version) {
          var remoteVersion = data.version;
          if (remoteVersion !== GAME_ASSET_VERSION) {
            console.log('[Cache] Remote update detected: ' + remoteVersion);
            window.notifyFlutter({
              type: 'version_mismatch',
              storedVersion: GAME_ASSET_VERSION,
              expectedVersion: remoteVersion
            });
          }
        }
      }).catch(function(e) { console.error('[Bridge] Update check failed:', e); });
  };

  window.flutterGameAction = function (payloadStr) {
    if (!phaserInstance || !window.__gameActive) return;
    try {
      var payload = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
      var scene = phaserInstance.scene.scenes[0];
      if (!scene) return;

      if (payload.action === 'confirm_build') {
        if (typeof scene._confirmBuild === 'function') scene._confirmBuild();
      } else if (payload.action === 'cancel_build') {
        if (typeof scene._cancelBuild === 'function') scene._cancelBuild();
      } else if (payload.action === 'start_harvest') {
        if (typeof scene._startHarvest === 'function') scene._startHarvest(payload.tx, payload.ty, payload.taskKey);
      } else if (payload.action === 'boost_harvest') {
        if (typeof scene._boostHarvest === 'function') scene._boostHarvest(payload.tx, payload.ty, payload.taskKey);
      } else if (payload.action === 'remove_building') {
        if (typeof scene._removeBuilding === 'function') scene._removeBuilding(payload.tx, payload.ty);
      } else if (payload.action === 'upgrade_building') {
        if (typeof scene._upgradeBuilding === 'function') scene._upgradeBuilding(payload.tx, payload.ty, payload.cost);
      } else if (payload.action === 'clear_border') {
        if (typeof scene._clearBorderTree === 'function') scene._clearBorderTree(payload.tx, payload.ty, payload.cost);
      } else if (payload.action === 'execute_attack') {
        if (typeof scene._executeAttack === 'function') scene._executeAttack(payload.tx, payload.ty);
      } else if (payload.action === 'respawn') {
        if (typeof scene._respawn === 'function') scene._respawn();
      } else if (payload.action === 'feed_player') {
         if (typeof scene._feedPlayer === 'function') scene._feedPlayer(payload.amount);
      } else if (payload.action === 'hydrate_player') {
         if (typeof scene._hydratePlayer === 'function') scene._hydratePlayer(payload.amount);
      } else if (payload.action === 'clean_player') {
         if (typeof scene._cleanPlayer === 'function') scene._cleanPlayer(payload.amount);
      } else if (payload.action === 'toilet_player') {
         if (typeof scene._toiletPlayer === 'function') scene._toiletPlayer();
      } else if (payload.action === 'close_menu') {
         isMenuOpen = false;
      } else if (payload.action === 'upgrade_era') {
         if (typeof scene._upgradeEra === 'function') scene._upgradeEra();
      } else if (payload.action === 'force_reboot') {
         if (window.forceAssetUpdate) window.forceAssetUpdate();
      } else if (payload.action === 'spawn_troop') {
         if (typeof scene._spawnTroop === 'function') scene._spawnTroop(payload.troopId, payload.originX, payload.originY);
      }
    } catch (e) {
      console.error('[Bridge] Failed to parse flutterGameAction payload:', e);
    }
  };

  /* Offline Detection */
  window.addEventListener('online', function() {
    window.notifyFlutter({ type: 'network_status', isOnline: true });
  });
  window.addEventListener('offline', function() {
    window.notifyFlutter({ type: 'network_status', isOnline: false });
  });
  setTimeout(function() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      window.notifyFlutter({ type: 'network_status', isOnline: false });
    }
  }, 1000);

  window.enterBuildMode = function (type) {
    if (!phaserInstance || !window.__gameActive) return;
    var scene = phaserInstance.scene.scenes[0];
    if (scene) {
      // Check Builder Capacity (Fences do not use builders)
      if (type !== 'fence') {
         var totalBuilders = scene._buildings.some(function(b) { return b.type === 'workers_hut' && b.is_completed; }) ? 2 : 1;
         var activeBuilders = scene._buildings.filter(function(b) { return b.is_completed === false; }).length;
         
         if (activeBuilders >= totalBuilders) {
            window.notifyFlutter({
               type: 'show_snackbar',
               message: 'All builders are busy! Wait for a task to finish.'
            });
            return;
         }
      }

      if (ghostBuilding) ghostBuilding.destroy();
      currentBuildMode = type;
      var config = BUILDINGS_CONFIG[type];
      ghostBuilding = scene.add.image(0, 0, config.texture).setAlpha(0.6).setDepth(1000).setOrigin(0.5, 0.8).setScale(0.12);
      ghostBuilding._config = config;
      ghostBuilding._type = type;
    }
  };

  /* ════════════════════════════════════════════════════════
     Isometric Math Helpers
     ════════════════════════════════════════════════════════ */
  function cartToIso(cx, cy) {
    return { x: (cx - cy) * TILE_W / 2, y: (cx + cy) * TILE_H / 2 };
  }

  function isoToCart(ix, iy) {
    var a = ix / (TILE_W / 2);
    var b = iy / (TILE_H / 2);
    return { cx: (a + b) / 2, cy: (b - a) / 2 };
  }

  function tileToWorld(tx, ty, ox, oy) {
    var iso = cartToIso(tx, ty);
    return { x: iso.x + ox + TILE_W / 2, y: iso.y + oy + TILE_H / 2 };
  }

  function worldToTile(wx, wy, ox, oy) {
    var ix = wx - ox - TILE_W / 2;
    var iy = wy - oy - TILE_H / 2;
    var cart = isoToCart(ix, iy);
    return { tx: Math.round(cart.cx), ty: Math.round(cart.cy) };
  }

  function getPathAsync(scene, x0, y0, x1, y1, rangeObj, callback) {
    var targetRect = (typeof rangeObj === 'object' && rangeObj !== null) ? rangeObj : null;
    var range = targetRect ? 0 : (rangeObj || 0);

    var openSet = [{ x: x0, y: y0, g: 0, f: 0, parent: null }];
    var closedSet = {};
    var maxStepsTotal = 5000;
    var stepsTaken = 0;
    
    function makeKey(x, y) { return x + ',' + y; }

    function heuristic(x, y) {
      if (targetRect) {
        var dx = Math.max(targetRect.tx - x, 0, x - (targetRect.tx + targetRect.w - 1));
        var dy = Math.max(targetRect.ty - y, 0, y - (targetRect.ty + targetRect.h - 1));
        return dx + dy;
      }
      return Math.abs(x - x1) + Math.abs(y - y1);
    }
    
    function processChunk() {
      var stepsThisFrame = 0;
      while(openSet.length > 0 && stepsTaken < maxStepsTotal && stepsThisFrame < 300) {
        stepsTaken++;
        stepsThisFrame++;
        openSet.sort(function(a, b) { return a.f - b.f; });
        var current = openSet.shift();
        var key = makeKey(current.x, current.y);
        
        var reached = false;
        if (targetRect) {
          var dx = Math.max(targetRect.tx - current.x, 0, current.x - (targetRect.tx + targetRect.w - 1));
          var dy = Math.max(targetRect.ty - current.y, 0, current.y - (targetRect.ty + targetRect.h - 1));
          reached = (dx + dy <= 1); // 1 = exactly adjacent
        } else {
          reached = (Math.abs(current.x - x1) + Math.abs(current.y - y1) <= range);
        }

        if (reached) {
          var path = [];
          var curr = current;
          while(curr) { path.unshift({x: curr.x, y: curr.y}); curr = curr.parent; }
          return callback(path);
        }
        
        closedSet[key] = true;
        var neighbors = [
          {x: current.x, y: current.y - 1}, {x: current.x, y: current.y + 1},
          {x: current.x - 1, y: current.y}, {x: current.x + 1, y: current.y}
        ];
        
        for (var i = 0; i < neighbors.length; i++) {
          var n = neighbors[i];
          if (n.x < 0 || n.x >= GRID || n.y < 0 || n.y >= GRID) continue;
          if (scene._barriers && scene._barriers[makeKey(n.x, n.y)]) continue; // fence = absolute barrier
          if (scene._occupied[makeKey(n.x, n.y)]) continue; // fully block since we stop adjacent anyway
          if (closedSet[makeKey(n.x, n.y)]) continue;
          
          var tentativeG = current.g + 1;
          var inOpen = openSet.find(function(node) { return node.x === n.x && node.y === n.y; });
          if (!inOpen) {
            openSet.push({x: n.x, y: n.y, g: tentativeG, f: tentativeG + heuristic(n.x, n.y), parent: current});
          } else if (tentativeG < inOpen.g) {
            inOpen.g = tentativeG; inOpen.f = tentativeG + heuristic(n.x, n.y); inOpen.parent = current;
          }
        }
      }
      if (openSet.length > 0 && stepsTaken < maxStepsTotal) {
        scene.time.delayedCall(1, processChunk);
      } else {
        callback([]);
      }
    }
    processChunk();
  }

  function distToTile(tx, ty, targetRes) {
    var dx = tx - targetRes.tileX;
    var dy = ty - targetRes.tileY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function findEnclosedFencedAreas(scene) {
    var minX = GRID, maxX = -1, minY = GRID, maxY = -1;
    var fenceTiles = {};
    for (var i=0; i<scene._buildings.length; i++) {
      var b = scene._buildings[i];
      if (b.type === 'fence') {
        for(var r=0; r<4; r++) {
          for(var c=0; c<4; c++) {
            var ftx = b.tx + c;
            var fty = b.ty + r;
            fenceTiles[ftx+','+fty] = true;
            if (ftx < minX) minX = ftx;
            if (ftx > maxX) maxX = ftx;
            if (fty < minY) minY = fty;
            if (fty > maxY) maxY = fty;
          }
        }
      }
    }
    if (maxX < 0) return []; // No fences

    minX -= 1; maxX += 1;
    minY -= 1; maxY += 1;
    minX = Math.max(0, minX);
    maxX = Math.min(GRID - 1, maxX);
    minY = Math.max(0, minY);
    maxY = Math.min(GRID - 1, maxY);

    var visited = {};
    var queue = [];
    for (var x = minX; x <= maxX; x++) { queue.push({x: x, y: minY}); queue.push({x: x, y: maxY}); }
    for (var y = minY + 1; y <= maxY - 1; y++) { queue.push({x: minX, y: y}); queue.push({x: maxX, y: y}); }

    var head = 0;
    while(head < queue.length) {
      var curr = queue[head++];
      var key = curr.x + ',' + curr.y;
      if (visited[key]) continue;
      if (fenceTiles[key]) continue; // Fences block the flood fill
      
      visited[key] = true;
      var nx, ny;
      nx = curr.x - 1; ny = curr.y;
      if (nx >= minX && !visited[nx+','+ny] && !fenceTiles[nx+','+ny]) queue.push({x:nx, y:ny});
      nx = curr.x + 1; ny = curr.y;
      if (nx <= maxX && !visited[nx+','+ny] && !fenceTiles[nx+','+ny]) queue.push({x:nx, y:ny});
      nx = curr.x; ny = curr.y - 1;
      if (ny >= minY && !visited[nx+','+ny] && !fenceTiles[nx+','+ny]) queue.push({x:nx, y:ny});
      nx = curr.x; ny = curr.y + 1;
      if (ny <= maxY && !visited[nx+','+ny] && !fenceTiles[nx+','+ny]) queue.push({x:nx, y:ny});
    }

    var enclosedEmpty4x4 = [];
    for (var x = minX + 1; x < maxX - 3; x++) {
      for (var y = minY + 1; y < maxY - 3; y++) {
        if (!visited[x+','+y] && !fenceTiles[x+','+y]) {
          var empty = true;
          for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
              var k = (x+c)+','+(y+r);
              // Must not be flood filled, not a fence, and completely empty of other things
              if (visited[k] || fenceTiles[k] || scene._occupied[k]) {
                empty = false; break;
              }
            }
            if (!empty) break;
          }
          if (empty) {
            enclosedEmpty4x4.push({x: x, y: y});
          }
        }
      }
    }
    return { emptySpots: enclosedEmpty4x4, visitedOutside: visited, fences: fenceTiles };
  }

  /* ════════════════════════════════════════════════════════
     PHASER BOOT
     ════════════════════════════════════════════════════════ */
  function bootPhaserGame(showLoader) {
    var gameW = Math.min(MAX_W, window.innerWidth);
    var gameH = Math.min(MAX_H, window.innerHeight);
    window.__gameActive = true;
    if (phaserInstance) phaserInstance.destroy(true);

    /* hoisted so the closure always references current values */
    eraId = pendingEraId;
    eraName = localPlayerData.eraName;
    lat = pendingLat;
    lng = pendingLng;
    resourceSprites = [];
    taskProgress = { hunting: 10, wood: 15, gem: 5, house: 0, workers_hut: 0, temple: 0, boat_house: 0, lake: 0, fish: 0 };
    isMoving = false;
    isMenuOpen = false;
    playerSprite = null;
    hudText = null;
    radialMenuContainer = null;
    radialMenuElements = null;

    var GameScene = new Phaser.Class({
      Extends: Phaser.Scene,
      initialize: function GameScene() {
        Phaser.Scene.call(this, { key: 'main' });
      },

      /* ─── PRELOAD ─── */
      preload: function () {
        var s = this;
        s.load.image('loading_bg', 'assets/game/images/loadingscreen.png');

        /* build loading bar UI immediately so progress listener can use it */
        if (showLoader) {
          var W = s.cameras.main.width;
          var H = s.cameras.main.height;
          var bcX = W / 2, bcY = H * 0.78, bW = 360, bH = 22, bX = bcX - bW / 2;

          /* use a solid background until loading_bg finishes */
          var bg = s.add.graphics().setDepth(0);
          bg.fillStyle(0x1A1512, 1); bg.fillRect(0, 0, W, H);

          var ov = s.add.graphics().setDepth(1);
          ov.fillStyle(0x000000, 0.35); ov.fillRect(0, 0, W, H);

          var tr = s.add.graphics().setDepth(2);
          tr.fillStyle(0x2C2520, 1); tr.fillRoundedRect(bX, bcY, bW, bH, 6);
          tr.lineStyle(2, 0xFFB300, 0.9); tr.strokeRoundedRect(bX, bcY, bW, bH, 6);

          var fl = s.add.graphics().setDepth(3);

          var pt = s.add.text(bcX, bcY + bH + 18, '', {
            fontFamily: 'GameFont',
            fontSize: '14px', color: '#FFD700',
          }).setOrigin(0.5).setDepth(4);

          s._ldUI = { bg: bg, ov: ov, tr: tr, fl: fl, pt: pt, bX: bX, bcY: bcY, bW: bW, bH: bH, ready: false };

          s.load.on('progress', function (v) {
            if (s._ldUI) s._ldUI._progress = v;
          });
          s.load.once('complete', function () {
            if (s._ldUI) s._ldUI.ready = true;
          });
          s.load.on('loaderror', function () {
            if (s._ldUI) s._ldUI.ready = true;
          });
        }

        /* procedural textures */
        var color = eraColors[eraId] || 0x2E7D32;

        function generateNaturalGrass(key, baseColorHex, tuftColor, isDarker) {
          var gw = 256;
          var gh = 128;
          var g = s.add.graphics();
          g.fillStyle(baseColorHex, 1);
          g.beginPath(); g.moveTo(gw / 2, 0); g.lineTo(gw, gh / 2);
          g.lineTo(gw / 2, gh); g.lineTo(0, gh / 2); g.closePath();
          g.fillPath(); 
          g.lineStyle(1, isDarker ? 0x33691e : 0x558b2f, 0.3); g.strokePath();

          // Scatter random lines to simulate dense natural grass
          for (var i = 0; i < 600; i++) {
             var px = Math.random() * gw;
             var py = Math.random() * gh;
             var dx = Math.abs(px - gw/2) / (gw/2);
             var dy = Math.abs(py - gh/2) / (gh/2);
             if (dx + dy <= 0.85) { // Ensure it stays inside the diamond bounds
                var alpha = 0.2 + Math.random() * 0.4;
                var shade = Math.random() > 0.5 ? tuftColor : (isDarker ? 0x2e7d32 : 0x8bc34a);
                g.lineStyle(1, shade, alpha);
                var tuftH = 2 + Math.random() * 3;
                g.beginPath();
                g.moveTo(px, py);
                g.lineTo(px + (Math.random() * 2 - 1), py - tuftH);
                g.strokePath();
             }
          }
          g.generateTexture(key, gw, gh); g.destroy();
        }

        generateNaturalGrass('grass_tile', 0x7cb342, 0x558b2f, false);
        generateNaturalGrass('grass_tile_2', 0x689f38, 0x33691e, true);

        /* shadow */
        var sg = s.add.graphics();
        sg.fillStyle(0x000000, 1); sg.fillEllipse(16, 8, 32, 16);
        sg.generateTexture('shadow', 32, 16); sg.destroy();

        /* Load Generated Assets Dynamically Based on Era */
        var v = '?v=' + GAME_ASSET_VERSION;
        // Temporary fallback: Only 'prehistoric' assets exist right now.
        // If the player advances to another era, use prehistoric assets to prevent 404 crashes/green screens.
        var safeEraId = (eraId === 'prehistoric') ? 'prehistoric' : 'prehistoric';
        var eraFolder = 'assets/game/images/sprites/' + safeEraId + '/';
        var commonFolder = 'assets/game/images/sprites/';

        s.load.audio('loading_music', 'assets/game/audio/loading_music.mp3' + v);
        
        // Common assets (trees, resources, etc.)
        s.load.image('tree', commonFolder + 'tree.webp' + v);
        s.load.spritesheet('deer', commonFolder + 'cow.webp' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.image('gem_rock', commonFolder + 'gem_rock.webp' + v);
        
        // Custom troops and wildlife
        s.load.spritesheet('wolf', commonFolder + 'wolf.png' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.spritesheet('bear', commonFolder + 'bear.png' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.spritesheet('troop', commonFolder + 'troop.png' + v, { frameWidth: 256, frameHeight: 256 });

        // Era-specific character sprite sheets
        s.load.spritesheet('player', eraFolder + 'walkingemptyhand.webp' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.spritesheet('player_axe', eraFolder + 'taskwithaex.webp' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.spritesheet('player_pickaxe', eraFolder + 'taskhandonrock.webp' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.spritesheet('npc_farmer', eraFolder + 'npc_farmer.webp' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.spritesheet('npc_lumberjack', eraFolder + 'npc_lumberjack.webp' + v, { frameWidth: 256, frameHeight: 256 });

        // Era-specific buildings
        s.load.image('house', eraFolder + 'house.webp' + v);
        s.load.image('farm', eraFolder + 'farm.webp' + v);
        s.load.image('mine', eraFolder + 'mine.webp' + v);
        s.load.image('workers_hut', eraFolder + 'workers_hut.webp' + v);
        s.load.image('temple', eraFolder + 'temple.webp' + v);
        s.load.image('lake', eraFolder + 'lake.webp' + v);
        s.load.image('boat_house', eraFolder + 'boat_house.webp' + v);
        s.load.image('cow_farm', eraFolder + 'cow_farm.webp' + v);
        // lumber_camp and sena_kanda reuse existing textures (workers_hut)
        // No separate file needed — BUILDINGS_CONFIG maps them to 'workers_hut' texture
        
        s.load.image('fence', eraFolder + 'fence.webp' + v);
        s.load.image('enemy_base', eraFolder + 'enemy_base.webp' + v);
        s.load.image('sena_kanda', eraFolder + 'workers_hut.webp' + v);
        s.load.image('lumber_camp', eraFolder + 'workers_hut.webp' + v);
        /* particles */
        var pg1 = s.add.graphics();
        pg1.fillStyle(0x4CAF50, 1); pg1.fillCircle(4, 4, 4);
        pg1.generateTexture('leaf', 8, 8); pg1.clear();
        pg1.fillStyle(0xFFD700, 1); pg1.fillCircle(3, 3, 3);
        pg1.generateTexture('spark', 6, 6); pg1.destroy();


        if (!showLoader) localStorage.setItem(STORAGE_KEY, GAME_ASSET_VERSION);
      },

      /* ─── CREATE ─── */
      create: function () {
        var s = this;

        // Create animations from the spritesheet frames
        if (s.textures.exists('player')) {
          s.anims.create({ key: 'walk-down', frames: s.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        }
        if (s.textures.exists('player_axe')) {
          s.anims.create({ key: 'action-axe', frames: s.anims.generateFrameNumbers('player_axe', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        }
        if (s.textures.exists('player_pickaxe')) {
          s.anims.create({ key: 'action-pickaxe', frames: s.anims.generateFrameNumbers('player_pickaxe', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        }
        if (s.textures.exists('deer')) {
          s.anims.create({
            key: 'cow-walk',
            frames: s.anims.generateFrameNumbers('deer', { start: 0, end: 3 }),
            frameRate: 4,
            repeat: -1
          });
        }
        // Custom Wildlife Animations
        if (s.textures.exists('wolf')) {
          s.anims.create({ key: 'wolf-idle', frames: s.anims.generateFrameNumbers('wolf', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
          s.anims.create({ key: 'wolf-walk', frames: s.anims.generateFrameNumbers('wolf', { start: 4, end: 7 }), frameRate: 10, repeat: -1 });
          s.anims.create({ key: 'wolf-attack', frames: s.anims.generateFrameNumbers('wolf', { start: 8, end: 11 }), frameRate: 12, repeat: 0 });
        }
        if (s.textures.exists('bear')) {
          s.anims.create({ key: 'bear-idle', frames: s.anims.generateFrameNumbers('bear', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
          s.anims.create({ key: 'bear-walk', frames: s.anims.generateFrameNumbers('bear', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
          s.anims.create({ key: 'bear-attack', frames: s.anims.generateFrameNumbers('bear', { start: 8, end: 11 }), frameRate: 10, repeat: 0 });
        }
        
        // Custom Troop Animations
        if (s.textures.exists('troop')) {
          s.anims.create({ key: 'troop-idle', frames: s.anims.generateFrameNumbers('troop', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
          s.anims.create({ key: 'troop-walk', frames: s.anims.generateFrameNumbers('troop', { start: 4, end: 7 }), frameRate: 10, repeat: -1 });
          s.anims.create({ key: 'troop-attack-axe', frames: s.anims.generateFrameNumbers('troop', { start: 8, end: 11 }), frameRate: 12, repeat: 0 });
        }

        if (showLoader) {
          loaderSequence(s, function () {
            localStorage.setItem(STORAGE_KEY, GAME_ASSET_VERSION);
            buildGame(s);
          });
        } else {
          buildGame(s);
        }
      },

      /* ─── UPDATE ─── */
      update: function () {
        if (!playerSprite || !playerSprite.body || isMoving) return;
      },
    });

    phaserInstance = new Phaser.Game({
      type: Phaser.AUTO,
      width: gameW,
      height: gameH,
      parent: window._phaserDiv || 'game-container',
      backgroundColor: '#689F38',
      physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
      scene: GameScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });

    window.addEventListener('resize', function() {
      if (phaserInstance && window.__gameActive) {
        phaserInstance.scale.resize(window.innerWidth, window.innerHeight);
      }
    });

    /* ──────────────────────────────────────────────
       LOADER SEQUENCE – grace period + fade-out
       ────────────────────────────────────────────── */
    function loaderSequence(scene, onDone) {
      var ui = scene._ldUI;
      if (!ui) return onDone();

      /* swap solid bg for the real loaded image (now available) */
      var W = scene.cameras.main.width;
      var H = scene.cameras.main.height;
      if (scene.textures.exists('loading_bg')) {
        ui.bg.destroy();
        var loadedBg = scene.add.image(W / 2, H / 2, 'loading_bg').setDisplaySize(W, H).setDepth(0);
        ui.bg = loadedBg;
      }

      /* Play Loading Music */
      var loadingAudio = null;
      if (scene.cache.audio.exists('loading_music')) {
         loadingAudio = scene.sound.add('loading_music', { loop: true, volume: 0.8 });
         // In web browsers, audio might be blocked without gesture, but the initial flutter tap satisfies this
         loadingAudio.play();
      }

      var grace = 100, elapsed = 0, isFading = false;
      var loaderTimer = scene.time.addEvent({
        delay: 50,
        repeat: 199,
        callback: function () {
          if (isFading) return;
          elapsed += 50;
          var nativeP = ui._progress || 0;
          var display = Math.max(nativeP, Math.min(1, elapsed / grace));

          ui.fl.clear();
          ui.fl.fillStyle(0xD4AF37, 1);
          ui.fl.fillRoundedRect(ui.bX, ui.bcY, ui.bW * display, ui.bH, 4);
          if (ui.pt && ui.pt.active) {
            ui.pt.setText(
              '\u0DC3\u0DB8\u0DCA\u0DB4\u0DAD\u0DCA \u0DB6\u0DCF\u0D9C\u0DAD \u0DC0\u0DD9\u0DB8\u0DD2\u0DB1\u0DCA \u0DB4\u0DC0\u0DAD\u0DD2\u0DB1\u0DCA\u0DB1\u0DDA... ' +
              Math.round(display * 100) + '%'
            );
          }

          if (elapsed >= grace && (ui.ready || elapsed >= 10000)) {
            isFading = true;
            if (loaderTimer) loaderTimer.remove();
            if (ui.pt && ui.pt.active) ui.pt.setText('\u0DC3\u0DB8\u0DCD\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB\u0DBA\u0DD2!');
            
            // Fade out audio alongside visuals
            if (loadingAudio) {
              scene.tweens.add({
                targets: loadingAudio,
                volume: 0,
                duration: 400,
                onComplete: function () { loadingAudio.stop(); }
              });
            }

            scene.tweens.add({
              targets: [ui.bg, ui.ov, ui.tr, ui.fl, ui.pt],
              alpha: 0, duration: 400, ease: 'Power2',
              onComplete: function () {
                ui.bg.destroy(); ui.ov.destroy(); ui.tr.destroy();
                ui.fl.destroy(); ui.pt.destroy();
                onDone();
              },
            });
          }
        },
      });
    }

    /* ──────────────────────────────────────────────
       BUILD ISOMETRIC GAME WORLD
       ────────────────────────────────────────────── */
    function buildGame(scene) {
      var W = scene.cameras.main.width;
      var H = scene.cameras.main.height;
      var gPW = (GRID - 1) * TILE_W;
      var gPH = (GRID - 1) * TILE_H;
      var ox = W / 2 - gPW / 2;
      var oy = H / 2 - gPH / 2;
      scene._ox = ox; scene._oy = oy;
      scene._occupied = {};
      scene._barriers = {}; // fence-only absolute barriers
      scene._buildings = [];
      npcSprites = [];

      scene._npcPool = scene.add.group();

      function getPooledUnit(scene, x, y, texture) {
        var s = scene._npcPool.getFirstDead(false);
        if (!s) {
          s = scene.add.sprite(x, y, texture);
          scene._npcPool.add(s);
        } else {
          s.setActive(true).setVisible(true).setPosition(x, y).setTexture(texture).clearTint().setAlpha(1);
          if (s._bubble) { s._bubble.destroy(); s._bubble = null; }
          if (s._harvestTimer) { s._harvestTimer.remove(false); s._harvestTimer = null; }
          scene.tweens.killTweensOf(s);
        }
        return s;
      }
      scene.getPooledUnit = getPooledUnit;

      function recycleUnit(scene, s) {
        if (!s) return;
        s.setActive(false).setVisible(false);
        if (s._bubble) { s._bubble.destroy(); s._bubble = null; }
        if (s._harvestTimer) { s._harvestTimer.remove(false); s._harvestTimer = null; }
        scene.tweens.killTweensOf(s);
      }
      scene.recycleUnit = recycleUnit;

      scene._troops = [];
      scene._spawnTroop = function(troopId, originX, originY) {
         var spawnTx = originX !== undefined ? originX : Math.floor(GRID/2);
         var spawnTy = originY !== undefined ? originY : Math.floor(GRID/2);
         
         if (originX === undefined) {
             var barracks = scene._buildings.find(function(b) { return b.type === 'sena_kanda'; });
             if (!barracks) barracks = scene._buildings.find(function(b) { return b.type === 'workers_hut'; });
             if (barracks) {
                 spawnTx = barracks.tx;
                 spawnTy = barracks.ty + barracks.h; // spawn just below it
             }
         }
         
         var pos = tileToWorld(spawnTx, spawnTy, ox, oy);
         // Use custom troop asset for military units
         var s = scene.getPooledUnit(scene, pos.x, pos.y, 'troop').setOrigin(0.5, 0.8).setDepth(spawnTx + spawnTy + 2).setScale(0.25);
         // s.setTint(0xFF4444); // Tint removed, custom asset handles color
         s._tileX = spawnTx; s._tileY = spawnTy;
         s._troopId = troopId;
         s._isMilitary = true;
         scene._troops.push(s);
         npcSprites.push(s); // include in selection and frustum culling
         
         if (typeof scheduleNPCMove === 'function') {
             scheduleNPCMove(scene, s, ox, oy);
         }
         
         console.log('[Bridge] Spawned troop ' + troopId + ' at tx:' + spawnTx + ' ty:' + spawnTy);
      };

      /* load persistent buildings */
      var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
      var updated = false;
      savedBuildings.forEach(function(b) {
        var config = BUILDINGS_CONFIG[b.type];
        if (!config) return;

        if (b.is_completed === false) {
           if (Date.now() >= b.completion_timestamp) {
              b.is_completed = true;
              updated = true;
           } else {
              b.w = config.w;
              b.h = config.h;
              scene._buildings.push(b);
              startConstruction(scene, b, config);
              return; // Skip normal rendering
           }
        }

        var pos = tileToWorld(b.tx, b.ty, ox, oy);
        var shad = scene.add.image(pos.x, pos.y, 'shadow').setAlpha(0.3).setDepth(b.tx + b.ty + 0.1);
        var lvScales = [0.12, 0.16, 0.20, 0.25, 0.30];
        var lvScale = lvScales[Math.min((b.level || 1) - 1, lvScales.length - 1)];
        var bSprite = scene.add.image(pos.x, pos.y, config.texture).setOrigin(0.5, 0.8).setDepth(b.tx + b.ty + 2).setScale(lvScale);
        for(var row=0; row<config.h; row++){
          for(var col=0; col<config.w; col++){
          scene._occupied[(b.tx+col)+','+(b.ty+row)] = true;
            if (b.type === 'fence') {
              scene._barriers[(b.tx+col)+','+(b.ty+row)] = true;
            }
          }
        }
        b.sprite = bSprite;
        b.w = config.w;
        b.h = config.h;
        scene._buildings.push(b);
        
        // Spawn farmer for existing cow_farm or lumber_camp
        if (b.type === 'cow_farm' || b.type === 'lumber_camp') {
          var spriteKey = b.type === 'cow_farm' ? 'npc_farmer' : 'npc_lumberjack';
          var n = scene.getPooledUnit(scene, pos.x, pos.y + 10, spriteKey).setOrigin(0.5, 0.8).setDepth(b.tx + b.ty + 2).setScale(0.25);
          n._tileX = b.tx; n._tileY = b.ty;
          n._needs = { hunger: 50 + Math.random()*50, thirst: 50 + Math.random()*50, hygiene: 100, toilet: 100 };
          npcSprites.push(n);
          scheduleNPCMove(scene, n, ox, oy);
        }
      });
      if (updated) {
         localStorage.setItem('rajadhaniya_buildings', JSON.stringify(savedBuildings));
      }

      /* place grass tiles using decoupled logical grid */
      for (var r = 0; r < GRID; r+=16) {
        for (var c = 0; c < GRID; c+=16) {
          var isoObj = cartToIso(c + 7.5, r + 7.5);
          var tex = ((c/16) + (r/16)) % 2 === 0 ? 'grass_tile' : 'grass_tile_2';
          scene.add.image(isoObj.x + ox + TILE_W / 2, isoObj.y + oy + TILE_H / 2, tex).setDepth(0);
        }
      }

      /* spawn player at center */
      var ci = cartToIso((GRID - 1) / 2, (GRID - 1) / 2);
      var spX = ci.x + ox + TILE_W / 2;
      var spY = ci.y + oy + TILE_H / 2;
      var pTile = worldToTile(spX, spY, ox, oy);
      // Wide initial bounds — will be replaced by exact grid bounds after placeResources()
      var safeW = GRID * TILE_W + 2000;
      var safeH = GRID * TILE_H + 2000;
      scene.cameras.main.setBounds(ox - safeW / 2, oy - safeH / 2, safeW, safeH);
      scene._playerShadow = scene.add.image(spX, spY, 'shadow').setAlpha(0.3).setDepth(pTile.tx + pTile.ty + 0.1);
      playerSprite = scene.add.sprite(spX, spY, 'player').setDepth(pTile.tx + pTile.ty + 1).setOrigin(0.5, 0.8).setScale(0.25);
      
      scene.cameras.main.centerOn(spX, spY);
      scene.cameras.main.setZoom(0.65); // Tactical overview zoom on startup
      
      window.centerCameraOnPlayer = function() {
        if (!window.__gameActive || !scene || !scene.cameras || !playerSprite) return;
        scene.tweens.add({
          targets: scene.cameras.main,
          scrollX: playerSprite.x - scene.cameras.main.width / 2,
          scrollY: playerSprite.y - scene.cameras.main.height / 2,
          duration: 400,
          ease: 'Sine.easeInOut'
        });
        
        selectedUnit = playerSprite;
        if (!selectionRing) {
          selectionRing = scene.add.graphics().setDepth(2000);
          selectionRing.lineStyle(3, 0x00FF00, 0.8);
          selectionRing.strokeEllipse(0, 0, 48, 24);
          scene.tweens.add({
            targets: selectionRing,
            scaleX: 1.2, scaleY: 1.2, alpha: 0.5,
            yoyo: true, repeat: -1, duration: 800
          });
        }
        selectionRing.setPosition(playerSprite.x, playerSprite.y);
        selectionRing.setVisible(true);
      };
      scene.cameras.main.setBackgroundColor('#689f38');
      


      /* setup multi-touch and zoom */
      scene.input.addPointer(1);
      scene.input.on('wheel', function(pointer, gameObjects, deltaX, deltaY, deltaZ) {
        var newZoom = scene.cameras.main.zoom - deltaY * 0.001;
        scene.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, 0.6, 2.0));
      });

      var pinchState = { pinching: false, startDist: 0, startZoom: 1, cooldown: false };

      /* place resource sprites */
      placeResources(scene, ox, oy);

      /* CoC: border forest */
      placeBorderForest(scene, ox, oy);

      /* CoC: enemy kingdoms */
      placeEnemyKingdoms(scene, ox, oy);

      /* CoC: fog of war (Disabled per user request for smooth play) */

      /* Dynamic Hostile Aggro System */
      var aggroTick = 0;
      scene.events.on('update', function() {
        aggroTick++;
        if (aggroTick % 30 !== 0) return; // Scan for targets twice a second (assuming 60fps)
        if (!scene._hostiles || scene._hostiles.length === 0) return;
        
        var validTargets = [];
        if (playerSprite) validTargets.push(playerSprite);
        if (npcSprites) validTargets = validTargets.concat(npcSprites);
        if (scene._troops) validTargets = validTargets.concat(scene._troops);

        for (var h = 0; h < scene._hostiles.length; h++) {
          var hostile = scene._hostiles[h];
          if (hostile.defeated || hostile.isAggroed) continue; // dead or already fighting/moving
          
          if (!hostile.sprite || !hostile.sprite.active) continue;
          var hSprite = hostile.sprite;

          for (var t = 0; t < validTargets.length; t++) {
             var target = validTargets[t];
             if (!target.active) continue;
             
             var targetTile = worldToTile(target.x, target.y, ox, oy);
             var dist = Math.abs(hostile.tx - targetTile.tx) + Math.abs(hostile.ty - targetTile.ty);
             
             if (dist <= 15) { // 15-tile aggro radius
                hostile.isAggroed = true; // Set flag so we don't spam pathfinding
                floatText(scene, 'Aggro!', hSprite.x, hSprite.y - 40, '#FF0000');
                
                if (typeof moveUnitToTile === 'function') {
                    // Sync sprite state with hostile logic
                    hSprite._tileX = hostile.tx;
                    hSprite._tileY = hostile.ty;
                    
                    moveUnitToTile(scene, hSprite, targetTile.tx, targetTile.ty, ox, oy, 1, function(success) {
                        // When it finishes moving, reset aggro so it can scan again (or attack)
                        hostile.isAggroed = false;
                        if (success) {
                            // Update internal coordinates
                            var finalTile = worldToTile(hSprite.x, hSprite.y, ox, oy);
                            hostile.tx = finalTile.tx;
                            hostile.ty = finalTile.ty;
                        }
                    });
                }
                break; // Only aggro one target at a time
             }
          }
        }
      });

      /* HUD - legacy debug text hidden; Flutter HUD handles all display */
      hudText = scene.add.text(10, 10, '', {
        fontFamily: 'GameFont', fontSize: '12px', color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.65)', padding: { x: 10, y: 8 }, lineSpacing: 2,
      }).setScrollFactor(0).setDepth(100).setAlpha(0); // Hidden — Flutter HUD used instead

      /* ESC to return */
      /* spawn NPCs */
      // spawn workers
      for(var i=0; i<5; i++) {
        var tx = Phaser.Math.Between(0, GRID - 1);
        var ty = Phaser.Math.Between(0, GRID - 1);
        if(!scene._occupied[tx+','+ty]) {
          var pos = tileToWorld(tx, ty, ox, oy);
          var s = scene.getPooledUnit(scene, pos.x, pos.y, 'player').setOrigin(0.5, 0.8).setDepth(tx + ty + 1).setScale(0.25);
          s.setTint(0xAAAAAA);
          s._tileX = tx; s._tileY = ty;
          s._needs = { hunger: Phaser.Math.Between(10, 100), thirst: Phaser.Math.Between(10, 100) };
          npcSprites.push(s);
          scheduleNPCMove(scene, s, ox, oy);
        }
      }

      scene.input.keyboard.on('keydown', function(ev) {
        if (ev.key === 'Escape') { closeContextualMenu(scene); window.showFlutterUi(); }
      });

      /* Frustum Culling Loop */
      scene.time.addEvent({
        delay: 250,
        loop: true,
        callback: function() {
          if (isMoving) return;
          var view = scene.cameras.main.worldView;
          var pad = 100;
          var rect = new Phaser.Geom.Rectangle(view.x - pad, view.y - pad, view.width + pad * 2, view.height + pad * 2);
          
          function cull(arr) {
            for (var i = 0; i < arr.length; i++) {
              var obj = arr[i];
              var spr = obj.sprite || obj;
              if (spr && spr.active) {
                var inView = Phaser.Geom.Rectangle.Contains(rect, spr.x, spr.y);
                spr.setVisible(inView);
                if (obj.shadow) obj.shadow.setVisible(inView);
                if (obj.label) obj.label.setVisible(inView);
                if (obj.flag) obj.flag.setVisible(inView);
              }
            }
          }
          cull(resourceSprites);
          cull(npcSprites);
          cull(scene._buildings);
          cull(enemyKingdoms);
        }
      });

      /* Idle Sleep Mode */
      var idleTimer = scene.time.addEvent({
        delay: 30000, // 30s
        callback: function() {
          scene.game.loop.targetFps = 30;
        }
      });

      function wakeUp() {
        scene.game.loop.targetFps = 60;
        if (idleTimer) idleTimer.reset({ delay: 30000, callback: function() { scene.game.loop.targetFps = 30; } });
      }

      var mapBoundsW = GRID * TILE_W;
      var mapBoundsH = GRID * TILE_H;
      scene.cameras.main.setBounds(ox - mapBoundsW/2 - 1000, oy - 1000, mapBoundsW + 2000, mapBoundsH + 2000);

      /* ══════════════════════════════════════════════
         STEP 2 + 3 – Tap Gestures (Single & Double)
         ══════════════════════════════════════════════ */
      var tapState = { lastTime: 0, lastX: 0, lastY: 0, count: 0, pending: false };

      scene.input.on('pointermove', function(ptr) {
        wakeUp();
        if (scene.input.pointer1.isDown && scene.input.pointer2.isDown) {
          var p1 = scene.input.pointer1;
          var p2 = scene.input.pointer2;
          var dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
          if (!pinchState.pinching) {
            pinchState.pinching = true;
            pinchState.startDist = dist;
            pinchState.startZoom = scene.cameras.main.zoom;
          } else {
            var newZoom = pinchState.startZoom * (dist / pinchState.startDist);
            scene.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, 0.6, 2.0));
          }
          return;
        } else if (ptr.isDown && !currentBuildMode && !editMode) {
          if (pinchState.pinching) {
             pinchState.pinching = false;
             pinchState.cooldown = true;
             setTimeout(function() { pinchState.cooldown = false; }, 250);
          }
          if (pinchState.cooldown) return;
          // Pan camera
          scene.cameras.main.scrollX -= (ptr.x - ptr.prevPosition.x) / scene.cameras.main.zoom;
          scene.cameras.main.scrollY -= (ptr.y - ptr.prevPosition.y) / scene.cameras.main.zoom;
        } else {
          if (pinchState.pinching) {
             pinchState.pinching = false;
             pinchState.cooldown = true;
             setTimeout(function() { pinchState.cooldown = false; }, 250);
          }
        }

        if (currentBuildMode && ghostBuilding && !ghostBuilding._isPlaced) {
          var wp = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
          var tile = worldToTile(wp.x, wp.y, ox, oy);
          if (ghostBuilding._type === 'fence' && isDragBuilding) {
             updateDragBuilding(scene, tile.tx, tile.ty, ox, oy);
          } else {
             updateGhostBuildingPos(scene, tile.tx, tile.ty, ox, oy);
          }
        }
        if (editMode && editGhost) {
          var wp2 = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
          var tile2 = worldToTile(wp2.x, wp2.y, ox, oy);
          updateEditGhost(scene, tile2.tx, tile2.ty, ox, oy);
        }
      });
      var pointerDownX = 0;
      var pointerDownY = 0;

      scene.input.on('pointerdown', function (ptr) {
        wakeUp();
        pointerDownX = ptr.x;
        pointerDownY = ptr.y;
        if (scene.input.pointer1.isDown && scene.input.pointer2.isDown) return;

        if (currentBuildMode && ghostBuilding && !ghostBuilding._isPlaced && ghostBuilding._type === 'fence') {
          var wp = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
          var tile = worldToTile(wp.x, wp.y, ox, oy);
          isDragBuilding = true;
          dragStartTile = { tx: ghostBuilding._tileX, ty: ghostBuilding._tileY };
          dragFenceCoords = [];
          return;
        }

        // Long-press detection for building drag-and-drop
        longPressPtr = ptr;
        longPressTimer = scene.time.delayedCall(500, function() {
          if (!longPressPtr) return;
          var wp = scene.cameras.main.getWorldPoint(longPressPtr.x, longPressPtr.y);
          var tile = worldToTile(wp.x, wp.y, ox, oy);
          for (var bi = 0; bi < scene._buildings.length; bi++) {
            var b = scene._buildings[bi];
            if (tile.tx >= b.tx && tile.tx < b.tx + b.w && tile.ty >= b.ty && tile.ty < b.ty + b.h) {
              enterEditMode(scene, b, ox, oy);
              return;
            }
          }
        });
      });

      scene._removeBuilding = function(tx, ty) {
        var bData = null;
        for (var i = 0; i < scene._buildings.length; i++) {
          if (scene._buildings[i].tx === tx && scene._buildings[i].ty === ty) {
            bData = scene._buildings[i]; break;
          }
        }
        if (bData) removeBuilding(scene, bData);
      };

      /* ── Upgrade Building ── */
      scene._upgradeBuilding = function(tx, ty, cost) {
        var bData = null;
        for (var i = 0; i < scene._buildings.length; i++) {
          if (scene._buildings[i].tx === tx && scene._buildings[i].ty === ty) {
            bData = scene._buildings[i]; break;
          }
        }
        if (!bData || !bData.sprite) return;

        // Deduct gold
        if (localPlayerData.gold < cost) {
          floatText(scene, 'Not enough Gold!', bData.sprite.x, bData.sprite.y - 40, '#FF0000');
          return;
        }
        localPlayerData.gold -= cost;

        // Level up
        bData.level = (bData.level || 1) + 1;

        // Scale grows with level: Lv1=0.12, Lv2=0.16, Lv3=0.20, Lv4=0.25
        var scales = [0.12, 0.16, 0.20, 0.25, 0.30];
        var newScale = scales[Math.min(bData.level - 1, scales.length - 1)];
        scene.tweens.add({
          targets: bData.sprite,
          scaleX: newScale, scaleY: newScale,
          duration: 500, ease: 'Back.Out'
        });

        floatText(scene, '⬆ Level ' + bData.level + '!', bData.sprite.x, bData.sprite.y - 50, '#D4A017');
        playHarvestEffect(scene, bData.sprite.x, bData.sprite.y, 'spark');

        // Persist level to localStorage
        var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
        for (var i = 0; i < savedBuildings.length; i++) {
          if (savedBuildings[i].tx === tx && savedBuildings[i].ty === ty) {
            savedBuildings[i].level = bData.level;
            break;
          }
        }
        localStorage.setItem('rajadhaniya_buildings', JSON.stringify(savedBuildings));
        window.__forceSync = true;
        refreshHud(scene);
      };

      /* ── Offline Production Catchup ── */
      (function applyOfflineProduction() {
        var OFFLINE_CAP_HOURS = 8;
        var lastSession = parseInt(localStorage.getItem('rajadhaniya_last_session') || '0', 10);
        localStorage.setItem('rajadhaniya_last_session', Date.now().toString());

        if (!lastSession) return; // First session ever, nothing to catch up
        var offlineSec = Math.min((Date.now() - lastSession) / 1000, OFFLINE_CAP_HOURS * 3600);
        if (offlineSec < 60) return; // Less than a minute — don't bother

        // Production rates per second for each building type (per building)
        var productionRates = {
          farm:        { food: 5/20, gold: 10/20 },
          cow_farm:    { milk: 3/3 },
          mine:        { gold: 25/30 },
          lumber_camp: { wood: 2/3 }
        };

        var totals = { gold: 0, wood: 0, food: 0, milk: 0 };
        var completedBuildings = savedBuildings.filter(function(b) { return b.is_completed; });

        completedBuildings.forEach(function(b) {
          var rate = productionRates[b.type];
          if (!rate) return;
          var lvMult = b.level || 1;
          for (var res in rate) {
            totals[res] = (totals[res] || 0) + rate[res] * offlineSec * lvMult;
          }
        });

        // Apply totals
        if (totals.gold  > 0) localPlayerData.gold += Math.floor(totals.gold);
        if (totals.food  > 0) localPlayerData.inventory.food = (localPlayerData.inventory.food || 0) + Math.floor(totals.food);
        if (totals.milk  > 0) localPlayerData.inventory.milk = (localPlayerData.inventory.milk || 0) + Math.floor(totals.milk);
        if (totals.wood  > 0) taskProgress['wood'] = (taskProgress['wood'] || 0) + Math.floor(totals.wood);

        // Show Flutter notification
        var hours = Math.floor(offlineSec / 3600);
        var mins  = Math.floor((offlineSec % 3600) / 60);
        var timeStr = hours > 0 ? hours + 'h ' + mins + 'm' : mins + 'm';
        var lines = [];
        if (Math.floor(totals.gold) > 0) lines.push('🪙 +' + Math.floor(totals.gold) + ' Gold');
        if (Math.floor(totals.food) > 0) lines.push('🌾 +' + Math.floor(totals.food) + ' Food');
        if (Math.floor(totals.milk) > 0) lines.push('🥛 +' + Math.floor(totals.milk) + ' Milk');
        if (Math.floor(totals.wood) > 0) lines.push('🪵 +' + Math.floor(totals.wood) + ' Wood');

        if (lines.length > 0) {
          window.notifyFlutter({
            type: 'show_offline_reward',
            offlineTime: timeStr,
            rewards: lines
          });
          window.__forceSync = true;
          refreshHud(scene);
        }
      })();

      /* ── Save session timestamp every 60s ── */
      scene.time.addEvent({
        delay: 60000,
        loop: true,
        callback: function() {
          localStorage.setItem('rajadhaniya_last_session', Date.now().toString());
        }
      });

      /* ── Active In-Game Passive Production (fires every 20s) ── */
      scene.time.addEvent({
        delay: 20000,
        loop: true,
        callback: function() {
          var completedBuildings = scene._buildings ? scene._buildings.filter(function(b) { return b.is_completed; }) : [];
          if (completedBuildings.length === 0) return;

          var productionPerTick = {
            farm:        { food: 5, gold: 10 },   // 5 food + 10 gold per 20s
            cow_farm:    { milk: 3 },              // 3 milk per 20s
            mine:        { gold: 25 },             // 25 gold per 20s (but 30s rate — close enough)
            lumber_camp: { wood: 2 }               // 2 wood per 20s (but 3s rate scaled down)
          };

          var earned = [];
          completedBuildings.forEach(function(b) {
            var rate = productionPerTick[b.type];
            if (!rate) return;
            var lvMult = b.level || 1;
            for (var res in rate) {
              var amount = Math.floor(rate[res] * lvMult);
              if (amount <= 0) continue;
              if (res === 'gold') {
                localPlayerData.gold += amount;
                earned.push({ res: res, amount: amount, x: b.sprite ? b.sprite.x : 0, y: b.sprite ? b.sprite.y : 0 });
              } else if (res === 'food') {
                localPlayerData.inventory = localPlayerData.inventory || {};
                localPlayerData.inventory.food = (localPlayerData.inventory.food || 0) + amount;
              } else if (res === 'milk') {
                localPlayerData.inventory = localPlayerData.inventory || {};
                localPlayerData.inventory.milk = (localPlayerData.inventory.milk || 0) + amount;
              } else if (res === 'wood') {
                taskProgress['wood'] = (taskProgress['wood'] || 0) + amount;
                earned.push({ res: res, amount: amount, x: b.sprite ? b.sprite.x : 0, y: b.sprite ? b.sprite.y : 0 });
              }
              // Float text for visual feedback on first 3 buildings only (avoid spam)
              if (b.sprite && b.sprite.active && earned.length <= 3) {
                var icon = res === 'gold' ? '\uD83E\uDE99' : res === 'milk' ? '\uD83E\uDD5B' : res === 'food' ? '\uD83C\uDF3E' : '\uD83E\uDEB5';
                floatText(scene, icon + ' +' + amount, b.sprite.x, b.sprite.y - 40, res === 'gold' ? '#FFD700' : res === 'wood' ? '#8B5A2B' : '#FFFDE7');
              }
            }
          });

          if (earned.length > 0) {
            refreshHud(scene);
          }
        }
      });

      scene.input.on('pointerup', function (ptr) {
        if (longPressTimer) { longPressTimer.remove(false); longPressTimer = null; }
        longPressPtr = null;

        if (scene.input.pointer1.isDown || scene.input.pointer2.isDown) return;

        // If in building reposition mode, always handle the lift — even after a long drag
        if (editMode && editGhost) {
          var wp = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
          var tile = worldToTile(wp.x, wp.y, ox, oy);
          updateEditGhost(scene, tile.tx, tile.ty, ox, oy);
          if (editGhost._validPlacement) {
            confirmReposition(scene, tile.tx, tile.ty, ox, oy);
          } else {
            cancelReposition(scene);
          }
          return;
        }

        // Ignore if this was a camera pan (moved more than 10 pixels)
        var distMoved = Phaser.Math.Distance.Between(pointerDownX, pointerDownY, ptr.x, ptr.y);
        if (distMoved > 10) return;

        if (currentBuildMode && ghostBuilding) {
          if (ghostBuilding._isPlaced) return; // Prevent tapping through Flutter UI
          
          if (ghostBuilding._type === 'fence' && isDragBuilding) {
             ghostBuilding._isPlaced = true;
             showBuildConfirmUI(scene);
             return;
          }

          // Tap sets the position and locks it, showing UI
          var wp = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
          var tile = worldToTile(wp.x, wp.y, ox, oy);
          updateGhostBuildingPos(scene, tile.tx, tile.ty, ox, oy);
          ghostBuilding._isPlaced = true;
          showBuildConfirmUI(scene);
          return;
        }

        if (isMenuOpen) {
          closeContextualMenu(scene);
          return; // don't re-open on same tap
        }

        var wp = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
        var tile = worldToTile(wp.x, wp.y, ox, oy);
        
        var clickedRes = null;
        for (var i = 0; i < resourceSprites.length; i++) {
          var res = resourceSprites[i];
          var rx = (res.sprite && res.sprite._tileX !== undefined) ? res.sprite._tileX : res.tileX;
          var ry = (res.sprite && res.sprite._tileY !== undefined) ? res.sprite._tileY : res.tileY;
          var inFootprint = (tile.tx >= rx && tile.tx < rx + 4 && tile.ty >= ry && tile.ty < ry + 4);
          var inSprite = false;
          if (res.sprite && res.sprite.getBounds) {
             inSprite = res.sprite.getBounds().contains(wp.x, wp.y);
          }
          if (inFootprint || inSprite) {
            clickedRes = res;
            break;
          }
        }
        
        if (!clickedRes) {
          for (var i = 0; i < scene._buildings.length; i++) {
            var b = scene._buildings[i];
            var inFootprint = (tile.tx >= b.tx && tile.tx < b.tx + b.w && tile.ty >= b.ty && tile.ty < b.ty + b.h);
            var inSprite = false;
            if (b.sprite && b.sprite.getBounds) {
               inSprite = b.sprite.getBounds().contains(wp.x, wp.y);
            }
            if (inFootprint || inSprite) {
              if (b.type === 'fence') {
                clickedRes = { type: 'fence', sprite: b.sprite, isBuilding: true, buildingData: b };
                break;
              } else {
                clickedRes = { type: b.type, sprite: b.sprite, isHarvesting: false, isBuilding: true, buildingData: b };
                break;
              }
            }
          }
        }

        // Check for hostile wildlife tap
        if (scene._hostiles) {
          for (var hi = 0; hi < scene._hostiles.length; hi++) {
             var hostile = scene._hostiles[hi];
             if (hostile.defeated) continue;
             
             // Distance from tap tile to hostile tile
             var dist = Math.abs(tile.tx - hostile.tx) + Math.abs(tile.ty - hostile.ty);
             if (dist <= 2) {
                if (selectedUnit && (selectedUnit._isMilitary || selectedUnit === playerSprite)) {
                   if (typeof issueCombatCommand === 'function') {
                      issueCombatCommand(scene, selectedUnit, { type: 'wildlife', obj: hostile }, ox, oy);
                   }
                }
                return; // Stop processing tap
             }
          }
        }

        // Check for enemy kingdom tap
        for (var ei = 0; ei < enemyKingdoms.length; ei++) {
          var ek = enemyKingdoms[ei];
          var dist = Math.abs(tile.tx - ek.tx) + Math.abs(tile.ty - ek.ty);
          if (dist <= 2) {
            if (selectedUnit && selectedUnit._isMilitary) {
              if (typeof issueCombatCommand === 'function') {
                 issueCombatCommand(scene, selectedUnit, { type: 'kingdom', obj: ek }, ox, oy);
              }
            } else {
              tryAttackKingdom(scene, ek);
            }
            return;
          }
        }

        // Check if player tapped a controllable unit (player or troop)
        var tappedUnit = null;
        var pTile = worldToTile(playerSprite.x, playerSprite.y, ox, oy);
        if (Math.abs(tile.tx - pTile.tx) + Math.abs(tile.ty - pTile.ty) <= 2) tappedUnit = playerSprite;
        
        if (!tappedUnit && scene._troops) {
           for (var t = 0; t < scene._troops.length; t++) {
              var trp = scene._troops[t];
              var tTile = worldToTile(trp.x, trp.y, ox, oy);
              if (Math.abs(tile.tx - tTile.tx) + Math.abs(tile.ty - tTile.ty) <= 2) {
                 tappedUnit = trp; break;
              }
           }
        }

        if (tappedUnit) {
          if (selectedUnit === tappedUnit) {
            // Deselect
            selectedUnit = null;
            if (selectionRing) selectionRing.setVisible(false);
            floatText(scene, window.gameLanguage === 'si' ? 'අවලංගුයි' : 'Deselected', tappedUnit.x, tappedUnit.y - 40, '#FF4444');
          } else {
            // Select
            selectedUnit = tappedUnit;
            if (!selectionRing) {
              selectionRing = scene.add.graphics().setDepth(2000);
              selectionRing.lineStyle(3, 0x00FF00, 0.8);
              selectionRing.strokeEllipse(0, 0, 48, 24);
              scene.tweens.add({
                targets: selectionRing,
                scaleX: 1.2, scaleY: 1.2, alpha: 0.5,
                yoyo: true, repeat: -1, duration: 800
              });
            }
            selectionRing.setPosition(tappedUnit.x, tappedUnit.y);
            selectionRing.setVisible(true);
            floatText(scene, window.gameLanguage === 'si' ? 'තේරුවා' : 'Selected', tappedUnit.x, tappedUnit.y - 40, '#00FF00');
            
            if (!window._ringUpdateBound) {
               window._ringUpdateBound = true;
               scene.events.on('update', function() {
                  if (selectedUnit && selectionRing && selectionRing.visible) {
                     selectionRing.setPosition(selectedUnit.x, selectedUnit.y);
                  }
               });
            }
          }
          return;
        }

        // Allow instantly inspecting buildings without needing a selected unit or walking to it
        if (clickedRes && clickedRes.isBuilding) {
          if (clickedRes.buildingData && clickedRes.buildingData.is_completed === false) {
             var pos = tileToWorld(clickedRes.buildingData.tx, clickedRes.buildingData.ty, ox, oy);
             floatText(scene, 'Under Construction!', pos.x, pos.y - 40, '#FF4444');
             return;
          }
          if (clickedRes.type === 'fence') {
            if (isMenuOpen) closeContextualMenu(scene);
            showFenceEditOverlay(scene, clickedRes, ox, oy);
          } else {
            if (activeFenceOverlay) { activeFenceOverlay.destroy(); activeFenceOverlay = null; }
            if (isMenuOpen) closeContextualMenu(scene);
            window.notifyFlutter({
              type: 'show_building_details',
              buildingType: clickedRes.type,
              buildingData: clickedRes.buildingData
            });
          }
          return;
        }

        // Clicked elsewhere - clean up fence overlay
        if (activeFenceOverlay) { activeFenceOverlay.destroy(); activeFenceOverlay = null; }

        // If no unit selected, but tapped a resource, open menu to inspect
        if (clickedRes && !selectedUnit) {
          if (isMenuOpen) closeContextualMenu(scene);
          createContextualMenu(scene, clickedRes);
          return;
        }

        // Default to player if no unit is selected
        var activeUnit = selectedUnit || playerSprite;

        if (activeUnit._harvestTimer) {
          activeUnit._harvestTimer.remove(false);
          activeUnit._harvestTimer = null;
          activeUnit.stop();
        }

        if (clickedRes) {
          var tRect = null;
          if (clickedRes.isBuilding && clickedRes.buildingData) {
            tRect = { tx: clickedRes.buildingData.tx, ty: clickedRes.buildingData.ty, w: clickedRes.buildingData.w, h: clickedRes.buildingData.h };
          } else {
            var rx = (clickedRes.sprite && clickedRes.sprite._tileX !== undefined) ? clickedRes.sprite._tileX : clickedRes.tileX;
            var ry = (clickedRes.sprite && clickedRes.sprite._tileY !== undefined) ? clickedRes.sprite._tileY : clickedRes.tileY;
            tRect = { tx: rx, ty: ry, w: 4, h: 4 };
          }

          var dx = Math.max(tRect.tx - pTile.tx, 0, pTile.tx - (tRect.tx + tRect.w - 1));
          var dy = Math.max(tRect.ty - pTile.ty, 0, pTile.ty - (tRect.ty + tRect.h - 1));
          
          if (dx + dy <= 2) { 
            startAutomatedHarvest(scene, activeUnit, clickedRes, ox, oy);
          } else {
            moveUnitToTile(scene, activeUnit, 0, 0, ox, oy, tRect, function(success) {
              if (success) {
                startAutomatedHarvest(scene, activeUnit, clickedRes, ox, oy);
              }
            });
          }
          return;
        }

        handleSingleTap(scene, ptr, ox, oy);
      });

      function updateNeedsBubble(scene, sprite, needsData) {
        if (!sprite || !sprite.active) return;
        var emoji = '';
        if (needsData.hunger < 30) emoji = '🍖';
        else if (needsData.thirst < 30) emoji = '💧';
        else if (needsData.hygiene < 30) emoji = '🧼';
        else if (needsData.toilet < 30) emoji = '🚽';

        if (emoji !== '') {
          if (!sprite._bubble) {
            sprite._bubble = scene.add.text(sprite.x, sprite.y - 60, emoji, { fontSize: '24px' }).setOrigin(0.5).setDepth(2000);
          } else {
            sprite._bubble.setText(emoji);
            sprite._bubble.setPosition(sprite.x, sprite.y - 60);
          }
        } else {
          if (sprite._bubble) {
            sprite._bubble.destroy();
            sprite._bubble = null;
          }
        }
      }

      function showDeathOverlay() {
        if (window.__isDead) return;
        window.__isDead = true;

        window.notifyFlutter({
          type: 'show_death_overlay'
        });

        scene._respawn = function() {
          window.__isDead = false;
          localPlayerData.health = 100;
          localPlayerData.needs.hunger = 100;
          localPlayerData.needs.thirst = 100;
          refreshHud(scene);
        };
      }

      scene.events.on('update', function() {
         if (playerSprite && playerSprite._bubble) {
             playerSprite._bubble.setPosition(playerSprite.x, playerSprite.y - 60);
         }
         npcSprites.forEach(function(npc) {
             if (npc && npc._bubble) {
                 npc._bubble.setPosition(npc.x, npc.y - 60);
             }
         });
      });

      var survivalTick = 0;
      scene.time.addEvent({
        delay: 3000,
        callback: function() {
          if (window.__isDead) return;
          survivalTick++;
          
          // Human-like timing (Slower):
          // Thirst drops every 18 seconds (30 mins to zero)
          // Hunger drops every 30 seconds (50 mins to zero)
          // Toilet drops every 48 seconds (80 mins to zero)
          // Hygiene drops every 72 seconds (120 mins to zero)
          if (survivalTick % 10 === 0) localPlayerData.needs.hunger = Math.max(0, localPlayerData.needs.hunger - 1);
          if (survivalTick % 6 === 0) localPlayerData.needs.thirst = Math.max(0, localPlayerData.needs.thirst - 1);
          if (survivalTick % 24 === 0) localPlayerData.needs.hygiene = Math.max(0, localPlayerData.needs.hygiene - 1);
          if (survivalTick % 16 === 0) localPlayerData.needs.toilet = Math.max(0, localPlayerData.needs.toilet - 1);
          
          if (localPlayerData.needs.hunger === 0 || localPlayerData.needs.thirst === 0) {
             // Only take health damage if we actually ticked down hunger/thirst on this cycle
             if (survivalTick % 6 === 0 || survivalTick % 10 === 0) {
                 localPlayerData.health = Math.max(0, localPlayerData.health - 2); // Decreased from 5 to 2 to make it less punishing
                 if (localPlayerData.health === 0) {
                    showDeathOverlay();
                 }
             }
          }

          updateNeedsBubble(scene, playerSprite, localPlayerData.needs);

          npcSprites.forEach(function(npc) {
            if (npc._needs) {
              if (survivalTick % 10 === 0) npc._needs.hunger = Math.max(0, npc._needs.hunger - 1);
              if (survivalTick % 6 === 0) npc._needs.thirst = Math.max(0, npc._needs.thirst - 1);
              updateNeedsBubble(scene, npc, npc._needs);
            }
          });

          // Cow Farm Production Calculation (Milk only)
          var cowFarmCount = scene._buildings.filter(function(b) { return b.type === 'cow_farm' && b.is_completed; }).length;
          if (cowFarmCount > 0) {
            localPlayerData.inventory.milk = (localPlayerData.inventory.milk || 0) + (3 * cowFarmCount);
          }
          
          // Farm Production Calculation (Food & Meat)
          var farmCount = scene._buildings.filter(function(b) { return b.type === 'farm' && b.is_completed; }).length;
          if (farmCount > 0) {
            localPlayerData.inventory.meat = (localPlayerData.inventory.meat || 0) + (1 * farmCount);
            localPlayerData.inventory.food = (localPlayerData.inventory.food || 0) + (1 * farmCount);
          }
          
          var lumberCampCount = scene._buildings.filter(function(b) { return b.type === 'lumber_camp' && b.is_completed; }).length;
          if (lumberCampCount > 0) {
            taskProgress['wood'] = (taskProgress['wood'] || 0) + (2 * lumberCampCount);
          }

          refreshHud(scene);
        },
        loop: true
      });

      // Auto-Spawn Trees inside Fences
      scene.time.addEvent({
        delay: 600000, // 10 minutes
        loop: true,
        callback: function() {
          if (window.__isDead) return;
          var enclosedData = findEnclosedFencedAreas(scene);
          var spots = enclosedData.emptySpots;
          if (spots.length > 0) {
             // Pick a random spot
             var spot = spots[Phaser.Math.Between(0, spots.length - 1)];
             var tx = spot.x;
             var ty = spot.y;
             
             // Count trees in THIS specific fenced area
             var treeMap = {};
             for(var i=0; i<resourceSprites.length; i++) {
               if(resourceSprites[i].type === 'tree') {
                 treeMap[resourceSprites[i].tileX + ',' + resourceSprites[i].tileY] = true;
               }
             }
             
             var innerVisited = {};
             var innerQueue = [{x: tx, y: ty}];
             var treesInThisArea = 0;
             var hd = 0;
             while(hd < innerQueue.length) {
                var c = innerQueue[hd++];
                var k = c.x+','+c.y;
                if(innerVisited[k]) continue;
                innerVisited[k] = true;
                
                if (treeMap[k]) treesInThisArea++;
                
                var neighbors = [
                  {x: c.x-1, y: c.y}, {x: c.x+1, y: c.y},
                  {x: c.x, y: c.y-1}, {x: c.x, y: c.y+1}
                ];
                for(var ni=0; ni<4; ni++) {
                  var nn = neighbors[ni];
                  var nk = nn.x+','+nn.y;
                  if (nn.x >= 0 && nn.x < GRID && nn.y >= 0 && nn.y < GRID) {
                     if (!enclosedData.visitedOutside[nk] && !enclosedData.fences[nk] && !innerVisited[nk]) {
                       innerQueue.push(nn);
                     }
                  }
                }
             }
             
             if (treesInThisArea >= 50) return; // Cap at 50 trees per fenced area
             
             // Spawn tree
             var iso = tileToWorld(tx, ty, ox, oy);
             var spr = scene.add.image(iso.x, iso.y, 'tree').setOrigin(0.5, 0.8).setDepth(tx + ty + 1).setScale(0.12);
             var resObj = {
               type: 'tree',
               tileX: tx, tileY: ty,
               sprite: spr,
               isHarvesting: false,
               maxYield: 50,
               currentYield: 50
             };
             resourceSprites.push(resObj);
             for(var r=0; r<4; r++){
               for(var c=0; c<4; c++){
                 scene._occupied[(tx+c) + ',' + (ty+r)] = true;
               }
             }
             playHarvestEffect(scene, iso.x, iso.y, 'spark');
             floatText(scene, '+ 🌱', iso.x, iso.y - 40, '#4CAF50');
          }
        }
      });

      refreshHud(scene);
      console.log('[Phaser] Game ready version=' + localStorage.getItem(STORAGE_KEY));
    }

    /* ──────────────────────────────────────────────
       CoC BUILD MODE HELPERS
       ────────────────────────────────────────────── */
    function updateGhostBuildingPos(scene, tx, ty, ox, oy) {
      if (!ghostBuilding) return;
      var config = ghostBuilding._config;
      tx = Math.max(0, Math.min(GRID - config.w, tx));
      ty = Math.max(0, Math.min(GRID - config.h, ty));

      var pos = tileToWorld(tx, ty, ox, oy);
      ghostBuilding.setPosition(pos.x, pos.y);
      ghostBuilding.setDepth(tx + ty + 2);
      ghostBuilding._tileX = tx;
      ghostBuilding._tileY = ty;
      
      var valid = true;
      for(var r=0; r<config.h; r++){
        for(var c=0; c<config.w; c++){
          var nx = tx + c;
          var ny = ty + r;
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID || scene._occupied[nx+','+ny]) {
            valid = false;
          }
        }
      }
      ghostBuilding._isValid = valid;
      ghostBuilding.setTint(valid ? 0x4CAF50 : 0xFF6B6B);

      if (ghostBuilding._type === 'fence') {
         if (!dragArrows) dragArrows = [];
         while(dragArrows.length < 4) {
            var text = scene.add.text(0, 0, '', {fontSize: '24px'}).setOrigin(0.5).setDepth(2000);
            dragArrows.push(text);
         }
         var pR = tileToWorld(tx+4, ty, ox, oy);
         dragArrows[0].setPosition(pR.x, pR.y).setText('➡️').setVisible(valid);
         var pL = tileToWorld(tx-4, ty, ox, oy);
         dragArrows[1].setPosition(pL.x, pL.y).setText('⬅️').setVisible(valid);
         var pD = tileToWorld(tx, ty+4, ox, oy);
         dragArrows[2].setPosition(pD.x, pD.y).setText('⬇️').setVisible(valid);
         var pU = tileToWorld(tx, ty-4, ox, oy);
         dragArrows[3].setPosition(pU.x, pU.y).setText('⬆️').setVisible(valid);
      }

      if (buildConfirmElements) {
         showBuildConfirmUI(scene); // Redraws at new position
      }
    }

    function updateDragBuilding(scene, currentTx, currentTy, ox, oy) {
       var dx = currentTx - dragStartTile.tx;
       var dy = currentTy - dragStartTile.ty;
       // Snap to largest axis
       var useX = Math.abs(dx) > Math.abs(dy);
       var length = useX ? Math.abs(dx) : Math.abs(dy);
       length = Math.ceil(length / 4); // each fence is 4x4
       var signX = useX ? Math.sign(dx) : 0;
       var signY = useX ? 0 : Math.sign(dy);
       
       // Limit to max 20 fences (fences do not use builders)
       length = Math.min(20, length);
       
       var newCoords = [];
       for(var i=0; i<=length; i++) {
         var ftx = dragStartTile.tx + (signX * i * 4);
         var fty = dragStartTile.ty + (signY * i * 4);
         var valid = true;
         for(var r=0; r<4; r++){
           for(var c=0; c<4; c++){
             var nx = ftx + c; var ny = fty + r;
             if (nx<0 || nx>=GRID || ny<0 || ny>=GRID || scene._occupied[nx+','+ny]) valid = false;
           }
         }
         newCoords.push({tx: ftx, ty: fty, valid: valid});
       }
       dragFenceCoords = newCoords;
       
       // Update ghost sprites
       while(dragFenceGhosts.length < dragFenceCoords.length) {
         var s = scene.add.image(0, 0, 'fence').setOrigin(0.5, 0.8).setScale(0.12).setAlpha(0.6);
         dragFenceGhosts.push(s);
       }
       for(var j=0; j<dragFenceGhosts.length; j++) {
         if (j < dragFenceCoords.length) {
            var c = dragFenceCoords[j];
            var iso = tileToWorld(c.tx, c.ty, ox, oy);
            dragFenceGhosts[j].setPosition(iso.x, iso.y).setDepth(c.tx + c.ty + 2).setVisible(true);
            dragFenceGhosts[j].setTint(c.valid ? 0x4CAF50 : 0xFF6B6B);
         } else {
            dragFenceGhosts[j].setVisible(false);
         }
       }
       // hide original ghost
       if (ghostBuilding) ghostBuilding.setVisible(false);
       if (dragArrows) dragArrows.forEach(function(a) { a.setVisible(false); });
       
       var validCount = dragFenceCoords.filter(function(c) { return c.valid; }).length;
       var totalTime = validCount * 5;
       var totalWood = validCount * 2;
       window.notifyFlutter({
         type: 'update_build_confirm',
         count: validCount,
         time: totalTime,
         wood: totalWood
       });
    }

    function showBuildConfirmUI(scene) {
      if (!ghostBuilding) return;
      
      // Notify Flutter to show the build confirmation overlay
      window.notifyFlutter({
        type: 'show_build_confirm'
      });

      // Bind callbacks for Flutter to call
      scene._confirmBuild = function() {
        confirmBuild(scene);
      };
      
      scene._cancelBuild = function() {
        cancelBuild(scene);
      };
    }

    function closeBuildConfirmUI() {
      window.notifyFlutter({
        type: 'close_build_confirm'
      });
    }

    function confirmBuild(scene) {
      if (ghostBuilding && ghostBuilding._type === 'fence' && isDragBuilding) {
         var config = ghostBuilding._config;
         var builtCount = 0;
         for(var i=0; i<dragFenceCoords.length; i++) {
            var coord = dragFenceCoords[i];
            if (coord.valid) {
               var costs = config.costs || {};
               if (costs.gold && localPlayerData.gold >= costs.gold) localPlayerData.gold -= costs.gold;
               if (costs.wood && (taskProgress['wood']||0) >= costs.wood) taskProgress['wood'] -= costs.wood;
               
               var durationSec = config.construction_duration_seconds || 5;
               var completionTime = Date.now() + (durationSec * 1000);
               var bData = {
                 tx: coord.tx, ty: coord.ty,
                 w: config.w, h: config.h,
                 type: ghostBuilding._type,
                 is_completed: false,
                 completion_timestamp: completionTime
               };
               scene._buildings.push(bData);
               var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
               savedBuildings.push(bData);
               localStorage.setItem('rajadhaniya_buildings', JSON.stringify(savedBuildings));
               
               startConstruction(scene, bData, config);
               builtCount++;
            }
         }
         window.__forceSync = true;
         refreshHud(scene);
         cancelBuild(scene);
         return;
      }

      if (!ghostBuilding || !ghostBuilding._isValid) return;
      var config = ghostBuilding._config;
      var tile = { tx: ghostBuilding._tileX, ty: ghostBuilding._tileY };
      var type = ghostBuilding._type;

      // Deduct Resources Permanently
      var costs = config.costs || {};
      if (costs.gold) localPlayerData.gold -= costs.gold;
      if (costs.wood) taskProgress['wood'] = Math.max(0, (taskProgress['wood']||0) - costs.wood);
      if (costs.gem) taskProgress['gem'] = Math.max(0, (taskProgress['gem']||0) - costs.gem);

      cancelBuild(scene);
      
      var durationSec = config.construction_duration_seconds || 5;
      var completionTime = Date.now() + (durationSec * 1000);
      
      var bData = {
         tx: tile.tx, ty: tile.ty, 
         w: config.w, h: config.h, 
         type: type, 
         is_completed: false, 
         completion_timestamp: completionTime
      };
      
      scene._buildings.push(bData);
      
      var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
      savedBuildings.push({ type: type, tx: tile.tx, ty: tile.ty, is_completed: false, completion_timestamp: completionTime });
      localStorage.setItem('rajadhaniya_buildings', JSON.stringify(savedBuildings));

      window.__forceSync = true;
      refreshHud(scene);

      startConstruction(scene, bData, config);
    }

    function startConstruction(scene, building, config) {
      var pos = tileToWorld(building.tx, building.ty, scene._ox, scene._oy);
      
      for(var r=0; r<config.h; r++){
        for(var c=0; c<config.w; c++){
          scene._occupied[(building.tx+c)+','+(building.ty+r)] = true;
        }
      }

      var shad = scene.add.image(pos.x, pos.y, 'shadow').setAlpha(0.3).setDepth(building.tx + building.ty + 0.1);
      var bSprite = scene.add.image(pos.x, pos.y, config.texture).setOrigin(0.5, 0.8).setDepth(building.tx + building.ty + 2);
      bSprite.setScale(0.12); // Scale AI assets
      bSprite.setTint(0x777777); // Grey out during construction
      building.sprite = bSprite;
      building.shadow = shad;

      var now = Date.now();
      var remainingMs = building.completion_timestamp - now;
      if (remainingMs <= 0) {
         finishConstruction(scene, building, config);
         return;
      }

      var bgBar = scene.add.graphics().setDepth(building.tx + building.ty + 2.5);
      bgBar.fillStyle(0x000000, 0.7);
      bgBar.fillRoundedRect(pos.x - 22, pos.y - 42, 44, 8, 4);

      var fgBar = scene.add.graphics().setDepth(building.tx + building.ty + 2.6);

      var timerLabel = scene.add.text(pos.x, pos.y - 56, '', {
        fontFamily: 'GameFont', fontSize: '11px', color: '#FFFFFF', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(building.tx + building.ty + 2.7);

      var timerEvent = scene.time.addEvent({
        delay: remainingMs,
        callback: function() {
          // IMPORTANT: remove the update listener FIRST, before destroying objects
          scene.events.off('update', updateFn);
          if (bgBar && bgBar.active) bgBar.destroy();
          if (fgBar && fgBar.active) fgBar.destroy();
          if (timerLabel && timerLabel.active) timerLabel.destroy();
          
          finishConstruction(scene, building, config);
        }
      });
      
      var durationMs = (config.construction_duration_seconds || 5) * 1000;

      var updateFn = function() {
        if (!fgBar || !fgBar.active) {
          scene.events.off('update', updateFn);
          return;
        }
        if (!bgBar || !bgBar.active || !timerLabel || !timerLabel.active) return;
        
        var elapsedMs = Date.now() - (building.completion_timestamp - durationMs);
        var p = Math.max(0, Math.min(1, elapsedMs / durationMs));
        
        fgBar.clear();
        fgBar.fillStyle(0xFFC107, 1);
        var barW = Math.max(8, 44 * p);
        fgBar.fillRoundedRect(pos.x - 22, pos.y - 42, barW, 8, 4);
        
        var secsLeft = Math.ceil((building.completion_timestamp - Date.now()) / 1000);
        if (secsLeft < 0) secsLeft = 0;
        
        if (secsLeft > 60) {
           var m = Math.floor(secsLeft / 60);
           var s = secsLeft % 60;
           timerLabel.setText(m + 'm ' + s + 's');
        } else {
           timerLabel.setText(secsLeft + 's');
        }
      };
      scene.events.on('update', updateFn);
    }

    function finishConstruction(scene, building, config) {
      if (building.sprite) building.sprite.clearTint();
      building.is_completed = true;
      var type = building.type;
      
      var bSprite = building.sprite;
      var pos = { x: bSprite ? bSprite.x : 0, y: bSprite ? bSprite.y : 0 };
      var tile = { tx: building.tx, ty: building.ty };
      
      taskProgress[type] = (taskProgress[type] || 0) + 1;
      
      // Mark fence tiles as hard barriers
      if (type === 'fence') {
        for (var fr = 0; fr < config.h; fr++) {
          for (var fc = 0; fc < config.w; fc++) {
            scene._barriers[(building.tx + fc) + ',' + (building.ty + fr)] = true;
          }
        }
      }
      
      var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
      for (var i = 0; i < savedBuildings.length; i++) {
         if (savedBuildings[i].tx === building.tx && savedBuildings[i].ty === building.ty) {
            savedBuildings[i].is_completed = true;
            break;
         }
      }
      localStorage.setItem('rajadhaniya_buildings', JSON.stringify(savedBuildings));

      playHarvestEffect(scene, building.sprite.x, building.sprite.y, 'spark');

      // Trigger Firestore sync via Flutter hud_update
      refreshHud(scene);

      // === Passive income for Mine and Farm ===
      if (type === 'mine') {
        scene.time.addEvent({
          delay: 30000,
          loop: true,
          callback: function() {
            localPlayerData.gold += 25;
            var goldMsg = window.gameLanguage === 'si' ? '🪙 +25 රත්‍රන් (පතල)' : '🪙 +25 Gold (Mine)';
            floatText(scene, goldMsg, bSprite.x, bSprite.y - 40, '#FFD700');
            playHarvestEffect(scene, bSprite.x, bSprite.y, 'spark');
            refreshHud(scene);
          }
        });
      }
      if (type === 'farm') {
        scene.time.addEvent({
          delay: 20000,
          loop: true,
          callback: function() {
            localPlayerData.inventory = localPlayerData.inventory || {};
            localPlayerData.inventory.food = (localPlayerData.inventory.food || 0) + 5;
            localPlayerData.gold += 10;
            var farmMsg = window.gameLanguage === 'si' ? '🌾 +5 ආහාර +10G (ගොවිපල)' : '🌾 +5 Food +10G (Farm)';
            floatText(scene, farmMsg, bSprite.x, bSprite.y - 40, '#A5D6A7');
            playHarvestEffect(scene, bSprite.x, bSprite.y, 'leaf');
            refreshHud(scene);
          }
        });
      }

      if (type === 'cow_farm') {
        var n = scene.getPooledUnit(scene, bSprite.x, bSprite.y + 10, 'player').setOrigin(0.5, 0.8).setDepth(tile.tx + tile.ty + 2).setScale(0.25);
        n._tileX = tile.tx; n._tileY = tile.ty;
        n._needs = { hunger: 50 + Math.random()*50, thirst: 50 + Math.random()*50, hygiene: 100, toilet: 100 };
        npcSprites.push(n);
        scheduleNPCMove(scene, n, ox, oy);
      }

      var buildStr = window.gameLanguage === 'si' ? '\u2714 ගොඩනැගුවා!' : '\u2714 Built!';
      floatText(scene, buildStr, pos.x, pos.y - 50, '#4CAF50');
      
      window.__forceSync = true;
      refreshHud(scene);
      checkEraCompletion(scene);
    }

    function cancelBuild(scene) {
      if (ghostBuilding) {
        ghostBuilding.destroy();
        ghostBuilding = null;
      }
      if (dragFenceGhosts) {
        dragFenceGhosts.forEach(function(g) { g.destroy(); });
        dragFenceGhosts = [];
      }
      if (dragArrows) {
        dragArrows.forEach(function(a) { a.destroy(); });
        dragArrows = [];
      }
      isDragBuilding = false;
      dragStartTile = null;
      dragFenceCoords = [];
      currentBuildMode = null;
      closeBuildConfirmUI();
    }

    /* ──────────────────────────────────────────────
       PLACE RESOURCES ON GRID
       ────────────────────────────────────────────── */
    function placeResources(scene, ox, oy) {
      var innerStart = BORDER + 2;
      var innerEnd   = GRID - BORDER - 3;

      var placements = [
        { type: 'tree',     count: 60 },
        { type: 'deer',     count: 20 },
        { type: 'gem_rock', count: 20 },
        { type: 'wolf',     count: 5 },
        { type: 'bear',     count: 2 }
      ];

      scene._occupied[(GRID - 1) / 2 + ',' + (GRID - 1) / 2] = true;

      placements.forEach(function (cfg) {
        for (var i = 0; i < cfg.count; i++) {
          var tx, ty;
          var attempts = 0;
          var isValid = false;
          do {
            tx = Math.floor(innerStart + Math.random() * (innerEnd - innerStart - 4));
            ty = Math.floor(innerStart + Math.random() * (innerEnd - innerStart - 4));
            isValid = true;
            for(var rr=0; rr<4; rr++){
              for(var cc=0; cc<4; cc++){
                if(scene._occupied[(tx+cc) + ',' + (ty+rr)]) isValid = false;
              }
            }
            attempts++;
          } while (!isValid && attempts < 50);
          if (attempts >= 50) continue;
          
          for(var rr=0; rr<4; rr++){
            for(var cc=0; cc<4; cc++){
              scene._occupied[(tx+cc) + ',' + (ty+rr)] = true;
            }
          }

          var posIso = cartToIso(tx + 1.5, ty + 1.5);
          var pos = { x: posIso.x + ox + TILE_W/2, y: posIso.y + oy + TILE_H/2 };
          var shad = scene.add.image(pos.x, pos.y, 'shadow').setAlpha(0.3).setDepth(tx + ty + 3);
          
          var spr;
          if (cfg.type === 'deer') {
            spr = scene.getPooledUnit(scene, pos.x, pos.y, cfg.type).setOrigin(0.5, 0.8).setDepth(tx + ty + 1);
            if (scene.anims && scene.anims.exists('cow-walk')) spr.play('cow-walk', true);
            spr.setScale(0.25);
            spr._tileX = tx; spr._tileY = ty;
            spr._needs = { hunger: 50 + Math.random()*50, thirst: 50 + Math.random()*50, hygiene: 100, toilet: 100 };
            npcSprites.push(spr);
            scheduleNPCMove(scene, spr, ox, oy);
          } else if (cfg.type === 'wolf' || cfg.type === 'bear') {
             if (!scene._hostiles) scene._hostiles = [];
             spr = scene.add.image(pos.x, pos.y, cfg.type).setOrigin(0.5, 0.8).setDepth(tx + ty + 1).setScale(0.25);
             var hp = cfg.type === 'bear' ? 300 : 100;
             var hpBar = scene.add.graphics();
             hpBar.setDepth(tx + ty + 5);
             scene._hostiles.push({
                 type: cfg.type,
                 sprite: spr,
                 tx: tx, ty: ty,
                 hp: hp,
                 maxHp: hp,
                 hpBar: hpBar,
                 defeated: false
             });
          } else {
            spr = scene.add.image(pos.x, pos.y, cfg.type).setOrigin(0.5, 0.8).setDepth(tx + ty + 1);
            spr.setScale(cfg.type === 'tree' ? 0.25 : 0.06);
            resourceSprites.push({ type: cfg.type, sprite: spr, shadow: shad, tileX: tx, tileY: ty, maxYield: 50, currentYield: 50 });

            if (cfg.type !== 'tree') {
              scene.tweens.add({
                targets: spr, y: pos.y - 4,
                duration: 1200 + Math.random() * 800,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
              });
            }
          }
        }
      });
    }

    /* ─── Border Forest (CoC style dense tree ring) ─── */
    function placeBorderForest(scene, ox, oy) {
      var clearedBorders = JSON.parse(localStorage.getItem('rajadhaniya_cleared_borders') || '[]');
      
      for (var r = 0; r < GRID; r+=4) {
        for (var c = 0; c < GRID; c+=4) {
          var isBorder = (r < BORDER || r >= GRID - BORDER || c < BORDER || c >= GRID - BORDER);
          if (!isBorder) continue;
          
          var isCleared = clearedBorders.some(function(cb) { return cb.tx === c && cb.ty === r; });
          if (isCleared) {
            revealedTiles[c + ',' + r] = true;
            
            // Fog clearing logic removed for performance
            continue;
          }

          if (Math.random() < 0.25) continue;

          for(var rr=0; rr<4; rr++){
            for(var cc=0; cc<4; cc++){
              scene._occupied[(c+cc) + ',' + (r+rr)] = true;
            }
          }
          
          var posObj = cartToIso(c + 1.5, r + 1.5);
          var pos = { x: posObj.x + ox + TILE_W/2, y: posObj.y + oy + TILE_H/2 };

          var spr = scene.add.image(pos.x, pos.y, 'tree')
            .setOrigin(0.5, 0.8).setDepth((c+2) + (r+2) + 1)
            .setScale(0.22 + Math.random() * 0.06)
            .setTint(0x2e5c20);

          scene.tweens.add({
            targets: spr, y: pos.y - 3,
            duration: 1400 + Math.random() * 900,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
          resourceSprites.push({ type: 'border_tree', sprite: spr, shadow: null, tileX: c, tileY: r, isBorderTree: true });
        }
      }
    }

    /* ─── Fog of War (Disabled) ─── */
    function initFog(scene, ox, oy) {
      // Disabled for smooth play
    }

    function revealFogAround(scene, cx, cy, radius, ox, oy) {
      // Disabled for smooth play
    }

    /* ─── Enemy Kingdoms ─── */
    function placeEnemyKingdoms(scene, ox, oy) {
      var is = BORDER + 8;
      var ie = GRID - BORDER - 9;
      var mid = Math.floor((GRID - 1) / 2);

      var defs = [
        { tx: is,   ty: is,   name: 'King Ravana',  gold: 200, level: 1 },
        { tx: ie,   ty: is,   name: 'Lord Pandya',  gold: 300, level: 2 },
        { tx: mid,  ty: ie,   name: 'Chief Yodha',  gold: 250, level: 3 },
      ];

      defs.forEach(function(d) {
        var pos = tileToWorld(d.tx, d.ty, ox, oy);
        var base = scene.add.image(pos.x, pos.y, 'enemy_base')
          .setOrigin(0.5, 0.8).setDepth(d.tx + d.ty + 2).setScale(1.3);

        var flagG = scene.add.graphics().setDepth(d.tx + d.ty + 3);
        flagG.fillStyle(0xBB0000, 1);
        flagG.fillRect(pos.x - 1, pos.y - 65, 3, 40);
        flagG.fillTriangle(pos.x + 2, pos.y - 65, pos.x + 20, pos.y - 57, pos.x + 2, pos.y - 49);

        var lbl = scene.add.text(pos.x, pos.y - 72, '\u2694\ufe0f ' + d.name, {
          fontFamily: 'GameFont', fontSize: '9px', color: '#FFD700',
          backgroundColor: 'rgba(0,0,0,0.75)', padding: { x: 4, y: 2 },
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5, 1).setDepth(d.tx + d.ty + 4);

        var kingdom = { name: d.name, tx: d.tx, ty: d.ty, sprite: base, label: lbl, flag: flagG, gold: d.gold, level: d.level, defeated: false, hp: 2000, maxHP: 2000 };
        enemyKingdoms.push(kingdom);
        for(var er=0; er<8; er++){
          for(var ec=0; ec<8; ec++){
            scene._occupied[(d.tx+ec) + ',' + (d.ty+er)] = true;
          }
        }
      });
    }

    /* ─── Attack System ─── */
    function tryAttackKingdom(scene, kingdom) {
      if (kingdom.defeated) {
        floatText(scene, '\u23f3 Rebuilding...', kingdom.sprite.x, kingdom.sprite.y - 80, '#AAAAAA');
        return;
      }
      closeContextualMenu(scene);
      
      // Notify Flutter
      window.notifyFlutter({
        type: 'show_attack_menu',
        kingdomName: kingdom.name,
        level: kingdom.level,
        gold: kingdom.gold,
        tx: kingdom.tx,
        ty: kingdom.ty
      });

      scene._executeAttack = function(tx, ty) {
        if (kingdom.tx === tx && kingdom.ty === ty) {
          executeAttack(scene, kingdom);
        }
      };
    }

    function executeAttack(scene, kingdom) {
      scene.cameras.main.shake(700, 0.01);
      playHarvestEffect(scene, kingdom.sprite.x, kingdom.sprite.y, 'spark');
      playHarvestEffect(scene, kingdom.sprite.x - 10, kingdom.sprite.y - 30, 'spark');
      scene.tweens.add({ targets: kingdom.sprite, alpha: 0.15, duration: 80, yoyo: true, repeat: 6 });

      var stolen = Math.floor(kingdom.gold * (0.3 + Math.random() * 0.2));
      kingdom.gold = Math.max(0, kingdom.gold - stolen);
      localPlayerData.gold += stolen;

      floatText(scene, '\ud83e\ude99 +' + stolen + ' Gold raided!', kingdom.sprite.x, kingdom.sprite.y - 80, '#FFD700');

      kingdom.defeated = true;
      kingdom.sprite.setTint(0x333333);
      kingdom.label.setText('\ud83d\udc80 ' + kingdom.name + ' (Defeated)');

      scene.time.addEvent({ delay: 60000, callback: function() {
        kingdom.defeated = false;
        kingdom.gold = 150 + kingdom.level * 80;
        kingdom.sprite.clearTint();
        kingdom.label.setText('\u2694\ufe0f ' + kingdom.name);
        floatText(scene, '\ud83d\udd04 ' + kingdom.name + ' rebuilt!', kingdom.sprite.x, kingdom.sprite.y - 70, '#FF8C00');
      }});

      refreshHud(scene);
    }

    function issueCombatCommand(scene, unit, targetPayload, ox, oy) {
       if (unit._harvestTimer) { unit._harvestTimer.remove(false); unit._harvestTimer = null; }
       if (unit._combatTimer) { unit._combatTimer.remove(false); unit._combatTimer = null; }
       scene.tweens.killTweensOf(unit);
       
       var targetTx = targetPayload.obj.tx;
       var targetTy = targetPayload.obj.ty;

       var dmg = 10, range = 1, speed = 1000;
       if (window.gameConfig && window.gameConfig.troops && unit._troopId) {
          var tCfg = window.gameConfig.troops.find(function(x) { return x.id === unit._troopId; });
          if (tCfg) {
             dmg = tCfg.attack_damage || 10;
             range = tCfg.attack_range || 1;
             speed = tCfg.attack_speed_ms || 1000;
          }
       }
       
       unit._combatStats = { dmg: dmg, range: range, speed: speed };
       unit._combatTarget = targetPayload;
       
       var uTx = unit._tileX !== undefined ? unit._tileX : Math.floor((unit.x - ox) / TILE_W);
       var uTy = unit._tileY !== undefined ? unit._tileY : Math.floor((unit.y - oy) / TILE_H);
       
       var minT = null;
       var minDist = 999999;
       
       // Footprint size depends on target type
       var maxR = targetPayload.type === 'kingdom' ? 8 : 1;
       var maxC = maxR;
       
       for (var dr = 0; dr < maxR; dr++) {
         for (var dc = 0; dc < maxC; dc++) {
            var ctx = targetTx + dc; var cty = targetTy + dr;
            var dist = Math.abs(uTx - ctx) + Math.abs(uTy - cty);
            if (dist < minDist) { minDist = dist; minT = {tx: ctx, ty: cty}; }
         }
       }
       
       floatText(scene, '⚔️ Attacking!', unit.x, unit.y - 40, '#FF4444');
       
       if (minDist <= range) {
           startCombatLoop(scene, unit, targetPayload, ox, oy);
       } else {
           moveUnitToTile(scene, unit, minT.tx, minT.ty, ox, oy, range, function(success) {
               if (success) startCombatLoop(scene, unit, targetPayload, ox, oy);
           });
       }
    }

    function startCombatLoop(scene, unit, targetPayload, ox, oy) {
        if (!unit.active || targetPayload.obj.defeated) return;
        
        // Flip to face target
        var targetPos = tileToWorld(targetPayload.obj.tx, targetPayload.obj.ty, ox, oy);
        unit.setFlipX(unit.x > targetPos.x);

        unit._combatTimer = scene.time.addEvent({
            delay: unit._combatStats.speed,
            loop: true,
            callback: function() {
                if (!unit.active || targetPayload.obj.defeated) {
                    if (unit._combatTimer) { unit._combatTimer.remove(false); unit._combatTimer = null; }
                    return;
                }
                
                // Swing animation
                if (scene.anims && scene.anims.exists('action-axe')) {
                    unit.play('action-axe', true);
                } else if (scene.anims && scene.anims.exists('walk-down')) {
                    unit.play('walk-down', true); // fallback
                }
                
                // Projectile Logic
                var isRanged = unit._combatStats && unit._combatStats.range > 2;

                if (isRanged) {
                    var projectile = scene.add.text(unit.x, unit.y - 20, '🏹', { fontSize: '20px' }).setDepth(3000);
                    var angle = Phaser.Math.Angle.Between(unit.x, unit.y - 20, targetPos.x, targetPos.y - 20);
                    projectile.setRotation(angle + Math.PI/4); // adjust emoji rotation
                    
                    scene.tweens.add({
                        targets: projectile,
                        x: targetPos.x,
                        y: targetPos.y - 20,
                        duration: 300,
                        onComplete: function() {
                            if (projectile && projectile.active) projectile.destroy();
                            applyDamage();
                        }
                    });
                } else {
                    applyDamage();
                }

                function applyDamage() {
                    if (targetPayload.obj.defeated) return;
                    
                    // Damage target
                    targetPayload.obj.hp -= unit._combatStats.dmg;
                    
                    // Render sparks
                    playHarvestEffect(scene, targetPos.x + (Math.random()*40-20), targetPos.y - 20 - Math.random()*20, 'spark');
                    floatText(scene, '-' + unit._combatStats.dmg, targetPos.x, targetPos.y - 60, '#FF0000');
                    
                    // Render HP Bar
                    if (!targetPayload.obj.hpBar) {
                        targetPayload.obj.hpBar = scene.add.graphics().setDepth(targetPayload.obj.tx + targetPayload.obj.ty + 5);
                    }
                    targetPayload.obj.hpBar.clear();
                    var hpPct = Math.max(0, targetPayload.obj.hp / targetPayload.obj.maxHP);
                    targetPayload.obj.hpBar.fillStyle(0x000000, 0.8);
                    targetPayload.obj.hpBar.fillRect(targetPos.x - 30, targetPos.y - 90, 60, 8);
                    targetPayload.obj.hpBar.fillStyle(0xFF0000, 1);
                    targetPayload.obj.hpBar.fillRect(targetPos.x - 30 + 1, targetPos.y - 90 + 1, (60 - 2) * hpPct, 6);

                    // Death check
                    if (targetPayload.obj.hp <= 0 && !targetPayload.obj.defeated) {
                        targetPayload.obj.defeated = true;
                        if (unit._combatTimer) { unit._combatTimer.remove(false); unit._combatTimer = null; }
                        if (targetPayload.obj.hpBar) { targetPayload.obj.hpBar.destroy(); targetPayload.obj.hpBar = null; }
                        
                        if (targetPayload.type === 'kingdom') {
                            executeAttack(scene, targetPayload.obj); // Re-use the pillage/defeat logic!
                        } else if (targetPayload.type === 'wildlife') {
                            executeWildlifeDefeat(scene, targetPayload.obj);
                        }
                        
                        unit.stop(); // idle
                    }
                }
            }
        });
    }

    function executeWildlifeDefeat(scene, hostile) {
        hostile.defeated = true;
        if (hostile.sprite) {
            playHarvestEffect(scene, hostile.sprite.x, hostile.sprite.y, 'smoke');
            hostile.sprite.destroy();
            hostile.sprite = null;
        }
        if (hostile.hpBar) {
            hostile.hpBar.destroy();
            hostile.hpBar = null;
        }

        var meatReward = hostile.type === 'bear' ? 20 : 10;
        // Reward Meat (Food) on kill — not Gold
        localPlayerData.inventory = localPlayerData.inventory || {};
        localPlayerData.inventory.meat = (localPlayerData.inventory.meat || 0) + meatReward;
        taskProgress['hunting'] = (taskProgress['hunting'] || 0) + meatReward; // era progress tracking
        
        var isoPos = cartToIso(hostile.tx + 0.5, hostile.ty + 0.5);
        var targetPos = { x: isoPos.x + scene.cameras.main.centerX, y: isoPos.y + scene.cameras.main.centerY };
        
        floatText(scene, '+' + meatReward + ' \ud83e\udd69 Meat', targetPos.x, targetPos.y - 40, '#FF6B35');
        
        refreshHud(scene);
    }


    /* ──────────────────────────────────────────────
       STEP 2 – Single Tap: move player to tile
       ────────────────────────────────────────────── */
    function handleSingleTap(scene, pointer, ox, oy) {
      var targetUnit = selectedUnit || playerSprite;
      
      var wp = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      var tile = worldToTile(wp.x, wp.y, ox, oy);
      tile.tx = Math.max(0, Math.min(GRID - 1, tile.tx));
      tile.ty = Math.max(0, Math.min(GRID - 1, tile.ty));

      var cur = worldToTile(targetUnit.x, targetUnit.y, ox, oy);
      if (tile.tx === cur.tx && tile.ty === cur.ty) return;

      // Interrupt existing tasks
      if (targetUnit._harvestTimer) {
        targetUnit._harvestTimer.remove(false);
        targetUnit._harvestTimer = null;
      }
      
      moveUnitToTile(scene, targetUnit, tile.tx, tile.ty, ox, oy);
    }

    function movePlayerToTile(scene, tx, ty, ox, oy, range, onComplete) {
      moveUnitToTile(scene, playerSprite, tx, ty, ox, oy, range, onComplete);
    }

    function moveUnitToTile(scene, unit, tx, ty, ox, oy, range, onComplete) {
      if (typeof range === 'function') {
        onComplete = range;
        range = 0;
      }
      
      scene.tweens.killTweensOf(unit);
      if (unit === playerSprite) isMoving = false;
      
      var cur = worldToTile(unit.x, unit.y, ox, oy);
      if (unit === playerSprite) isMoving = true;
      
      getPathAsync(scene, cur.tx, cur.ty, tx, ty, range, function(path) {
        if (path.length <= 1) {
          if (unit === playerSprite) isMoving = false;
          if (onComplete) onComplete(path.length === 1);
          return;
        }

        var idx = 1;

        function nextStep() {
          if (idx >= path.length || !unit.active) {
            if (unit === playerSprite) isMoving = false;
            if (unit.anims && unit.anims.isPlaying) {
              unit.stop();
            }
            refreshHud(scene);
            if (onComplete) onComplete(true);
            return;
          }
          var t = path[idx];
          var pos = tileToWorld(t.x, t.y, ox, oy);

          var prev = path[idx - 1];
          var animKey = (unit.texture && unit.texture.key === 'deer') ? 'cow-walk' : 'walk-down';
          if (scene.anims && scene.anims.exists(animKey)) {
            unit.play(animKey, true);
          }
          if (t.x > prev.x) unit.setFlipX(false);
          else if (t.x < prev.x) unit.setFlipX(true);

          unit.setDepth(t.x + t.y + 1);
          unit._tileX = t.x;
          unit._tileY = t.y;
          if (unit === playerSprite && scene._playerShadow) {
            scene._playerShadow.setPosition(pos.x, pos.y);
            scene._playerShadow.setDepth(t.x + t.y + 0.1);
          }

          scene.tweens.add({
            targets: unit,
            x: pos.x, y: pos.y,
            duration: 30,
            ease: 'Linear',
            onUpdate: function() {
              if (selectionRing && selectedUnit === unit) {
                selectionRing.setPosition(unit.x, unit.y);
                selectionRing.setDepth(unit.depth - 0.5);
              }
            },
            onComplete: function () { idx++; nextStep(); },
          });
        }
        nextStep();
      });
    }


    function scheduleNPCMove(scene, npc, ox, oy) {
      var wait = Phaser.Math.Between(2000, 6000);
      scene.time.delayedCall(wait, function() {
        if (!npc.active) return;
        var tx = Phaser.Math.Between(0, Math.min(GRID - 1, npc._tileX + 15));
        var ty = Phaser.Math.Between(0, Math.min(GRID - 1, npc._tileY + 15));
        if (scene._occupied[tx+','+ty]) { scheduleNPCMove(scene, npc, ox, oy); return; }

        getPathAsync(scene, npc._tileX, npc._tileY, tx, ty, 0, function(path) {
          if (path.length <= 1) { scheduleNPCMove(scene, npc, ox, oy); return; }

          var idx = 1;
          function nextStep() {
            if (!npc.active) return;
            if (idx >= path.length || scene._occupied[path[idx].x+','+path[idx].y]) {
              if (npc.anims && npc.anims.isPlaying) {
                npc.stop();
              }
              scheduleNPCMove(scene, npc, ox, oy);
              return;
            }
            var t = path[idx];
            var pos = tileToWorld(t.x, t.y, ox, oy);
            
            if (t.x > npc._tileX) npc.setFlipX(false);
            else if (t.x < npc._tileX) npc.setFlipX(true);
            
            if (npc.texture.key === 'deer') {
              if (scene.anims && scene.anims.exists('cow-walk')) npc.play('cow-walk', true);
            } else {
              if (scene.anims && scene.anims.exists('walk-down')) npc.play('walk-down', true);
            }

            npc._tileX = t.x;
            npc._tileY = t.y;
            npc.setDepth(t.x + t.y + 1);

            scene.tweens.add({
              targets: npc,
              x: pos.x, y: pos.y,
              duration: 60,
              ease: 'Linear',
              onComplete: function() { 
                idx++; 
                nextStep(); 
              }
            });
          }
          nextStep();
        });
      });
    }

    /* ──────────────────────────────────────────────
       STEP 3 – Contextual Menu & Harvesting
       ────────────────────────────────────────────── */
    function createContextualMenu(scene, res) {
      closeContextualMenu(scene);
      isMenuOpen = true;

      var taskMap = { tree: 'wood', deer: 'hunting', gem_rock: 'gem', lake: 'fish', fence: 'fence' };
      var taskKey = taskMap[res.type];
      var cfg = TASKS_CONFIG[taskKey] || {};

      var tx = (res.isBuilding && res.buildingData) ? res.buildingData.tx : ((res.sprite && res.sprite._tileX !== undefined) ? res.sprite._tileX : res.tileX);
      var ty = (res.isBuilding && res.buildingData) ? res.buildingData.ty : ((res.sprite && res.sprite._tileY !== undefined) ? res.sprite._tileY : res.tileY);

      var yields = [];
      if (cfg && cfg.icon) yields.push('1 ' + cfg.icon);
      if (res.type === 'gem_rock') yields.push('🪙 +10 Gold  💎 +3 Gems');
      if (res.type === 'deer') { yields.push('🥛 +5 Milk'); yields.push('💧 +8 Hydration'); }
      if (res.type === 'tree') { yields.push('🪙 +5 Gold'); yields.push('🪵 +3 Wood'); }
      if (res.type === 'lake') { yields.push('🪙 +15 Gold'); yields.push('💧 +20 Hydration'); yields.push('🍔 +1 Food'); }

      var assignedWorkers = 0;
      var maxWorkers = 5; // Default max workers per drop-off
      if (res.isBuilding && res.buildingData) {
         assignedWorkers = res.buildingData._workers ? res.buildingData._workers.length : 0;
      }

      window.notifyFlutter({
        type: 'show_contextual_menu',
        resType: res.type,
        isHarvesting: res.isHarvesting,
        isBuilding: res.isBuilding,
        taskKey: taskKey,
        tx: tx,
        ty: ty,
        yields: yields,
        cost: GLOBAL_CONFIG.treeClearCost || 100,
        isEraUpgradeReady: window.isEraUpgradeReady,
        isTownHall: res.type === 'workers_hut',
        assignedWorkers: assignedWorkers,
        maxWorkers: maxWorkers
      });

      scene._upgradeEra = function() {
        if (window.isEraUpgradeReady && res.type === 'workers_hut') {
          transitionToNextEra(scene);
        }
      };

      scene._startHarvest = function(tX, tY, tKey) {
        if (tX === tx && tY === ty) {
          if (res.isBuilding) {
            res.isHarvesting = true;
            playHarvestEffect(scene, res.sprite.x, res.sprite.y + 40, 'spark');
            setTimeout(function() { 
              res.isHarvesting = false;
              taskProgress[tKey] = (taskProgress[tKey] || 0) + 1;
              refreshHud(scene);
            }, 1000);
          } else {
            startHarvest(scene, res, tKey);
          }
        }
      };

      scene._boostHarvest = function(tX, tY, tKey) {
        if (tX === tx && tY === ty) {
          boostHarvest(scene, res, tKey);
        }
      };

      scene._removeBuilding = function(tX, tY) {
        if (tX === tx && tY === ty) {
          removeBuilding(scene, res.buildingData);
        }
      };

      scene._clearBorderTree = function(tX, tY, cost) {
        if (tX === tx && tY === ty) {
          clearBorderTree(scene, res, cost);
        }
      };

      scene._feedPlayer = function(amount) {
        localPlayerData.needs.hunger = Math.min(100, localPlayerData.needs.hunger + amount);
        floatText(scene, '🍔 +' + amount, res.sprite.x, res.sprite.y, '#4CAF50');
        refreshHud(scene);
      };

      scene._hydratePlayer = function(amount) {
        localPlayerData.needs.thirst = Math.min(100, localPlayerData.needs.thirst + amount);
        floatText(scene, '💧 +' + amount, res.sprite.x, res.sprite.y, '#4CAF50');
        refreshHud(scene);
      };

      scene._cleanPlayer = function(amount) {
        localPlayerData.needs.hygiene = Math.min(100, localPlayerData.needs.hygiene + amount);
        floatText(scene, '🧼 +' + amount, res.sprite.x, res.sprite.y, '#4CAF50');
        refreshHud(scene);
      };

      scene._toiletPlayer = function() {
        localPlayerData.needs.toilet = 100;
        floatText(scene, '🚽 +100', res.sprite.x, res.sprite.y, '#4CAF50');
        refreshHud(scene);
      };
    }

    function closeContextualMenu(scene) {
      if (isMenuOpen) {
        window.notifyFlutter({ type: 'close_contextual_menu' });
        isMenuOpen = false;
      }
    }

    /* ──────────────────────────────────────────────
       SMART FENCE BUILDING (Phase 3)
       ────────────────────────────────────────────── */
    function showFenceEditOverlay(scene, res, ox, oy) {
      if (activeFenceOverlay) { activeFenceOverlay.destroy(); activeFenceOverlay = null; }
      if (!res || !res.buildingData) return;
      var bData = res.buildingData;
      var tx = bData.tx;
      var ty = bData.ty;

      activeFenceOverlay = scene.add.group();

      function createDirArrow(dx, dy, icon) {
        var ntx = tx + dx;
        var nty = ty + dy;
        // Check grid boundary
        if (ntx < 0 || ntx >= GRID || nty < 0 || nty >= GRID) return;
        
        // Check if blocked by any occupied tile (4x4)
        var blocked = false;
        for(var rr=0; rr<4; rr++){
          for(var cc=0; cc<4; cc++){
            if(scene._occupied[(ntx+cc) + ',' + (nty+rr)]) blocked = true;
          }
        }
        if (blocked) return;

        var iso = tileToWorld(ntx, nty, ox, oy);
        var arrow = scene.add.text(iso.x, iso.y, icon, { fontSize: '24px' })
          .setOrigin(0.5, 0.5)
          .setDepth(tx + ty + 100)
          .setPadding(12) // Generous hitbox padding for mobile (>=44px)
          .setInteractive()
          .on('pointerdown', function(pointer) {
             pointer.event.stopPropagation(); // prevent underlying grid click
          })
          .on('pointerup', function(pointer) {
             pointer.event.stopPropagation();
             var currentWood = taskProgress['task2'] || 0;
             if (currentWood < 2) {
               floatText(scene, window.gameLanguage === 'si' ? 'දැව මදි!' : 'Not enough Wood!', iso.x, iso.y - 20, '#FF0000');
               return;
             }
             // Deduct wood
             taskProgress['task2'] -= 2;
             
             // Place new fence
             for(var r=0; r<4; r++){
               for(var c=0; c<4; c++){
                 scene._occupied[(ntx+c) + ',' + (nty+r)] = true;
                 scene._barriers[(ntx+c) + ',' + (nty+r)] = true;
               }
             }
             var nIso = cartToIso(ntx + 1.5, nty + 1.5);
             var np = { x: nIso.x + ox + TILE_W/2, y: nIso.y + oy + TILE_H/2 };
             var spr = scene.add.image(np.x, np.y, 'fence').setOrigin(0.5, 0.8).setDepth(ntx + nty + 1).setScale(0.12);
             
             var newBData = { type: 'fence', sprite: spr, tx: ntx, ty: nty, w: 4, h: 4 };
             scene._buildings.push(newBData);
             
             var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
             savedBuildings.push({ type: 'fence', tx: ntx, ty: nty });
             localStorage.setItem('rajadhaniya_buildings', JSON.stringify(savedBuildings));

             playHarvestEffect(scene, np.x, np.y, 'spark');
             refreshHud(scene);

             // Re-center overlay on new fence
             showFenceEditOverlay(scene, { isBuilding: true, type: 'fence', buildingData: newBData }, ox, oy);
          });
        activeFenceOverlay.add(arrow);
      }

      createDirArrow(0, -4, '⬆️'); // North
      createDirArrow(0, 4, '⬇️');  // South
      createDirArrow(4, 0, '➡️');  // East
      createDirArrow(-4, 0, '⬅️'); // West

      // Delete Button
      var centerIso = tileToWorld(tx, ty, ox, oy);
      var delBtn = scene.add.text(centerIso.x, centerIso.y - 20, '❌', { fontSize: '20px' })
        .setOrigin(0.5, 0.5)
        .setDepth(tx + ty + 101)
        .setPadding(12) // Generous hitbox
        .setInteractive()
        .on('pointerdown', function(pointer) {
           pointer.event.stopPropagation();
        })
        .on('pointerup', function(pointer) {
           pointer.event.stopPropagation();
           taskProgress['task2'] = (taskProgress['task2'] || 0) + 1; // refund 1 wood
           floatText(scene, '+1 🪵', centerIso.x, centerIso.y - 40, '#8B5A2B');
           scene._removeBuilding(tx, ty);
           refreshHud(scene);
           activeFenceOverlay.destroy();
           activeFenceOverlay = null;
        });
      activeFenceOverlay.add(delBtn);
    }

    /* ──────────────────────────────────────────────
       AUTOMATED RESOURCE GATHERING (Phase 1 & 2 - True AoE)
       ────────────────────────────────────────────── */
    function startAutomatedHarvest(scene, unit, res, ox, oy) {
      if (!unit || !res) return;
      if (res.isBuilding) {
        createContextualMenu(scene, res);
        return;
      }
      if (res.currentYield <= 0) return;
      
      var maxCarry = 10;
      unit._payload = unit._payload || { amount: 0, type: res.type };

      // Assign worker to nearest dropoff for UI tracking
      if (!unit._assignedDropoff) {
         var dropoff = findNearestDropoff(scene, unit);
         if (dropoff) {
            if (!dropoff._workers) dropoff._workers = [];
            if (dropoff._workers.indexOf(unit) === -1) dropoff._workers.push(unit);
            unit._assignedDropoff = dropoff;
         }
      }

      // If unit already carrying something else or full, drop off first
      if (unit._payload.amount >= maxCarry || (unit._payload.amount > 0 && unit._payload.type !== res.type)) {
         returnDropoff(scene, unit, res, ox, oy);
         return;
      }

      if (scene.anims && scene.anims.exists('action-axe')) {
         unit.play('action-axe', true);
      } else {
         scene.tweens.add({
           targets: unit, y: unit.y - 10,
           yoyo: true, repeat: -1, duration: 400
         });
      }
      
      unit._harvestTimer = scene.time.addEvent({
        delay: 2000,
        loop: true,
        callback: function() {
          if (!res.sprite || !res.sprite.active || res.currentYield <= 0) {
            stopHarvesting(scene, unit);
            if (unit._payload.amount > 0) returnDropoff(scene, unit, null, ox, oy);
            return;
          }

          res.currentYield -= 1;
          unit._payload.amount += 1;
          unit._payload.type = res.type;
          
          var icon = (res.type === 'gem_rock') ? '💎' : (res.type === 'deer' ? '🍖' : '🪵');
          floatText(scene, '+1 ' + icon, unit.x, unit.y - 40, '#FFFFFF');
          playHarvestEffect(scene, res.sprite.x, res.sprite.y, 'spark');

          if (res.currentYield <= 0) {
            depleteResource(scene, res);
            stopHarvesting(scene, unit);
            if (unit._payload.amount > 0) returnDropoff(scene, unit, null, ox, oy);
            return;
          }

          if (unit._payload.amount >= maxCarry) {
            stopHarvesting(scene, unit);
            returnDropoff(scene, unit, res, ox, oy);
          }
        }
      });
    }

    function stopHarvesting(scene, unit) {
      if (unit._harvestTimer) unit._harvestTimer.remove(false);
      unit._harvestTimer = null;
      scene.tweens.killTweensOf(unit);
      if (unit.anims && unit.anims.isPlaying) unit.stop();
      if (unit._assignedDropoff && unit._assignedDropoff._workers) {
         var idx = unit._assignedDropoff._workers.indexOf(unit);
         if (idx !== -1) unit._assignedDropoff._workers.splice(idx, 1);
         unit._assignedDropoff = null;
      }
    }

    function depleteResource(scene, res) {
      for(var rr=0; rr<4; rr++){
        for(var cc=0; cc<4; cc++){
          scene._occupied[(res.tileX+cc) + ',' + (res.tileY+rr)] = false;
        }
      }
      if (res.shadow) res.shadow.destroy();
      if (res.sprite) res.sprite.destroy();
    }

    function findNearestDropoff(scene, unit, blacklist) {
      var pType = unit._payload ? unit._payload.type : null;
      var dropoffs = [];
      if (pType === 'tree') {
        dropoffs = ['workers_hut'];
      } else if (pType === 'deer') {
        dropoffs = ['house', 'workers_hut'];
      } else if (pType === 'gem_rock') {
        dropoffs = ['temple'];
      } else {
        dropoffs = ['house', 'workers_hut', 'temple', 'mine', 'farm', 'lumber_camp'];
      }

      var best = null;
      var bestDist = Infinity;
      var uTx = unit._tileX || 0;
      var uTy = unit._tileY || 0;
      for (var i = 0; i < scene._buildings.length; i++) {
        var b = scene._buildings[i];
        if (dropoffs.indexOf(b.type) !== -1) {
          if (!b.is_completed) continue; // Only deposit at completed buildings
          if (blacklist && blacklist.indexOf(b) !== -1) continue; // Skip blocked buildings
          
          var dist = Math.abs(b.tx - uTx) + Math.abs(b.ty - uTy);
          if (dist < bestDist) {
            bestDist = dist;
            best = b;
          }
        }
      }
      return best;
    }

    function depositPayload(scene, unit) {
      if (!unit._payload || unit._payload.amount <= 0) return;
      var amt = unit._payload.amount;
      var type = unit._payload.type;
      unit._payload.amount = 0;

      if (type === 'gem_rock') {
        localPlayerData.gold += amt;
        taskProgress['gem'] = (taskProgress['gem'] || 0) + amt;
      } else if (type === 'deer') {
        localPlayerData.inventory = localPlayerData.inventory || {};
        localPlayerData.inventory.meat = (localPlayerData.inventory.meat || 0) + amt;
      } else if (type === 'tree') {
        taskProgress['wood'] = (taskProgress['wood'] || 0) + amt;
      } else {
        var taskKey = type === 'tree' ? 'task2' : 'task1';
        taskProgress[taskKey] = (taskProgress[taskKey] || 0) + amt;
      }
      refreshHud(scene);
      checkEraCompletion(scene);
    }

    function returnDropoff(scene, unit, res, ox, oy, blacklist) {
      blacklist = blacklist || [];
      var dropoff = findNearestDropoff(scene, unit, blacklist);
      if (!dropoff) {
        floatText(scene, 'No Drop-off!', unit.x, unit.y - 40, '#FF0000');
        unit.stop(); // Go idle
        depositPayload(scene, unit); // Fallback deposit so they don't hold resources forever
        return;
      }
      
      var targetRect = { tx: dropoff.tx, ty: dropoff.ty, w: dropoff.w, h: dropoff.h };
      moveUnitToTile(scene, unit, 0, 0, ox, oy, targetRect, function(success) {
        if (success) {
          depositPayload(scene, unit);
          playHarvestEffect(scene, dropoff.sprite.x, dropoff.sprite.y, 'spark');
          floatText(scene, 'Deposited!', unit.x, unit.y - 40, '#00FF00');

          // Walk back to resource
          if (res && res.currentYield > 0 && res.sprite && res.sprite.active) {
            var rRect = { tx: res.tileX, ty: res.tileY, w: 4, h: 4 };
            moveUnitToTile(scene, unit, 0, 0, ox, oy, rRect, function(reached) {
              if (reached) {
                startAutomatedHarvest(scene, unit, res, ox, oy);
              }
            });
          }
        } else {
          // Failsafe: Path is blocked!
          floatText(scene, 'Blocked!', unit.x, unit.y - 40, '#FF4444');
          unit.stop(); // Drop payload animation
          blacklist.push(dropoff); // Add trapped building to blacklist
          
          // Re-route dynamically to the next nearest building
          scene.time.delayedCall(1000, function() {
              returnDropoff(scene, unit, res, ox, oy, blacklist);
          });
        }
      });
    }

    function removeBuilding(scene, bData) {
      if (!bData) return;
      var cx = bData.sprite.x;
      var cy = bData.sprite.y;

      // Clear occupied & barrier cells
      for(var r=0; r<bData.h; r++){
        for(var c=0; c<bData.w; c++){
          delete scene._occupied[(bData.tx+c)+','+(bData.ty+r)];
          delete scene._barriers[(bData.tx+c)+','+(bData.ty+r)];
        }
      }

      // Refund 1 wood
      taskProgress['wood'] = (taskProgress['wood'] || 0) + 1;
      
      // Reduce task progress
      taskProgress[bData.type] = Math.max(0, (taskProgress[bData.type] || 0) - 1);

      // Remove from localStorage
      var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
      savedBuildings = savedBuildings.filter(function(b) {
        return !(b.type === bData.type && b.tx === bData.tx && b.ty === bData.ty);
      });
      localStorage.setItem('rajadhaniya_buildings', JSON.stringify(savedBuildings));

      // Remove from scene array
      scene._buildings = scene._buildings.filter(function(b) {
        return b !== bData;
      });

      // Visuals
      bData.sprite.destroy();
      playHarvestEffect(scene, cx, cy, 'leaf');
      
      var rmStr = bData.type === 'fence'
        ? (window.gameLanguage === 'si' ? '-1 වැටක්' : '-1 Fence')
        : (window.gameLanguage === 'si' ? '✓ ඉවත් කෙරුණා' : '✓ Removed');
      floatText(scene, rmStr, cx, cy - 50, '#FF6B6B');

      refreshHud(scene);
    }

    /* ──────────────────────────────────────────────
       DRAG-AND-DROP BUILDING REPOSITION SYSTEM
       ────────────────────────────────────────────── */
    function enterEditMode(scene, buildingData, ox, oy) {
      if (isMoving) return;
      editMode = buildingData;
      editOrigTx = buildingData.tx;
      editOrigTy = buildingData.ty;

      var config = BUILDINGS_CONFIG[buildingData.type];
      if (!config) return;

      // Lift the sprite visually
      scene.tweens.add({ targets: buildingData.sprite, scaleY: 0.14, y: buildingData.sprite.y - 10, duration: 200, ease: 'Back.Out' });

      // Create ghost outline
      editGhost = scene.add.image(buildingData.sprite.x, buildingData.sprite.y, config.texture)
        .setOrigin(0.5, 0.8).setDepth(9999).setScale(0.12).setAlpha(0.6).setTint(0x00FF00);
      editGhost._validPlacement = true;
      editGhost._tw = config.w;
      editGhost._th = config.h;

      // Show instruction
      floatText(scene, window.gameLanguage === 'si' ? '📍 ස්ථානය ගෙනයන්න' : '📍 Drag to reposition', buildingData.sprite.x, buildingData.sprite.y - 60, '#FFD700');
    }

    function updateEditGhost(scene, tx, ty, ox, oy) {
      if (!editGhost) return;
      var config = BUILDINGS_CONFIG[editMode.type];
      var pos = tileToWorld(tx, ty, ox, oy);
      editGhost.setPosition(pos.x, pos.y);
      editGhost._curTx = tx;
      editGhost._curTy = ty;

      // Check validity (not occupied by others, within grid)
      var valid = true;
      for (var r = 0; r < config.h && valid; r++) {
        for (var c = 0; c < config.w && valid; c++) {
          var key = (tx + c) + ',' + (ty + r);
          if (tx + c < 0 || tx + c >= GRID || ty + r < 0 || ty + r >= GRID) { valid = false; break; }
          // occupied by another building (not ourselves)
          if (scene._occupied[key]) {
            var isSelf = (tx + c >= editOrigTx && tx + c < editOrigTx + config.w &&
                          ty + r >= editOrigTy && ty + r < editOrigTy + config.h);
            if (!isSelf) { valid = false; break; }
          }
        }
      }
      editGhost._validPlacement = valid;
      editGhost.setTint(valid ? 0x00FF00 : 0xFF0000);
    }

    function confirmReposition(scene, newTx, newTy, ox, oy) {
      if (!editMode) return;
      var config = BUILDINGS_CONFIG[editMode.type];

      // Free old cells
      for (var r = 0; r < editMode.h; r++) {
        for (var c = 0; c < editMode.w; c++) {
          delete scene._occupied[(editOrigTx + c) + ',' + (editOrigTy + r)];
          delete scene._barriers[(editOrigTx + c) + ',' + (editOrigTy + r)];
        }
      }

      // Claim new cells
      for (var r = 0; r < config.h; r++) {
        for (var c = 0; c < config.w; c++) {
          scene._occupied[(newTx + c) + ',' + (newTy + r)] = true;
          if (editMode.type === 'fence') {
            scene._barriers[(newTx + c) + ',' + (newTy + r)] = true;
          }
        }
      }

      // Move sprite — restore level-appropriate scale, don't hard-reset to 0.12
      var newPos = tileToWorld(newTx, newTy, ox, oy);
      editMode.sprite.setPosition(newPos.x, newPos.y);
      var lvScales = [0.12, 0.16, 0.20, 0.25, 0.30];
      var repositionScale = lvScales[Math.min((editMode.level || 1) - 1, lvScales.length - 1)];
      editMode.sprite.setScale(repositionScale);
      editMode.tx = newTx;
      editMode.ty = newTy;

      // Update localStorage
      var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
      savedBuildings = savedBuildings.map(function(b) {
        if (b.type === editMode.type && b.tx === editOrigTx && b.ty === editOrigTy) {
          return { type: b.type, tx: newTx, ty: newTy };
        }
        return b;
      });
      localStorage.setItem('rajadhaniya_buildings', JSON.stringify(savedBuildings));

      floatText(scene, window.gameLanguage === 'si' ? '✔ ගෙනා ගිය!' : '✔ Moved!', newPos.x, newPos.y - 60, '#4CAF50');

      if (editGhost) { editGhost.destroy(); editGhost = null; }
      editMode = null;
      refreshHud(scene); // Triggers Flutter→Firestore sync
    }

    function cancelReposition(scene) {
      if (!editMode) return;
      // Restore level-appropriate scale on cancel — don't hard-reset to 0.12
      var lvScales = [0.12, 0.16, 0.20, 0.25, 0.30];
      var cancelScale = lvScales[Math.min((editMode.level || 1) - 1, lvScales.length - 1)];
      editMode.sprite.setScale(cancelScale);
      var origPos = tileToWorld(editOrigTx, editOrigTy, scene._ox, scene._oy);
      editMode.sprite.setPosition(origPos.x, origPos.y);
      if (editGhost) { editGhost.destroy(); editGhost = null; }
      editMode = null;
      floatText(scene, window.gameLanguage === 'si' ? '✗ අවලංගුයි' : '✗ Cancelled', origPos.x, origPos.y - 50, '#FF6B6B');
    }

    function clearBorderTree(scene, res, cost) {
      if (localPlayerData.gold < cost) {
        var msg = window.gameLanguage === 'si' ? 'රත්‍රන් මදි!' : 'Not enough Gold!';
        floatText(scene, msg, res.sprite.x, res.sprite.y - 50, '#FF0000');
        return;
      }
      localPlayerData.gold -= cost;

      var cx = res.sprite.x;
      var cy = res.sprite.y;

      // Free up the 4x4 grid space
      for(var rr=0; rr<4; rr++){
        for(var cc=0; cc<4; cc++){
          delete scene._occupied[(res.tileX+cc) + ',' + (res.tileY+rr)];
        }
      }

      // Remove the sprite and play effect
      res.sprite.destroy();
      playHarvestEffect(scene, cx, cy, 'spark');

      var floatMsg = window.gameLanguage === 'si' ? 'භූමිය පුළුල් විය!' : 'Territory Expanded!';
      floatText(scene, floatMsg, cx, cy - 50, '#4CAF50');

      // Clear Fog around this newly opened area
      // We pass 0 as origin offset because revealFogAround uses the global ox/oy from buildGame scope. 
      // Actually, wait. revealFogAround takes ox, oy. Let's just use the current offset. 
      // If we don't have ox, we can calculate it or just pass 0,0 if it's not strictly needed for the fog keys (fog sprites are keyed by c+','+r).
      // Let's call the global or pass it? It's better to just delete the fog sprites directly here:
      for(var dr=-8; dr<=8; dr++) {
        for(var dc=-8; dc<=8; dc++) {
          var tx = res.tileX + dc;
          var ty = res.tileY + dr;
          var fogTx = tx - (tx % 4);
          var fogTy = ty - (ty % 4);
          var fg = fogSprites[fogTx + ',' + fogTy];
          if (fg) {
            scene.tweens.add({ targets: fg, alpha: 0, duration: 800, onComplete: function() { fg.destroy(); } });
            delete fogSprites[fogTx + ',' + fogTy];
            revealedTiles[fogTx + ',' + fogTy] = true;
          }
        }
      }

      // Save to localStorage so it stays cleared on reboot
      var clearedBorders = JSON.parse(localStorage.getItem('rajadhaniya_cleared_borders') || '[]');
      clearedBorders.push({ tx: res.tileX, ty: res.tileY });
      localStorage.setItem('rajadhaniya_cleared_borders', JSON.stringify(clearedBorders));

      refreshHud(scene);
    }

    function startHarvest(scene, res, taskKey) {
      if (res.isHarvesting) return; // already harvesting this resource

      res.isHarvesting = true;
      var duration = 10000;

      /* --- background bar track --- */
      var bgBar = scene.add.graphics().setDepth(res.sprite.depth + 0.5);
      bgBar.fillStyle(0x000000, 0.7);
      bgBar.fillRoundedRect(res.sprite.x - 22, res.sprite.y - 42, 44, 8, 4);

      /* --- foreground fill bar --- */
      var fgBar = scene.add.graphics().setDepth(res.sprite.depth + 0.6);

      /* --- countdown label (e.g. "10s") --- */
      var timerLabel = scene.add.text(res.sprite.x, res.sprite.y - 56, '10s', {
        fontFamily: 'GameFont',
        fontSize: '11px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(res.sprite.depth + 0.7);

      res.timerLabel = timerLabel;

      var timerEvent = scene.time.addEvent({
        delay: duration,
        callback: function() {
          if (bgBar && bgBar.active) bgBar.destroy();
          if (fgBar && fgBar.active) fgBar.destroy();
          if (timerLabel && timerLabel.active) timerLabel.destroy();
          // Remove the per-resource update listener
          scene.events.off('update', res._updateListener);
          res._updateListener = null;
          finishHarvest(scene, res, taskKey);
        }
      });

      res.harvestTimer = timerEvent;
      res.bgBar = bgBar;
      res.fgBar = fgBar;

      // Each resource gets its OWN named listener so they never affect each other
      res._updateListener = function() {
        if (!res.isHarvesting || !fgBar.active) return;
        var p = timerEvent.getProgress();

        /* update fill bar */
        fgBar.clear();
        var barColor = p < 0.5 ? 0x4CAF50 : p < 0.8 ? 0xFFC107 : 0xFF5722;
        fgBar.fillStyle(barColor, 1);
        var w = Math.max(8, 44 * p);
        fgBar.fillRoundedRect(res.sprite.x - 22, res.sprite.y - 42, w, 8, 4);

        /* update countdown label */
        if (timerLabel && timerLabel.active) {
          var secsLeft = Math.ceil((1 - p) * (duration / 1000));
          timerLabel.setText(secsLeft + 's');
          timerLabel.setX(res.sprite.x);
          timerLabel.setY(res.sprite.y - 50);
          timerLabel.setStyle({ color: p < 0.5 ? '#AAFFAA' : p < 0.8 ? '#FFD700' : '#FF6B6B' });
        }
      };
      scene.events.on('update', res._updateListener);
    }

    function boostHarvest(scene, res, taskKey) {
      if (localPlayerData.gold < 50) {
        var errGold = window.gameLanguage === 'si' ? '\u274C රත්‍රන් මදි' : '\u274C Not enough Gold';
        floatText(scene, errGold, res.sprite.x, res.sprite.y - 30, '#FF6B6B');
        return;
      }
      localPlayerData.gold -= 50;
      refreshHud(scene);

      if (res.harvestTimer) res.harvestTimer.remove();
      if (res.bgBar) res.bgBar.destroy();
      if (res.fgBar) res.fgBar.destroy();
      if (res.timerLabel && res.timerLabel.active) res.timerLabel.destroy();
      if (res._updateListener) { scene.events.off('update', res._updateListener); res._updateListener = null; }

      var boostMsg = window.gameLanguage === 'si' ? '\u26A1 වේගවත් කළා!' : '\u26A1 Boosted!';
      floatText(scene, boostMsg, res.sprite.x, res.sprite.y - 50, '#FFD700');
      finishHarvest(scene, res, taskKey);
    }

    function finishHarvest(scene, res, taskKey) {
      res.isHarvesting = false;
      var cfg = TASKS_CONFIG[taskKey];
      
      taskProgress[taskKey] = (taskProgress[taskKey] || 0) + 1;
      var current = taskProgress[taskKey];

      // ══════════════════════════════════════════════════
      // OFFICIAL RESOURCE ECONOMY MATRIX
      // ══════════════════════════════════════════════════
      // 🪵 Tree    → +Gold (5) AND +Wood (via taskProgress) — dual drop
      // 🐄 Deer    → +Milk (livestock interaction, no gold)
      // 💎 Gem     → +Gold (30)
      // 🏞️ Lake    → +Gold (15) AND +Food (1)
      // ══════════════════════════════════════════════════
      var goldReward = 0;
      var woodReward = 0;
      var gemReward  = 0;
      var milkReward = 0;
      var foodReward = 0;
      var hydrateReward = 0;

      if (res.type === 'gem_rock') { goldReward = 10; gemReward = 3; }  // dual drop: Gold + Gems
      if (res.type === 'tree')     { goldReward = 5;  woodReward = 3; }  // dual drop: Gold + Wood
      if (res.type === 'deer')     { milkReward = 5;  hydrateReward = 8; }  // Milk + slight hydration boost
      if (res.type === 'lake')     { goldReward = 15; foodReward = 1; hydrateReward = 20; } // authoritative water source

      if (goldReward > 0) {
        localPlayerData.gold += goldReward;
        var goldMsg = window.gameLanguage === 'si' ? '🪙 +' + goldReward + ' රත්‍රන්' : '🪙 +' + goldReward + ' Gold';
        floatText(scene, goldMsg, res.sprite.x + 20, res.sprite.y - 50, '#FFD700');
      }
      if (gemReward > 0) {
        taskProgress['gem'] = (taskProgress['gem'] || 0) + gemReward;
        floatText(scene, '💎 +' + gemReward + ' Gems', res.sprite.x - 20, res.sprite.y - 70, '#A78BFA');
      }
      if (woodReward > 0) {
        taskProgress['wood'] = (taskProgress['wood'] || 0) + woodReward;
        floatText(scene, '🪵 +' + woodReward + ' Wood', res.sprite.x - 20, res.sprite.y - 70, '#8B5A2B');
      }
      if (milkReward > 0) {
        localPlayerData.inventory = localPlayerData.inventory || {};
        localPlayerData.inventory.milk = (localPlayerData.inventory.milk || 0) + milkReward;
        floatText(scene, '🥛 +' + milkReward + ' Milk', res.sprite.x, res.sprite.y - 50, '#FFFDE7');
      }
      if (foodReward > 0) {
        localPlayerData.inventory = localPlayerData.inventory || {};
        localPlayerData.inventory.food = (localPlayerData.inventory.food || 0) + foodReward;
      }
      if (hydrateReward > 0) {
        localPlayerData.needs.thirst = Math.min(100, (localPlayerData.needs.thirst || 0) + hydrateReward);
        var hydrateMsg = res.type === 'lake'
          ? '💧 +' + hydrateReward + ' Hydration'
          : '💧 +' + hydrateReward + ' Hydration (Milk)';
        floatText(scene, hydrateMsg, res.sprite.x, res.sprite.y - 90, '#64B5F6');
      }

      var idx = resourceSprites.indexOf(res);
      if (idx !== -1) resourceSprites.splice(idx, 1);
      scene._occupied[res.tileX + ',' + res.tileY] = false;
      if (res.shadow) res.shadow.destroy();

      scene.tweens.add({
        targets: res.sprite,
        alpha: 0, y: res.sprite.y - 20,
        duration: 300,
        onComplete: function () { res.sprite.destroy(); },
      });

      var msgName = window.gameLanguage === 'si' ? cfg.sinLabel : cfg.label;
      var msg = cfg.icon + ' +1 ' + msgName + ' (' + current + '/' + cfg.req + ')';
      floatText(scene, msg, res.sprite.x, res.sprite.y - 30, '#D4AF37');

      var pTex = (res.type === 'tree') ? 'leaf' : 'spark';
      playHarvestEffect(scene, res.sprite.x, res.sprite.y, pTex);

      refreshHud(scene);
    }

    function playHarvestEffect(scene, x, y, texture) {
      var emitter = scene.add.particles(x, y - 20, texture, {
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        gravityY: 150,
        lifespan: 1500,
        quantity: 15,
        emitting: false
      });
      emitter.setDepth(2000);
      emitter.explode();
      scene.time.delayedCall(1500, function() { emitter.destroy(); });
    }

    function floatText(scene, msg, wx, wy, color) {
      var t = scene.add.text(wx, wy, msg, {
        fontFamily: 'GameFont', fontSize: '13px', color: color || '#ffffff',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(150);

      scene.tweens.add({
        targets: t,
        y: wy - 50,
        alpha: 0,
        duration: 1200,
        ease: 'Power2',
        onComplete: function () { t.destroy(); },
      });
    }

    function checkEraCompletion(scene) {
      var allDone = true;
      for (var k in TASKS_CONFIG) {
        if ((taskProgress[k] || 0) < TASKS_CONFIG[k].req) { allDone = false; break; }
      }

      if (allDone) {
        if (!localStorage.getItem(ERA_UNLOCK_KEY)) {
          localStorage.setItem(ERA_UNLOCK_KEY, 'true');
          window.__forceSync = true;
          window.notifyFlutter({
            type: 'show_era_completion'
          });
        }
      }
    }

    /* ──────────────────────────────────────────────
       HUD REFRESH (Bridge to Flutter)
       ────────────────────────────────────────────── */
    function refreshHud(scene) {
      var cowFarmCount = scene._buildings ? scene._buildings.filter(function(b) { return b.type === 'cow_farm' && b.is_completed; }).length : 0;
      var farmCount = scene._buildings ? scene._buildings.filter(function(b) { return b.type === 'farm' && b.is_completed; }).length : 0;
      var lumberCampCount = scene._buildings ? scene._buildings.filter(function(b) { return b.type === 'lumber_camp' && b.is_completed; }).length : 0;
      
      var safeBuildings = scene._buildings ? scene._buildings.map(function(b) {
         return {
            tx: b.tx, ty: b.ty, w: b.w, h: b.h, type: b.type,
            is_completed: b.is_completed,
            completion_timestamp: b.completion_timestamp,
            level: b.level || 1
         };
      }) : [];

      // Forward resource updates to Flutter with lightweight payload
      window.notifyFlutter({
        type: 'hud_update',
        tasks: taskProgress,
        taskConfig: TASKS_CONFIG,
        gold: localPlayerData.gold,
        wood: taskProgress['wood'] || 0,       // explicit top-level for Flutter resource bar
        gem: taskProgress['gem'] || 0,         // explicit top-level for Flutter resource bar
        meat: localPlayerData.inventory.meat || 0,
        milk: localPlayerData.inventory.milk || 0,
        needs: localPlayerData.needs,
        health: localPlayerData.health,
        meatRate: farmCount * 1200,
        milkRate: cowFarmCount * 3600,
        woodRate: lumberCampCount * 2400,
        buildings: safeBuildings,
        forceSync: window.__forceSync
      });
      window.__forceSync = false;
      checkEraCompletion(scene);
    }

    function transitionToNextEra(scene) {
      if (!window.__gameMaster || !window.__gameMaster.eras) return;
      var eras = window.__gameMaster.eras;
      var currentIndex = eras.findIndex(function(e) { return e.id === localPlayerData.eraId; });
      if (currentIndex === -1 || currentIndex >= eras.length - 1) return; // Max era

      var nextEra = eras[currentIndex + 1];
      
      // Visual celebration
      playHarvestEffect(scene, playerSprite.x, playerSprite.y, 'spark');
      floatText(scene, window.gameLanguage === 'si' ? nextEra.name + ' යුගයට පිවිසේ!' : 'Entering ' + nextEra.englishName + '!', playerSprite.x, playerSprite.y - 100, '#FFD700');

      // Update state
      localPlayerData.eraId = nextEra.id;
      localPlayerData.eraName = nextEra.name;
      
      // Reset Tasks
      taskProgress = {};
      window.isEraUpgradeReady = false;
      
      // Save state
      localStorage.setItem('rajadhaniya_player_data', JSON.stringify(localPlayerData));
      localStorage.setItem('rajadhaniya_task_progress', JSON.stringify(taskProgress));
      
      // Notify flutter to show overlay, Flutter will call force_reboot after animation
      window.notifyFlutter({
        type: 'era_upgraded',
        newEraId: nextEra.id,
        newEraName: nextEra.name
      });
    }
  }

  console.log('[Bridge] ' + GAME_ASSET_VERSION + ' loaded');
})();
