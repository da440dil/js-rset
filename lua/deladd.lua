-- ARGV: 1 - value
local t = redis.call("time")
redis.call("del", KEYS[1])
redis.call("zadd", KEYS[1], (t[1] * 1000000) + t[2], ARGV[1])