import 'package:flutter/material.dart';
import '../models/troop.dart';
import '../config/game_config.dart';

class SenaKandaScreen extends StatefulWidget {
  final Function(String) translate;
  const SenaKandaScreen({super.key, required this.translate});

  @override
  State<SenaKandaScreen> createState() => _SenaKandaScreenState();
}

class _SenaKandaScreenState extends State<SenaKandaScreen> with SingleTickerProviderStateMixin {
  late final int housingSpaceLimit;
  Map<String, int> trainingQueue = {}; // troop id -> count

  @override
  void initState() {
    super.initState();
    housingSpaceLimit = GameConfig.instance.global['housingSpaceLimit'] ?? 50;
  }

  int get currentHousingSpace {
    int space = 0;
    trainingQueue.forEach((id, count) {
      final troop = allTroops.firstWhere((t) => t.id == id);
      space += troop.housingSpaceCost * count;
    });
    return space;
  }

  int get totalTrainingTimeSeconds {
    int total = 0;
    trainingQueue.forEach((id, count) {
      final troop = allTroops.firstWhere((t) => t.id == id);
      total += troop.trainingTimeSeconds * count;
    });
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
          content: Text(widget.translate('❌ Not enough housing space!')),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() {
      trainingQueue[troop.id] = (trainingQueue[troop.id] ?? 0) + 1;
    });
  }

  void _removeTroop(Troop troop) {
    if ((trainingQueue[troop.id] ?? 0) > 0) {
      setState(() {
        trainingQueue[troop.id] = trainingQueue[troop.id]! - 1;
        if (trainingQueue[troop.id] == 0) {
          trainingQueue.remove(troop.id);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: const Color(0xFFD4A017).withValues(alpha: 0.5), width: 2),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.white38, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 16),
              Text(
                widget.translate('Sena Kanda (Training Barracks)'),
                style: const TextStyle(color: Color(0xFFD4A017), fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.0),
              ),
            const SizedBox(height: 16),

            // Top Status Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF2C2520),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatusItem(Icons.group, widget.translate('Housing Space'), '$currentHousingSpace / $housingSpaceLimit'),
                  Container(width: 1, height: 40, color: Colors.white12),
                  _buildStatusItem(Icons.timer, widget.translate('Total Time'), _formatTime(totalTrainingTimeSeconds)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Troop Selection Grid
            Expanded(
              flex: 3,
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 2.2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: allTroops.length,
                itemBuilder: (context, index) {
                  final troop = allTroops[index];
                  final queuedCount = trainingQueue[troop.id] ?? 0;
                  return _buildTroopCard(troop, queuedCount);
                },
              ),
            ),

            const SizedBox(height: 16),
            const Divider(color: Colors.white24),
            const SizedBox(height: 8),

            // Active Training Queue
            Text(
              widget.translate('Active Training Queue'),
              style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Expanded(
              flex: 1,
              child: trainingQueue.isEmpty
                  ? Center(
                      child: Text(
                        widget.translate('No troops in queue.'),
                        style: const TextStyle(color: Colors.white54),
                      ),
                    )
                  : ListView.builder(
                      itemCount: trainingQueue.length,
                      itemBuilder: (context, index) {
                        final id = trainingQueue.keys.elementAt(index);
                        final count = trainingQueue[id]!;
                        final troop = allTroops.firstWhere((t) => t.id == id);
                        return _buildQueueItem(troop, count);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusItem(IconData icon, String label, String value) {
    return Column(
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.white54, size: 14),
            const SizedBox(width: 4),
            Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10)),
          ],
        ),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildTroopCard(Troop troop, int queuedCount) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFF3E2723), const Color(0xFF2C1914)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: queuedCount > 0 ? const Color(0xFFD4A017) : Colors.white12, width: queuedCount > 0 ? 2 : 1),
      ),
      padding: const EdgeInsets.all(6),
      child: Row(
        children: [
          // Icon Placeholder
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: Colors.black45,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFD4A017).withValues(alpha: 0.5)),
            ),
            child: const Icon(Icons.person, color: Color(0xFFD4A017), size: 18),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  troop.name.split(' (')[0], // Only English part for UI space
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${widget.translate('Cost')}: ${troop.housingSpaceCost} ${widget.translate('Space')}',
                  style: const TextStyle(color: Colors.white54, fontSize: 9),
                ),
                Text(
                  '${widget.translate('Time')}: ${troop.trainingTime}',
                  style: const TextStyle(color: Colors.white54, fontSize: 8),
                ),
              ],
            ),
          ),
          // Action Buttons
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              GestureDetector(
                onTap: () => _addTroop(troop),
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(4)),
                  child: const Icon(Icons.add, color: Colors.green, size: 14),
                ),
              ),
              const SizedBox(height: 2),
              Text(queuedCount.toString(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10)),
              const SizedBox(height: 2),
              GestureDetector(
                onTap: () => _removeTroop(troop),
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(4)),
                  child: const Icon(Icons.remove, color: Colors.red, size: 14),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQueueItem(Troop troop, int count) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: const Color(0xFF2C2520),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(4)),
            child: const Icon(Icons.person, color: Color(0xFFD4A017), size: 14),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${troop.name.split(' (')[0]} x$count',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: const LinearProgressIndicator(
                    value: 0.35, // Static mock progress
                    backgroundColor: Colors.black45,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _formatTime(troop.trainingTimeSeconds * count),
            style: const TextStyle(color: Colors.white54, fontSize: 10),
          ),
        ],
      ),
    );
  }
}
