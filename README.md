###🚀 Real-Time Collaborative Code Editor

A high-performance collaborative code editor that enables multiple users to edit the same codebase in real-time. Designed with efficiency in mind, it leverages CRDT-inspired algorithms, differential updates, and compaction techniques to ensure low latency, scalable performance, and optimized storage.

###✨ Key Highlights

⚡ Real-Time Collaboration – Seamless multi-user editing powered by WebSockets & Socket.IO.

🧮 CRDT-Inspired Algorithm – Conflict-free updates with O(1) average insertion/update complexity.

🗜️ Compaction Strategy – Reduces operation log size by ~80% on average, maintaining query efficiency.

📦 Optimized Storage – Operations logged in MongoDB and compacted periodically for minimal overhead.

🎯 Scalable Design – Efficient handling of 10k+ operations without performance degradation.

🖊️ Cursor & Member Synchronization – Tracks and updates user positions for a smooth collaborative experience.

⚙️ Technical Stack

###Frontend: React, Monaco Editor

Backend: Node.js, Express.js, WebSockets (Socket.IO)

###Database: MongoDB (operation logs + compaction strategy)

📊 System Design Efficiency

Update Insertion: O(1)

Diff-Match-Patch Reconstruction: O(n) worst case, near O(1) for typical edits

Compaction: Amortized O(1), worst case O(n)

Latency: Optimized for sub-100ms propagation across clients

###📌 Workflow

User Edit → Generates operation (payload includes index, cursor, delete count, new characters).

Backend Storage → Operation logged in MongoDB.

Diff-Match-Patch Algorithm → Efficiently applies changes to reconstruct state.

Compaction → Merges redundant ops at login or time intervals for efficient retrieval.
