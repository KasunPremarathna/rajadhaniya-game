import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../bridge/js_bridge.dart';
import '../bridge/game_view.dart';
import '../models/historical_era.dart';
import '../services/firestore_service.dart';
import 'update_screen.dart';
import 'sena_kanda_screen.dart';
import 'login_screen.dart';

class KingdomViewScreen extends StatefulWidget {
  final HistoricalEra era;
  const KingdomViewScreen({super.key, required this.era});

  @override
  State<KingdomViewScreen> createState() => _KingdomViewScreenState();
}

class _KingdomViewScreenState extends State<KingdomViewScreen> {
  Map<String, dynamic>? _hudData;
  Timer? _cloudSyncTimer;

  String _language = 'en';

  @override
  void initState() {
    super.initState();
    JsBridge.registerFlutterCallback(_onJsEvent);
    _initGame();
    
    // Start background cloud sync every 60 seconds
    _cloudSyncTimer = Timer.periodic(const Duration(seconds: 60), (_) => _syncToCloud());
  }

  @override
  void dispose() {
    _cloudSyncTimer?.cancel();
    super.dispose();
  }

  Future<void> _syncToCloud() async {
    if (_hudData != null && mounted) {
      await FirestoreService.saveUserData({
        'gold': _hudData!['gold'] ?? 0,
        'tasks': _hudData!['tasks'] ?? {},
        'era_id': widget.era.id,
        'era_name': widget.era.name,
      });
    }
  }

  Future<void> _initGame() async {
    final prefs = await SharedPreferences.getInstance();
    _language = prefs.getString('selected_language') ?? 'en';
    if (!mounted) return;

    // Load cloud save data and inject into localPlayerData via JS
    final cloudData = await FirestoreService.loadUserData();
    if (cloudData != null) {
      JsBridge.callJs('restorePlayerData', cloudData);
    }

    // Boot the game now that we bypassed EraSelectionScreen
    WidgetsBinding.instance.addPostFrameCallback((_) {
      JsBridge.callInitGameGrid(
        widget.era.id,
        widget.era.name,
        widget.era.bonus,
        0.0,
        0.0,
        _language,
      );
    });
  }

  String _translate(String key) {
    if (_language == 'si') {
      switch (key) {
        case 'Construct Building': return 'ගොඩනැගිල්ලක් ඉදිකරන්න';
        case 'House': return 'නිවස';
        case 'Farm': return 'ගොවිපල';
        case 'Mine': return 'පතල';
        case 'Workers': return 'කම්කරු';
        case 'Temple': return 'පන්සල';
        case 'Lake': return 'වැව';
        case 'Boat': return 'බෝට්ටුව';
        case '❌ Not enough resources!': return '❌ ප්‍රමාණවත් සම්පත් නැත!';
        case 'Menu': return 'මෙනුව';
        case 'Settings': return 'සැකසුම්';
        case 'Army': return 'හමුදාව';
        case 'Build': return 'ඉදිකරන්න';
        case 'Gold': return 'රත්‍රන්';
        case 'Wood': return 'දැව';
        case 'Gems': return 'මැණික්';
        case 'Food': return 'ආහාර';
        case 'Hut': return 'පැල';
        case 'Fish': return 'මාළු';
        case 'Save & Exit': return 'සුරැකීම සහ පිටවීම';
        case 'Do you want to save your progress to the cloud before exiting?': return 'පිටවීමට පෙර ඔබගේ ප්‍රගතිය ක්ලවුඩ් වෙත සුරැකීමට අවශ්‍යද?';
        case 'Cancel': return 'අවලංගු කරන්න';
        case 'Exit Game': return 'පිටවීම';
      }
    }
    return key;
  }

  void _onJsEvent(Map<String, dynamic> data) {
    if (!mounted) return;
    final type = data['type'];
    if (type == 'hud_update') {
      setState(() {
        _hudData = data;
      });
      // Cloud sync is now handled by _cloudSyncTimer in the background to save costs.
    } else if (type == 'version_mismatch') {
      Navigator.of(context).push(
        MaterialPageRoute(
          fullscreenDialog: true,
          builder: (_) => UpdateScreen(
            storedVersion: (data['storedVersion'] ?? 'none').toString(),
            expectedVersion: (data['expectedVersion'] ?? 'unknown').toString(),
          ),
        ),
      );
    }
  }

