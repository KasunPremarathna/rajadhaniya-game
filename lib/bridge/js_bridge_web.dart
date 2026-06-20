// ignore_for_file: deprecated_member_use, avoid_web_libraries_in_flutter

import 'dart:js' as js;
import 'dart:convert';

class JsBridge {
  JsBridge._();

  static void callInitGameGrid(String eraId, String eraName, String eraBonus, double lat, double lng, String lang) {
    js.context.callMethod('initGameGrid', [eraId, eraName, eraBonus, lat, lng, lang]);
  }

  static void showFlutterUi() {
    js.context.callMethod('showFlutterUi');
  }

  static void forceAssetUpdate() {
    js.context.callMethod('forceAssetUpdate');
  }

  static void checkAssetVersion() {
    js.context.callMethod('checkAssetVersion');
  }

  static void enterBuildMode(String buildingType) {
    js.context.callMethod('enterBuildMode', [buildingType]);
  }

  /// Generic JS bridge call — calls window[fnName](jsonEncode(args))
  static void callJs(String fnName, Map<String, dynamic> args) {
    final payload = jsonEncode(args);
    if (js.context.hasProperty(fnName)) {
      js.context.callMethod(fnName, [payload]);
    }
  }

  static bool get isGameActive {
    final val = js.context['__gameActive'];
    return val == true;
  }

  static void registerFlutterCallback(void Function(Map<String, dynamic>) callback) {
    js.context['_flutterCallback'] = (dynamic data) {
      if (data is String) {
        try {
          final decoded = jsonDecode(data);
          if (decoded is Map) {
            callback(Map<String, dynamic>.from(decoded));
          }
        } catch (e) {
          // ignore error
        }
      } else if (data is js.JsObject) {
        // JS objects arrive as JsObject (not Map) — convert via Object.keys()
        final keys = js.context['Object'].callMethod('keys', [data]) as js.JsArray;
        final map = <String, dynamic>{};
        for (final k in keys) {
          map[k as String] = data[k];
        }
        callback(map);
      } else if (data is Map) {
        callback(Map<String, dynamic>.from(data));
      }
    };
  }
}
