var mongoose = require("mongoose")

var schema = mongoose.Schema({
  name: { type: String },
  expire: { type: Date },
  inserted: { type: Date, default: Date.now }
}, { autoIndex: true })

schema.index({ name: 1 }, { unique: true })

module.exports = mongoose.model("DistributedLock", schema)