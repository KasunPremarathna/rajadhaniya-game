(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════
     STEP 1 – Asset Version Control & Configuration
     ════════════════════════════════════════════════════════ */
  var GAME_ASSET_VERSION = 'v1.3.1';
  var STORAGE_KEY = 'rajadhaniya_asset_version';
  var ERA_UNLOCK_KEY = 'era_anuradhapura_unlocked';
  var MAX_W = 960;
  var MAX_H = 540;
  var TILE_W = 64;
  var TILE_H = 32;
  var GRID = 100;

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
  var taskProgress = { hunting: 10, wood: 15, gem: 5, house: 0, workers_hut: 0, temple: 0, boat_house: 0, lake: 0, fish: 0, fence: 0 };
  var radialMenuContainer = null;
  var radialMenuElements = null;
  var isMoving = false;
  var isMenuOpen = false;
  /* CoC Map Globals */
  var BORDER = 10;
  var FOG_RADIUS = 8;
  var fogSprites = {};
  var revealedTiles = {};
  var enemyKingdoms = [];
  var eraId = 'prehistoric';
  var eraName = '';
  var lat = 0;
  var lng = 0;
  var BUILDINGS_CONFIG = {
    house:       { w: 2, h: 2, texture: 'house',       costs: { gold: 50, wood: 5 }, name: 'House' },
    farm:        { w: 2, h: 2, texture: 'farm',        costs: { gold: 100, wood: 10 }, name: 'Farm' },
    mine:        { w: 2, h: 2, texture: 'mine',        costs: { gold: 150, wood: 5, gem: 5 }, name: 'Mine' },
    workers_hut: { w: 2, h: 2, texture: 'workers_hut', costs: { gold: 80, wood: 10 }, name: 'Workers Hut' },
    temple:      { w: 3, h: 3, texture: 'temple',      costs: { gold: 300, wood: 20, gem: 5 }, name: 'Temple' },
    lake:        { w: 4, h: 4, texture: 'lake',        costs: { gold: 50, wood: 5 }, name: 'Lake' },
    boat_house:  { w: 2, h: 2, texture: 'boat_house',  costs: { gold: 120, wood: 15 }, name: 'Boat House' },
    fence:       { w: 1, h: 1, texture: 'fence',       costs: { wood: 2 }, name: 'Fence' }
  };
  var currentBuildMode = null;
  var ghostBuilding = null;
  var buildConfirmElements = null;

  var localPlayerData = {
    eraId: '', eraName: '', eraBonus: '', lat: 0, lng: 0,
    role: 'Citizen', gold: 500,
    inventory: { wood: 10, stone: 5, food: 20 },
    character: { name: '', avatar: '' },
  };
  window.localPlayerData = localPlayerData;
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
  window.initGameGrid = function (eId, eName, eBonus, eLat, eLng, lang) {
    window.gameLanguage = lang || 'en';
    console.log('[Bridge] initGameGrid era=' + eId + ' lat=' + eLat + ' lng=' + eLng + ' lang=' + lang);
    pendingEraId = eId;
    pendingLat = eLat;
    pendingLng = eLng;

    var ci = eraCharacterMap[eId] || eraCharacterMap.prehistoric;
    Object.assign(localPlayerData, {
      eraId: eId, eraName: eName, eraBonus: eBonus, lat: eLat, lng: eLng,
      role: 'Citizen', gold: 500,
      inventory: { wood: 10, stone: 5, food: 20 },
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
    if (typeof window._flutterCallback === 'function') {
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
      ghostBuilding = scene.add.image(0, 0, config.texture).setAlpha(0.6).setDepth(1000).setOrigin(0.5, 0.8);
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

  function getPath(scene, x0, y0, x1, y1) {
    var openSet = [{ x: x0, y: y0, g: 0, f: 0, parent: null }];
    var closedSet = {};
    var maxSteps = 500;
    
    function heuristic(x, y) { return Math.abs(x - x1) + Math.abs(y - y1); }
    function makeKey(x, y) { return x + ',' + y; }
    
    while(openSet.length > 0 && maxSteps-- > 0) {
      openSet.sort(function(a, b) { return a.f - b.f; });
      var current = openSet.shift();
      var key = makeKey(current.x, current.y);
      
      if (current.x === x1 && current.y === y1) {
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
        if (scene._occupied[makeKey(n.x, n.y)] && (n.x !== x1 || n.y !== y1)) continue;
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

        /* Tile 1: Lighter Grass */
        var g = s.add.graphics();
        g.fillStyle(0x7cb342, 1);
        g.beginPath(); g.moveTo(TILE_W / 2, 0); g.lineTo(TILE_W, TILE_H / 2);
        g.lineTo(TILE_W / 2, TILE_H); g.lineTo(0, TILE_H / 2); g.closePath();
        g.fillPath(); g.lineStyle(1, 0x558b2f, 0.3); g.strokePath();
        /* Grass tufts */
        g.lineStyle(2, 0x689f38, 0.6);
        g.beginPath(); g.moveTo(20, 12); g.lineTo(18, 16); g.moveTo(20, 16); g.lineTo(22, 12); g.strokePath();
        g.beginPath(); g.moveTo(44, 20); g.lineTo(42, 24); g.moveTo(44, 24); g.lineTo(46, 20); g.strokePath();
        g.generateTexture('grass_tile', TILE_W, TILE_H); g.destroy();

        /* Tile 2: Darker Grass (Checkerboard) */
        var g2 = s.add.graphics();
        g2.fillStyle(0x689f38, 1);
        g2.beginPath(); g2.moveTo(TILE_W / 2, 0); g2.lineTo(TILE_W, TILE_H / 2);
        g2.lineTo(TILE_W / 2, TILE_H); g2.lineTo(0, TILE_H / 2); g2.closePath();
        g2.fillPath(); g2.lineStyle(1, 0x33691e, 0.3); g2.strokePath();
        /* Grass tufts */
        g2.lineStyle(2, 0x558b2f, 0.6);
        g2.beginPath(); g2.moveTo(24, 18); g.lineTo(22, 22); g.moveTo(24, 22); g.lineTo(26, 18); g2.strokePath();
        g2.generateTexture('grass_tile_2', TILE_W, TILE_H); g2.destroy();

        /* shadow */
        var sg = s.add.graphics();
        sg.fillStyle(0x000000, 1); sg.fillEllipse(16, 8, 32, 16);
        sg.generateTexture('shadow', 32, 16); sg.destroy();

        // Load the character sprite sheet
        s.load.spritesheet('player', 'assets/game/images/sprites/char_prehistoric.png', {
          frameWidth: 352,
          frameHeight: 256
        });

        /* Load Generated Assets */
        var v = '?v=' + GAME_ASSET_VERSION;
        s.load.image('tree', 'assets/game/images/sprites/tree.png' + v);
        s.load.spritesheet('deer', 'assets/game/images/sprites/cow.png' + v, { frameWidth: 256, frameHeight: 256 });
        s.load.image('gem_rock', 'assets/game/images/sprites/gem_rock.png' + v);
        s.load.image('house', 'assets/game/images/sprites/house.png' + v);
        s.load.image('farm', 'assets/game/images/sprites/farm.png' + v);
        s.load.image('mine', 'assets/game/images/sprites/mine.png' + v);
        s.load.image('workers_hut', 'assets/game/images/sprites/workers_hut.png' + v);
        s.load.image('temple', 'assets/game/images/sprites/temple.png' + v);
        s.load.image('lake', 'assets/game/images/sprites/lake.png' + v);
        s.load.image('boat_house', 'assets/game/images/sprites/boat_house.png' + v);
        
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
          s.anims.create({
            key: 'walk-down',
            frames: s.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
          });
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

      var grace = 100, elapsed = 0;
      scene.time.addEvent({
        delay: 50,
        repeat: 39,
        callback: function () {
          elapsed += 50;
          var nativeP = ui._progress || 0;
          var display = Math.max(nativeP, Math.min(1, elapsed / grace));

          ui.fl.clear();
          ui.fl.fillStyle(0xD4AF37, 1);
          ui.fl.fillRoundedRect(ui.bX, ui.bcY, ui.bW * display, ui.bH, 4);
          ui.pt.setText(
            '\u0DC3\u0DB8\u0DCA\u0DB4\u0DAD\u0DCA \u0DB6\u0DCF\u0D9C\u0DAD \u0DC0\u0DD9\u0DB8\u0DD2\u0DB1\u0DCA \u0DB4\u0DC0\u0DAD\u0DD2\u0DB1\u0DCA\u0DB1\u0DDA... ' +
            Math.round(display * 100) + '%'
          );

          if (elapsed >= grace && (ui.ready || elapsed >= 2000)) {
            ui.pt.setText('\u0DC3\u0DB8\u0DCD\u0DB4\u0DD6\u0DBB\u0DCA\u0DAB\u0DBA\u0DD2!');
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
      scene._buildings = [];

      /* load persistent buildings */
      var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
      savedBuildings.forEach(function(b) {
        var config = BUILDINGS_CONFIG[b.type];
        if (!config) return;
        var pos = tileToWorld(b.tx, b.ty, ox, oy);
        var shad = scene.add.image(pos.x, pos.y, 'shadow').setAlpha(0.3).setDepth(b.tx + b.ty + 0.1);
        var bSprite = scene.add.image(pos.x, pos.y, config.texture).setOrigin(0.5, 0.8).setDepth(b.tx + b.ty + 2);
        for(var row=0; row<config.h; row++){
          for(var col=0; col<config.w; col++){
            scene._occupied[(b.tx+col)+','+(b.ty+row)] = true;
          }
        }
        scene._buildings.push({sprite: bSprite, tx: b.tx, ty: b.ty, w: config.w, h: config.h});
      });

      /* place grass tiles */
      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var iso = cartToIso(c, r);
          var tex = (c + r) % 2 === 0 ? 'grass_tile' : 'grass_tile_2';
          scene.add.image(iso.x + ox + TILE_W / 2, iso.y + oy + TILE_H / 2, tex).setDepth(0);
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
      var npcSprites = [];
      for(var i=0; i<5; i++) {
        var tx = Phaser.Math.Between(0, GRID - 1);
        var ty = Phaser.Math.Between(0, GRID - 1);
        if(!scene._occupied[tx+','+ty]) {
          var pos = tileToWorld(tx, ty, ox, oy);
          var s = scene.add.sprite(pos.x, pos.y, 'player').setOrigin(0.5, 0.8).setDepth(tx + ty + 1).setScale(0.25);
          s.setTint(0xAAAAAA);
          s._tileX = tx; s._tileY = ty;
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
      });

      scene.input.on('pointerdown', function (ptr) {
        if (scene.input.pointer1.isDown && scene.input.pointer2.isDown) return;

        if (currentBuildMode && ghostBuilding) {
          // Tap sets the position and locks it, showing UI
          var wp = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
          var tile = worldToTile(wp.x, wp.y, ox, oy);
          updateGhostBuildingPos(scene, tile.tx, tile.ty, ox, oy);
          ghostBuilding._isPlaced = true;
          showBuildConfirmUI(scene);
          return;
        }

        if (isMenuOpen) { closeContextualMenu(scene); }

        var wp = scene.cameras.main.getWorldPoint(ptr.x, ptr.y);
        var tile = worldToTile(wp.x, wp.y, ox, oy);
        
        var clickedRes = null;
        for (var i = 0; i < resourceSprites.length; i++) {
          var res = resourceSprites[i];
          if (res.tileX === tile.tx && res.tileY === tile.ty) {
            clickedRes = res;
            break;
          }
        }
        
        if (!clickedRes) {
          for (var i = 0; i < scene._buildings.length; i++) {
            var b = scene._buildings[i];
            if (tile.tx >= b.tx && tile.tx < b.tx + b.w && tile.ty >= b.ty && tile.ty < b.ty + b.h) {
              if (b.type === 'lake') {
                clickedRes = { type: 'lake', sprite: b.sprite, isHarvesting: false, isBuilding: true };
                break;
              } else if (b.type === 'fence') {
                clickedRes = { type: 'fence', sprite: b.sprite, isBuilding: true, buildingData: b };
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
          createContextualMenu(scene, clickedRes);
          return;
        }

        handleSingleTap(scene, ptr, ox, oy);
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
      bSprite.setScale(0.18); // Scale AI assets
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
      
      var savedBuildings = JSON.parse(localStorage.getItem('rajadhaniya_buildings') || '[]');
      savedBuildings.push({ type: type, tx: tile.tx, ty: tile.ty });
      localStorage.setItem('rajadhaniya_buildings', JSON.stringify(savedBuildings));

      playHarvestEffect(scene, pos.x, pos.y, 'spark');

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
          var tx, ty, key;
          var attempts = 0;
          do {
            tx = Math.floor(innerStart + Math.random() * (innerEnd - innerStart));
            ty = Math.floor(innerStart + Math.random() * (innerEnd - innerStart));
            key = tx + ',' + ty;
            attempts++;
          } while (scene._occupied[key] && attempts < 50);
          if (attempts >= 50) continue;
          scene._occupied[key] = true;

          var pos = tileToWorld(tx, ty, ox, oy);
          var shad = scene.add.image(pos.x, pos.y, 'shadow').setAlpha(0.3).setDepth(tx + ty + 0.1);
          
          var spr;
          if (cfg.type === 'deer') {
            spr = scene.add.sprite(pos.x, pos.y, cfg.type).setOrigin(0.5, 0.8).setDepth(tx + ty + 1);
            if (scene.anims && scene.anims.exists('cow-walk')) spr.play('cow-walk', true);
            spr.setScale(0.12);
          } else {
            spr = scene.add.image(pos.x, pos.y, cfg.type).setOrigin(0.5, 0.8).setDepth(tx + ty + 1);
            spr.setScale(cfg.type === 'tree' ? 0.14 : 0.12);
          }
          resourceSprites.push({ type: cfg.type, sprite: spr, shadow: shad, tileX: tx, tileY: ty });

          scene.tweens.add({
            targets: spr, y: pos.y - 4,
            duration: 1200 + Math.random() * 800,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
        }
      });
    }

    /* ─── Border Forest (CoC style dense tree ring) ─── */
    function placeBorderForest(scene, ox, oy) {
      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var isBorder = (r < BORDER || r >= GRID - BORDER || c < BORDER || c >= GRID - BORDER);
          if (!isBorder) continue;
          var key = c + ',' + r;
          if (scene._occupied[key]) continue;

          var distFromEdge = Math.min(c, r, GRID - 1 - c, GRID - 1 - r);
          if (distFromEdge > 3 && Math.random() < 0.35) continue;

          scene._occupied[key] = true;
          var pos = tileToWorld(c, r, ox, oy);
          var spr = scene.add.image(pos.x, pos.y, 'tree')
            .setOrigin(0.5, 0.8).setDepth(c + r + 1)
            .setScale(0.12 + Math.random() * 0.05)
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
      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var pos = tileToWorld(c, r, ox, oy);
          var fg = scene.add.graphics().setDepth(500);
          fg.fillStyle(0x061006, 0.90);
          fg.fillPoints([
            { x: pos.x,            y: pos.y - TILE_H / 2 },
            { x: pos.x + TILE_W/2, y: pos.y },
            { x: pos.x,            y: pos.y + TILE_H / 2 },
            { x: pos.x - TILE_W/2, y: pos.y },
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
          var key = tx + ',' + ty;
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
        scene._occupied[d.tx + ',' + d.ty] = true;
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

    function movePlayerToTile(scene, tx, ty, ox, oy) {
      var cur = worldToTile(playerSprite.x, playerSprite.y, ox, oy);
      var path = getPath(scene, cur.tx, cur.ty, tx, ty);
      if (path.length <= 1) return;

      isMoving = true;
      var idx = 1; /* skip start */

      function nextStep() {
        if (idx >= path.length) {
          isMoving = false;
          if (playerSprite.anims && playerSprite.anims.isPlaying) {
            playerSprite.stop();
          }
          refreshHud(scene);
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
        if (scene._playerShadow) {
          scene._playerShadow.setPosition(pos.x, pos.y);
          scene._playerShadow.setDepth(t.x + t.y + 0.1);
        }

        scene.tweens.add({
          targets: playerSprite,
          x: pos.x, y: pos.y,
          duration: 120,
          ease: 'Linear',
          onComplete: function () { idx++; nextStep(); },
        });
      }
      nextStep();

      /* update player tile for proximity checks */
      playerSprite._tileX = tx;
      playerSprite._tileY = ty;
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
          
          if (scene.anims && scene.anims.exists('walk-down')) {
            npc.play('walk-down', true);
          }

          npc._tileX = t.x;
          npc._tileY = t.y;
          npc.setDepth(t.x + t.y + 1);

          scene.tweens.add({
            targets: npc,
            x: pos.x, y: pos.y,
            duration: 250,
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
      var cy = res.sprite.y - 40;

      var elems = [];

      var bg = scene.add.graphics().setDepth(200);
      bg.fillStyle(0x1A1512, 0.92);
      bg.fillRoundedRect(cx - 50, cy - 60, 100, 80, 10);
      bg.lineStyle(2, 0xD4AF37, 0.9);
      bg.strokeRoundedRect(cx - 50, cy - 60, 100, 80, 10);
      elems.push(bg);

      var labelMap = { tree: 'Tree', deer: 'Deer', gem_rock: 'Gem Rock', lake: 'Lake', fence: 'Fence' };
      var labelMapSi = { tree: 'ගස', deer: 'මුවා', gem_rock: 'මැණික් ගල', lake: 'වැව', fence: 'වැට' };
      var taskMap = { tree: 'wood', deer: 'hunting', gem_rock: 'gem', lake: 'fish', fence: 'fence' };
      var taskKey = taskMap[res.type];
      var cfg = TASKS_CONFIG[taskKey];

      var displayLabel = window.gameLanguage === 'si' ? labelMapSi[res.type] : labelMap[res.type];
      var title = scene.add.text(cx, cy - 50, displayLabel, {
        fontFamily: 'monospace', fontSize: '12px', color: '#FFF'
      }).setOrigin(0.5).setDepth(201);
      elems.push(title);

      if (res.type === 'fence') {
        var btn = scene.add.graphics().setDepth(201);
        btn.fillStyle(0xFF6B6B, 1);
        btn.fillRoundedRect(cx - 40, cy - 35, 80, 30, 8);
        elems.push(btn);

        var rmTxt = window.gameLanguage === 'si' ? '\u2715 ඉවත් කරන්න' : '\u2715 Remove';
        var txt = scene.add.text(cx, cy - 20, rmTxt, {
          fontFamily: 'monospace', fontSize: '10px', color: '#FFF'
        }).setOrigin(0.5).setDepth(202);
        elems.push(txt);

        var zone = scene.add.zone(cx, cy - 20, 80, 30).setDepth(203).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', function() {
          closeContextualMenu(scene);
          removeBuilding(scene, res.buildingData);
        });
        elems.push(zone);
      } else if (!res.isHarvesting) {
        var btn = scene.add.graphics().setDepth(201);
        btn.fillStyle(0x4CAF50, 1);
        btn.fillRoundedRect(cx - 40, cy - 35, 80, 30, 8);
        elems.push(btn);

        var harvestTxt = window.gameLanguage === 'si' ? 'අස්වනු' : 'Harvest';
        var iconStr = cfg.icon + ' ' + harvestTxt;
        var txt = scene.add.text(cx, cy - 20, iconStr, {
          fontFamily: 'monospace', fontSize: '10px', color: '#FFF'
        }).setOrigin(0.5).setDepth(202);
        elems.push(txt);

        var zone = scene.add.zone(cx, cy - 20, 80, 30).setDepth(203).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', function() {
          closeContextualMenu(scene);
          if (res.isBuilding) {
            // Fake harvest process for buildings
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
      } else {
        var btn = scene.add.graphics().setDepth(201);
        btn.fillStyle(0xFFD700, 1);
        btn.fillRoundedRect(cx - 40, cy - 35, 80, 30, 8);
        elems.push(btn);

        var boostTxt = window.gameLanguage === 'si' ? '\u26A1 50 රත්‍රන්' : '\u26A1 50 Gold';
        var txt = scene.add.text(cx, cy - 20, boostTxt, {
          fontFamily: 'monospace', fontSize: '10px', color: '#000', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(202);
        elems.push(txt);

        var zone = scene.add.zone(cx, cy - 20, 80, 30).setDepth(203).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', function() {
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

      // Clear occupied
      for(var r=0; r<bData.h; r++){
        for(var c=0; c<bData.w; c++){
          delete scene._occupied[(bData.tx+c)+','+(bData.ty+r)];
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
      
      var rmStr = window.gameLanguage === 'si' ? '-1 වැටක්' : '-1 Fence';
      floatText(scene, rmStr, cx, cy - 50, '#FF6B6B');

      refreshHud(scene);
    }

    function startHarvest(scene, res, taskKey) {
      if (!playerSprite) return;
      var pTile = worldToTile(playerSprite.x, playerSprite.y, scene._ox, scene._oy);
      var d = distToTile(pTile.tx, pTile.ty, res);
      if (d > 2) {
        var errMove = window.gameLanguage === 'si' ? '\u274C ළං වෙන්න!' : '\u274C Move closer!';
        floatText(scene, errMove, res.sprite.x, res.sprite.y - 30, '#FF6B6B');
        return;
      }

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
          finishHarvest(scene, res, taskKey);
        }
      });

      res.harvestTimer = timerEvent;
      res.bgBar = bgBar;
      res.fgBar = fgBar;

      scene.events.on('update', function() {
        if (!res.isHarvesting || !fgBar.active) return;
        var p = timerEvent.getProgress();

        /* update fill bar */
        fgBar.clear();
        var barColor = p < 0.5 ? 0x4CAF50 : p < 0.8 ? 0xFFC107 : 0xFF5722;
        fgBar.fillStyle(barColor, 1);
        fgBar.fillRoundedRect(res.sprite.x - 22, res.sprite.y - 42, 44 * p, 8, 4);

        /* update countdown label */
        if (timerLabel && timerLabel.active) {
          var secsLeft = Math.ceil((1 - p) * (duration / 1000));
          timerLabel.setText(secsLeft + 's');
          timerLabel.setX(res.sprite.x);
          timerLabel.setY(res.sprite.y - 50);
          /* colour: green → yellow → red as time runs out */
          timerLabel.setStyle({ color: p < 0.5 ? '#AAFFAA' : p < 0.8 ? '#FFD700' : '#FF6B6B' });
        }
      });
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
      // Forward resource updates to Flutter instead of drawing text
      window.notifyFlutter({
        type: 'hud_update',
        tasks: taskProgress,
        config: TASKS_CONFIG,
        gold: localPlayerData.gold
      });
      checkEraCompletion(scene);
    }
  }

  console.log('[Bridge] ' + GAME_ASSET_VERSION + ' loaded');
})();
