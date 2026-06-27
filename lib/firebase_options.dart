// ⚠️ PLACEHOLDER FILE — This was auto-generated as a stub.
// Run the following command to generate the real configuration:
//   dart pub global activate flutterfire_cli
//   flutterfire configure --project=rajadhanigamesl
//
// The real generated file will replace this one.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform. '
          'Please run `flutterfire configure` to generate real options.',
        );
    }
  }

  // ⚠️ Replace with real values from `flutterfire configure`

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyCZxVuGgBB9NTMsfmjsRjLEIfNyGH-IWq4',
    appId: '1:999174467302:web:7d98924a35f738657f1527',
    messagingSenderId: '999174467302',
    projectId: 'rajadhanigamesl',
    authDomain: 'rajadhanigamesl.firebaseapp.com',
    storageBucket: 'rajadhanigamesl.firebasestorage.app',
    measurementId: 'G-JDML960GB4',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCjtDCSbXjGaijuGNDk-vjYLrSomxAqe_A',
    appId: '1:999174467302:android:55354416d69f7cef7f1527',
    messagingSenderId: '999174467302',
    projectId: 'rajadhanigamesl',
    storageBucket: 'rajadhanigamesl.firebasestorage.app',
  );
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'REPLACE_WITH_API_KEY',
    appId: 'REPLACE_WITH_APP_ID',
    messagingSenderId: 'REPLACE_WITH_SENDER_ID',
    projectId: 'rajadhanigamesl',
    storageBucket: 'rajadhanigamesl.appspot.com',
    iosBundleId: 'com.example.rajadhaniya',
  );
}