  Future<void> _showExitDialog() async {
    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2C3E50),
        title: Text(
          _translate('Save & Exit'),
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Text(
          _translate('Do you want to save your progress to the cloud before exiting?'),
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(_translate('Cancel'), style: const TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD4A017)),
            onPressed: () async {
              final nav = Navigator.of(context);
              if (_hudData != null) {
                await FirestoreService.saveUserData({
                  'gold': _hudData!['gold'] ?? 0,
                  'tasks': _hudData!['tasks'] ?? {},
                  'era_id': widget.era.id,
                  'era_name': widget.era.name,
                });
              }
              await FirebaseAuth.instance.signOut();
              nav.pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: Text(_translate('Save & Exit'), style: const TextStyle(color: Colors.black87)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF689F38), // Matches the grass mesh
      body: Stack(
        children: [
          // BASE LAYER: The Phaser Game
          const Positioned.fill(
            child: GameViewWidget(),
          ),

          // TOP LAYER: The Game Dashboard (HUD)
          Positioned.fill(
            child: _buildDashboard(),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboard() {
    return SafeArea(
      child: Column(
        children: [
          // Top HUD Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPlayerProfile(),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerRight,
                        child: _buildResourceBar(),
                      ),
                      const SizedBox(height: 8),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerRight,
                        child: _buildTaskBar(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
          // Bottom HUD Row (Controls/Menu)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildCircularButton(Icons.logout, _translate('Exit Game'), () {
                  _showExitDialog();
                }),
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerRight,
                    child: Row(
                      children: [
                        _buildCircularButton(Icons.settings, _translate('Settings'), () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Settings coming soon!')),
                          );
                        }),
                        const SizedBox(width: 12),
                        _buildActionButton(_translate('Train'), Icons.shield, Colors.redAccent, () {
                          _showSenaKanda();
                        }),
                        const SizedBox(width: 12),
                        _buildActionButton(_translate('Build'), Icons.account_balance, Colors.blueAccent, () {
                          _showBuildMenu();
                        }),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showSenaKanda() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return SenaKandaScreen(translate: _translate);
      },
    );
  }

  void _showBuildMenu() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.9),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              border: Border.all(color: const Color(0xFFD4A017).withValues(alpha: 0.5), width: 2),
            ),
            padding: const EdgeInsets.all(16),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
              Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white38, borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 16),
              Text(_translate('Construct Building'), style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 12,
                runSpacing: 12,
                children: [
                  _buildMenuCard(_translate('House'), 'house', Icons.home, 50, 5, 0),
                  _buildMenuCard(_translate('Farm'), 'farm', Icons.agriculture, 100, 10, 0),
                  _buildMenuCard(_translate('Mine'), 'mine', Icons.construction, 150, 5, 5),
                  _buildMenuCard(_translate('Workers'), 'workers_hut', Icons.people, 80, 10, 0),
                  _buildMenuCard(_translate('Temple'), 'temple', Icons.account_balance, 300, 20, 5),
                  _buildMenuCard(_translate('Lake'), 'lake', Icons.water, 50, 5, 0),
                  _buildMenuCard(_translate('Boat'), 'boat_house', Icons.sailing, 120, 15, 0),
                  _buildMenuCard(_translate('Fence'), 'fence', Icons.fence, 0, 2, 0),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        )));
      },
    );
  }

  Widget _buildMenuCard(String label, String type, IconData icon, int goldCost, int woodCost, int gemCost) {
    return GestureDetector(
      onTap: () {
        // Check costs
        final currentGold = _hudData?['gold'] ?? 0;
        final currentWood = _hudData?['tasks']?['wood'] ?? 0;
        final currentGem = _hudData?['tasks']?['gem'] ?? 0;

        if (currentGold < goldCost || currentWood < woodCost || currentGem < gemCost) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_translate('❌ Not enough resources!')),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
              margin: const EdgeInsets.only(bottom: 80, left: 16, right: 16),
            ),
          );
          return;
        }

        Navigator.pop(context); // Close menu
        JsBridge.enterBuildMode(type); // Start CoC placement mode
      },
      child: Container(
        width: 100,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 36),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (goldCost > 0) Row(mainAxisAlignment: MainAxisAlignment.center, children: [const Text('🪙 ', style: TextStyle(fontSize: 10)), Text('$goldCost', style: const TextStyle(color: Colors.white, fontSize: 12))]),
            if (woodCost > 0) Row(mainAxisAlignment: MainAxisAlignment.center, children: [const Text('🪵 ', style: TextStyle(fontSize: 10)), Text('$woodCost', style: const TextStyle(color: Colors.white, fontSize: 12))]),
            if (gemCost > 0) Row(mainAxisAlignment: MainAxisAlignment.center, children: [const Text('💎 ', style: TextStyle(fontSize: 10)), Text('$gemCost', style: const TextStyle(color: Colors.white, fontSize: 12))]),
          ],
        ),
      ),
    );
  }

  String _getAvatarAsset() {
    if (widget.era.id == 'prehistoric') return 'assets/images/avatar_prehistoric.png';
    if (widget.era.id == 'anuradhapura') return 'assets/images/avatar_anuradhapura.png';
    return 'assets/images/avatar_temp.png'; // Fallback for other eras
  }

  Widget _buildPlayerProfile() {
    final tasks = _hudData?['tasks'] ?? {};
    final config = _hudData?['config'] ?? {};

    // Calculate total progress across all tasks
    double totalProgress = 0.0;
    int taskCount = 0;
    const taskKeys = ['house', 'workers_hut', 'temple', 'boat_house', 'lake', 'fish', 'fence'];
    for (final key in taskKeys) {
      final current = (tasks[key] ?? 0) as num;
      final required = (config[key]?['req'] ?? 1) as num;
      totalProgress += (current / required).clamp(0.0, 1.0);
      taskCount++;
    }
    final overallProgress = taskCount > 0 ? totalProgress / taskCount : 0.0;
    final progressPercent = (overallProgress * 100).toInt();

    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: const Color(0xFFD4A017).withValues(alpha: 0.5), width: 1.5),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.4), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      padding: const EdgeInsets.only(right: 16, top: 4, bottom: 4, left: 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFD4A017), width: 2),
              image: DecorationImage(
                image: AssetImage(_getAvatarAsset()),
                fit: BoxFit.cover,
              ),
              boxShadow: [
                BoxShadow(color: const Color(0xFFD4A017).withValues(alpha: 0.5), blurRadius: 8),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Info
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                FirebaseAuth.instance.currentUser?.displayName ?? widget.era.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  shadows: [Shadow(color: Colors.black, blurRadius: 4)],
                ),
              ),
              Text(
                widget.era.name,
                style: const TextStyle(
                  color: Color(0xFFD4A017),
                  fontSize: 11,
                  shadows: [Shadow(color: Colors.black, blurRadius: 3)],
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD4A017),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      progressPercent >= 100 ? 'MAX' : 'Lv. ${progressPercent ~/ 10}',
                      style: const TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 6),
                  if (progressPercent >= 100)
                    InkWell(
                      onTap: () {
                        // Action for next era
                      },
                      child: const Text(
                        'NEXT ERA \u2192',
                        style: TextStyle(
                          color: Color(0xFF00FF00),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          shadows: [Shadow(color: Colors.black, blurRadius: 2)],
                        ),
                      ),
                    )
                  else
                    Container(
                      width: 60,
                      height: 6,
                      decoration: BoxDecoration(
                        color: Colors.black45,
                        borderRadius: BorderRadius.circular(3),
                        border: Border.all(color: Colors.black, width: 1),
                      ),
                      child: FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: overallProgress.clamp(0.0, 1.0),
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFADFF2F), // Green yellow like the provided image
                            borderRadius: BorderRadius.circular(2),
                            boxShadow: const [
                              BoxShadow(color: Color(0xFFADFF2F), blurRadius: 4),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResourceBar() {
    // Fallback to 0 if HUD data is not yet received
    final tasks = _hudData?['tasks'] ?? {};
    final config = _hudData?['config'] ?? {};

    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildResourceItem('🪙', _translate('Gold'), _hudData?['gold'] ?? 500),
          _buildDivider(),
          _buildResourceTaskItem('🪵', _translate('Wood'), 'wood', tasks, config),
          _buildDivider(),
          _buildResourceTaskItem('💎', _translate('Gems'), 'gem', tasks, config),
          _buildDivider(),
          _buildResourceTaskItem('🏹', _translate('Food'), 'hunting', tasks, config),
        ],
      ),
    );
  }


  Widget _buildTaskBar() {
    final tasks = _hudData?['tasks'] ?? {};
    final config = _hudData?['config'] ?? {};
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFD4A017).withValues(alpha: 0.5), width: 1),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildResourceTaskItem('🏠', _translate('House'), 'house', tasks, config),
          _buildDivider(),
          _buildResourceTaskItem('🛖', _translate('Hut'), 'workers_hut', tasks, config),
          _buildDivider(),
          _buildResourceTaskItem('🏛️', _translate('Temple'), 'temple', tasks, config),
          _buildDivider(),
          _buildResourceTaskItem('💧', _translate('Lake'), 'lake', tasks, config),
          _buildDivider(),
          _buildResourceTaskItem('🛶', _translate('Boat'), 'boat_house', tasks, config),
          _buildDivider(),
          _buildResourceTaskItem('🐟', _translate('Fish'), 'fish', tasks, config),
          _buildDivider(),
          _buildResourceTaskItem('🚧', _translate('Fence'), 'fence', tasks, config),
        ],
      ),
    );
  }

  Widget _buildResourceItem(String icon, String name, int amount) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 6),
          Text(
            amount.toString(),
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildResourceTaskItem(String icon, String name, String key, Map tasks, Map config) {
    final current = tasks[key] ?? 0;
    final target = config[key]?['req'] ?? '?';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 6),
          Text(
            '$current/$target',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      width: 1,
      height: 20,
      color: Colors.white.withValues(alpha: 0.2),
    );
  }

  Widget _buildCircularButton(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.black.withValues(alpha: 0.7),
              border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 10, shadows: [Shadow(blurRadius: 2)])),
        ],
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color, color.withValues(alpha: 0.7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
          boxShadow: [
            BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
