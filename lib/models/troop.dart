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

const List<Troop> allTroops = [
  Troop(
    id: "troop_padati_soldier",
    name: "Padati Soldier (පාබල සෙබළා)",
    role: "Frontline Swordsman Vanguard",
    housingSpaceCost: 1,
    ability: "Angam Swarm Aggression",
    whereCanBuildIt: "Sena Kanda (War Barracks) Level 1",
    unlockBuildCost: "100 Food",
    unlockBuildTime: "10 Seconds",
    trainingTime: "5 Seconds",
    whatItDoes: "Sprints to the nearest structural fortification or enemy unit, attacking with quick Kastane sword strikes.",
    description: "A fierce infantry foot soldier armed with a traditional blade. Highly effective when deployed in massive swarms to overwhelm outlying village structures.",
  ),
  Troop(
    id: "troop_dunuvaya",
    name: "Dunuvaya (දුනුවායා)",
    role: "Ranged Archer Marksman",
    housingSpaceCost: 1,
    ability: "Ranged Arrow Volley",
    whereCanBuildIt: "Sena Kanda (War Barracks) Level 2",
    unlockBuildCost: "500 Food",
    unlockBuildTime: "15 Seconds",
    trainingTime: "6 Seconds",
    whatItDoes: "Fires high-arc arrows from a safe distance, enabling them to strike internal base targets directly over protective Stone Walls.",
    description: "A highly trained elite archer from the king's guard. Keeps their distance to pick off enemy defense towers and gold stockpiles safely.",
  ),
  Troop(
    id: "troop_maha_yodha",
    name: "Maha Yodha (මහා යෝධයා)",
    role: "Heavy Defensive Shield Tank",
    housingSpaceCost: 5,
    ability: "Fortress Bashing",
    whereCanBuildIt: "Sena Kanda (War Barracks) Level 3",
    unlockBuildCost: "2,500 Food",
    unlockBuildTime: "2 Minutes",
    trainingTime: "30 Seconds",
    whatItDoes: "Completely bypasses normal citizen homes and resource silos to march straight toward the nearest active defensive fortification to smash it down.",
    description: "Inspired by the legendary giant warriors of old. Possesses immense health and physical strength, absorbing heavy fire to protect weaker units behind him.",
  ),
  Troop(
    id: "troop_kollakaraya",
    name: "Kollakaraya (කොල්ලකරු)",
    role: "Resource Plunderer",
    housingSpaceCost: 1,
    ability: "Treasury Hustle (x2 Loot Damage)",
    whereCanBuildIt: "Sena Kanda (War Barracks) Level 4",
    unlockBuildCost: "5,000 Food",
    unlockBuildTime: "30 Minutes",
    trainingTime: "7 Seconds",
    whatItDoes: "Ignores all combatants to sprint directly toward Gold Mines and Food Silos, dealing double damage until the enemy's treasury is completely dried up.",
    description: "A swift, stealthy rogue who moves faster than any unit on the grid. Obsessed with gold and rations, making them perfect for lightning-fast resource raids.",
  ),
  Troop(
    id: "troop_prakara_bhedaka",
    name: "Prakara Bhedaka (ප්‍රාකාර බිඳින්නා)",
    role: "Wall Demolisher",
    housingSpaceCost: 2,
    ability: "Kamikaze Exploding Keg (x40 Wall Damage)",
    whereCanBuildIt: "Sena Kanda (War Barracks) Level 5",
    unlockBuildCost: "20,000 Food",
    unlockBuildTime: "2 Hours",
    trainingTime: "1 Minute",
    whatItDoes: "Carries an explosive black-powder keg directly to the nearest sealed Stone Wall junction, detonating itself to blow wide gaps in enemy defenses.",
    description: "A daring sapper unit trained specifically to breach heavy royal fortifications, paving a clear open path for the main vanguard army to storm inside.",
  ),
  Troop(
    id: "troop_mantrakaraya",
    name: "Mantrakaraya (මන්ත්‍රකාරයා)",
    role: "Splash Damage Sorcerer",
    housingSpaceCost: 4,
    ability: "Gini Jala Spell",
    whereCanBuildIt: "Sena Kanda (War Barracks) Level 7",
    unlockBuildCost: "270,000 Food",
    unlockBuildTime: "6 Hours",
    trainingTime: "2 Minutes",
    whatItDoes: "Channels ancient mystic arts to hurl exploding fireballs that incinerate tightly clustered groups of buildings or defending guard units at once.",
    description: "A powerful glass-cannon mystic master of elemental sorcery. Deals massive area-of-effect damage but has low defense against direct physical arrows.",
  ),
  Troop(
    id: "troop_loha_yodha",
    name: "Loha Juggernaut (ලෝහ යෝධයා)",
    role: "Heavy Armored Iron Knight",
    housingSpaceCost: 25,
    ability: "Hardened Iron Cleave",
    whereCanBuildIt: "Sena Kanda (War Barracks) Level 10",
    unlockBuildCost: "1,400,000 Food",
    unlockBuildTime: "1 Day 12 Hours",
    trainingTime: "3 Minutes",
    whatItDoes: "Marches slowly across the battlefield, executing devastating heavy broadsword swings that instantly demolish high-HP structures.",
    description: "Encased fully in dense, heavy iron plate armor. This slow-moving titan possesses catastrophic single-target attack power and near-impenetrable defenses.",
  ),
  Troop(
    id: "hero_maharaja",
    name: "Maharaja (මහාරාජා)",
    role: "Immortal King Tank Leader",
    housingSpaceCost: 0,
    ability: "Sri Handha (Royal Roar)",
    whereCanBuildIt: "Royal Simhasanaya Throne (Kingdom Level 7)",
    unlockBuildCost: "10,000 Gold",
    unlockBuildTime: "Instant",
    trainingTime: "Instant (No Rest Required)",
    whatItDoes: "Acts as the ultimate ground combat leader, tanking enemy defense strikes while dealing high-impact sword strikes.",
    description: "The supreme leader of the Rajadhani. Activating his Royal Roar instantly heals his wounds, triggers a speed/damage rage aura, and summons a loyal squad of Padati Soldiers to his side.",
  ),
  Troop(
    id: "hero_bisawa",
    name: "Bisawa / Rani (රැජින)",
    role: "High-DPS Ranged Stealth Queen",
    housingSpaceCost: 0,
    ability: "Mayam Cloak (Stealth)",
    whereCanBuildIt: "Royal Simhasanaya Throne (Kingdom Level 9)",
    unlockBuildCost: "20,000 Gold",
    unlockBuildTime: "Instant",
    trainingTime: "Instant (No Rest Required)",
    whatItDoes: "Snipes down key defensive fortifications from extreme range using a modified high-tension Royal Bow with precise accuracy.",
    description: "The fierce tactical queen of the realm. Activating her Mayam Cloak turns her completely invisible to enemy defenses, dramatically spikes her arrow damage, and summons elite Dunuvaya archers to aid her.",
  ),
];
