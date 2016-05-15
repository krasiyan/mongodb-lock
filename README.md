# mongoose-distributed-lock #

An easy module for distributed state locks with Mongoose.

## Instantiating a lock ##

Make sure to have an active `mongoose` connection before instantiating the lock.

```js
mongoose.connect('mongodb://localhost/mongoose-distributed-lock', function(err, connection) {

  var lock = Lock('testLock', options)
})
```

## Options ##

You can specify the following options:

```js
var lock = Lock('testLock', {
  timeout: 60000, // the maximum time a lock can aqcuired for in miliseconds before granting it to other issues is possible again; defaults to 60000
  pollInterval: 500, // the interval in which `pollAcquire` will execute in miliseconds; default to 500
})
```

## Acquiring the lock ##

```js
lock.acquire(function(err, lockAcquired) {
  if (err) {
    return console.error(err)
  }

  if ( lockAcquired ) {
    // lock was acquired
    console.log('lock acquired successfuly')
  }
  else {
    // lock was not acquired
  }
})
```

Once you have a lock, you have `lock.timeout` time until the lock is released. You can release it earlier via the `release()` method.

If the lock is currently in use (lets say by another instance of your code) then `lockAquired` will be `false`. If you want to ensure that the lock will be acquired you can use `pollAcquire`.

`aqcuire` can return the following errors:

- `lock_already_aquired` - when the lock has already been acquired and since has not been released


## Acquiring the lock via polling ##

```js
lock.pollAcquire(function(err, lockAcquired) {
  if (err) {
    return console.error(err)
  }

  if ( lockAcquired ) {
    // lock was acquired
    console.log('lock acquired successfuly')
  }
  else {
    // lock was not acquired
  }
})
```

`pollAqcuire` will poll the database every `lock.pollInterval` miliseconds untill the lock is acquired or until it has reached its maximum attempts. The maximum poll attemts are defined as `(timeout / pollInterval) + 2` to ensure that until the last moment possible the lock can be acquired.

`pollAqcuire` can return the following errors:

- `lock_already_aquired` - when the lock has already been acquired and since has not been released
- `timeout in pollAquire for lock name LOCK_NAME` - when the maximum attempts to poll the database have been reached

## Releasing the lock ##

```js
lock.release(function(err, lockTimeouted) {
  if (err) {
    return console.error(err)
  }

  if (!lockTimeouted) {
    console.log('lock released ok')
  }
  else {
    console.log('this INSTANCE of the lock is currently released, however the lock has probably timeouted')
  }
})
```

Note that if `lockTimeouted` is `true` this instance of the lock has timeouted and is de-facto released. However another issuer has most likely taken the lock.

`release` can return the following errors:

- `releasing_not_aquired_lock` - when the lock has not been acquired in order to be released

## Advanced ##

Each lock has the following properties:

```js
name // the name of the lock
lockId // the mongoose ObjectID of the lock DB entry (if one has been acquired)
timeout // the maximum time a lock can aqcuired for in miliseconds
pollInterval // the interval in which `pollAcquire` will execute in miliseconds
probeMaxAttempts // the maximum possible times pollAcquire can iterate before returning a timeout error
```

Although not adviced, it is possible to change them in the runtime.

## Notes ##

- This module aims to use MongoDB's atomic method wrapped by Mongoose. However please note that since this is a very early version, race conditions are possible.
- Currently when a lock expires and is re-acquired or when it is released, its entry is removed from the database.

## Todo ##

- :warning: Give the ability to change to collection name instead of using the one hardcoded in `model.js`.
- Add an infinite `pollAquire` method.
- Emit events on acquiring / timeout.
- Add calls to `model.getIndexes` and `model.ensureIndexes` on instantination.
- Use MongoDB's TTL on the lock entries.
- Add a `forceAcquire` method.
- Periodically poll the databse when a lock is acquired to ensure its state and otherwise emit a `release` event.
- Add option to persist expired logs in the database.

## Changelog ##

### 0.0.0 (2016-05-13) ###

- Initial implementation with mongoose and `pollAcquire`

## Authors ##

Originally written by [Andrew Chilton](http://chilts.org/) -
[Twitter](https://twitter.com/andychilton).

and forked by [Krasiyan Nedelchev](http://krasiyan.com)

## License ##

MIT
