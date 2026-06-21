import 'package:flutter/material.dart';

class GameViewWidget extends StatelessWidget {
  const GameViewWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return const HtmlElementView(viewType: 'phaser-game');
  }
}
