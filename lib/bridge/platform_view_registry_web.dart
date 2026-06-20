// ignore_for_file: avoid_web_libraries_in_flutter
import 'dart:ui_web' as ui_web;
import 'package:web/web.dart' as web;

extension WindowExtension on web.Window {
  external set _phaserDiv(web.HTMLDivElement value);
}

final web.HTMLDivElement _phaserDiv = web.HTMLDivElement()
  ..id = 'game-container'
  ..style.width = '100%'
  ..style.height = '100%';

void registerPhaserView() {
  web.window._phaserDiv = _phaserDiv;
  ui_web.platformViewRegistry.registerViewFactory('phaser-game', (int viewId) => _phaserDiv);
}
