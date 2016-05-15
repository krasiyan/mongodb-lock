var Lock = require("../index")
var LockModel = require("../model")

describe("mongoose-distributed-lock edge cases", function() {
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

  it("same lock can't be acquired twice", function(done) {
    var lock = Lock(name, lockConfig)

    lock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      lock.acquire(function(err, lockAquired) {
        expect(err).to.exist()
        expect(err.message).to.eq("lock_already_aquired")
        done()
      })
    })
  })

  it("can't release an un-aquired lock", function(done) {
    var lock = Lock(name, lockConfig)

    lock.release(function(err, lockAquired) {
      expect(err).to.exist()
      expect(err.message).to.eq("releasing_not_aquired_lock")
      done()
    })
  })

  it("same lock can't be released twice", function(done) {
    var lock = Lock(name, lockConfig)

    lock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      lock.release(function (err, lockTimeouted) {
        expect(err).to.not.exist()
        expect(lockTimeouted).to.eq(false)

        lock.release(function (err, lockTimeouted) {
          expect(err).to.exist()
          expect(err.message).to.eq("releasing_not_aquired_lock")
          return done()
        })
      })
    })
  })

  it("expired locks return false by calling release()", function(done) {
    var lock = Lock(name, lockConfig)

    lock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      setTimeout(function() {
        lock.release(function(err, lockTimeouted) {
          expect(err).to.not.exist()
          expect(lockTimeouted).to.eq(true)
          done()
        })
      }, lockConfig.timeout + 100)
    })
  })

  it("pollAquire timeouts if lock is not aquired in time", function(done) {
    var firstLock = Lock(name, {
      timeout: 1000
    })

    firstLock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      var secondLock = Lock(name, {
        timeout: 500,
        pollInterval: 100
      })

      secondLock.pollAquire(function(err, lockAquired) {
        expect(err).to.exist()
        expect(lockAquired).to.eq(false)
        done()
      })
    })
  })

  it("locks with different names do not interact", function(done) {
    var firstlock = Lock(name, lockConfig)
    var secondlock = Lock("secondLock", lockConfig)

    firstlock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      secondlock.acquire(function(err, lockAquired) {
        expect(err).to.not.exist()
        expect(lockAquired).to.eq(true)
        done()
      })
    })
  })
})