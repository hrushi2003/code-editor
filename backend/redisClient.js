import { createClient } from "redis";

export const redis = createClient({
    url : process.env.REDIS_URL || "edis://localhost:6379",
});

redis.on("error", err => console.error("redis error : " + err.message));

try{
    await redis.connect();
    console.log("connected to redis");
}catch(err){
    console.error("Could not connect to redis, running without cache: ", err.message);
}

export const projectsKey = (userId) => `projects:${userId}`;