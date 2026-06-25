import 'package:flutter/material.dart';
import '../models/troop.dart';
import '../config/game_config.dart';
import 'dart:async';
import '../bridge/js_bridge.dart';

class QueuedTroop {
  final Troop troop;
  final int totalTimeSeconds;
  int remainingSeconds;

  QueuedTroop(this.troop)
      : totalTimeSeconds = troop.trainingTimeSeconds,
        remainingSeconds = troop.trainingTimeSeconds;
}

class SenaKandaScreen extends StatefulWidget {
  final Function(String) translate;
  const SenaKandaScreen({super.key, required this.translate});

  @override
  State<SenaKandaScreen> createState() => _SenaKandaScreenState();
}

class _SenaKandaScreenState extends State<SenaKandaScreen> with SingleTickerProviderStateMixin {
  late final int housingSpaceLimit;
  List<QueuedTroop> activeQueue = [];
  Timer? _trainingTimer;
  Troop? inspectingTroop;

  @override
  void initState() {
    super.initState();
    housingSpaceLimit = GameConfig.instance.global['housingSpaceLimit'] ?? 50;
    _trainingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (activeQueue.isNotEmpty) {
        setState(() {
          activeQueue.first.remainingSeconds--;
          if (activeQueue.first.remainingSeconds <= 0) {
            final trained = activeQueue.removeAt(0);
            JsBridge.spawnTroop({'troopId': trained.troop.id});
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _trainingTimer?.cancel();
    super.dispose();
  }

  int get currentHousingSpace {
    int space = 0;
    for (var q in activeQueue) {
      space += q.troop.housingSpaceCost;
    }
    return space;
  }

  int get totalTrainingTimeSeconds {
    int total = 0;
    for (var q in activeQueue) {
      total += q.remainingSeconds;
    }
    return total;
  }

  String _formatTime(int seconds) {
    if (seconds == 0) return "0s";
    if (seconds < 60) return "${seconds}s";
    final m = seconds ~/ 60;
    final s = seconds % 60;
    if (s == 0) return "${m}m";
    return "${m}m ${s}s";
  }

  void _addTroop(Troop troop) {
    if (currentHousingSpace + troop.housingSpaceCost > housingSpaceLimit) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.translate('Housing limit reached! Build more Wadiya (Houses)')),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() {
      activeQueue.add(QueuedTroop(troop));
    });
  }

  void _removeTroop(Troop troop) {
    final index = activeQueue.lastIndexWhere((q) => q.troop.id == troop.id);
    if (index != -1) {
      setState(() {
        activeQueue.removeAt(index);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.95),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF231E1B), // Dark COC background
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: const Color(0xFF5E4B3C), width: 3),
        ),
        child: Column(
          children: [
            // Handle bar
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.white38, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 8),

            // Header Title
            Stack(
              alignment: Alignment.center,
              children: [
                Align(
                  alignment: Alignment.center,
                  child: Text(
                    inspectingTroop != null
                        ? "${inspectingTroop!.name.split(' (')[0]} (Level 1)"
                        : widget.translate('Barracks (Level 1)'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      shadows: [Shadow(color: Colors.black, blurRadius: 2, offset: Offset(1, 1))],
                    ),
                  ),
                ),
                if (inspectingTroop != null)
                  Positioned(
                    right: 16,
                    child: GestureDetector(
                      onTap: () => setState(() => inspectingTroop = null),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.black, width: 2),
                        ),
                        child: const Icon(Icons.close, color: Colors.white, size: 20),
                      ),
                    ),
                  ),
                if (inspectingTroop != null)
                   Positioned(
                    left: 16,
                    child: GestureDetector(
                      onTap: () => setState(() => inspectingTroop = null),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.black, width: 2),
                        ),
                        child: const Icon(Icons.arrow_back, color: Colors.black, size: 20),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            const Divider(color: Color(0xFF5E4B3C), thickness: 3, height: 0),

            Expanded(
              child: inspectingTroop != null ? _buildDetailView() : _buildGridView(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGridView() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          // Top Active Queue
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFDCD2B0), // Beige CoC background for top section
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF8B7765), width: 2),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Train troops $currentHousingSpace/$housingSpaceLimit',
                        style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      const SizedBox(height: 8),
                      // Horizontal list of actively training units
                      SizedBox(
                        height: 65,
                        child: activeQueue.isEmpty
                            ? Container(
                                decoration: BoxDecoration(
                                  color: Colors.black12,
                                  border: Border.all(color: Colors.black26),
                                ),
                              )
                            : ListView.builder(
                                scrollDirection: Axis.horizontal,
                                itemCount: activeQueue.map((q) => q.troop.id).toSet().length,
                                itemBuilder: (context, index) {
                                  final distinctIds = activeQueue.map((q) => q.troop.id).toSet().toList();
                                  final id = distinctIds[index];
                                  final relatedTroops = activeQueue.where((q) => q.troop.id == id).toList();
                                  final troop = relatedTroops.first.troop;
                                  final count = relatedTroops.length;
                                  bool isActive = index == 0;
                                  double progress = isActive 
                                     ? (1.0 - (relatedTroops.first.remainingSeconds / relatedTroops.first.totalTimeSeconds))
                                     : 0.0;
                                  return _buildHorizontalQueueSlot(troop, count, isActive, progress);
                                },
                              ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Total Time and Finish Button
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Total time:', style: TextStyle(color: Colors.black54, fontSize: 10, fontWeight: FontWeight.bold)),
                    Text(
                      _formatTime(totalTrainingTimeSeconds).toUpperCase(),
                      style: const TextStyle(color: Colors.black, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    const Text('Finish Training:', style: TextStyle(color: Colors.black54, fontSize: 9)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7CB342),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFF33691E), width: 2),
                      ),
                      child: Row(
                        children: [
                           Text(
                             ((totalTrainingTimeSeconds / 60).ceil() + 1).toString(),
                             style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                           ),
                           const SizedBox(width: 4),
                           const Icon(Icons.diamond, color: Color(0xFF00E676), size: 12),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Troop Roster Grid
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF88A9BB), // CoC light blue background
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF537385), width: 2),
              ),
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  childAspectRatio: 0.8,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: allTroops.length,
                itemBuilder: (context, index) {
                  return _buildRosterCard(allTroops[index]);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalQueueSlot(Troop troop, int count, bool isActive, double progress) {
    return Container(
      width: 55,
      margin: const EdgeInsets.only(right: 6),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF435A6B),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFF2E3E4B), width: 2),
            ),
            child: Column(
              children: [
                Expanded(
                  child: Center(
                    child: Icon(Icons.person, color: const Color(0xFFD4A017), size: 28),
                  ),
                ),
                if (isActive)
                   Container(
                     height: 14,
                     width: double.infinity,
                     color: Colors.black45,
                     child: Stack(
                       alignment: Alignment.centerLeft,
                       children: [
                         FractionallySizedBox(
                           widthFactor: progress,
                           child: Container(color: Colors.green),
                         ),
                         Center(
                           child: Text(
                             _formatTime(activeQueue.first.remainingSeconds),
                             style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                           ),
                         ),
                       ],
                     ),
                   ),
              ],
            ),
          ),
          // xCount Badge
          Positioned(
            top: -2,
            left: -2,
            child: Text(
              '${count}x',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                shadows: [Shadow(color: Colors.black, blurRadius: 2)],
              ),
            ),
          ),
          // Minus Button
          Positioned(
            top: -6,
            right: -6,
            child: GestureDetector(
              onTap: () => _removeTroop(troop),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
                padding: const EdgeInsets.all(2),
                child: const Icon(Icons.remove, color: Colors.white, size: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRosterCard(Troop troop) {
    return GestureDetector(
      onTap: () => _addTroop(troop),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF5D7F96),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: const Color(0xFF385060), width: 2),
        ),
        child: Stack(
          children: [
            Center(child: Icon(Icons.person, color: const Color(0xFFD4A017), size: 40)),
            // Info Icon
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () => setState(() => inspectingTroop = troop),
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF0277BD),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  padding: const EdgeInsets.all(2),
                  child: const Icon(Icons.info_outline, color: Colors.white, size: 14),
                ),
              ),
            ),
            // Level
            Positioned(
              top: 4,
              left: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text('1', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ),
            // Cost Banner
            Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 2),
                decoration: const BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(4)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      troop.unlockBuildCost.split(' ')[0], // Extract just the number for now
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.water_drop, color: Colors.purpleAccent, size: 10),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailView() {
    final troop = inspectingTroop!;
    // Parse stats
    final atkObj = GameConfig.instance.troops.firstWhere((t) => t['id'] == troop.id);
    final int dmg = atkObj['attack_damage'] ?? 10;
    final int speedMs = atkObj['attack_speed_ms'] ?? 1000;
    final int dps = (dmg / (speedMs / 1000)).round();
    final int hp = troop.housingSpaceCost * 150; // Mock HP

    return Container(
      color: const Color(0xFFDCD2B0), // Beige background
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Expanded(
            flex: 2,
            child: Row(
              children: [
                // Avatar Left Side
                Expanded(
                  flex: 1,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Expanded(
                        child: Center(
                          child: Icon(Icons.person, size: 120, color: const Color(0xFF3E2723)),
                        ),
                      ),
                    ],
                  ),
                ),
                // Stat Bars Right Side
                Expanded(
                  flex: 1,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildStatBar('Damage per second:', dps.toString(), dps / 100, Colors.orange),
                      const SizedBox(height: 12),
                      _buildStatBar('Hitpoints:', hp.toString(), hp / 1000, Colors.green),
                      const SizedBox(height: 12),
                      _buildStatBar('Training Cost:', troop.unlockBuildCost, 0.5, Colors.purple),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Metadata Rows
          Expanded(
            flex: 3,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0E6CD),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF8B7765), width: 1),
              ),
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _buildMetaRow('Favorite target:', troop.role),
                    _buildMetaRow('Damage type:', troop.ability),
                    _buildMetaRow('Targets:', 'Ground'),
                    _buildMetaRow('Housing Space:', troop.housingSpaceCost.toString()),
                    _buildMetaRow('Training Time:', troop.trainingTime),
                    _buildMetaRow('Movement speed:', '24'),
                    const SizedBox(height: 16),
                    Text(
                      troop.description,
                      style: const TextStyle(color: Color(0xFF2C567A), fontSize: 12, fontStyle: FontStyle.italic),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatBar(String label, String value, double progress, Color barColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
           mainAxisAlignment: MainAxisAlignment.spaceBetween,
           children: [
             Text(label, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 10)),
           ],
        ),
        const SizedBox(height: 4),
        Stack(
          alignment: Alignment.centerLeft,
          children: [
            Container(
              height: 16,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            FractionallySizedBox(
              widthFactor: progress.clamp(0.0, 1.0),
              child: Container(
                height: 16,
                decoration: BoxDecoration(
                  color: barColor,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.black26, width: 1),
                ),
              ),
            ),
            Padding(
               padding: const EdgeInsets.only(left: 8),
               child: Text(value, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, shadows: [Shadow(color: Colors.black, blurRadius: 1)])),
            )
          ],
        ),
      ],
    );
  }

  Widget _buildMetaRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(color: Color(0xFF1976D2), fontWeight: FontWeight.bold, fontSize: 12)),
              Text(value, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
            ],
          ),
          const Divider(color: Colors.black12, height: 8),
        ],
      ),
    );
  }
}
