# Rajadhaniya 👑🏹

An isometric historical real-time strategy and kingdom-building mobile game deeply rooted in ancient Sri Lankan history and lore. Build your settlement, manage resources, progress through historical eras, and train legendary indigenous armies to defend your soil or raid rival kingdoms.

---

## 🎮 Game Overview

In **Rajadhani**, players take on the role of a Kingdom Builder, starting from primitive tribal times and evolving through monumental eras of Sri Lankan history (Anuradhapura, Polonnaruwa, Colonial, and Modern). The game combines isometric grid building, tactical resource management (**Food** & **Gold**), and a dynamic troop training system inspired by classic strategy mechanics but adapted with rich localized flavor.

### Key Features
*   🏛️ **Historical Era Progression:** Watch your player title and architecture evolve from a *Tribal Settler (ගෝත්‍රික වැසියා)* to a *Rajarata Farmer (රජරට ගොවියා)* and beyond.
*   ⚔️ **Sena Kanda (War Barracks):** Train unique historical troop classes including *Padati Swordsmen*, *Dunuvaya Archers*, and the massive *Maha Yodha Tanks*.
*   👺 **Epic Raids & Bosses:** Defend your borders or launch strategic raids against historical and mythical regional threats like King Ravana and Lord Pandya.
*   📜 **Bi-lingual Support:** Complete native integration for both English and Sinhala (සිංහල) gameplay experiences.
*   🗂️ **JSON-Driven Core:** Fully modular architecture where troop stats, abilities, unlock costs, and building structures are managed via clean, scalable configuration layers.

---

## 🛠️ Tech Stack & Architecture

*   **Platform:** Mobile (Android / Cross-platform)
*   **Architecture:** Clean Architecture with Unidirectional Data Flow (UDF) for clean separation of UI state and business logic.
*   **Data Management:** JSON-driven configurations for real-time calculation of training queues, resource costs, and housing caps.

---

## ⚔️ Sena Kanda (Barracks) Unit Roster

The game's combat engine relies on specialized units, each serving distinct tactical roles:

| Unit Name | Role | Core Ability | Resource Cost |
| :--- | :--- | :--- | :--- |
| **Padati Soldier (පාබල සෙබළා)** | Vanguard Infantry | Angam Swarm Aggression | 100 Food |
| **Dunuvaya (දුනුවායා)** | Ranged Marksman | Arrow Volley (Shoots over walls) | 500 Food |
| **Maha Yodha (මහා යෝධයා)** | Heavy Shield Tank | Defenses Targeted Bashing | 2,500 Food |
| **Kollakaraya (කොල්ලකරු)** | Stealth Raider | x2 Treasury Plunder Speed | 5,000 Food |
| **Maharaja (මහාරාජා)** | Hero / General | Sri Handha (Royal Healing Roar) | 10,000 Gold |
| **Bisawa (රැජින)** | Hero / Assassin | Mayam Cloak (Invisibility & High DPS) | 20,000 Gold |

---

## 🚀 Getting Started / Installation

### Prerequisites
*   Ensure you have the latest mobile SDK installed matching the configuration file.
*   An Android Device or Emulator running API 26 or higher.

### Local Setup
1. Clone the repository:
```bash
   git clone [https://github.com/KasunPremarathna/rajadhaniya-game.git](https://github.com/KasunPremarathna/rajadhaniya-game.git)
