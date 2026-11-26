import bodyParser from "body-parser";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { connect } from "./connect.js";
import { User } from "./models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import { CodeSchema } from "./models/codes.js";
import { Ops } from "./models/Ops.js";
import './models/ScheduleCompaction.js';
import { diffMatchPatchAlgo } from "./diffMatchPatchAlgo.js";
import {redis,projectsKey,rateLimit} from "./redisClient.js";
const app = express();
app.use(bodyParser.json());
app.use(express.json());


const users = {};
const server = createServer(app);
const io = new Server(server, {
    path: '/socket',
    wssEngine: ['ws', 'wss'],
    transports: ['websocket', 'polling'],
    cors: {
        origin: "*",
        credentials: true,
        optionSuccessStatus: 200
    },
    connectionStateRecovery: {}
});
app.use(cors());
connect();
var operations = 0;    
io.on("connection", socket => {
    console.log("Client connected");
    socket.on("cursorChange", (data, callback) => {
        console.log(data);
        callback();
    });
    socket.on("authenticate", (userId, callback) => {
        socket.userId = userId;
        users[userId] = socket.id;
        callback();
    });
    socket.on("changeData", (data, callback) => {
        const { changes,userId } = data;
        if (changes == null) {
            callback();
            return;
        }
        if (users[userId]) socket.to(users[userId]).emit("updateCursorAndData", { changes });
        callback();
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected");
        delete users[socket.userId];
    });
});

const createToken = (id) => {
    const token = jwt.sign({ id }, process.env.SECRET_KEY
        , { expiresIn: '1d' }); // 1 d
    return token;
}

const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      req.userId = jwt.verify(token, process.env.SECRET_KEY).id;
      next();                        // pass control to the route
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };

app.post('/login', rateLimit({
    limit : 10,
    windowSec : 60,
    keyPrefix : "rl"
}), (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username: username }).then((user) => {
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        bcrypt.compare(password, user.password).then((valid) => {
            if (!valid) {
                res.status(401).json({ message: "Invalid password" });
                return;
            }
            const token = createToken(user._id);
            console.log(user);
            res.status(200).json({ "token": token, "user_id": user._id });
            return;
        }).catch((err) => {
            res.status(500).json({ message: "Error" });
            return;
        })
    }).catch((err) => {
        console.log(err);
        res.status(500).json({ message: "Error" });
        return;
    });
})
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.log(password);
    const isNewUser = await User.findOne({ username: username });
    if (isNewUser) {
        return res.status(409).send('Username already in use');
    }
    bcrypt.hash(password, 10).then((hash) => {
        const newUser = new User({
            username: username,
            email: email,
            password: hash
        })
        newUser.save().then((data) => {
            console.log("saved succesfully", data);
            const token = createToken(data._id);
            return res.json({ "token": token, "success": true, "user_id": data._id });
        }).catch((err) => {
            return res.status(400).send("duplication found", err);
        })
    }).catch((err) => {
        return res.status(500).send(err);
    })
});
app.get('/getUser',auth, async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({
        "username": user.username,
        "email": user.email
    })
});

