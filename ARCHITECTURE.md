# Rajadhaniya Engine Architecture

This document serves as the centralized, definitive technical mapping for the Rajadhaniya codebase. 

> [!IMPORTANT]
> **Strict Engineering Protocol:**
> 1. **Read & Absorb First:** Before executing any code modifications, feature additions, or era implementations, developers must thoroughly comprehend these flowcharts.
> 2. **Logic Alignment:** Every single line of code written must perfectly align with the structural constraints, asset restrictions, drop-off rules, and data routing pipelines defined below.
> 3. **Keep Docs Updated:** If a future implementation fundamentally alters a system flow, the corresponding flowchart in this document must be updated before the code is committed.

---

## 1. Automated Harvesting Loop Flowchart (AoE Economy)

This workflow outlines the continuous Age of Empires style resource extraction loop managed inside `game_bridge.js`.

```mermaid
flowchart TD
    A([Idle State]) -->|Player Taps Resource| B{Unit Selected?}
    B -- Yes --> C[startAutomatedHarvest]
    B -- No --> D[Inspect Resource / Open Menu]
    
    C --> E{Target in Range? <= 2 tiles}
    E -- No --> F[moveUnitToTile via A* Pathfinding]
    F --> E
    E -- Yes --> G[Begin Harvesting Timer / Animations]
    
    G --> H[Extract 1 Resource Unit]
    H --> I[Increment Unit _payload]
    
    I --> J{_payload >= Max Capacity 5?}
    J -- No --> G
    J -- Yes --> K[Stop Harvesting]
    
    K --> L[Vector Distance Scan: Find Nearest Drop-off]
    L --> M[moveUnitToTile to Drop-off]
    M --> N[Deposit Payload]
    
    N --> O[Update Inventory & refreshHud]
    O --> P[moveUnitToTile back to Node]
    P --> C
```

---

## 2. Background Construction Timer Workflow

This diagram maps out the boot-sequence logic when handling the absolute Unix timestamps for our Clash of Clans style background construction.

```mermaid
flowchart TD
    A([App Launch / Resume]) --> B[buildGame Triggered]
    B --> C[Parse rajadhaniya_buildings from localStorage]
    
    C --> D{Iterate Saved Buildings}
    D --> E{is_completed === false?}
    
    E -- No --> F[Render Final Visual Asset]
    F --> G([End Boot Sequence])
    
    E -- Yes --> H{Date.now >= completion_timestamp?}
    
    H -- Yes: Absolute Time Passed --> I[b.is_completed = true]
    I --> J[Render Final Visual Asset]
    J --> K[Update localStorage & scene._buildings]
    
    H -- No: Still Constructing --> L[Render Scaffold Asset grey tint]
    L --> M[Calculate secsLeft]
    M --> N[Mount Ticking UI Bar & Timer]
    N --> O[Interaction Block: createContextualMenu]
    O --> P([Await Timer Expiry -> finishConstruction])
```

---

## 3. Flutter-to-Phaser Data Sync Pipeline

This outlines the cross-layer communication architecture between the Phaser engine (WebGL) and the native Flutter wrapper connecting to Firebase.

```mermaid
flowchart LR
    subgraph Phaser Engine WebGL
        A1[Player Action Build/Harvest] --> A2[Core Game State Mutated]
        A2 --> A3[refreshHud Triggered]
        A3 --> A4[Generate Lightweight JSON Payload]
        A4 -->|Includes: gold, tasks, needs, buildings, forceSync| A5[window.notifyFlutter]
    end

    subgraph JS/Dart Bridge
        B1{Environment Check}
        A5 --> B1
        B1 -- Android/iOS --> B2[window.FlutterBridge.postMessage]
        B1 -- Flutter Web --> B3[window._flutterCallback]
    end

    subgraph Native Flutter App
        C1[_onJsEvent Listener]
        B2 --> C1
        B3 --> C1
        C1 --> C2[setState: Update _hudData Dashboard]
        C2 --> C3{forceSync === true?}
    end

    subgraph Firebase Cloud
        C3 -- Yes: Immediate Backup --> D1[FirestoreService.saveUserData]
        C3 -- No: Background Throttling --> D2[_cloudSyncTimer 60s]
        D2 --> D1
        D1 --> D3[(Cloud Firestore Document)]
    end
```

---

## 4. Era of Veddas Engine Mapping (Data & Logic Restraints)

This visualizes how the grid nodes route through the worker pipeline, the strict building drop-off restrictions, the passive heartbeat loops, and the survival mechanics.

```mermaid
flowchart TD
    %% Define Styles
    classDef node fill:#689F38,stroke:#333,stroke-width:2px,color:#fff
    classDef worker fill:#D4AF37,stroke:#333,stroke-width:2px,color:#000
    classDef building fill:#2C3E50,stroke:#D4AF37,stroke-width:2px,color:#fff
    classDef resource fill:#F1C40F,stroke:#333,stroke-width:2px,color:#000
    classDef passive fill:#8E44AD,stroke:#fff,stroke-width:2px,color:#fff
    classDef survival fill:#C0392B,stroke:#fff,stroke-width:2px,color:#fff

    %% 1. Grid Nodes
    subgraph Grid Resources
        T([tree_node]):::node
        D([deer_node]):::node
        G([gem_rock]):::node
        L([lake_node]):::node
    end

    %% 2. Harvesting Pipeline
    subgraph Worker Tasks
        W[Worker Payload _payload <= 5]:::worker
    end

    T -->|Chop Wood| W
    D -->|Hunt Meat| W
    G -->|Mine Gems/Honey| W

    %% 3. Drop-off Restraints
    subgraph Drop-Off Targets
        H[Wadiya house]:::building
        WH[Maha Wadi Gedara workers_hut]:::building
        TMP[Devale temple]:::building
    end

    W -->|Wood Payload| WH
    W -->|Meat Payload| H
    W -->|Meat Payload| WH
    W -->|Gem/Honey Payload ONLY| TMP

    %% Extracted Resources
    subgraph Global Inventory Payload
        WOOD[(wood)]:::resource
        MEAT[(meat)]:::resource
        GOLD[(gold)]:::resource
        GEM[(gem)]:::resource
        FOOD[(food)]:::resource
        MILK[(milk)]:::resource
    end

    WH -.-> WOOD
    H -.-> MEAT
    WH -.-> MEAT
    TMP -.-> GEM
    TMP -.-> GOLD

    %% 4. Passive Yield Heartbeat
    subgraph Passive Heartbeat Loop 3s/30s
        CF[Cow Farmer Hut cow_farm]:::passive
        F[Hunting Grounds / Farms farm]:::passive
        MR[milkRate / meatRate Ticks]:::passive
    end

    CF --> MR
    F --> MR
    MR -.-> MILK
    MR -.-> MEAT
    MR -.-> FOOD

    %% 5. Sims Survival Depletion Loop
    subgraph Sims Survival Engine
        TH[Thirst -1/Tick]:::survival
        HG[Hunger -1/Tick]:::survival
        HL[Health -5 if empty]:::survival
    end

    L ==>|Direct Replenish| TH
    FOOD ==>|Replenish| HG
    MEAT ==>|Replenish| HG
    MILK ==>|Replenish| HG
    HG -.->|Maintains| HL
```
