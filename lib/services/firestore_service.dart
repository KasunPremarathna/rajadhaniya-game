import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

class FirestoreService {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Loads the user's game data from Firestore and returns it as a map.
  /// Returns null if no data exists yet (new player).
  static Future<Map<String, dynamic>?> loadUserData() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return null;

    try {
      final doc = await _db.collection('users').doc(user.uid).get();
      if (!doc.exists || doc.data() == null) {
        debugPrint('[FirestoreService] New user – no cloud data found.');
        return null;
      }
      debugPrint('[FirestoreService] Cloud data loaded successfully.');
      return doc.data()!['game_data'] as Map<String, dynamic>?;
    } catch (e) {
      debugPrint('[FirestoreService] Error loading user data: $e');
      return null;
    }
  }

  /// Saves the current game state map to Firestore under the authenticated user.
  /// Call this whenever the HUD updates (gold changes, buildings placed, etc.)
  static Future<void> saveUserData(Map<String, dynamic> gameData) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    try {
      await _db.collection('users').doc(user.uid).set(
        {
          'uid': user.uid,
          'email': user.email,
          'display_name': user.displayName,
          'last_updated': FieldValue.serverTimestamp(),
          'game_data': gameData,
        },
        SetOptions(merge: true),
      );
      debugPrint('[FirestoreService] Game state saved to cloud.');
    } catch (e) {
      debugPrint('[FirestoreService] Error saving user data: $e');
    }
  }
}
