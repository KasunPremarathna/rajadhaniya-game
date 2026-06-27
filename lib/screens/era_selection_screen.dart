import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/historical_era.dart';
import '../bridge/js_bridge.dart';
import 'kingdom_view_screen.dart';
import 'language_selection_screen.dart';
import '../config/game_config.dart';

class EraSelectionScreen extends StatefulWidget {
  const EraSelectionScreen({super.key});

  static VoidCallback? onGameStarted;
  static VoidCallback? onVersionMismatch;
  static void Function(Map<String, dynamic>)? onShowUpdateDialog;

  @override
  State<EraSelectionScreen> createState() => _EraSelectionScreenState();
}

class _EraSelectionScreenState extends State<EraSelectionScreen> {
  bool _entering = false;
  HistoricalEra? _selectedEra;
  String _language = 'en';

  @override
  void initState() {
    super.initState();
    EraSelectionScreen.onGameStarted = _leaveToGame;
    EraSelectionScreen.onVersionMismatch = _resetEntering;
    EraSelectionScreen.onShowUpdateDialog = _showDialog;
    _loadLanguage();

    // Immediately check for asset version mismatch upon app load
    // so the user sees the update dialog before tapping an era.
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        JsBridge.checkAssetVersion();
      }
    });
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _language = prefs.getString('selected_language') ?? 'en';
      });
    }
  }

  @override
  void dispose() {
    if (EraSelectionScreen.onGameStarted == _leaveToGame) EraSelectionScreen.onGameStarted = null;
    if (EraSelectionScreen.onVersionMismatch == _resetEntering) EraSelectionScreen.onVersionMismatch = null;
    if (EraSelectionScreen.onShowUpdateDialog == _showDialog) EraSelectionScreen.onShowUpdateDialog = null;
    super.dispose();
  }

  void _leaveToGame() {
    if (!mounted || _selectedEra == null) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => KingdomViewScreen(era: _selectedEra!)),
    );
  }

  void _resetEntering() {
    if (!mounted) return;
    setState(() { _entering = false; });
  }

  void _showDialog(Map<String, dynamic> data) {
    if (!mounted) return;
    _resetEntering();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E2A38),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFD4A017), width: 2),
        ),
        title: const Row(children: [
          Icon(Icons.shield, color: Color(0xFFD4A017), size: 28),
          SizedBox(width: 12),
          Expanded(child: Text('නව යාවත්කාලීන කිරීමක් ඇත!',
            style: TextStyle(color: Color(0xFFD4A017), fontSize: 18, fontWeight: FontWeight.bold))),
        ]),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Game assets have been updated. Please update to continue.',
            style: TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(8)),
            child: Row(children: [
              Text('Current: ', style: TextStyle(color: Colors.grey[500], fontSize: 12)),
              Text('${data['storedVersion'] ?? 'none'}',
                style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontFamily: 'monospace')),
              const SizedBox(width: 16),
              Text('Required: ', style: TextStyle(color: Colors.grey[500], fontSize: 12)),
              Text('${data['expectedVersion'] ?? 'unknown'}',
                style: const TextStyle(color: Colors.greenAccent, fontSize: 12, fontFamily: 'monospace')),
            ]),
          ),
        ]),
        actions: [SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: () { Navigator.of(ctx).pop(); JsBridge.forceAssetUpdate(); },
            icon: const Icon(Icons.download),
            label: const Text('Update & Continue'),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFD4A017), foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        )],
      ),
    );
  }

  void _onEraTap(HistoricalEra era) {
    if (_entering) return;
    setState(() {
      _entering = true;
      _selectedEra = era;
    });
    JsBridge.callInitGameGrid(era.id, era.name, era.bonus, 0.0, 0.0, _language, GameConfig.instance.toJsonString());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rajadhaniya'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Image.network(
              'https://cdn-icons-png.flaticon.com/512/3524/3524636.png',
              width: 24,
              height: 24,
              color: Theme.of(context).colorScheme.primary,
              errorBuilder: (context, error, stackTrace) => const Icon(Icons.settings),
            ),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const LanguageSelectionScreen()),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: GridView.count(
              crossAxisCount: 3,
              childAspectRatio: 1.0,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              children: historicalEras.map((era) {
                return _EraCard(
                  era: era,
                  onTap: () => _onEraTap(era),
                );
              }).toList(),
            ),
          ),
          if (_entering)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.8),
                child: const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: Color(0xFFD4A017)),
                      SizedBox(height: 20),
                      Text(
                        'Building Your Kingdom...',
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
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
}

class _EraCard extends StatelessWidget {
  final HistoricalEra era;
  final VoidCallback onTap;

  const _EraCard({required this.era, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    width: 24, height: 24,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Center(child: Text(era.icon, style: const TextStyle(fontSize: 14))),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      era.englishName,
                      style: theme.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.bold, fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 3),
              Text(
                era.name,
                style: theme.textTheme.bodySmall?.copyWith(fontSize: 10, color: theme.colorScheme.onSurfaceVariant),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 1),
              Row(
                children: [
                  Icon(Icons.schedule, size: 9, color: theme.colorScheme.primary),
                  const SizedBox(width: 2),
                  Flexible(
                    child: Text(era.period, style: theme.textTheme.labelSmall?.copyWith(fontSize: 9, color: theme.colorScheme.primary), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
              Row(
                children: [
                  Icon(Icons.auto_awesome, size: 9, color: Colors.amber[700]),
                  const SizedBox(width: 2),
                  Flexible(
                    child: Text(era.bonus, style: theme.textTheme.labelSmall?.copyWith(fontSize: 9, color: Colors.amber[800], fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
