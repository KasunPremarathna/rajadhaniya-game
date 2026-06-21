(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════
     STEP 1 – Asset Version Control & Configuration
     ════════════════════════════════════════════════════════ */
  var GAME_ASSET_VERSION = 'v1.3.37';
  var STORAGE_KEY = 'rajadhaniya_asset_version';
  var ERA_UNLOCK_KEY = 'era_anuradhapura_unlocked';
  var MAX_W = 960;
  var MAX_H = 540;
  var TILE_W = 16;
  var TILE_H = 8;
  var GRID = 400;

  var TASKS_CONFIG = {
    hunting:     { req: 3, icon: '🏹', label: 'Hunting',      sinLabel: 'වන සතුන් දඩයම', resType: 'deer' },
    wood:        { req: 10, icon: '🪵', label: 'Wood Scraping', sinLabel: 'දැව එකතු කිරීම', resType: 'tree' },
    gem:         { req: 5,  icon: '💎', label: 'Gem Mining',    sinLabel: 'මැණික්/ගල් කැණීම', resType: 'gem_rock' },
    house:       { req: 1, icon: '🏠', label: 'Build House',       sinLabel: 'නිවසක් හදන්න' },
    workers_hut: { req: 1, icon: '🛖', label: 'Workers Hut',       sinLabel: 'කම්කරු නිවස' },
    temple:      { req: 1, icon: '🏛️', label: 'Build Temple',      sinLabel: 'පන්සලක් හදන්න' },
    boat_house:  { req: 1, icon: '🛶', label: 'Boat House',        sinLabel: 'බෝට්ටු නිවස' },
    lake:        { req: 1, icon: '💧', label: 'Dig Lake',          sinLabel: 'වැවක් හදන්න' },
    fish:        { req: 5, icon: '🐟', label: 'Harvest Fish',      sinLabel: 'මාළු අල්ලන්න' },
    fence:       { req: 5, icon: '🚧', label: 'Build Fence',       sinLabel: 'වැටක් ගහන්න' }
  };

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
      console.log('[Bridge] Restored player data from cloud save:', cloudData);
    } catch (e) {
      console.error('[Bridge] Failed to restore cloud data:', e);
    }
  };
  window.__gameActive = false;

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
    if (stored === GAME_ASSET_VERSION) {
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
    console.log('[Cache] force update');
    localStorage.removeItem(STORAGE_KEY);
    bootPhaserGame(true);
    /* Notify Flutter the game is starting after forced update */
    window.notifyFlutter({ type: 'game_started' });
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

  function getPath(scene, x0, y0, x1, y1, rangeObj) {
    var targetRect = (typeof rangeObj === 'object' && rangeObj !== null) ? rangeObj : null;
    var range = targetRect ? 0 : (rangeObj || 0);

    var openSet = [{ x: x0, y: y0, g: 0, f: 0, parent: null }];
    var closedSet = {};
    var maxSteps = 5000;
    
    function makeKey(x, y) { return x + ',' + y; }

    function heuristic(x, y) {
      if (targetRect) {
        var dx = Math.max(targetRect.tx - x, 0, x - (targetRect.tx + targetRect.w - 1));
        var dy = Math.max(targetRect.ty - y, 0, y - (targetRect.ty + targetRect.h - 1));
        return dx + dy;
      }
      return Math.abs(x - x1) + Math.abs(y - y1);
    }
    
    while(openSet.length > 0 && maxSteps-- > 0) {
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
        return path;
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
    return [];
  }

  function distToTile(tx, ty, targetRes) {
    var dx = tx - targetRes.tileX;
    var dy = ty - targetRes.tileY;
    return Math.sqrt(dx * dx + dy * dy);
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
            fontFamily: '"Noto Sans","Iskoola Pota",sans-serif',
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
          var gw = 64;
          var gh = 32;
          var g = s.add.graphics();
          g.fillStyle(baseColorHex, 1);
          g.beginPath(); g.moveTo(gw / 2, 0); g.lineTo(gw, gh / 2);
          g.lineTo(gw / 2, gh); g.lineTo(0, gh / 2); g.closePath();
          g.fillPath(); 
          g.lineStyle(1, isDarker ? 0x33691e : 0x558b2f, 0.3); g.strokePath();

          // Scatter random lines to simulate dense natural grass
          for (var i = 0; i < 45; i++) {
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
        var eraFolder = 'assets/game/images/sprites/' + eraId + '/';
        var commonFolder = 'assets/game/images/sprites/';

        s.load.audio('loading_music', 'assets/game/audio/loading_music.mp3' + v);
        
        // Common assets (trees, resources, etc.)
        s.load.image('tree', commonFolder + 'tree.png' + v);
        s.load.spritesheet('deer', commonFolder + 'cow.png' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.image('gem_rock', commonFolder + 'gem_rock.png' + v);

        // Era-specific character sprite sheets
        s.load.spritesheet('player', eraFolder + 'walkingemptyhand.png' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.spritesheet('player_axe', eraFolder + 'taskwithaex.png' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.spritesheet('player_pickaxe', eraFolder + 'taskhandonrock.png' + v, { frameWidth: 256, frameHeight: 256 });

        // Era-specific buildings
        s.load.image('house', eraFolder + 'house.png' + v);
        s.load.image('farm', eraFolder + 'farm.png' + v);
        s.load.image('mine', eraFolder + 'mine.png' + v);
        s.load.image('workers_hut', eraFolder + 'workers_hut.png' + v);
        s.load.image('temple', eraFolder + 'temple.png' + v);
        s.load.image('lake', eraFolder + 'lake.png' + v);
        s.load.image('boat_house', eraFolder + 'boat_house.png' + v);
        
        /* fence: procedural texture */
        var fcg = s.add.graphics();
        fcg.lineStyle(2, 0x5D4037, 1);
        fcg.beginPath(); fcg.moveTo(6, 26); fcg.lineTo(26, 6); fcg.moveTo(6, 6); fcg.lineTo(26, 26); fcg.strokePath(); // cross
        fcg.fillStyle(0x4E342E, 1); fcg.fillRect(14, 4, 4, 26); // center post
        fcg.generateTexture('fence', 32, 32); fcg.destroy();
        
        /* enemy_base: red-roofed enemy hut cluster */
        var eg = s.add.graphics();
        eg.fillStyle(0x8B4513, 1); eg.fillRect(10, 35, 44, 22); // base
        eg.fillStyle(0xCC2222, 1); eg.beginPath(); eg.moveTo(32, 8); eg.lineTo(54, 35); eg.lineTo(10, 35); eg.closePath(); eg.fillPath(); // red roof
        eg.fillStyle(0x4a1a00, 1); eg.fillRect(24, 40, 16, 17); // door
        eg.fillStyle(0x8B4513, 1); eg.fillRect(40, 30, 22, 16); // side hut
        eg.fillStyle(0xCC2222, 1); eg.beginPath(); eg.moveTo(51, 18); eg.lineTo(62, 30); eg.lineTo(40, 30); eg.closePath(); eg.fillPath(); // side roof
        eg.generateTexture('enemy_base', 64, 60); eg.destroy();
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
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
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

      var grace = 10000, elapsed = 0, isFading = false;
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

      /* load persistent buildings */
      var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
      savedBuildings.forEach(function(b) {
        var config = BUILDINGS_CONFIG[b.type];
        if (!config) return;
        var pos = tileToWorld(b.tx, b.ty, ox, oy);
        var shad = scene.add.image(pos.x, pos.y, 'shadow').setAlpha(0.3).setDepth(b.tx + b.ty + 0.1);
        var bSprite = scene.add.image(pos.x, pos.y, config.texture).setOrigin(0.5, 0.8).setDepth(b.tx + b.ty + 2).setScale(0.12);
        for(var row=0; row<config.h; row++){
          for(var col=0; col<config.w; col++){
          scene._occupied[(b.tx+col)+','+(b.ty+row)] = true;
            if (b.type === 'fence') {
              scene._barriers[(b.tx+col)+','+(b.ty+row)] = true;
            }
          }
        }
        scene._buildings.push({sprite: bSprite, tx: b.tx, ty: b.ty, w: config.w, h: config.h, type: b.type});
        
        // Spawn farmer for existing cow_farm or lumber_camp
        if (b.type === 'cow_farm' || b.type === 'lumber_camp') {
          var n = scene.add.sprite(pos.x, pos.y + 10, 'player').setOrigin(0.5, 0.8).setDepth(b.tx + b.ty + 2).setScale(0.25);
          n._tileX = b.tx; n._tileY = b.ty;
          n._needs = { hunger: 50 + Math.random()*50, thirst: 50 + Math.random()*50, hygiene: 100, toilet: 100 };
          npcSprites.push(n);
          scheduleNPCMove(scene, n, ox, oy);
        }
      });

      /* place grass tiles using decoupled logical grid */
      for (var r = 0; r < GRID; r+=4) {
        for (var c = 0; c < GRID; c+=4) {
          var isoObj = cartToIso(c + 1.5, r + 1.5);
          var tex = ((c/4) + (r/4)) % 2 === 0 ? 'grass_tile' : 'grass_tile_2';
          scene.add.image(isoObj.x + ox + TILE_W / 2, isoObj.y + oy + TILE_H / 2, tex).setDepth(0);
        }
      }

      /* spawn player at center */
      var ci = cartToIso((GRID - 1) / 2, (GRID - 1) / 2);
      var spX = ci.x + ox + TILE_W / 2;
      var spY = ci.y + oy + TILE_H / 2;
      var pTile = worldToTile(spX, spY, ox, oy);
      scene._playerShadow = scene.add.image(spX, spY, 'shadow').setAlpha(0.3).setDepth(pTile.tx + pTile.ty + 0.1);
      playerSprite = scene.add.sprite(spX, spY, 'player').setDepth(pTile.tx + pTile.ty + 1).setOrigin(0.5, 0.8).setScale(0.25);
      
      scene.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
      scene.cameras.main.setZoom(1.2);
      scene.cameras.main.setBackgroundColor('#689f38');
      
      var cx = ox;
      var cy = oy + (GRID * TILE_H) / 2;
      var safeW = 2000;
      var safeH = 1000;
      scene.cameras.main.setBounds(cx - safeW/2, cy - safeH/2, safeW, safeH);

      /* setup multi-touch and zoom */
      scene.input.addPointer(1);
      scene.input.on('wheel', function(pointer, gameObjects, deltaX, deltaY, deltaZ) {
        var newZoom = scene.cameras.main.zoom - deltaY * 0.001;
        scene.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, 0.6, 2.0));
      });

      var pinchState = { pinching: false, startDist: 0, startZoom: 1 };

      /* place resource sprites */
      placeResources(scene, ox, oy);

      /* CoC: border forest */
      placeBorderForest(scene, ox, oy);

      /* CoC: enemy kingdoms */
      placeEnemyKingdoms(scene, ox, oy);

      /* CoC: fog of war */
      initFog(scene, ox, oy);
      var spawnTile = worldToTile(spX, spY, ox, oy);
      revealFogAround(scene, spawnTile.tx, spawnTile.ty, FOG_RADIUS, ox, oy);

      /* update fog as player moves */
      scene.events.on('update', function() {
        if (!playerSprite) return;
        var pt = worldToTile(playerSprite.x, playerSprite.y, ox, oy);
        revealFogAround(scene, pt.tx, pt.ty, FOG_RADIUS, ox, oy);
      });

      /* HUD */
      hudText = scene.add.text(10, 10, '', {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.65)', padding: { x: 10, y: 8 }, lineSpacing: 2,
      }).setScrollFactor(0).setDepth(100);

      /* ESC to return */
      /* spawn NPCs */
      // spawn workers
      for(var i=0; i<5; i++) {
        var tx = Phaser.Math.Between(0, GRID - 1);
        var ty = Phaser.Math.Between(0, GRID - 1);
        if(!scene._occupied[tx+','+ty]) {
          var pos = tileToWorld(tx, ty, ox, oy);
          var s = scene.add.sprite(pos.x, pos.y, 'player').setOrigin(0.5, 0.8).setDepth(tx + ty + 1).setScale(0.25);
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

      /* ══════════════════════════════════════════════
         STEP 2 + 3 – Tap Gestures (Single & Double)
         ══════════════════════════════════════════════ */
      var tapState = { lastTime: 0, lastX: 0, lastY: 0, count: 0, pending: false };

      scene.input.on('pointermove', function(ptr) {
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
        } else {
          pinchState.pinching = false;
        }

        if (currentBuildMode && ghostBuilding && !ghostBuilding._isPlaced) {
          var wp = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
          var tile = worldToTile(wp.x, wp.y, ox, oy);
          updateGhostBuildingPos(scene, tile.tx, tile.ty, ox, oy);
        }
        if (editMode && editGhost) {
          var wp2 = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
          var tile2 = worldToTile(wp2.x, wp2.y, ox, oy);
          updateEditGhost(scene, tile2.tx, tile2.ty, ox, oy);
        }
      });
      scene.input.on('pointerdown', function (ptr) {
        if (scene.input.pointer1.isDown && scene.input.pointer2.isDown) return;

        // If in edit/drag mode, confirm placement on tap
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

        if (currentBuildMode && ghostBuilding) {
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

        var wp = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
        var tile = worldToTile(wp.x, wp.y, ox, oy);
        
        var clickedRes = null;
        for (var i = 0; i < resourceSprites.length; i++) {
          var res = resourceSprites[i];
          var rx = (res.sprite && res.sprite._tileX !== undefined) ? res.sprite._tileX : res.tileX;
          var ry = (res.sprite && res.sprite._tileY !== undefined) ? res.sprite._tileY : res.tileY;
          if (tile.tx >= rx && tile.tx < rx + 4 && tile.ty >= ry && tile.ty < ry + 4) {
            clickedRes = res;
            break;
          }
        }
        
        if (!clickedRes) {
          for (var i = 0; i < scene._buildings.length; i++) {
            var b = scene._buildings[i];
            if (tile.tx >= b.tx && tile.tx < b.tx + b.w && tile.ty >= b.ty && tile.ty < b.ty + b.h) {
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

        // Check for enemy kingdom tap
        for (var ei = 0; ei < enemyKingdoms.length; ei++) {
          var ek = enemyKingdoms[ei];
          var dist = Math.abs(tile.tx - ek.tx) + Math.abs(tile.ty - ek.ty);
          if (dist <= 2) {
            tryAttackKingdom(scene, ek);
            return;
          }
        }

        if (clickedRes) {
          if (isMoving) return;
          var pTile = worldToTile(playerSprite.x, playerSprite.y, ox, oy);
          
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
          
          if (dx + dy <= 2) { // 2 allows reaching it diagonally or slightly adjacent
            createContextualMenu(scene, clickedRes);
          } else {
            movePlayerToTile(scene, 0, 0, ox, oy, tRect, function(success) {
              if (success) {
                createContextualMenu(scene, clickedRes);
              }
            });
          }
          return;
        }

        handleSingleTap(scene, ptr, ox, oy);
      });

      // Cancel long-press if finger lifts quickly (it was a tap, not a hold)
      scene.input.on('pointerup', function(ptr) {
        if (longPressTimer) { longPressTimer.remove(false); longPressTimer = null; }
        longPressPtr = null;
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
        var cx = scene.cameras.main.scrollX + scene.cameras.main.width / 2;
        var cy = scene.cameras.main.scrollY + scene.cameras.main.height / 2;
        
        var bg = scene.add.graphics().setDepth(5000);
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(scene.cameras.main.scrollX, scene.cameras.main.scrollY, scene.cameras.main.width, scene.cameras.main.height);

        var txt = scene.add.text(cx, cy - 50, 'You have perished from exhaustion.', { fontFamily: 'monospace', fontSize: '24px', color: '#ff4444' }).setOrigin(0.5).setDepth(5001);
        
        var btn = scene.add.text(cx, cy + 30, '[ RESPAWN ]', { fontFamily: 'monospace', fontSize: '28px', color: '#44ff44', backgroundColor: '#222', padding: { x: 10, y: 5 } }).setOrigin(0.5).setDepth(5001).setInteractive();
        btn.on('pointerdown', function() {
          window.__isDead = false;
          localPlayerData.health = 100;
          localPlayerData.needs.hunger = 100;
          localPlayerData.needs.thirst = 100;
          bg.destroy(); txt.destroy(); btn.destroy();
          refreshHud(scene);
        });
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

      scene.time.addEvent({
        delay: 3000,
        callback: function() {
          if (window.__isDead) return;
          localPlayerData.needs.hunger = Math.max(0, localPlayerData.needs.hunger - 1);
          localPlayerData.needs.thirst = Math.max(0, localPlayerData.needs.thirst - 1);
          localPlayerData.needs.hygiene = Math.max(0, localPlayerData.needs.hygiene - 1);
          localPlayerData.needs.toilet = Math.max(0, localPlayerData.needs.toilet - 1);
          
          if (localPlayerData.needs.hunger === 0 || localPlayerData.needs.thirst === 0) {
             localPlayerData.health = Math.max(0, localPlayerData.health - 5);
             if (localPlayerData.health === 0) {
                showDeathOverlay();
             }
          }

          updateNeedsBubble(scene, playerSprite, localPlayerData.needs);

          npcSprites.forEach(function(npc) {
            if (npc._needs) {
              npc._needs.hunger = Math.max(0, npc._needs.hunger - 1);
              npc._needs.thirst = Math.max(0, npc._needs.thirst - 1);
              updateNeedsBubble(scene, npc, npc._needs);
            }
          });

          // Cow Farm Production Calculation
          var cowFarmCount = scene._buildings.filter(function(b) { return b.type === 'cow_farm'; }).length;
          if (cowFarmCount > 0) {
            localPlayerData.inventory.meat = (localPlayerData.inventory.meat || 0) + (1 * cowFarmCount);
            localPlayerData.inventory.milk = (localPlayerData.inventory.milk || 0) + (3 * cowFarmCount);
          }
          
          var lumberCampCount = scene._buildings.filter(function(b) { return b.type === 'lumber_camp'; }).length;
          if (lumberCampCount > 0) {
            taskProgress['wood'] = (taskProgress['wood'] || 0) + (2 * lumberCampCount);
          }

          refreshHud(scene);
        },
        loop: true
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

      if (buildConfirmElements) {
         showBuildConfirmUI(scene); // Redraws at new position
      }
    }

    function showBuildConfirmUI(scene) {
      closeBuildConfirmUI();
      if (!ghostBuilding) return;

      var cx = ghostBuilding.x;
      var cy = ghostBuilding.y - 60; // floating above building
      var elems = [];

      // ✅ Confirm Button
      var btnOk = scene.add.graphics().setDepth(2000);
      btnOk.fillStyle(0x4CAF50, 1);
      btnOk.fillRoundedRect(cx - 50, cy - 20, 40, 40, 20);
      elems.push(btnOk);

      var txtOk = scene.add.text(cx - 30, cy, '\u2714', { fontSize: '20px', color: '#FFF' }).setOrigin(0.5).setDepth(2001);
      elems.push(txtOk);

      var zoneOk = scene.add.zone(cx - 30, cy, 40, 40).setDepth(2002).setInteractive({ useHandCursor: true });
      zoneOk.on('pointerdown', function(ptr, localX, localY, ev) {
        ev.stopPropagation(); // Block from hitting grid
        confirmBuild(scene);
      });
      elems.push(zoneOk);

      // ❌ Cancel Button
      var btnNo = scene.add.graphics().setDepth(2000);
      btnNo.fillStyle(0xFF6B6B, 1);
      btnNo.fillRoundedRect(cx + 10, cy - 20, 40, 40, 20);
      elems.push(btnNo);

      var txtNo = scene.add.text(cx + 30, cy, '\u2715', { fontSize: '20px', color: '#FFF' }).setOrigin(0.5).setDepth(2001);
      elems.push(txtNo);

      var zoneNo = scene.add.zone(cx + 30, cy, 40, 40).setDepth(2002).setInteractive({ useHandCursor: true });
      zoneNo.on('pointerdown', function(ptr, localX, localY, ev) {
        ev.stopPropagation(); // Block from hitting grid
        cancelBuild(scene);
      });
      elems.push(zoneNo);

      buildConfirmElements = elems;
    }

    function closeBuildConfirmUI() {
      if (buildConfirmElements) {
        buildConfirmElements.forEach(function (el) { if (el && el.destroy) el.destroy(); });
        buildConfirmElements = null;
      }
    }

    function confirmBuild(scene) {
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
      refreshHud(scene);

      startConstruction(scene, tile, config, type);
    }

    function startConstruction(scene, tile, config, type) {
      var pos = tileToWorld(tile.tx, tile.ty, scene._ox, scene._oy);
      
      for(var r=0; r<config.h; r++){
        for(var c=0; c<config.w; c++){
          scene._occupied[(tile.tx+c)+','+(tile.ty+r)] = true;
        }
      }

      var shad = scene.add.image(pos.x, pos.y, 'shadow').setAlpha(0.3).setDepth(tile.tx + tile.ty + 0.1);
      var bSprite = scene.add.image(pos.x, pos.y, config.texture).setOrigin(0.5, 0.8).setDepth(tile.tx + tile.ty + 2);
      bSprite.setScale(0.12); // Scale AI assets
      bSprite.setTint(0x777777); // Grey out during construction

      var duration = 5000; // 5 seconds build time

      var bgBar = scene.add.graphics().setDepth(tile.tx + tile.ty + 2.5);
      bgBar.fillStyle(0x000000, 0.7);
      bgBar.fillRoundedRect(pos.x - 22, pos.y - 42, 44, 8, 4);

      var fgBar = scene.add.graphics().setDepth(tile.tx + tile.ty + 2.6);

      var timerLabel = scene.add.text(pos.x, pos.y - 56, '5s', {
        fontFamily: 'monospace', fontSize: '11px', color: '#FFFFFF', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(tile.tx + tile.ty + 2.7);

      var timerEvent = scene.time.addEvent({
        delay: duration,
        callback: function() {
          if (bgBar) bgBar.destroy();
          if (fgBar) fgBar.destroy();
          if (timerLabel) timerLabel.destroy();
          
          finishConstruction(scene, tile, config, type, bSprite);
        }
      });

      var updateFn = function() {
        if (!fgBar.active) {
          scene.events.off('update', updateFn);
          return;
        }
        var p = timerEvent.getProgress();
        fgBar.clear();
        fgBar.fillStyle(0xFFC107, 1);
        fgBar.fillRoundedRect(pos.x - 22, pos.y - 42, 44 * p, 8, 4);
        
        var secsLeft = Math.ceil((1 - p) * (duration / 1000));
        timerLabel.setText(secsLeft + 's');
      };
      scene.events.on('update', updateFn);
    }

    function finishConstruction(scene, tile, config, type, bSprite) {
      bSprite.clearTint();
      var pos = { x: bSprite.x, y: bSprite.y };

      scene._buildings.push({sprite: bSprite, tx: tile.tx, ty: tile.ty, w: config.w, h: config.h, type: type});
      
      taskProgress[type] = (taskProgress[type] || 0) + 1;
      
      // Mark fence tiles as hard barriers
      if (type === 'fence') {
        for (var fr = 0; fr < config.h; fr++) {
          for (var fc = 0; fc < config.w; fc++) {
            scene._barriers[(tile.tx + fc) + ',' + (tile.ty + fr)] = true;
          }
        }
      }
      
      var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
      savedBuildings.push({ type: type, tx: tile.tx, ty: tile.ty });
      localStorage.setItem('rajadhaniya_buildings', JSON.stringify(savedBuildings));

      playHarvestEffect(scene, pos.x, pos.y, 'spark');

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
        var n = scene.add.sprite(bSprite.x, bSprite.y + 10, 'player').setOrigin(0.5, 0.8).setDepth(tile.tx + tile.ty + 2).setScale(0.25);
        n._tileX = tile.tx; n._tileY = tile.ty;
        n._needs = { hunger: 50 + Math.random()*50, thirst: 50 + Math.random()*50, hygiene: 100, toilet: 100 };
        npcSprites.push(n);
        scheduleNPCMove(scene, n, ox, oy);
      }

      var buildStr = window.gameLanguage === 'si' ? '\u2714 ගොඩනැගුවා!' : '\u2714 Built!';
      floatText(scene, buildStr, pos.x, pos.y - 50, '#4CAF50');
      
      refreshHud(scene);
      checkEraCompletion(scene);
    }

    function cancelBuild(scene) {
      if (ghostBuilding) {
        ghostBuilding.destroy();
        ghostBuilding = null;
      }
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
            spr = scene.add.sprite(pos.x, pos.y, cfg.type).setOrigin(0.5, 0.8).setDepth(tx + ty + 1);
            if (scene.anims && scene.anims.exists('cow-walk')) spr.play('cow-walk', true);
            spr.setScale(0.25);
            spr._tileX = tx; spr._tileY = ty;
            spr._needs = { hunger: 50 + Math.random()*50, thirst: 50 + Math.random()*50, hygiene: 100, toilet: 100 };
            npcSprites.push(spr);
            scheduleNPCMove(scene, spr, ox, oy);
          } else {
            spr = scene.add.image(pos.x, pos.y, cfg.type).setOrigin(0.5, 0.8).setDepth(tx + ty + 1);
            spr.setScale(cfg.type === 'tree' ? 0.25 : 0.06);
            resourceSprites.push({ type: cfg.type, sprite: spr, shadow: shad, tileX: tx, tileY: ty });

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
            
            // clear a slightly larger fog area so it perfectly matches the expanded feel
            for(var dr=-8; dr<=8; dr++) {
              for(var dc=-8; dc<=8; dc++) {
                var tx = c + dc;
                var ty = r + dr;
                var fogTx = tx - (tx % 4);
                var fogTy = ty - (ty % 4);
                var fg = fogSprites[fogTx + ',' + fogTy];
                if (fg) {
                  fg.destroy();
                  delete fogSprites[fogTx + ',' + fogTy];
                  revealedTiles[fogTx + ',' + fogTy] = true;
                }
              }
            }
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

    /* ─── Fog of War ─── */
    function initFog(scene, ox, oy) {
      fogSprites = {};
      revealedTiles = {};
      for (var r = 0; r < GRID; r+=4) {
        for (var c = 0; c < GRID; c+=4) {
          var isBorder = (r < BORDER || r >= GRID - BORDER || c < BORDER || c >= GRID - BORDER);
          if (!isBorder) {
            revealedTiles[c + ',' + r] = true;
            continue; // The entire safe zone is revealed by default
          }

          var posObj = cartToIso(c + 1.5, r + 1.5);
          var pos = { x: posObj.x + ox + TILE_W/2, y: posObj.y + oy + TILE_H/2 };
          var fg = scene.add.graphics().setDepth(500);
          fg.fillStyle(0x061006, 0.90);
          
          var gw = 64; var gh = 32;
          fg.fillPoints([
            { x: pos.x,        y: pos.y - gh / 2 },
            { x: pos.x + gw/2, y: pos.y },
            { x: pos.x,        y: pos.y + gh / 2 },
            { x: pos.x - gw/2, y: pos.y },
          ], true);
          fogSprites[c + ',' + r] = fg;
        }
      }
    }

    function revealFogAround(scene, cx, cy, radius, ox, oy) {
      for (var dr = -radius; dr <= radius; dr++) {
        for (var dc = -radius; dc <= radius; dc++) {
          var tx = Math.round(cx + dc);
          var ty = Math.round(cy + dr);
          if (tx < 0 || ty < 0 || tx >= GRID || ty >= GRID) continue;
          if (Math.sqrt(dc*dc + dr*dr) > radius) continue;
          
          var fogTx = tx - (tx % 4);
          var fogTy = ty - (ty % 4);
          var key = fogTx + ',' + fogTy;
          
          if (revealedTiles[key]) continue;
          revealedTiles[key] = true;
          var fg = fogSprites[key];
          if (fg) {
            (function(f) {
              scene.tweens.add({ targets: f, alpha: 0, duration: 350,
                onComplete: function() { if (f && f.active) f.destroy(); }
              });
            })(fg);
            delete fogSprites[key];
          }
        }
      }
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
          fontFamily: 'monospace', fontSize: '9px', color: '#FFD700',
          backgroundColor: 'rgba(0,0,0,0.75)', padding: { x: 4, y: 2 },
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5, 1).setDepth(d.tx + d.ty + 4);

        var kingdom = { name: d.name, tx: d.tx, ty: d.ty, sprite: base, label: lbl, flag: flagG, gold: d.gold, level: d.level, defeated: false };
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
      var W = scene.cameras.main.width;
      var H = scene.cameras.main.height;
      var cx = W / 2; var cy = H / 2;
      var elems = [];

      var bg = scene.add.graphics().setScrollFactor(0).setDepth(500);
      bg.fillStyle(0x1a0505, 0.93);
      bg.fillRoundedRect(cx - 135, cy - 85, 270, 170, 14);
      bg.lineStyle(2, 0xCC2222, 1);
      bg.strokeRoundedRect(cx - 135, cy - 85, 270, 170, 14);
      elems.push(bg);

      elems.push(scene.add.text(cx, cy - 68, '\u2694\ufe0f  RAID  \u2014  ' + kingdom.name, {
        fontFamily: 'monospace', fontSize: '11px', color: '#FF6B6B', fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(501));

      elems.push(scene.add.text(cx, cy - 44,
        '\ud83c\udfc6 Level ' + kingdom.level + '   |   \ud83e\ude99 ~' + Math.floor(kingdom.gold * 0.4) + ' Gold loot', {
        fontFamily: 'monospace', fontSize: '10px', color: '#FFFFFF'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(501));

      var atkBg = scene.add.graphics().setScrollFactor(0).setDepth(501);
      atkBg.fillStyle(0xCC0000, 1); atkBg.fillRoundedRect(cx - 85, cy - 18, 170, 36, 8);
      elems.push(atkBg);
      elems.push(scene.add.text(cx, cy + 0, '\u2694\ufe0f  ATTACK NOW', {
        fontFamily: 'monospace', fontSize: '12px', color: '#FFF', fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(502));

      var atkZ = scene.add.zone(cx, cy, 170, 36).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true });
      atkZ.on('pointerdown', function() {
        elems.forEach(function(e) { if (e && e.destroy) e.destroy(); });
        executeAttack(scene, kingdom);
      });
      elems.push(atkZ);

      var cancelT = scene.add.text(cx, cy + 50, '\u2715 Cancel', {
        fontFamily: 'monospace', fontSize: '10px', color: '#AAAAAA'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true });
      cancelT.on('pointerdown', function() { elems.forEach(function(e) { if (e && e.destroy) e.destroy(); }); });
      elems.push(cancelT);
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


    /* ──────────────────────────────────────────────
       STEP 2 – Single Tap: move player to tile
       ────────────────────────────────────────────── */
    function handleSingleTap(scene, pointer, ox, oy) {
      if (isMoving) return;

      var wp = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      var tile = worldToTile(wp.x, wp.y, ox, oy);
      tile.tx = Math.max(0, Math.min(GRID - 1, tile.tx));
      tile.ty = Math.max(0, Math.min(GRID - 1, tile.ty));

      var cur = worldToTile(playerSprite.x, playerSprite.y, ox, oy);
      if (tile.tx === cur.tx && tile.ty === cur.ty) return;

      movePlayerToTile(scene, tile.tx, tile.ty, ox, oy);
    }

    function movePlayerToTile(scene, tx, ty, ox, oy, range, onComplete) {
      if (typeof range === 'function') {
        onComplete = range;
        range = 0;
      }
      var cur = worldToTile(playerSprite.x, playerSprite.y, ox, oy);
      var path = getPath(scene, cur.tx, cur.ty, tx, ty, range);
      if (path.length <= 1) {
        isMoving = false; // ensure guard is clear
        if (onComplete) onComplete(path.length === 1); // success=true if already there
        return;
      }

      isMoving = true;
      var idx = 1; /* skip start */

      function nextStep() {
        if (idx >= path.length) {
          isMoving = false;
          if (playerSprite.anims && playerSprite.anims.isPlaying) {
            playerSprite.stop();
          }
          refreshHud(scene);
          if (onComplete) onComplete(true);
          return;
        }
        var t = path[idx];
        var pos = tileToWorld(t.x, t.y, ox, oy);

        /* face direction and play animation */
        var prev = path[idx - 1];
        if (scene.anims && scene.anims.exists('walk-down')) {
          playerSprite.play('walk-down', true);
        }
        if (t.x > prev.x) playerSprite.setFlipX(false);
        else if (t.x < prev.x) playerSprite.setFlipX(true);

        playerSprite.setDepth(t.x + t.y + 1);
        playerSprite._tileX = t.x; // update per-step for accurate proximity
        playerSprite._tileY = t.y;
        if (scene._playerShadow) {
          scene._playerShadow.setPosition(pos.x, pos.y);
          scene._playerShadow.setDepth(t.x + t.y + 0.1);
        }

        scene.tweens.add({
          targets: playerSprite,
          x: pos.x, y: pos.y,
          duration: 30,
          ease: 'Linear',
          onComplete: function () { idx++; nextStep(); },
        });
      }
      nextStep();
    }

    function scheduleNPCMove(scene, npc, ox, oy) {
      var wait = Phaser.Math.Between(2000, 6000);
      scene.time.delayedCall(wait, function() {
        if (!npc.active) return;
        var tx = Phaser.Math.Between(0, Math.min(GRID - 1, npc._tileX + 15));
        var ty = Phaser.Math.Between(0, Math.min(GRID - 1, npc._tileY + 15));
        if (scene._occupied[tx+','+ty]) { scheduleNPCMove(scene, npc, ox, oy); return; }

        var path = getPath(scene, npc._tileX, npc._tileY, tx, ty);
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
    }

    /* ──────────────────────────────────────────────
       STEP 3 – Contextual Menu & Harvesting
       ────────────────────────────────────────────── */
    function createContextualMenu(scene, res) {
      closeContextualMenu(scene);
      
      var cx = res.sprite.x;
      var cy = res.sprite.y - 140;
      var elems = [];
      
      function addNeedsButton(s, px, py, elArr, label, callback, width) {
        var w = width || 160;
        var btn = s.add.graphics().setDepth(201);
        btn.fillStyle(0x005A9C, 1);
        btn.fillRoundedRect(px - w/2, py - 20, w, 40, 8);
        btn.lineStyle(2, 0x3399FF, 1);
        btn.strokeRoundedRect(px - w/2, py - 20, w, 40, 8);
        elArr.push(btn);
        var txt = s.add.text(px, py, label, { fontFamily: 'monospace', fontSize: '13px', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5).setDepth(202);
        elArr.push(txt);
        var z = s.add.zone(px, py, w, 40).setDepth(203).setInteractive({ useHandCursor: true });
        z.on('pointerdown', function(ptr, localX, localY, ev) {
          if (ev) ev.stopPropagation(); if (ptr.event) ptr.event.stopPropagation();
          closeContextualMenu(s); callback();
        });
        elArr.push(z);
      }

      // 1. Draw a shadow for depth
      var shadow = scene.add.graphics().setDepth(199);
      shadow.fillStyle(0x000000, 0.5);
      shadow.fillRoundedRect(cx - 105, cy - 95, 220, 230, 12);
      elems.push(shadow);

      // 2. Main Background Box
      var bg = scene.add.graphics().setDepth(200);
      bg.fillStyle(0x1F1A17, 0.98); // Dark rich brown background
      bg.fillRoundedRect(cx - 110, cy - 100, 220, 230, 12);
      bg.lineStyle(2, 0xD4AF37, 1); // Gold border
      bg.strokeRoundedRect(cx - 110, cy - 100, 220, 230, 12);
      elems.push(bg);

      // 3. Title Banner Background
      var banner = scene.add.graphics().setDepth(200);
      banner.fillStyle(0x2D241C, 1);
      banner.fillRoundedRect(cx - 108, cy - 98, 216, 40, { tl: 10, tr: 10, bl: 0, br: 0 });
      // Separator line
      banner.lineStyle(1, 0xD4AF37, 0.5);
      banner.beginPath();
      banner.moveTo(cx - 110, cy - 58);
      banner.lineTo(cx + 110, cy - 58);
      banner.strokePath();
      elems.push(banner);

      var labelMap = { tree: 'Tree', deer: 'Deer', gem_rock: 'Gem Rock', lake: 'Lake', fence: 'Fence', border_tree: 'Dense Forest', house: 'House', farm: 'Farm', workers_hut: 'Workers Hut', temple: 'Temple', boat_house: 'Boat House', cow_farm: 'Cow Farmer Hut', lumber_camp: 'Lumber Camp', mine: 'Mine' };
      var labelMapSi = { tree: 'ගස', deer: 'මුවා', gem_rock: 'මැණික් ගල', lake: 'වැව', fence: 'වැට', border_tree: 'ඝන කැලෑව', house: 'නිවස', farm: 'ගොවිපල', workers_hut: 'කම්කරු නිවස', temple: 'පන්සල', boat_house: 'බෝට්ටු නිවස', cow_farm: 'එළදෙනුන් ගොවිපල', lumber_camp: 'දැව කඳවුර', mine: 'පතල' };
      var taskMap = { tree: 'wood', deer: 'hunting', gem_rock: 'gem', lake: 'fish', fence: 'fence' };
      var taskKey = taskMap[res.type];
      var cfg = TASKS_CONFIG[taskKey];

      // 4. Title Text (Centered in Banner)
      var displayLabel = window.gameLanguage === 'si' ? labelMapSi[res.type] : labelMap[res.type];
      var title = scene.add.text(cx, cy - 78, displayLabel, {
        fontFamily: 'monospace', fontSize: '18px', color: '#FFD700', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(201);
      elems.push(title);

      // 5. Close (X) Button
      var closeBtn = scene.add.text(cx + 90, cy - 88, '✖', {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#AAAAAA'
      }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true });
      closeBtn.on('pointerover', function() { closeBtn.setColor('#FFFFFF'); });
      closeBtn.on('pointerout', function() { closeBtn.setColor('#AAAAAA'); });
      closeBtn.on('pointerdown', function(ptr, localX, localY, ev) {
        if (ev) ev.stopPropagation();
        if (ptr.event) ptr.event.stopPropagation();
        closeContextualMenu(scene);
      });
      elems.push(closeBtn);

      // 6. Production Details (Grid Layout)
      var isSi = (window.gameLanguage === 'si');
      
      if (res.type === 'border_tree') {
        var cost = GLOBAL_CONFIG.treeClearCost || 100;
        var qText = isSi ? 'භූමිය පුළුල් කරන්නද?' : 'Expand Territory?';
        var costText = isSi ? `මිල: ${cost} 🪙` : `Cost: ${cost} 🪙`;

        var qLabel = scene.add.text(cx, cy - 35, qText, {
          fontFamily: 'monospace', fontSize: '15px', color: '#CCCCCC', align: 'center'
        }).setOrigin(0.5).setDepth(201);
        elems.push(qLabel);

        var cLabel = scene.add.text(cx, cy - 10, costText, {
          fontFamily: 'monospace', fontSize: '16px', color: '#FFD700', fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5).setDepth(201);
        elems.push(cLabel);

      } else if (res.type === 'fence') {
        var yieldLabel = scene.add.text(cx, cy - 20, isSi ? 'අස්වැන්න: +1 🪵' : 'Yield: +1 🪵', {
          fontFamily: 'monospace', fontSize: '15px', color: '#4CAF50', align: 'center'
        }).setOrigin(0.5).setDepth(201);
        elems.push(yieldLabel);
      } else {
        // Time Row
        var timeLabel = scene.add.text(cx - 90, cy - 40, isSi ? '⏱️ කාලය:' : '⏱️ Time:', {
          fontFamily: 'monospace', fontSize: '14px', color: '#CCCCCC'
        }).setOrigin(0, 0.5).setDepth(201);
        elems.push(timeLabel);

        var timeVal = scene.add.text(cx + 90, cy - 40, '10s', {
          fontFamily: 'monospace', fontSize: '14px', color: '#FFF'
        }).setOrigin(1, 0.5).setDepth(201);
        elems.push(timeVal);

        // Yield Row
        var yieldText = scene.add.text(cx - 90, cy - 10, isSi ? '🎁 අස්වැන්න:' : '🎁 Yield:', {
          fontFamily: 'monospace', fontSize: '14px', color: '#CCCCCC'
        }).setOrigin(0, 0.5).setDepth(201);
        elems.push(yieldText);

        var yields = [];
        if (cfg && cfg.icon) yields.push('1 ' + cfg.icon);
        if (res.type === 'gem_rock') yields.push('30 🪙');
        if (res.type === 'deer') { yields.push('10 🪙'); yields.push('2 🥩'); }
        if (res.type === 'tree') yields.push('5 🪙');
        if (res.type === 'lake') { yields.push('15 🪙'); yields.push('1 🥩'); }
        
        var yieldVal = scene.add.text(cx + 90, cy - 10, yields.join('  '), {
          fontFamily: 'monospace', fontSize: '14px', color: '#4CAF50', fontStyle: 'bold'
        }).setOrigin(1, 0.5).setDepth(201);
        elems.push(yieldVal);
      }

      // 7. Action Button
      var btnY = cy + 45;
      if (res.type === 'fence') {
        var btn = scene.add.graphics().setDepth(201);
        btn.fillStyle(0xCC0000, 1);
        btn.fillRoundedRect(cx - 80, btnY - 20, 160, 40, 8);
        btn.lineStyle(2, 0xFF6B6B, 1);
        btn.strokeRoundedRect(cx - 80, btnY - 20, 160, 40, 8);
        elems.push(btn);

        var rmTxt = isSi ? '\u2715 ඉවත් කරන්න' : '\u2715 Remove';
        var txt = scene.add.text(cx, btnY, rmTxt, {
          fontFamily: 'monospace', fontSize: '16px', color: '#FFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(202);
        elems.push(txt);

        var zone = scene.add.zone(cx, btnY, 160, 40).setDepth(203).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', function(ptr, localX, localY, ev) {
          if (ev) ev.stopPropagation();
          if (ptr.event) ptr.event.stopPropagation();
          closeContextualMenu(scene);
          removeBuilding(scene, res.buildingData);
        });
        elems.push(zone);

      } else if (res.type === 'border_tree') {
        var cost = GLOBAL_CONFIG.treeClearCost || 100;
        var btn = scene.add.graphics().setDepth(201);
        btn.fillStyle(0x8B4513, 1);
        btn.fillRoundedRect(cx - 80, btnY - 20, 160, 40, 8);
        btn.lineStyle(2, 0xD4AF37, 1);
        btn.strokeRoundedRect(cx - 80, btnY - 20, 160, 40, 8);
        elems.push(btn);

        var clrTxt = isSi ? '\u2694\uFE0F කැලෑව කපන්න' : '\u2694\uFE0F Clear Forest';
        var txt = scene.add.text(cx, btnY, clrTxt, {
          fontFamily: 'monospace', fontSize: '15px', color: '#FFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(202);
        elems.push(txt);

        var zone = scene.add.zone(cx, btnY, 160, 40).setDepth(203).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', function(ptr, localX, localY, ev) {
          if (ev) ev.stopPropagation();
          if (ptr.event) ptr.event.stopPropagation();
          closeContextualMenu(scene);
          clearBorderTree(scene, res, cost);
        });
        elems.push(zone);

      } else if (!res.isHarvesting) {
        var canHarvest = (res.type === 'lake' || !res.isBuilding);
        var currentBtnY = btnY;
        
        if (canHarvest) {
          var btn = scene.add.graphics().setDepth(201);
          btn.fillStyle(0x2E7D32, 1); // Dark green base
          btn.fillRoundedRect(cx - 80, currentBtnY - 20, 160, 40, 8);
          btn.lineStyle(2, 0x4CAF50, 1); // Bright green border
          btn.strokeRoundedRect(cx - 80, currentBtnY - 20, 160, 40, 8);
          elems.push(btn);

          var harvestTxt = isSi ? 'අස්වනු නෙලන්න' : 'Start Harvest';
          var iconStr = (cfg && cfg.icon ? cfg.icon : '⚒️') + ' ' + harvestTxt;
          var txt = scene.add.text(cx, currentBtnY, iconStr, {
            fontFamily: 'monospace', fontSize: '15px', color: '#FFF', fontStyle: 'bold'
          }).setOrigin(0.5).setDepth(202);
          elems.push(txt);

          var zone = scene.add.zone(cx, currentBtnY, 160, 40).setDepth(203).setInteractive({ useHandCursor: true });
          zone.on('pointerdown', function(ptr, localX, localY, ev) {
            if (ev) ev.stopPropagation();
            if (ptr.event) ptr.event.stopPropagation();
            closeContextualMenu(scene);
            if (res.isBuilding) {
              res.isHarvesting = true;
              playHarvestEffect(scene, cx, cy + 40, 'spark');
              setTimeout(function() { 
                res.isHarvesting = false;
                taskProgress[taskKey] = (taskProgress[taskKey] || 0) + 1;
                refreshHud(scene);
              }, 1000);
            } else {
              startHarvest(scene, res, taskKey);
            }
          });
          elems.push(zone);
        }

        var needsBtnY = canHarvest ? currentBtnY + 45 : currentBtnY;
        var rType = res.type;
        if (rType === 'farm' || rType === 'deer') {
          addNeedsButton(scene, cx, needsBtnY, elems, '🍔 ' + (isSi ? 'ආහාර ගන්න' : 'Eat Food'), function() {
            localPlayerData.needs.hunger = Math.min(100, localPlayerData.needs.hunger + 40);
            floatText(scene, '🍔 +40', cx, needsBtnY, '#4CAF50');
            refreshHud(scene);
          });
        }
        else if (rType === 'lake') {
          addNeedsButton(scene, cx - 45, needsBtnY, elems, '💧 ' + (isSi ? 'බොන්න' : 'Drink'), function() {
            localPlayerData.needs.thirst = Math.min(100, localPlayerData.needs.thirst + 30);
            floatText(scene, '💧 +30', cx - 45, needsBtnY, '#4CAF50');
            refreshHud(scene);
          }, 80);
          addNeedsButton(scene, cx + 45, needsBtnY, elems, '🧼 ' + (isSi ? 'නාන්න' : 'Bathe'), function() {
            localPlayerData.needs.hygiene = Math.min(100, localPlayerData.needs.hygiene + 50);
            floatText(scene, '🧼 +50', cx + 45, needsBtnY, '#4CAF50');
            refreshHud(scene);
          }, 80);
        }
        else if (rType === 'house' || rType === 'workers_hut' || rType === 'tree') {
          addNeedsButton(scene, cx, needsBtnY, elems, '🚽 ' + (isSi ? 'වැසිකිළිය' : 'Use Toilet'), function() {
            localPlayerData.needs.toilet = 100;
            floatText(scene, '🚽 +100', cx, needsBtnY, '#4CAF50');
            refreshHud(scene);
          });
        }

      } else {
        var btn = scene.add.graphics().setDepth(201);
        btn.fillStyle(0xFFB300, 1); // Dark gold base
        btn.fillRoundedRect(cx - 80, btnY - 20, 160, 40, 8);
        btn.lineStyle(2, 0xFFE082, 1); // Bright gold border
        btn.strokeRoundedRect(cx - 80, btnY - 20, 160, 40, 8);
        elems.push(btn);

        var boostTxt = isSi ? '\u26A1 50 රත්‍රන්' : '\u26A1 50 Gold';
        var txt = scene.add.text(cx, btnY, boostTxt, {
          fontFamily: 'monospace', fontSize: '16px', color: '#000', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(202);
        elems.push(txt);

        var zone = scene.add.zone(cx, btnY, 160, 40).setDepth(203).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', function(ptr, localX, localY, ev) {
          if (ev) ev.stopPropagation();
          if (ptr.event) ptr.event.stopPropagation();
          closeContextualMenu(scene);
          boostHarvest(scene, res, taskKey);
        });
        elems.push(zone);
      }

      radialMenuElements = elems;
      isMenuOpen = true;
    }

    function closeContextualMenu(scene) {
      if (radialMenuElements) {
        radialMenuElements.forEach(function (el) { if (el && el.destroy) el.destroy(); });
        radialMenuElements = null;
      }
      isMenuOpen = false;
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

      // Move sprite
      var newPos = tileToWorld(newTx, newTy, ox, oy);
      editMode.sprite.setPosition(newPos.x, newPos.y);
      editMode.sprite.setScale(0.12);
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
      // Reset sprite back to normal
      editMode.sprite.setScale(0.12);
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
        fontFamily: 'monospace',
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

      // === Gold & Resource rewards per resource type ===
      var goldReward = 0;
      var foodReward = 0;
      if (res.type === 'gem_rock') { goldReward = 30; }
      if (res.type === 'deer')     { goldReward = 10; foodReward = 2; }
      if (res.type === 'tree')     { goldReward = 5; }
      if (res.type === 'lake')     { goldReward = 15; foodReward = 1; }
      if (goldReward > 0) {
        localPlayerData.gold += goldReward;
        var goldMsg = window.gameLanguage === 'si' ? '🪙 +' + goldReward + ' රත්‍රන්' : '🪙 +' + goldReward + ' Gold';
        floatText(scene, goldMsg, res.sprite.x + 20, res.sprite.y - 50, '#FFD700');
      }
      if (foodReward > 0) {
        localPlayerData.inventory = localPlayerData.inventory || {};
        localPlayerData.inventory.food = (localPlayerData.inventory.food || 0) + foodReward;
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
        fontFamily: 'monospace', fontSize: '13px', color: color || '#ffffff',
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
        localStorage.setItem(ERA_UNLOCK_KEY, 'true');

        /* completion overlay */
        var W = scene.cameras.main.width;
        var H = scene.cameras.main.height;

        var veil = scene.add.graphics().setScrollFactor(0).setDepth(300);
        veil.fillStyle(0x000000, 0.75);
        veil.fillRect(0, 0, W, H);

        var panel = scene.add.graphics().setScrollFactor(0).setDepth(301);
        panel.fillStyle(0x1E2A38, 0.95);
        panel.fillRoundedRect(W / 2 - 200, H / 2 - 80, 400, 160, 20);
        panel.lineStyle(3, 0xD4AF37, 1);
        panel.strokeRoundedRect(W / 2 - 200, H / 2 - 80, 400, 160, 20);

        var titleText = window.gameLanguage === 'si' ? '\u0DBA\u0DD4\u0D9C\u0DBA \u0DA2\u0DBA\u0D9C\u0DCA\u200D\u0DBB\u0DC4\u0DAB\u0DBA \u0D9A\u0DBB\u0DB1 \u0DBD\u0DAF\u0DD3!' : 'Era Completed!';
        var subText = window.gameLanguage === 'si' ? 'යුගය සම්පූර්ණයි!' : 'Era Completed!';
        var btnString = window.gameLanguage === 'si' ? '📦 සිතියමට යන්න' : '📦 Return to Map';

        var title = scene.add.text(W / 2, H / 2 - 50, titleText, {
          fontFamily: '"Noto Sans","Iskoola Pota",sans-serif',
          fontSize: '16px', color: '#D4AF37', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302);

        var sub = scene.add.text(W / 2, H / 2 - 22, subText, {
          fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302);

        var btnBg = scene.add.graphics().setScrollFactor(0).setDepth(302);
        btnBg.fillStyle(0xD4AF37, 1);
        btnBg.fillRoundedRect(W / 2 - 80, H / 2 + 20, 160, 40, 10);

        var btnText = scene.add.text(W / 2, H / 2 + 40, btnString, {
          fontFamily: 'monospace', fontSize: '13px', color: '#000000', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(303).setInteractive({ useHandCursor: true });

        btnText.on('pointerdown', function () {
          veil.destroy(); panel.destroy(); title.destroy(); sub.destroy();
          btnBg.destroy(); btnText.destroy();
          window.showFlutterUi();
        });

        /* entrance animation */
        var overlayItems = [veil, panel, title, sub, btnBg, btnText];
        overlayItems.forEach(function (el) { el.setAlpha(0); });
        scene.tweens.add({
          targets: overlayItems, alpha: 1, duration: 500, ease: 'Power2',
        });
      }
    }

    /* ──────────────────────────────────────────────
       HUD REFRESH (Bridge to Flutter)
       ────────────────────────────────────────────── */
    function refreshHud(scene) {
      var cowFarmCount = scene._buildings ? scene._buildings.filter(function(b) { return b.type === 'cow_farm'; }).length : 0;
      
      var lumberCampCount = scene._buildings ? scene._buildings.filter(function(b) { return b.type === 'lumber_camp'; }).length : 0;
      
      // Forward resource updates to Flutter instead of drawing text
      window.notifyFlutter({
        type: 'hud_update',
        tasks: taskProgress,
        config: TASKS_CONFIG,
        gold: localPlayerData.gold,
        needs: localPlayerData.needs,
        health: localPlayerData.health,
        meat: localPlayerData.inventory.meat || 0,
        milk: localPlayerData.inventory.milk || 0,
        meatRate: cowFarmCount * 1200, // 1 per 3s = 1200/hr
        milkRate: cowFarmCount * 3600, // 3 per 3s = 3600/hr
        woodRate: lumberCampCount * 2400 // 2 per 3s = 2400/hr
      });
      checkEraCompletion(scene);
    }
  }

  console.log('[Bridge] ' + GAME_ASSET_VERSION + ' loaded');
})();
