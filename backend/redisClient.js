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

export const rateLimit = ({
    limit = 100, windowSec = 60, keyPrefix = "rl"
} = {}) => async (req,res,next) => {
    if(!redis.isReady){
        return next();
    }

    const id = req.userId || req.ip;
    const key = `${keyPrefix}:${id}`;

    try{
        const count = await redis.incr(key);
        if (count == 1) await redis.expire(key,windowSec);

        const ttl = await redis.ttl(key);
        res.set("X-RateLimit-Limit",limit);
        res.set("X-RateLimit-Remaining", Math.max(0, limit - count));

        if (count > limit) {
            res.set("Retry-After", ttl);
            return res.status(429).json({ message: `Too many requests. Try again in ${ttl}s.` });
        }
        next();

    }catch(err){
        console.log("rate limit failed");
        next();
    }
}

export const projectsKey = (userId) => `projects:${userId}`;