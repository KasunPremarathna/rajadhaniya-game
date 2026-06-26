import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';


void main() {
  runApp(const QuizCreatorApp());
}

class QuizCreatorApp extends StatelessWidget {
  const QuizCreatorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Quiz Image Creator',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF1B263B),
        scaffoldBackgroundColor: const Color(0xFF0D1B2A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFFB347),
          secondary: Color(0xFF4A90D9),
        ),
        useMaterial3: true,
      ),
      home: const QuizEditorScreen(),
    );
  }
}

class ArcTextPainter extends CustomPainter {
  final String text;
  final double radius;
  final double startAngle;
  final double endAngle;
  final TextStyle textStyle;

  ArcTextPainter({
    required this.text,
    required this.radius,
    this.startAngle = -3.0,
    this.endAngle = 0.0,
    required this.textStyle,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (text.isEmpty) return;
    final center = Offset(size.width / 2, size.height / 2);
    final totalAngle = endAngle - startAngle;
    final charCount = text.length;
    final charAngle = totalAngle / (charCount.clamp(1, charCount));

    for (int i = 0; i < charCount; i++) {
      final angle = startAngle + charAngle * i;
      final char = text[i];
      final tp = TextPainter(
        text: TextSpan(text: char, style: textStyle),
        textDirection: TextDirection.ltr,
      );
      tp.layout();
      canvas.save();
      canvas.translate(
        center.dx + radius * cos(angle),
        center.dy + radius * sin(angle),
      );
      canvas.rotate(angle + 1.5708);
      tp.paint(canvas, Offset(-tp.width / 2, -tp.height / 2));
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant ArcTextPainter old) =>
      old.text != text || old.radius != radius || old.textStyle != textStyle;
}

class CogPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final maxR = size.shortestSide / 2;

    final line = Paint()
      ..color = Colors.white.withValues(alpha: 0.07)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (double r = maxR / 5; r <= maxR; r += maxR / 5) {
      canvas.drawCircle(c, r, line);
    }

    for (int i = 0; i < 48; i++) {
      final a = (i * 6.2832) / 48;
      canvas.drawLine(
        Offset(c.dx + (maxR * 0.82) * cos(a), c.dy + (maxR * 0.82) * sin(a)),
        Offset(c.dx + maxR * cos(a), c.dy + maxR * sin(a)),
        line,
      );
    }

    final gear = Paint()
      ..color = Colors.white.withValues(alpha: 0.04)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    final path = Path();
    final teeth = 16;
    final ir = maxR * 0.28;
    final or = maxR * 0.36;
    for (int i = 0; i < teeth; i++) {
      final a1 = (i * 6.2832) / teeth;
      final a2 = ((i + 0.5) * 6.2832) / teeth;
      final a3 = ((i + 1) * 6.2832) / teeth;
      if (i == 0) path.moveTo(c.dx + or * cos(a1), c.dy + or * sin(a1));
      path.lineTo(c.dx + ir * cos(a2), c.dy + ir * sin(a2));
      path.lineTo(c.dx + or * cos(a3), c.dy + or * sin(a3));
    }
    path.close();
    canvas.drawPath(path, gear);
  }

  @override
  bool shouldRepaint(covariant CogPatternPainter old) => false;
}

class QuizEditorScreen extends StatefulWidget {
  const QuizEditorScreen({super.key});

  @override
  State<QuizEditorScreen> createState() => _QuizEditorScreenState();
}

class _QuizEditorScreenState extends State<QuizEditorScreen> {
  final GlobalKey _repaintKey = GlobalKey();

  double _canvasW = 800;
  double _canvasH = 800;
  String _sizeLabel = 'FB Post (1:1)';
  final List<Map<String, dynamic>> _presets = [
    {'label': 'FB Post (1:1)', 'w': 800.0, 'h': 800.0},
    {'label': 'Insta Story (9:16)', 'w': 450.0, 'h': 800.0},
    {'label': 'Square (1:1)', 'w': 800.0, 'h': 800.0},
    {'label': 'Twitter Post (16:9)', 'w': 800.0, 'h': 450.0},
  ];

  Offset _logoPos = const Offset(300, 30);
  Offset _questionPos = const Offset(40, 200);
  Offset _answersPos = const Offset(40, 320);
  Offset _bottomPos = const Offset(40, 620);

  double _logoSize = 100.0;
  double _questionWidth = 0.0;
  double _answerBlockWidth = 0.0;

  String _questionText = 'ලංකාවේ විශාලතම දිස්ත්‍රික්කය කුමක්ද?';
  List<String> _answers = [
    'අනුරාධපුරය',
    'පොළොන්නරුව',
    'කුරුණෑගල',
    'මහනුවර',
  ];

