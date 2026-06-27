import 'dart:convert';
import 'package:flutter/services.dart';

class GameConfig {
  static final GameConfig instance = GameConfig._internal();
  GameConfig._internal();

  Map<String, dynamic> _configData = {};

  Future<void> loadConfig() async {
    final jsonString = await rootBundle.loadString('assets/config/game_master.json');
    _configData = jsonDecode(jsonString);
  }

  Map<String, dynamic> get global => _configData['global'] ?? {};
  List<dynamic> get eras => _configData['eras'] ?? [];
  Map<String, dynamic> get buildings => _configData['buildings'] ?? {};
  List<dynamic> get troops => _configData['troops'] ?? [];
  List<dynamic> get resources => _configData['resources'] ?? [];
  
  // Quick getter for JSON dump to pass into JS bridge
  String toJsonString() => jsonEncode(_configData);
}
