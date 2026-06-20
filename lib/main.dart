import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/kingdom_view_screen.dart';
import 'screens/era_selection_screen.dart';
import 'screens/language_selection_screen.dart';
import 'screens/update_screen.dart';
import 'screens/no_internet_screen.dart';

import 'bridge/platform_view_registry.dart';
import 'bridge/js_bridge.dart';
import 'models/historical_era.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'firebase_options.dart';
import 'screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  registerPhaserView();
  final prefs = await SharedPreferences.getInstance();
  final initialLang = prefs.getString('selected_language');
  runApp(RajadhaniyaApp(initialLanguage: initialLang));
}

class RajadhaniyaApp extends StatefulWidget {
  final String? initialLanguage;
  const RajadhaniyaApp({super.key, this.initialLanguage});

  @override
  State<RajadhaniyaApp> createState() => _RajadhaniyaAppState();
}

class _RajadhaniyaAppState extends State<RajadhaniyaApp> {
  final _navigatorKey = GlobalKey<NavigatorState>();

  bool _isOffline = false;

  @override
  void initState() {
    super.initState();
    JsBridge.registerFlutterCallback(_onJsEvent);
  }

  void _onJsEvent(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    debugPrint('[JS Bridge] Event: $data');

    if (type == 'network_status') {
      final isOnline = data['isOnline'] as bool? ?? true;
      if (_isOffline == isOnline) {
        setState(() {
          _isOffline = !isOnline;
        });
      }
    } else if (type == 'version_mismatch') {
      EraSelectionScreen.onVersionMismatch?.call();
      final ctx = _navigatorKey.currentContext;
      if (ctx != null) {
        Navigator.of(ctx).push(
          MaterialPageRoute(
            fullscreenDialog: true,
            builder: (_) => UpdateScreen(
              storedVersion: (data['storedVersion'] ?? 'none').toString(),
              expectedVersion: (data['expectedVersion'] ?? 'unknown').toString(),
            ),
          ),
        );
      }
    } else if (type == 'game_started') {
      EraSelectionScreen.onGameStarted?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rajadhaniya',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF5D4037),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      builder: (context, child) {
        return Stack(
          children: [
            ?child,
            if (_isOffline)
              const Positioned.fill(
                child: Directionality(
                  textDirection: TextDirection.ltr,
                  child: Material(
                    child: NoInternetScreen(),
                  ),
                ),
              ),
          ],
        );
      },
      home: _LandscapeWrapper(
        child: FirebaseAuth.instance.currentUser == null
            ? const LoginScreen()
            : (widget.initialLanguage == null
                ? const LanguageSelectionScreen()
                : KingdomViewScreen(era: historicalEras.first)),
      ),
      navigatorKey: _navigatorKey,
    );
  }
}

class _LandscapeWrapper extends StatelessWidget {
  final Widget child;

  const _LandscapeWrapper({required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < constraints.maxHeight) {
          return const Scaffold(
            backgroundColor: Color(0xFF1E2A38),
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.screen_rotation, color: Color(0xFFD4A017), size: 64),
                  SizedBox(height: 24),
                  Text(
                    'Please rotate your device\nto landscape mode',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 12),
                  Text(
                    'Rajadhaniya requires a wide screen to play.',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }
        
        // Fully responsive full-screen landscape!
        return child;
      },
    );
  }
}
