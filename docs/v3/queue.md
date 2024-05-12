# Queue Management

Wertik JS allows you creating Queues by using npm bull library. Wertik JS provides a function called `useQueue` which integrates a Queue into your Wertik App.

## Why use it?

When handling requests from API clients, We might run into a situation where a request initiates a CPU intensive operation that could potentially block other requests. Instead of processing such tasks immediately and blocking other requests, we can defer it to be processed in the future by adding information about the task in a processor. A task consumer will then pick up the task from the queue and process it.

It is considered the elegant way of scaling and solving performance challenges in common applications.

```js
import wertik, { useQueue } from "wertik-js/lib/"

wertik({
  port: 1200,

  // Specifying Redis connection using redis url

  queue: {
    options: {
      useBullBoard: true,
      uiPath: "/admin/queues",
    },
    jobs: {
      sendEmails: useQueue({
        name: "sendEmails",
        url: "redis://127.0.0.1:6379",
        options: {
          limiter: {
            max: 12,
            duration: 32,
            bounceBack: true,
          },
        },
      }),

      // Specifying Redis connection using object

      sendPushNotification: useQueue({
        name: "sendPushNotification",
        options: {
          redis: { port: 6379, host: "127.0.0.1", password: "somepass" },
          limiter: {
            max: 12,
            duration: 32,
            bounceBack: true,
          },
        },
      }),
    },
  },
})
```

This `useQueue` method simply instantiates a new instance of bull and returns that instance.

- A given queue is always referred by its name (instantiation name) as `name: "sendPushNotification"`

- The optional url `url:'redis://127.0.0.1:6379',` parameter is used to specify the Redis connection `string`. If no url is specified, bull will try to connect to default Redis server running on `localhost:6379`

- A queue can be instantiated with some useful options, for instance, we can specify the `location` and `password` of our Redis server, as well as some other useful settings. we can use them as `options : {redis : {port : 6379, host : "127.0.0.1", password : "somepass" }}`.

#### UseQueueProps

-The `useQueue` method always expects an instantiation name such as(`my-queue-name`) all the other arguments are optional.

```typescript
export interface UseQueueProps {
  name?: string
  url?: string
  options?: QueueOptions
}
```

#### Monitoring Jobs

As of today(Friday 7 Jan 2022), Wertik JS provides [Bull Board UI](https://github.com/felixmosh/bull-board) for monitoring Jobs.

```javascript
import wertik, { useQueue } from "wertik-js/lib/"
wertik({
  port: 1200,
  queue: {
    options: {
      useBullBoard: true,
      uiPath: "/admin/jobs",
    },
    jobs: {
      fetchGames: useQueue({
        name: "fetchGames",
      }),
    },
  },
})
```

This will run UI for monitoring jobs at page: [http://localhost:1200/admin/jobs/](http://localhost:1200/admin/jobs/).

This will print in console: 

```log
Queue UI Monitoring Bull Board running at: http://localhost:1200/admin/jobs
```

You can also access Queue Jobs from WertikApp in your app by using: 

- Express

```javascript
app.get("/somepath", (req, res) => {
  console.log(req.wertik.queue); // Queue in Wertik App
  res.send("Some Info");
});
```

For more please see [This line](https://github.com/Uconnect-Technologies/wertik-js/blob/master/src/next/index.ts#:~:text=req.wertik%20%3D%20wertikApp%3B).

- GraphQL Resolver

```javascript
function Resolver(_, args, context, info) => {
  console.log(context.wertik.queue); // Queue in Wertik App
  return "Some Info"
}
```