  String _logoTitle = 'Railway';
  String _logoSubtitle = 'රේල්වේ';
  String _bottomText = 'COMMENT YOUR ANSWER';

  Uint8List? _bgImageBytes;
  Uint8List? _logoImageBytes;

  final ImagePicker _picker = ImagePicker();
  bool _isExporting = false;

  bool _showBorders = true;

  @override
  void initState() {
    super.initState();
    _updateDerivedSizes();
  }

  void _updateDerivedSizes() {
    setState(() {
      _questionWidth = _canvasW - 80;
      _answerBlockWidth = _canvasW - 80;
    });
  }

  void _setSize(double w, double h, String label) {
    setState(() {
      _canvasW = w;
      _canvasH = h;
      _sizeLabel = label;
      _updateDerivedSizes();
      _logoPos = Offset(w / 2 - 50, 30);
      _questionPos = Offset(40, h * 0.28);
      _answersPos = Offset(40, h * 0.42);
      _bottomPos = Offset(40, h * 0.82);
    });
  }

  Future<void> _pickBackground() async {
    try {
      final XFile? img = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 2048);
      if (img != null) {
        final bytes = await img.readAsBytes();
        setState(() => _bgImageBytes = bytes);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _pickLogo() async {
    try {
      final XFile? img = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 1024);
      if (img != null) {
        final bytes = await img.readAsBytes();
        setState(() => _logoImageBytes = bytes);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _editQuestion() {
    final c = TextEditingController(text: _questionText);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B263B),
        title: const Text('Edit Question'),
        content: TextField(
          controller: c,
          maxLines: 3,
          style: const TextStyle(fontSize: 16, color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Enter question in Sinhala/English',
            hintStyle: TextStyle(color: Colors.grey),
            filled: true,
            fillColor: Color(0xFF0D1B2A),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              setState(() => _questionText = c.text);
              Navigator.pop(ctx);
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
    c.dispose();
  }

  void _editAnswers() {
    final controllers = _answers.map((a) => TextEditingController(text: a)).toList();
    final letters = ['A', 'B', 'C', 'D'];
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B263B),
        title: const Text('Edit Answers'),
        content: SizedBox(
          width: 300,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: 4,
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: TextField(
                controller: controllers[i],
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Answer ${letters[i]}',
                  labelStyle: const TextStyle(color: Colors.amber),
                  filled: true,
                  fillColor: const Color(0xFF0D1B2A),
                ),
              ),
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              setState(() => _answers = controllers.map((c) => c.text).toList());
              Navigator.pop(ctx);
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
    for (final c in controllers) {
      c.dispose();
    }
  }

  void _editLogo() {
    final tc = TextEditingController(text: _logoTitle);
    final sc = TextEditingController(text: _logoSubtitle);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B263B),
        title: const Text('Edit Logo'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: tc,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Top Curved Text',
                labelStyle: TextStyle(color: Colors.amber),
                filled: true,
                fillColor: Color(0xFF0D1B2A),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: sc,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Bottom Sinhala Text',
                labelStyle: TextStyle(color: Colors.amber),
                filled: true,
                fillColor: Color(0xFF0D1B2A),
              ),
            ),
            const SizedBox(height: 15),
            ElevatedButton.icon(
              icon: const Icon(Icons.image, size: 18),
              label: const Text('Upload Logo Image'),
              onPressed: () async {
                await _pickLogo();
              },
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              setState(() {
                _logoTitle = tc.text;
                _logoSubtitle = sc.text;
              });
              Navigator.pop(ctx);
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
    tc.dispose();
    sc.dispose();
  }

  void _editBottomText() {
    final c = TextEditingController(text: _bottomText);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B263B),
        title: const Text('Edit Bottom Text'),
        content: TextField(
          controller: c,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            filled: true,
            fillColor: Color(0xFF0D1B2A),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              setState(() => _bottomText = c.text);
              Navigator.pop(ctx);
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
    c.dispose();
  }

  Future<void> _exportImage() async {
    setState(() => _isExporting = true);

    try {
      final boundary = _repaintKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Error: Canvas not ready')),
          );
        }
        return;
      }

      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Error: Failed to encode image')),
          );
        }
        return;
      }

      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/quiz_image_${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(byteData.buffer.asUint8List());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Saved: ${file.path}'),
            duration: const Duration(seconds: 4),
            action: SnackBarAction(
              label: 'OK',
              onPressed: () {},
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Widget _buildCanvas() {
    final double padding = _canvasW * 0.03;
    final double fontSize = _canvasW / 25;
    final double answerFontSize = _canvasW / 28;

    return RepaintBoundary(
      key: _repaintKey,
      child: Container(
        width: _canvasW,
        height: _canvasH,
        clipBehavior: Clip.hardEdge,
        decoration: BoxDecoration(
          color: const Color(0xFF0B132B),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Stack(
          children: [
            Positioned.fill(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(
                  children: [
                    Container(color: const Color(0xFF0B132B)),
                    if (_bgImageBytes != null)
                      Positioned.fill(
                        child: ColorFiltered(
                          colorFilter: ColorFilter.mode(
                            const Color(0xFF0B132B).withValues(alpha: 0.45),
                            BlendMode.srcOver,
                          ),
                          child: Image.memory(_bgImageBytes!, fit: BoxFit.cover),
                        ),
                      ),
                    Positioned.fill(
                      child: IgnorePointer(
                        child: CustomPaint(painter: CogPatternPainter()),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            _buildDraggableLogo(padding, fontSize),
            _buildDraggableQuestion(padding, fontSize),
            _buildDraggableAnswers(padding, answerFontSize),
            _buildDraggableBottom(padding, fontSize),
          ],
        ),
      ),
    );
  }

  Widget _buildDraggableLogo(double pad, double fs) {
    return Positioned(
      left: _logoPos.dx,
      top: _logoPos.dy,
      child: GestureDetector(
        onTap: _editLogo,
        onPanUpdate: (d) => setState(() => _logoPos += d.delta),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            _buildLogoContent(pad, fs),
            if (_showBorders)
              Positioned(
                right: -8,
                bottom: -8,
                child: GestureDetector(
                  onPanUpdate: (d) => setState(() => _logoSize = (_logoSize + d.delta.dx).clamp(60, 200)),
                  child: _resizeHandle(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoContent(double pad, double fs) {
    return Container(
      width: _logoSize,
      padding: EdgeInsets.all(pad * 0.5),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.amber.shade600, width: _showBorders ? 3 : 0),
        color: _showBorders ? Colors.black26 : Colors.transparent,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: _logoSize - 30,
            height: _logoSize * 0.35,
            child: _logoTitle.isNotEmpty
                ? CustomPaint(
                    painter: ArcTextPainter(
                      text: _logoTitle,
                      radius: _logoSize * 0.24,
                      startAngle: -2.6,
                      endAngle: 0.6,
                      textStyle: TextStyle(
                        fontSize: fs * 0.7,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  )
                : const SizedBox(),
          ),
          if (_logoImageBytes != null)
            ClipOval(
              child: Image.memory(_logoImageBytes!, width: _logoSize * 0.45, height: _logoSize * 0.45, fit: BoxFit.cover),
            )
          else
            Icon(Icons.directions_railway, size: _logoSize * 0.4, color: Colors.white),
          const SizedBox(height: 2),
          if (_logoSubtitle.isNotEmpty)
            Text(
              _logoSubtitle,
              style: TextStyle(
                fontSize: fs * 1.1,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
        ],
      ),
    );
  }

  Widget _resizeHandle() {
    return Container(
      width: 16,
      height: 16,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.amber, width: 2),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.48), blurRadius: 4)],
      ),
    );
  }

  Widget _buildDraggableQuestion(double pad, double fs) {
    final w = _questionWidth;
    return Positioned(
      left: _questionPos.dx,
      top: _questionPos.dy,
      child: GestureDetector(
        onTap: _editQuestion,
        onPanUpdate: (d) => setState(() => _questionPos += d.delta),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: w,
              constraints: BoxConstraints(minHeight: fs * 3),
              padding: EdgeInsets.symmetric(horizontal: pad, vertical: pad * 0.7),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3)),
                ],
                border: _showBorders ? Border.all(color: Colors.amber, width: 2) : null,
              ),
              child: Text(
                _questionText,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: fs * 1.4,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            if (_showBorders)
              Positioned(
                right: -8,
                bottom: -8,
                child: GestureDetector(
                  onPanUpdate: (d) => setState(() => _questionWidth = (_questionWidth + d.delta.dx).clamp(200, _canvasW - 20)),
                  child: _resizeHandle(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDraggableAnswers(double pad, double fs) {
    final w = _answerBlockWidth;
    final letters = ['A', 'B', 'C', 'D'];
    return Positioned(
      left: _answersPos.dx,
      top: _answersPos.dy,
      child: GestureDetector(
        onTap: _editAnswers,
        onPanUpdate: (d) => setState(() => _answersPos += d.delta),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            SizedBox(
              width: w,
              child: Column(
                children: List.generate(4, (i) {
                  final isLast = i == 3;
                  return Padding(
                    padding: EdgeInsets.only(bottom: isLast ? 0 : pad * 0.6),
                    child: Container(
                      height: fs * 2.8,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFE8E8E8), Color(0xFFD0D0D0)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFFB347), width: 2),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 4, offset: const Offset(0, 2)),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: fs * 2.5,
                            decoration: const BoxDecoration(
                              color: Color(0xFFB0B0B0),
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(10),
                                bottomLeft: Radius.circular(10),
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              letters[i],
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: fs * 1.3,
                                fontWeight: FontWeight.w900,
                                shadows: [
                                  Shadow(color: Colors.black38, blurRadius: 2, offset: const Offset(1, 1)),
                                ],
                              ),
                            ),
                          ),
                          Expanded(
                            child: Padding(
                              padding: EdgeInsets.symmetric(horizontal: pad * 0.7),
                              child: Text(
                                _answers[i],
                                style: TextStyle(
                                  color: Colors.black87,
                                  fontSize: fs * 1.1,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
            if (_showBorders)
              Positioned(
                right: -8,
                bottom: -8,
                child: GestureDetector(
                  onPanUpdate: (d) => setState(() => _answerBlockWidth = (_answerBlockWidth + d.delta.dx).clamp(200, _canvasW - 20)),
                  child: _resizeHandle(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDraggableBottom(double pad, double fs) {
    return Positioned(
      left: _bottomPos.dx,
      top: _bottomPos.dy,
      child: GestureDetector(
        onTap: _editBottomText,
        onPanUpdate: (d) => setState(() => _bottomPos += d.delta),
        child: Container(
          width: _canvasW - 80,
          padding: EdgeInsets.symmetric(vertical: pad * 0.5),
          decoration: BoxDecoration(
            border: _showBorders ? Border.all(color: Colors.purpleAccent, width: 1.5) : null,
          ),
          child: Column(
            children: [
              Text(
                _bottomText,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: fs * 0.9,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
              SizedBox(height: pad * 0.5),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _socialIcon(Icons.camera_alt, 'Instagram', () {}),
                  const SizedBox(width: 20),
                  _socialIcon(Icons.facebook, 'Facebook', () {}),
                  const SizedBox(width: 20),
                  _socialIcon(Icons.alternate_email, 'Twitter', () {}),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _socialIcon(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: Colors.white24,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 16, color: Colors.white70),
          ),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 7, color: Colors.white54)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenW = MediaQuery.of(context).size.width;
    final canvasDisplayW = (screenW - 40).clamp(200.0, 800.0);
    final scale = canvasDisplayW / _canvasW;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quiz Image Creator'),
        backgroundColor: const Color(0xFF1B263B),
        actions: [
          if (_isExporting)
            const Padding(
              padding: EdgeInsets.all(12),
              child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)),
            )
          else
            IconButton(
              icon: const Icon(Icons.download, color: Colors.greenAccent),
              tooltip: 'Export High-Res Image',
              onPressed: _exportImage,
            ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: const Color(0xFF1B263B),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ..._presets.map((p) {
                    final active = _sizeLabel == p['label'];
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(p['label'], style: const TextStyle(fontSize: 11)),
                        selected: active,
                        selectedColor: Colors.amber.shade700,
                        onSelected: (_) => _setSize(p['w'], p['h'], p['label']),
                      ),
                    );
                  }),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: Icon(Icons.border_all, color: _showBorders ? Colors.amber : Colors.grey, size: 20),
                    tooltip: 'Toggle element borders',
                    onPressed: () => setState(() => _showBorders = !_showBorders),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Center(
              child: SingleChildScrollView(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Transform.scale(
                      scale: scale,
                      child: _buildCanvas(),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: const BoxDecoration(
              color: Color(0xFF1B263B),
              borderRadius: BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _editChip(Icons.railway_alert, 'Logo', _editLogo),
                  const SizedBox(width: 8),
                  _editChip(Icons.help_outline, 'Question', _editQuestion),
                  const SizedBox(width: 8),
                  _editChip(Icons.list, 'Answers', _editAnswers),
                  const SizedBox(width: 8),
                  _editChip(Icons.text_fields, 'Bottom', _editBottomText),
                  const SizedBox(width: 8),
                  _editChip(Icons.image, 'BG', _pickBackground),
                  const SizedBox(width: 8),
                  _editChip(Icons.photo_library, 'Logo Img', _pickLogo),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _editChip(IconData icon, String label, VoidCallback onTap) {
    return ActionChip(
      avatar: Icon(icon, size: 16, color: Colors.amber.shade300),
      label: Text(label, style: const TextStyle(fontSize: 11)),
      backgroundColor: const Color(0xFF0D1B2A),
      onPressed: onTap,
    );
  }
}
