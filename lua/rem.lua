-- ARGV: 1 - value, 2 - ttl
local t = redis.call("time")
redis.call("zremrangebyscore", KEYS[1], 0, (t[1] * 1000000) + t[2] - ARGV[2])
return redis.call("zrem", KEYS[1], ARGV[1])