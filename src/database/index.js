const mongose = require("mongoose");

mongose.connect("mongodb://localhost/noderest", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

mongose.set('useFindAndModify', false);

mongose.Promise = global.Promise;

module.exports = mongose;
