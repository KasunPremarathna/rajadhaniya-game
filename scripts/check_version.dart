// ignore_for_file: avoid_print

import 'dart:io';
import 'dart:convert';

void main() async {
  print('Running version synchronization check...');

  final jsFile = File('web/game_bridge.js');
  final jsonFile = File('web/version.json');

  if (!await jsFile.exists()) {
    print('Error: web/game_bridge.js not found.');
    exit(1);
  }

  if (!await jsonFile.exists()) {
    print('Error: web/version.json not found.');
    exit(1);
  }

  final jsContent = await jsFile.readAsString();
  final jsonContent = await jsonFile.readAsString();

  // Extract version from JS
  final jsRegex = RegExp(r"GAME_ASSET_VERSION\s*=\s*['""]([^'""]+)['""]");
  final jsMatch = jsRegex.firstMatch(jsContent);
  if (jsMatch == null) {
    print('Error: Could not find GAME_ASSET_VERSION in web/game_bridge.js.');
    exit(1);
  }
  final jsVersion = jsMatch.group(1);

  // Extract version from JSON
  String? jsonVersion;
  try {
    final Map<String, dynamic> jsonData = jsonDecode(jsonContent);
    jsonVersion = jsonData['version'];
  } catch (e) {
    print('Error: Invalid JSON in web/version.json.');
    exit(1);
  }

  if (jsVersion == null || jsonVersion == null) {
    print('Error: Version string is null.');
    exit(1);
  }

  if (jsVersion != jsonVersion) {
    print('\n========================================================');
    print('❌ VERSION MISMATCH ERROR ❌');
    print('========================================================');
    print('web/game_bridge.js has version: $jsVersion');
    print('web/version.json has version:   $jsonVersion');
    print('These two files must have the identical version string.');
    print('Please update them to match before building or deploying.');
    print('========================================================\n');
    exit(1);
  }

  print('✅ Version check passed. Both files are synced at $jsVersion.');
  exit(0);
}
