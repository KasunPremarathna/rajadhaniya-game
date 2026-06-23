import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'js_bridge_stub.dart'; // We'll need to pass the controller to JsBridge

class GameViewWidget extends StatefulWidget {
  const GameViewWidget({super.key});

  @override
  State<GameViewWidget> createState() => _GameViewWidgetState();
}

class _GameViewWidgetState extends State<GameViewWidget> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: (JavaScriptMessage message) {
          // Send to the registered callback in JsBridge
          JsBridge.handleWebViewMessage(message.message);
        },
      )
      ..loadRequest(Uri.parse('https://rajadhanigamesl.web.app/game.html?v=${DateTime.now().millisecondsSinceEpoch}'));
      
    // Set global reference for JsBridge to execute JS
    JsBridge.webViewController = controller;
  }

  @override
  Widget build(BuildContext context) {
    return WebViewWidget(controller: controller);
  }
}
