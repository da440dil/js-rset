-- ARGV: 1 - value, 2 - ttl, 3 - limit
local t = redis.call("time")
local now = (t[1] * 1000000) + t[2]
redis.call("zremrangebyscore", KEYS[1], 0, now - ARGV[2])
redis.call("zadd", KEYS[1], now, ARGV[1])
local diff = redis.call("zcount", KEYS[1], 0, now) - ARGV[3]
if diff > 0 then
    redis.call("zpopmin", KEYS[1], diff)
end
return diff