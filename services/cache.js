const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");

// redis client set-up
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
// promisifying callback function
client.hget = util.promisify(client.hget);

// original mongoose exec() function reference
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || "");
    return this;
};

mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return exec.apply(this, arguments);
    }

    // create key for redis cache for the specific query
    const key = JSON.stringify(
        Object.assign({}, this.getQuery(), {
            collection: this.mongooseCollection.name,
        })
    );

    // if value stored for key in redis, return that value
    const cachedValue = await client.hget(this.hashKey, key);

    if (cachedValue) {
        const parsedDoc = JSON.parse(cachedValue);

        return Array.isArray(parsedDoc)
            ? parsedDoc.map((doc) => new this.model(doc))
            : new this.model(parsedDoc);
    }

    // else fetch mongodb and store redis based on key
    const result = await exec.apply(this, arguments);
    client.hmset(this.hashKey, key, JSON.stringify(result), "EX", 10);

    return result;
};

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    },
};
