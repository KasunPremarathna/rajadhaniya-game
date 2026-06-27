import 'dart:convert';
import 'dart:io';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class JsBridge {
  JsBridge._();

  static WebViewController? webViewController;
  static void Function(Map<String, dynamic>)? _flutterCallback;

  static void handleWebViewMessage(String message) {
    if (_flutterCallback != null) {
      try {
        final decoded = jsonDecode(message);
        if (decoded is Map) {
          _flutterCallback!(Map<String, dynamic>.from(decoded));
        }
      } catch (e) {
        // ignore
      }
    }
  }

  static void callInitGameGrid(String eraId, String eraName, String eraBonus, double lat, double lng, String lang, String configJson) {
    webViewController?.runJavaScript("window.initGameGrid('$eraId', '$eraName', '$eraBonus', $lat, $lng, '$lang', '${configJson.replaceAll("'", "\\'")}')");
  }

  static void showFlutterUi() {
    webViewController?.runJavaScript("window.showFlutterUi()");
  }

  static void forceAssetUpdate() {
    webViewController?.runJavaScript("window.forceAssetUpdate()");
  }

  static void checkAssetVersion() async {
    try {
      final request = await HttpClient().getUrl(Uri.parse('https://rajadhanigamesl.web.app/version.json?t=${DateTime.now().millisecondsSinceEpoch}'));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      final data = jsonDecode(body);
      final remoteVersion = data['version'] as String;
      
      final prefs = await SharedPreferences.getInstance();
      final localVersion = prefs.getString('rajadhaniya_asset_version') ?? 'none';
      
      if (remoteVersion != localVersion) {
        if (_flutterCallback != null) {
          _flutterCallback!({
            'type': 'version_mismatch',
            'storedVersion': localVersion,
            'expectedVersion': remoteVersion
          });
        }
      }
    } catch (e) {
      // fallback if network fails
    }
  }

  static void enterBuildMode(String buildingType) {
    webViewController?.runJavaScript("window.enterBuildMode('$buildingType')");
  }

  static void spawnTroop(Map<String, dynamic> payload) {
    payload['action'] = 'spawn_troop';
    callJs('flutterGameAction', payload);
  }

  static void callJs(String fnName, Map<String, dynamic> args) {
    final payload = jsonEncode(args);
    // Note: JSON.stringify payload needs to be carefully passed
    webViewController?.runJavaScript("if (window.$fnName) window.$fnName($payload)");
  }

  static bool get isGameActive {
    return true; // Stub for mobile
  }

  static void registerFlutterCallback(void Function(Map<String, dynamic>) callback) {
    _flutterCallback = callback;
  }
}
