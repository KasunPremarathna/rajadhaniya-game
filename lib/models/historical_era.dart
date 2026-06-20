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

final List<HistoricalEra> historicalEras = [
  const HistoricalEra(
    id: 'prehistoric',
    name: 'ප්\u{200D}රාග් ඓතිහාසික යුගය',
    englishName: 'Prehistoric & Protohistoric',
    period: 'c. 30,000 BCE – 500 BCE',
    bonus: 'Hunting & Stone Tools +30%',
    icon: '\u{1F3F9}',
    lat: 6.6521,
    lng: 80.6922,
  ),
  const HistoricalEra(
    id: 'anuradhapura',
    name: 'අනුරාධපුර යුගය',
    englishName: 'Anuradhapura Period',
    period: 'c. 377 BCE – 1017 CE',
    bonus: 'Farming & Irrigation +25%',
    icon: '\u{1F33E}',
    lat: 8.3114,
    lng: 80.4037,
  ),
  const HistoricalEra(
    id: 'polonnaruwa',
    name: 'පොලොන්නරු යුගය',
    englishName: 'Polonnaruwa Period',
    period: '1017 CE – 1232 CE',
    bonus: 'Gold & International Trade +20%',
    icon: '\u{1F3EF}',
    lat: 7.9403,
    lng: 81.0028,
  ),
  const HistoricalEra(
    id: 'transitional',
    name: 'සංක්\u{200D}රාන්ති යුගය',
    englishName: 'Transitional Period',
    period: '1232 CE – 1594 CE',
    bonus: 'Fortress Defense & Training +25%',
    icon: '\u{26F0}\u{FE0F}',
    lat: 7.8144,
    lng: 80.2224,
  ),
  const HistoricalEra(
    id: 'colonial',
    name: 'යටත්විජිත යුගය',
    englishName: 'Colonial Era',
    period: '1505 CE – 1948 CE',
    bonus: 'Cash Crops & Modern Roads +20%',
    icon: '\u{1F6A2}',
    lat: 6.0367,
    lng: 80.2170,
  ),
  const HistoricalEra(
    id: 'modern',
    name: 'නිදහසින් පසු වර්තමානය',
    englishName: 'Independence to 2026',
    period: '1948 CE – 2026',
    bonus: 'Full OSM Infrastructure Map',
    icon: '\u{1F3D9}\u{FE0F}',
    lat: 6.9271,
    lng: 79.8612,
  ),
];