app.patch('/updatePass', auth, async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid password" });
    }
    await bcrypt.hash(newPassword, 10).then((hash) => {
        user.password = hash;
        user.save().then((data) => {
            return res.json({ "success": true, "message": "Password updated succesfully" });
        }).catch((err) => {
            return res.status(400).send("Error updating password", err);
        })
    }).catch((err) => {
        return res.status(500).send(err);
    })
});
app.post('/createProject',auth, async (req, res) => {
    const { projectName, membersId = [] } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // creator + members, no duplicates
    const allMembers = [...new Set([...membersId.map(String), String(user._id)])];

    try {
        const data = await new CodeSchema({
            codeName: projectName,
            users: allMembers.map(id => ({ userId: id })),
            leader: user._id,
            code: ["// DO AWESOME THINGS"]
        }).save();

        // Invalidate every member's cached project list (one round trip)
        try {
            if (redis.isReady) {
                const keys = allMembers.map(projectsKey);
                await redis.del(keys);
                console.log("invalidated:", keys);
            }
        } catch (err) {
            console.log("redis del failed:", err.message);
        }

        return res.json({ message: "Project created successfully", code_id: data._id });
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
});
app.get('/getProjects', auth, rateLimit(), async (req, res) => {
    const start = performance.now();                                   // NEW: start timer

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    try {
        const cacheKey = projectsKey(user._id);
        try {
            if (redis.isReady) {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    console.log(`HIT  ${(performance.now() - start).toFixed(1)} ms`);   // NEW
                    return res.status(200).json({ "projects": JSON.parse(cached) });
                }
            }
        } catch (err) {
            console.log("redis failed");
        }

        const projects = await CodeSchema.find({ users: { $elemMatch: { userId: user._id } } })
            .select(["codeName", "users", "leader"])
            .populate({ path: 'users.userId', select: 'username' })
            .exec();

        try {
            if (redis.isReady) {
                await redis.set(cacheKey, JSON.stringify(projects), { EX: 300 });   // FIX: added await
            }
        } catch (err) {
            console.log("redis failed");
        }

        console.log(`MISS ${(performance.now() - start).toFixed(1)} ms`);        // NEW
        return res.status(200).json({ "projects": projects });
    } catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
});
app.get('/getMembers', auth, async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    try {
        const members = await User.find({ username: { $ne: user.username } }).select(["username"]).exec();
        return res.status(200).json({ "members": members });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
})
app.get('/Projects/getCode', async (req, res) => {
    const codeId = req.query.codeId;
    if (!codeId) {
        return res.status(404).json({ message: "The provided code id is null" });
    }
    try {
        const code = await CodeSchema.findById(codeId).populate({path : "users.userId", select : 'username'}).exec();
        const setField = await CodeSchema.findOneAndUpdate(
            { _id: codeId, version: { $exists: false } },
            { $set: { version: 1 } },
            { new: true }
        );

        if (!code) {
            return res.status(404).json({ message: "Code not found" });
        }
        const getAllOps = await Ops.find({ codeId: code._id }).sort({ version: 1 });
        console.log(getAllOps, "all ops",code);
        try {
            const result = await diffMatchPatchAlgo(getAllOps, code);
            console.log(result,getAllOps,code,"the output");
            result.version = operations + getAllOps.length;
            await result.save();
            operations = 0;
            const maxVersion = getAllOps.length ? getAllOps[getAllOps.length - 1].version : 0;
            await Ops.deleteMany({ codeId: code._id, version: { $lte: maxVersion } });
            return res.status(200).json({ "code":  code, "ops": getAllOps, "res" : result });// result
        }
        catch (err) {
            return res.status(500).json({ "message": "error in diffMatchPatchAlgo", "error": err });
        }
    }
    catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
});
app.post('/Projects/update', async (req, res) => {
    const { changedCodePos, codeId, language } = req.body;
    const codeDoc = await CodeSchema.findById(codeId);
    const err = {}
    if (!codeDoc || !codeDoc.code) {
        err.message = "code Not Found";
    }
    codeDoc.language = language;
    let opsToSave = [];
   if(operations == null || operations == 0) operations = codeDoc.version;
    let version = await Ops.find({
        codeId : codeDoc._id
    }).sort({
        version : -1
    }).limit(1);
    version = !version[0]?.version ? codeDoc.version + 1 : version[0].version + 1
    try {
        changedCodePos.forEach(patch => {
            const { startIndx, deleteCount, endIndx = startIndx, newLines, startColumn, endColumn } = patch;
            opsToSave.push(new Ops({
                codeId: codeDoc._id,
                version: version++,
                payload: {
                    startIndx,
                    endIndx,
                    newLines,
                    startColumn,
                    endColumn,
                    deleteCount
                },
                changedBy: req.userId, 
                timestamps: patch.timeStamp
            }));
        });
        if (opsToSave.length > 0) {
            await Ops.insertMany(opsToSave);
        }
        await codeDoc.save();
        return res.status(200).json({ "message": "Code updated successfully" });
    }
    catch (error) {
        return res.status(500).json({
            "message": "error in saving code",
            "data": changedCodePos,
            err
        });
    }
});
server.listen(3000, () => {
    console.log("Server is running on port 3000");
})
