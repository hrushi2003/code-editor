import bodyParser from "body-parser";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import {connect} from "./connect.js";
import { User } from "./models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import { CodeSchema } from "./models/codes.js";
import { console } from "inspector";
const app = express();
app.use(bodyParser.json());
app.use(express.json());


const users = {};
const server = createServer(app);
const io = new Server(server,{
    path : '/socket',
    wssEngine : ['ws','wss'],
    transports : ['websocket','polling'],
    cors : {
        origin : "*",
        credentials:true,            
        optionSuccessStatus:200
  },
  connectionStateRecovery: {}
});
app.use(cors());
connect();
io.on("connection", socket => {
    console.log("Client connected");
    socket.on("cursorChange",(data,callback) => {
        console.log(data);
        callback();
    });
    socket.on("authenticate", (userId,callback) => {
       socket.userId = userId;
        users[userId] = socket.id;
        callback();
    });
    socket.on("changeData",(data,callback) => {
        const {line,position,member} = data;
        if (line == null || position == null) {
            callback();
            return;
        }
       if(users[member]) socket.to(users[member]).emit("updateCursorAndData",{line,position});
        callback();
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected");
        delete users[socket.userId];
    });
});

const createToken = (id) => {
    const token = jwt.sign({ id }, process.env.SECRET_KEY
        ,{ expiresIn: '1d' }); // 1 d
    return token;  
}

app.post('/login',(req,res) => {
    const {username,password} = req.body;
    User.findOne({username : username}).then((user) => {
        if(!user) {
            res.status(404).json({message : "User not found"});
            return;
        }
        bcrypt.compare(password,user.password).then((valid) => {
            if(!valid) {
                res.status(401).json({message : "Invalid password"});
                return;
            }
            const token = createToken(user._id);
            console.log(user);
            res.status(200).json({"token":token,"user_id" : user._id});
            return;
        }).catch((err) => {
            res.status(500).json({message : "Error"});
            return;
        })
    }).catch((err) => {
        console.log(err);
        res.status(500).json({message : "Error"});
        return;
    });
})
app.post('/register',async (req,res) => {
    const {username,email,password} = req.body;
    console.log(password);
    const isNewUser = await User.findOne({username : username});
    if(isNewUser){
        return res.status(409).send('Username already in use');
    }
    bcrypt.hash(password,10).then((hash) => {
        const newUser  = new User({
            username : username,
            email : email,
            password : hash
        })
        newUser.save().then((data) => {
            console.log("saved succesfully",data);
            const token = createToken(data._id);
           return res.json({"token" : token,"success":true,"user_id" : data._id});
        }).catch((err) => {
           return res.status(400).send("duplication found",err);
        })    
    }).catch((err) => {
        return res.status(500).send(err);
    })
});
app.get('/getUser', async (req,res) => {
    const {userId} = req.body;
    const user = await User.findById(userId);
    if(!user){
        return res.status(404).json({message : "User not found"});
    }
    return res.status(200).json({
        "username" : user.username,
        "email" : user.email
    })
});

app.patch('/updatePass',async (req,res) => {
    const {userId,oldPassword,newPassword} = req.body;
    const user = await User.findById(userId);
    const isValidPassword = await bcrypt.compare(oldPassword,user.password);
    if(!isValidPassword){
        return res.status(401).json({message : "Invalid password"});
    }
    await bcrypt.hash(newPassword,10).then((hash) => {
        user.password = hash;
        user.save().then((data) => {
            return res.json({"success":true,"message" : "Password updated succesfully"});
        }).catch((err) => {
            return res.status(400).send("Error updating password",err);
        })
    }).catch((err) => {
        return res.status(500).send(err);
    })
});
app.post('/createProject',async (req,res) => {
    const {projectName,membersId} = req.body;
    const tokenId = req.headers["authorization"].split(" ")[1];
    if(!tokenId) {
        return res.status(401).json({message : "Unauthorized"});
    }
    const user_id = jwt.decode(tokenId);
    if(!user_id){
        return res.status(404).json({message : "User is not logged in"});
    }
    const user = await User.findById(user_id.id);
    if(!user){
        return res.status(404).json({message : "User is not found"});
    }
    membersId.push(user._id);
    const Code = new CodeSchema({
        codeName : projectName,
        users : membersId.map(id => ({userId : id})),
        leader : user._id,
        code : [
            "// DO AWESOME THINGS"
        ]
    });
    Code.save().then((data) => {
        console.log(data);
        return res.json({message : "Project created successfully","code_id" : data._id});
    }
    ).catch((err) => {
        console.log(err);
        return res.status(500).send(err);
    });

});
app.get('/getProjects',async(req,res) => {
    const tokenId = req.headers["authorization"].split(" ")[1];
    if(!tokenId) {
        return res.status(401).json({message : "Unauthorized"});
    }
    const user_id = jwt.decode(tokenId);
    if(!user_id){
        return res.status(404).json({message : "User is not logged in"});
    }
    const user = await User.findById(user_id.id);
    if(!user){
        return res.status(404).json({message : "User not found"});
    }
    try{
    const projects = await CodeSchema.find({users : {$elemMatch : {userId : user._id }}}).select([
        "codeName",
        "users",
        "leader"
    ]).populate({path : 'users.userId', select : 'username'}).exec();
    return res.status(200).json({"projects" : projects});
    }
    catch(err){
        console.log(err);
        return res.status(500).send(err);
    }  
})
app.get('/getMembers',async(req,res) => {
    const tokenId = req.headers["authorization"].split(" ")[1];
    if(!tokenId) {
        return res.status(401).json({message : "Unauthorized"});
    }
    const user_id = jwt.decode(tokenId);
    if(!user_id){
        return res.status(404).json({message : "User is not logged in"});
    }
    const user = await User.findById(user_id.id);
    if(!user){
        return res.status(404).json({message : "User not found"});
    }
    try{
        const members = await User.find({username : {$ne : user.username}}).select(["username"]).exec();
        return res.status(200).json({"members" : members});
    }
    catch(err){
        console.log(err);
        return res.status(500).send(err);
    }
})
app.get('/Projects/getCode',async (req,res) => {
    const codeId = req.query.codeId;
    if(!codeId){
        return res.status(404).json({message : "The provided code id is null"});
    }
    try{
        const code = await CodeSchema.findById(codeId);
        if(!code){
            return res.status(404).json({message : "Code not found"});
        }
        return res.status(200).json({"code" : code});
    }
    catch(err){
        console.log(err);
        return res.status(500).send(err);
    }
});
app.post('/Projects/update',async (req,res) => {
    const {changedCodePos,codeId,language} = req.body;
    const codeDoc = await CodeSchema.findById(codeId);
    try{
        codeDoc.language = language;
    changedCodePos.forEach(element => {
        const lineNo = element.lineNumber - 1;
        if(lineNo >= 0 && lineNo < codeDoc.code.length){
            codeDoc.code[lineNo] = element.line;
        }
        else if(lineNo >= codeDoc.code.length){
            for(let i = codeDoc.code.length - 1; i < lineNo; i++){
                codeDoc.code.push("");
            }
            codeDoc.code.push(element.line);
        }
    });
    await codeDoc.save();
    return res.status(200).json({"message" : "Code updated successfully"});
    }
    catch(err){
        console.log(err);
        return res.status(500).send(err);
    }
});
server.listen(3000,() => {
    console.log("Server is running on port 3000");
})
