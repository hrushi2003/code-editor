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

## 🧹 Compaction Flow

```mermaid
flowchart TD
    A[Incoming Operations<br/>(Ops Log)] -->|Append| B[MongoDB Ops Collection]

    B -->|Periodically (10 min / on file open)| C[Compaction Engine]

    C -->|Merge Ops| D[Snapshot Document]

    D -->|Stored in DB| E[Latest Code State]

    E -->|Served to Users| F[Fast Load & Edit]
    
    C -->|Discard Old Ops| G[Reduced DB Size]

---

This shows:  
- All edits go into **Ops Collection**.  
- A **Compaction Engine** merges them into a **Snapshot** (like CRDT consolidation).  
- Snapshots are what you serve on user login = fast load.  
- Old ops get discarded → keeps DB light.  

Together with the sequence diagram, your README will look 🔥 and **interviewer-ready**.  

👉 Do you also want me to add a **sample MongoDB schema** for `Ops` and `Snapshot` in the README so companies like Google/Microsoft see your design thinking?
