-- ARGV: 1 - value, 2 - ttl, 3 - limit
local t = redis.call("time")
local now = (t[1] * 1000000) + t[2]
redis.call("zremrangebyscore", KEYS[1], 0, now - ARGV[2])
if redis.call("zcount", KEYS[1], 0, now) >= 0 + ARGV[3] then
	return 0
end
redis.call("zadd", KEYS[1], now, ARGV[1])
return 1