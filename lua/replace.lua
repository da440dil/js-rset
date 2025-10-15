-- ARGV: 1 - oldValue, 2 - newValue, 3 - ttl
local t = redis.call("time")
local now = (t[1] * 1000000) + t[2]
redis.call("zremrangebyscore", KEYS[1], 0, now - ARGV[3])
if redis.call("zrem", KEYS[1], ARGV[1]) == 1 then
    redis.call("zadd", KEYS[1], now, ARGV[2])
    return 1
end
return 0