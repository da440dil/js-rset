-- ARGV: 1 - ttl
local t = redis.call("time")
local now = (t[1] * 1000000) + t[2]
redis.call("zremrangebyscore", KEYS[1], 0, now - ARGV[1])
return redis.call("zrangebyscore", KEYS[1], 0, now)