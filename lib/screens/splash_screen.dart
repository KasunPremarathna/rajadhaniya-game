import 'package:flutter/material.dart';
import 'language_selection_screen.dart';
import 'kingdom_view_screen.dart';
import '../models/historical_era.dart';

class SplashScreen extends StatefulWidget {
  final String? initialLanguage;
  const SplashScreen({super.key, this.initialLanguage});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => widget.initialLanguage == null
                ? const LanguageSelectionScreen()
                : KingdomViewScreen(era: historicalEras.first),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1512),
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            'assets/images/loadingscreen.png',
            fit: BoxFit.cover,
          ),
          // Dark Overlay
          Container(color: Colors.black38),
          Positioned(
            bottom: MediaQuery.of(context).size.height * 0.22,
            left: 0,
            right: 0,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 360,
                  height: 22,
                  padding: const EdgeInsets.all(2), // For inner fill spacing
                  decoration: BoxDecoration(
                    color: const Color(0xFF2C2520),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: const Color(0xFFFFB300).withValues(alpha: 0.9),
                      width: 2,
                    ),
                  ),
                  alignment: Alignment.centerLeft,
                  child: TweenAnimationBuilder<double>(
                    tween: Tween<double>(begin: 0, end: 1),
                    duration: const Duration(seconds: 3),
                    builder: (context, value, child) {
                      return FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: value,
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFD4AF37),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 18),
                TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0, end: 1),
                  duration: const Duration(seconds: 3),
                  builder: (context, value, child) {
                    final percent = (value * 100).round();
                    return Text(
                      'සම්පත් බාගත වෙමින් පවතින්නේ... $percent%',
                      style: const TextStyle(
                        fontFamily: 'Noto Sans',
                        color: Color(0xFFFFD700),
                        fontSize: 14,
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
