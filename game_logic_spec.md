Act as an expert Game Architect and Senior Full-Stack Developer. I want to build a hybrid Web game (which will later be wrapped into a Mobile App using a WebView) called "Rajadhaniya" (රාජධානිය). The front-end UI and initial world selection are built using Flutter Web, and the core 2.5D/Isometric simulation gameplay is handled by JavaScript (Phaser.js/Babylon.js) embedded directly via Flutter's HtmlElementView.

CRITICAL ARCHITECTURE REQUIREMENT: For the initial development phase, the game must run ENTIRELY WITHOUT A DATABASE (Database-less / Local State). All data, inventories, states, and coordinates must be managed using local in-memory states (Dart Maps in Flutter and JS Objects in JavaScript) and synchronized over the browser's Window Object.

Please generate a comprehensive Game Design and Logic Specification Document formatted strictly in Markdown (.md). The document must detail the entire game logic, front-end state management, and communication bridges, broken down into the following structured sections:

1. ## Game Overview & Core Concept
   - Explain the progression from a "Normal Citizen" to a "Clan Leader" and finally to the "Governor (පාලකයා)" of a selected area.
   - Describe the shift in gameplay styles: RPG/Survival mode for Citizens vs. Top-down/Isometric Country Planning mode for the Governor.
   - Detail how the local in-memory data object manages player states during a single session without database persistence.

2. ## OpenStreetMap (OSM) Area Selection & Mapping Logic
   - Outline the logic for the Flutter Web OpenStreetMap integration using `flutter_map`.
   - Explain how the user selects a region (capturing Latitude and Longitude Bounding Boxes) and how this data is used to define the region name and environment type (e.g., Mountainous/Mist for Kandy, Coastal for Galle, Dry Zone for Anuradhapura).

3. ## Citizen Gameplay & Resource Mechanics (Local State)
   - Detail the Grid-based movement and interaction logic within the JS Game Canvas.
   - Define the legal resource-gathering mechanics (Farming fields, wood chopping on owned land) and how they update the local Javascript memory object (`localPlayerData.inventory`).

4. ## Stealing Mechanics & Warning/Wanted System (The Crime Logic)
   - Explain the mathematical logic for the "Detection Radius" around NPC/Player storehouses.
   - Create a step-by-step logic for the Guard Detection system.
   - Detail the "Warning Levels" (Level 1: Suspicion, Level 2: Fines, Level 3: Outlaw/Imprisonment) and how they dynamically reduce the local `popularity_rating` variable.

5. ## Community, Clans & Election Mechanics
   - Explain how Text-based Clan creation and collective resource pools are simulated using local state management inside the Flutter Web UI.
   - Detail the Local Election/Voting Logic: How popularity points trigger simulated AI votes to determine if the citizen becomes the Governor.

6. ## Governor Mode (Country Planning Mechanics)
   - Define the logic switch: `if (localPlayerData.role == 'Governor')`.
   - Detail the Grid-based tilemap implementation for building roads, managing trade networks, expanding community infrastructure, and collecting taxes into the local state.

7. ## Flutter-to-JavaScript Web-Native Bridge (Browser Window Events)
   - Do NOT use mobile WebView channels. Provide concrete code examples of bidirectional communication using Dart's `dart:js` / `dart:html` and JavaScript's `window.dispatchEvent` and `window.addEventListener`.
   - Show how Flutter passes `latitude/longitude` to JS, and how JS passes back events like `caught_stealing` or `resource_updated` to Flutter Web UI.

8. ## Local Session State Schema Design (JSON)
   - Provide the complete structure for the single local JS Object / Dart Map that holds all session data: `localPlayerData` (including role, inventory, warnings, popularity, and selected location data).

Please structure the output with clear markdown headings, bullet points, code blocks for JSON/Code, and structured tables where necessary, so I can save it directly as a `game_logic_spec.md` file. Use clear, production-grade technical terminology.