var chai = require("chai")
var mongoose = require("mongoose")

global.expect = chai.expect

chai.config.includeStack = true

global.test = {}

global.test.connectDb = function(done) {
  mongoose.connect('mongodb://localhost/mongoose-distributed-lock', function(err, connection) {
    mongoose.connection.db.dropDatabase(done)
  })
}

global.test.disconnectDb = function(done) {
  mongoose.disconnect(done)
}