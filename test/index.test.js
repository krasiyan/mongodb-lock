var Lock = require("../index")
var LockModel = require("../model")
var async = require("async")

describe("mongoose-distributed-lock", function() {
  beforeEach(test.connectDb)
  beforeEach(function(done) {
    LockModel.ensureIndexes(function (err) {
      if (err) return done(err)
    })
    LockModel.once("index", done)
  })
  afterEach(test.disconnectDb)

  var lockConfig = {
    timeout: 500,
    pollInterval: 100
  }
  var name = "testLock"

  it("instantiating works", function() {
    var lock = Lock(name, lockConfig)

    expect(lock.name).to.eq(name)
    expect(lock.timeAquired).to.not.exist()
    expect(lock.lockId).to.not.exist()
    expect(lock.timeout).to.eq(lockConfig.timeout)
    expect(lock.pollInterval).to.eq(lockConfig.pollInterval)
    expect(lock.probeMaxAttempts).to.eq((lockConfig.timeout / lockConfig.pollInterval) + 2)
  })

  it(".aquire works", function(done) {
    var lock = Lock(name, lockConfig)

    lock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      expect(lock.lockId).to.exist()
      expect(lock.timeAquired).to.exist()
      return done()
    })
  })

  it(".release works", function(done) {
    var lock = Lock(name, lockConfig)

    lock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)
      expect(lock.lockId).to.exist()
      expect(lock.timeAquired).to.exist()

      lock.release(function(err, lockTimeouted) {
        expect(err).to.not.exist()
        expect(lockTimeouted).to.eq(false)
        expect(lock.lockId).to.not.exist()
        expect(lock.timeAquired).to.not.exist()
        return done()
      })
    })
  })

  it("another lock can aquire an expired one", function(done) {
    var firstlock = Lock(name, lockConfig)
    var secondlock = Lock(name, lockConfig)

    firstlock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      setTimeout(function() {
        secondlock.acquire(function(err, lockAquired) {
          expect(err).to.not.exist()
          expect(lockAquired).to.eq(true)
          done()
        })
      }, lockConfig.timeout + 100)
    })
  })

  it("locks can be released and then re-acquired", function(done) {
    var lock = Lock(name, lockConfig)

    lock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      lock.release(function(err, lockTimeouted) {
        expect(err).to.not.exist()
        expect(lockTimeouted).to.eq(false)

        // re-acquire this lock since it has been released
        lock.acquire(function(err, lockAquired) {
          expect(err).to.not.exist()
          expect(lockAquired).to.eq(true)
          done()
        })
      })
    })
  })

  it("lock can be aquired via pollAquire", function(done) {
    var lock = Lock(name, lockConfig)

    lock.pollAquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      done()
    })
  })

  it("concurrent pollAquire calls work", function(done) {
    var firstLock = Lock(name, lockConfig)
    var firstLockAquired = false
    var secondLock = Lock(name, lockConfig)
    var secondLockAquired = false

    async.parallel([
      function(next) {
        firstLock.pollAquire(function (err, lockAquired) {
          expect(err).to.not.exist()
          expect(lockAquired).to.eq(true)
          firstLockAquired = true
          return next()
        })
      },
      function(next) {
        secondLock.pollAquire(function (err, lockAquired) {
          expect(err).to.not.exist()
          expect(lockAquired).to.eq(true)
          secondLockAquired = true
          return next()
        })
      }
    ], function (err) {
      if (err) return done(err)
      expect(firstLockAquired).to.eq(true)
      expect(secondLockAquired).to.eq(true)
      done()
    })
  })
})