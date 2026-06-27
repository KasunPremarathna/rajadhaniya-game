import '../config/game_config.dart';

class HistoricalEra {
  final String id;
  final String name;
  final String englishName;
  final String period;
  final String bonus;
  final String icon;
  final double lat;
  final double lng;

  const HistoricalEra({
    required this.id,
    required this.name,
    required this.englishName,
    required this.period,
    required this.bonus,
    required this.icon,
    required this.lat,
    required this.lng,
  });

  factory HistoricalEra.fromMap(Map<String, dynamic> map) {
    return HistoricalEra(
      id: map['id'] as String,
      name: map['name'] as String,
      englishName: map['englishName'] as String,
      period: map['period'] as String,
      bonus: map['bonus'] as String,
      icon: map['icon'] as String,
      lat: (map['lat'] as num).toDouble(),
      lng: (map['lng'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'englishName': englishName,
        'period': period,
        'bonus': bonus,
        'icon': icon,
        'lat': lat,
        'lng': lng,
      };
}

List<HistoricalEra> get historicalEras {
  final list = GameConfig.instance.eras;
  if (list.isEmpty) {
    return [
      const HistoricalEra(
        id: 'prehistoric',
        name: 'ප්‍රාග් ඓතිහාසික යුගය',
        englishName: 'Prehistoric & Protohistoric',
        period: 'c. 30,000 BCE – 500 BCE',
        bonus: 'Hunting & Stone Tools +30%',
        icon: '🏹',
        lat: 6.6521,
        lng: 80.6922,
      )
    ]; // Safe fallback if config not loaded yet
  }
  return list.map((e) => HistoricalEra(
    id: e['id'],
    name: e['name'],
    englishName: e['englishName'],
    period: e['period'],
    bonus: e['bonus'],
    icon: e['icon'],
    lat: (e['lat'] as num).toDouble(),
    lng: (e['lng'] as num).toDouble(),
  )).toList();
}
