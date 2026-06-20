import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/historical_era.dart';
import 'kingdom_view_screen.dart';

class LanguageSelectionScreen extends StatefulWidget {
  const LanguageSelectionScreen({super.key});

  @override
  State<LanguageSelectionScreen> createState() => _LanguageSelectionScreenState();
}

class _LanguageSelectionScreenState extends State<LanguageSelectionScreen> {
  Future<void> _selectLanguage(String langCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_language', langCode);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => KingdomViewScreen(era: historicalEras.first)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E17),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Rajadhaniya',
              style: TextStyle(
                color: Color(0xFFD4A017),
                fontSize: 32,
                fontWeight: FontWeight.bold,
                shadows: [Shadow(color: Colors.black, blurRadius: 10)],
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Select Language / භාෂාව තෝරන්න',
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 40),
            _buildLangButton('English', 'en'),
            const SizedBox(height: 20),
            _buildLangButton('සිංහල', 'si'),
          ],
        ),
      ),
    );
  }

  Widget _buildLangButton(String title, String code) {
    return InkWell(
      onTap: () => _selectLanguage(code),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 200,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E2A38),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFD4A017).withValues(alpha: 0.5), width: 2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFD4A017).withValues(alpha: 0.1),
              blurRadius: 8,
              spreadRadius: 2,
            )
          ],
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
