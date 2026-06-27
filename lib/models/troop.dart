import '../config/game_config.dart';

class Troop {
  final String id;
  final String name;
  final String role;
  final int housingSpaceCost;
  final String ability;
  final String whereCanBuildIt;
  final String unlockBuildCost;
  final String unlockBuildTime;
  final String trainingTime;
  final String whatItDoes;
  final String description;

  const Troop({
    required this.id,
    required this.name,
    required this.role,
    required this.housingSpaceCost,
    required this.ability,
    required this.whereCanBuildIt,
    required this.unlockBuildCost,
    required this.unlockBuildTime,
    required this.trainingTime,
    required this.whatItDoes,
    required this.description,
  });

  // Calculate rough seconds for trainingTime string for the queue
  int get trainingTimeSeconds {
    if (trainingTime.toLowerCase() == 'instant' || trainingTime.toLowerCase().contains('instant')) {
      return 0;
    }
    int seconds = 0;
    if (trainingTime.toLowerCase().contains('minute')) {
      final parts = trainingTime.split(' ');
      if (parts.isNotEmpty) {
        seconds = (int.tryParse(parts[0]) ?? 0) * 60;
      }
    } else if (trainingTime.toLowerCase().contains('second')) {
      final parts = trainingTime.split(' ');
      if (parts.isNotEmpty) {
        seconds = int.tryParse(parts[0]) ?? 0;
      }
    }
    return seconds;
  }
}

List<Troop> get allTroops {
  final list = GameConfig.instance.troops;
  return list.map((t) => Troop(
    id: t['id'],
    name: t['name'],
    role: t['role'],
    housingSpaceCost: t['housingSpaceCost'],
    ability: t['ability'],
    whereCanBuildIt: t['whereCanBuildIt'],
    unlockBuildCost: t['unlockBuildCost'],
    unlockBuildTime: t['unlockBuildTime'],
    trainingTime: t['trainingTime'],
    whatItDoes: t['whatItDoes'],
    description: t['description'],
  )).toList();
}
