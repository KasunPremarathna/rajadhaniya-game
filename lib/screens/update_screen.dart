import 'dart:async';
import 'package:flutter/material.dart';
import '../bridge/js_bridge.dart';

class UpdateScreen extends StatefulWidget {
  final String storedVersion;
  final String expectedVersion;

  const UpdateScreen({
    super.key,
    required this.storedVersion,
    required this.expectedVersion,
  });

  @override
  State<UpdateScreen> createState() => _UpdateScreenState();
}

class _UpdateScreenState extends State<UpdateScreen>
    with SingleTickerProviderStateMixin {
  double _progress = 0.0;
  String _statusText = 'Checking for updates...';
  bool _downloadDone = false;
  Timer? _timer;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulseAnim = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Short delay before starting the animated progress
    Future.delayed(const Duration(milliseconds: 600), _startDownload);
  }

  void _startDownload() {
    setState(() => _statusText = 'Downloading update...');

    // Animate progress from 0 to ~90% over ~2.5 seconds
    const totalMs = 2500;
    const intervalMs = 50;
    final steps = totalMs ~/ intervalMs;
    int step = 0;

    _timer = Timer.periodic(const Duration(milliseconds: intervalMs), (t) {
      step++;
      final p = step / steps;
      if (!mounted) { t.cancel(); return; }
      setState(() {
        _progress = p.clamp(0.0, 0.92);
        if (p > 0.3) _statusText = 'Downloading update... ${(_progress * 100).toInt()}%';
        if (p > 0.7) _statusText = 'Installing assets...';
        if (p > 0.85) _statusText = 'Finishing up...';
      });

      if (step >= steps) {
        t.cancel();
        _finishDownload();
      }
    });
  }

  void _finishDownload() {
    setState(() {
      _progress = 1.0;
      _statusText = 'Update complete! Launching...';
      _downloadDone = true;
    });

    // Trigger actual Phaser asset update then close
    JsBridge.forceAssetUpdate();

    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) Navigator.of(context).pop();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      body: Stack(
        children: [
          // Background grid pattern
          CustomPaint(
            painter: _GridPainter(),
            size: Size.infinite,
          ),
          // Glowing center radial
          Center(
            child: AnimatedBuilder(
              animation: _pulseAnim,
              builder: (_, _) => Container(
                width: 500,
                height: 500,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFD4A017).withValues(alpha: 0.08 * _pulseAnim.value),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),
          // Main content
          Center(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Container(
                width: 480,
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 48),
              decoration: BoxDecoration(
                color: const Color(0xFF161B22).withValues(alpha: 0.95),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: const Color(0xFFD4A017).withValues(alpha: 0.5),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFD4A017).withValues(alpha: 0.15),
                    blurRadius: 60,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Icon
                  AnimatedBuilder(
                    animation: _pulseAnim,
                    builder: (_, _) => Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF1C2A14),
                        border: Border.all(
                          color: _downloadDone
                              ? Colors.greenAccent
                              : const Color(0xFFD4A017).withValues(alpha: _pulseAnim.value),
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: (_downloadDone ? Colors.greenAccent : const Color(0xFFD4A017))
                                .withValues(alpha: 0.3 * _pulseAnim.value),
                            blurRadius: 20,
                          ),
                        ],
                      ),
                      child: Icon(
                        _downloadDone ? Icons.check_circle_outline : Icons.system_update_alt,
                        color: _downloadDone ? Colors.greenAccent : const Color(0xFFD4A017),
                        size: 36,
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Title
                  const Text(
                    'RAJADHANIYA',
                    style: TextStyle(
                      color: Color(0xFFD4A017),
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 4,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _downloadDone ? 'Update Successful' : 'Update Available',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Version info
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _VersionChip(label: widget.storedVersion, isOld: true),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10),
                        child: Icon(Icons.arrow_forward, color: Color(0xFFD4A017), size: 16),
                      ),
                      _VersionChip(label: widget.expectedVersion, isOld: false),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // Progress bar
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _statusText,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            '${(_progress * 100).toInt()}%',
                            style: const TextStyle(
                              color: Color(0xFFD4A017),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      // Track
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Stack(
                          children: [
                            Container(
                              height: 12,
                              width: double.infinity,
                              color: Colors.white.withValues(alpha: 0.07),
                            ),
                            AnimatedFractionallySizedBox(
                              duration: const Duration(milliseconds: 100),
                              widthFactor: _progress.clamp(0.0, 1.0),
                              child: Container(
                                height: 12,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: _downloadDone
                                        ? [Colors.green.shade600, Colors.greenAccent]
                                        : [const Color(0xFF8B6914), const Color(0xFFD4A017), const Color(0xFFFFF176)],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFFD4A017).withValues(alpha: 0.6),
                                      blurRadius: 8,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Hint text
                  if (!_downloadDone)
                    Text(
                      'Please wait while we update the game assets.\nDo not close this window.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.35),
                        fontSize: 11,
                        height: 1.6,
                      ),
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

class _VersionChip extends StatelessWidget {
  final String label;
  final bool isOld;
  const _VersionChip({required this.label, required this.isOld});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isOld
            ? Colors.redAccent.withValues(alpha: 0.15)
            : Colors.greenAccent.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isOld ? Colors.redAccent.withValues(alpha: 0.5) : Colors.greenAccent.withValues(alpha: 0.5),
        ),
      ),
      child: Text(
        label.isEmpty ? 'none' : label,
        style: TextStyle(
          color: isOld ? Colors.redAccent : Colors.greenAccent,
          fontSize: 12,
          fontFamily: 'monospace',
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFD4A017).withValues(alpha: 0.04)
      ..strokeWidth = 1;
    const spacing = 40.0;
    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_GridPainter old) => false;
}
