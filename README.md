# 🚀 Real-Time Collaborative Code Editor

A Google Docs–style collaborative code editor built with **React + Monaco Editor**, **WebSockets**, and **MongoDB**.  
Supports real-time cursor tracking, batched updates, and efficient compaction of operational logs.

---

## ✨ Features

- 🖊️ **Live Code Editing** – Multiple users can edit the same file simultaneously.
- 👥 **Remote Cursor Tracking** – See collaborators' cursors and names in real-time.
- ⚡ **Low-Latency Updates** –  
  - Cursor positions are emitted instantly.  
  - Text updates are sent per keystroke for responsiveness.  
  - Backend updates are **batched** for efficiency.  
- 📦 **Operational Log Storage (CRDT-inspired)** – Every edit is stored as a payload with position and timestamp.
- 🧹 **Automatic Compaction** –  
  - Old operations are periodically merged into snapshots.  
  - Keeps database size manageable and lookup efficient.
- 🔄 **Diff/Patch Algorithm** – Efficiently applies incoming changes with near O(1) updates.

---

## ⚙️ Tech Stack

- **Frontend:** React, Monaco Editor, TailwindCSS  
- **Backend:** Node.js, Express.js, WebSocket  
- **Database:** MongoDB (Ops log + snapshots)  

---

## 🏗️ How It Works

1. **Payload Generation**  
   - Each edit generates a payload:  
     ```json
     {
       "startIndx": 0,
       "endIndx": 0,
       "newLines": ["e"],
       "startColumn": 0,
       "endColumn": 0,
       "deleteCount": 1,
       "timeStamp": 1694567890000
     }
     ```

2. **Frontend → Backend**  
   - Cursor updates: sent instantly.  
   - Text updates: emitted live but **batched before DB writes**.

3. **Backend Storage**  
   - Stores operations like a CRDT log.  
   - Runs **compaction every 10 minutes** or when a file is opened.
   - Operations update in DB takes O(1) in general.

4. **Diff/Patch Algorithm**  
   - Applies ops in timestamp order.  
   - Achieves **O(1)** for most updates, **O(n)** worst case during compaction.

---

## 📊 Efficiency

- **Cursor emission latency:** ~30–80 ms  
- **Text update latency:** ~100–200 ms  
- **DB writes:** Batching reduces ops from 1000s → 10s  
- **Compaction complexity:** amortized ~O(1)–O(n), runs in background  

---

## 🚧 Future Improvements

- 🔐 Access control (roles: leader, member).  
- 📝 Syntax highlighting with Monaco’s language services.  
- 🌍 Support for cross-region low-latency replication.  

## 🔄 System Flow

```mermaid
sequenceDiagram
    participant UserA as User A (Editor)
    participant FE as Frontend
    participant WS as WebSocket Server
    participant BE as Backend (Express)
    participant DB as MongoDB
    participant UserB as User B (Editor)

    UserA->>FE: Type code / Move cursor
    FE->>WS: Emit payload (cursor or text)
    WS->>BE: Forward event
    BE->>DB: Store operation (batched)
    BE-->>WS: Broadcast to other users
    WS-->>UserB: Send update
    UserB->>FE: Apply diff/patch
```
## Diff Match Patch Flow
```mermaid
sequenceDiagram
  participant U as User (Monaco)
  participant D as Diff Engine
  participant RT as Real-time Server
  participant DB as Ops Store
  participant P as Peers

  U->>D: Local edit (range, text)
  D->>D: Compute minimal diff (start,end,newText)
  D-->>RT: Patch payload
  RT->>DB: Append op (O(1))
  RT-->>P: Broadcast patch
  P->>P: Apply patch → update editor
```
## Compaction Flow
```mermaid
sequenceDiagram
  participant Worker as Compaction Worker
  participant DB as MongoDB
  participant Snap as Snapshots

  Worker->>DB: load latest snapshot
  Worker->>DB: fetch ops after snapshot.version
  Worker->>Worker: apply ops in-memory
  Worker->>Snap: write new snapshot
  Worker->>DB: delete archived ops
```
## Edit and Broadcast
```mermaid
sequenceDiagram
  participant U as User (Monaco)
  participant WS as WebSocket/RT service
  participant DB as Ops DB
  participant P as Peer(s)

  U->>WS: code-change (range, text, ts)
  WS->>DB: append op (O(1))
  WS-->>P: broadcast remote-change
  P->>PeerEditor: applyEdits()
```
## flowchart TD
```mermaid
    subgraph Rope["Traditional Rope Data Structure"]
        A1["Balanced Binary Tree"]
        A2["Leaves store substrings"]
        A3["Internal nodes store weights"]
        A1 --> A2
        A1 --> A3
    end

    subgraph PieceTable["Piece Table"]
        B1["Original File Buffer"]
        B2["Add Buffer (edits)"]
        B3["Table of spans (pointers)"]
        B1 --> B3
        B2 --> B3
    end

    subgraph YourAlgo["Your Hybrid Approach (LinkedMapBuffer)"]
        C1["LinkedList → Maintains line order (O(1) insert/delete)"]
        C2["HashMap → Direct access by lineId (O(1))"]
        C3["Ops Batching → Merge keystrokes into single op"]
        C4["Diff-Patch → Store transformations instead of whole text"]
        C1 --> C2
        C2 --> C3
        C3 --> C4
    end

    Rope -->|Different| YourAlgo
    PieceTable -->|Different| YourAlgo
```
