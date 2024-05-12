# Redis(Beta)

Wertik JS allows a using redis, Wertik JS uses package named `redis(options: UseRedisProps)`. Wertik JS gives a function called `useRedis` which allows creating a redis server. Let's create a redis client:

Where `UseRedisProps` is:

```typescript
export interface UseRedisProps {
  [key: string]: any
  name: string;
}
```

Where rest of the options will be part of redis `createClient` options. For `createClient` options please check https://github.com/redis/node-redis/blob/master/docs/client-configuration.md.


```javascript
import wertik, { useRedis } from "wertik-js/lib/";
wertik({
port: 1200,
    redis: {
        testRedis: useRedis({
            name: "testRedis"
        })
    }
})
```
This print in console:

```log
[REDIS] Initialized redis testRedis
Wertik JS app listening at http://localhost:1200
```


### Accessing redis inside Expres handler or GraphQL Resolver

You can access Redis instances inside GraphQL and Express handler through:

- Express

```javascript
app.get("/somepath", (req, res) => {
  console.log(req.wertik.redis); // will return object of redis instances
  res.send("Some Info");
});
```

- GraphQL Resolver

```javascript
function Resolver(_, args, context, info) => {
  console.log(context.wertik.redis); // will return object of redis instances
  return "Some Info"
}
```