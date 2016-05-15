var Lock = require("../index")
var LockModel = require("../model")
var async = require("async")

describe("mongoose-distributed-lock database usage", function() {
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

  it("entry stays in db while lock is aquired", function(done) {
    var lock = Lock(name, lockConfig)

    lock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)
      LockModel.find({}, function (err, locks) {
        if (err) return done(err)
        expect(locks).to.have.length(1)
        expect(locks[0].name).to.eq(name)
        expect(locks[0].expire.getTime()).to.eq(lock.timeAquired + lockConfig.timeout)
        expect(locks[0].inserted.getTime()).to.eq(lock.timeAquired)
        done()
      })
    })
  })

  it("entry is removed from the db when the lock is aquired", function(done) {
    var lock = Lock(name, lockConfig)

    lock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      lock.release(function (err, lockTimeouted) {
        expect(err).to.not.exist()
        expect(lockTimeouted).to.eq(false)

        LockModel.find({}, function (err, locks) {
          if (err) return done(err)
          expect(locks).to.have.length(0)
          done()
        })
      })
    })
  })

  it("expired lock entries are removed on re-acquiring", function(done) {
    var expiredlock = Lock(name, {
      timeout: 100
    })
    var newLock = Lock(name, lockConfig)

    expiredlock.acquire(function(err, lockAquired) {
      expect(err).to.not.exist()
      expect(lockAquired).to.eq(true)

      setTimeout(function() {
        newLock.acquire(function(err, lockAquired) {
          expect(err).to.not.exist()
          expect(lockAquired).to.eq(true)

          LockModel.find({}, function (err, locks) {
            if (err) return done(err)
            expect(locks).to.have.length(1)
            expect(locks[0].name).to.eq(name)
            expect(locks[0].expire.getTime()).to.eq(newLock.timeAquired + lockConfig.timeout)
            expect(locks[0].inserted.getTime()).to.eq(newLock.timeAquired)
            done()
          })
        })
      }, 100)
    })
  })
})