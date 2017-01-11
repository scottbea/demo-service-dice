const restify = require('restify');
const plugins = require('restify-plugins');
const {Tracer, ExplicitContext, ConsoleRecorder} = require('zipkin');
const zipkinMiddleware = require('zipkin-instrumentation-restify').restifyMiddleware;

const ctxImpl = new ExplicitContext();
const recorder = new ConsoleRecorder();
const tracer = new Tracer({ctxImpl, recorder}); // configure your tracer properly here


const server = restify.createServer({
  name: 'dice',
  version: '1.0.0'
});

server.use(plugins.acceptParser(server.acceptable));
server.use(plugins.queryParser());
server.use(plugins.bodyParser());
server.use(zipkinMiddleware({tracer, serviceName: 'dice'}));

server.get('/dice/:type', function (req, res, next) {
  var type = (req.params.type || 'd6').toLowerCase().replace(/ /g, '');
  if (type.indexOf('d') === 0) { type = '1' + type; }
  var parts = type.split('d');
  var count = parseInt(parts[0]);
  var dice = parseInt(parts[1]);
  var rolls = [];
  var total = 0;
  for (var x = 0; x < count; x++) {
     var roll = Math.floor(Math.random()*dice, 0)+1;
     total += roll;
     rolls.push(roll);
  }
  var results = {
    type: type,
    count: count,
    dice: dice,
    sum: total,
    rolls: rolls
  };
  res.send(results);
  return next();
});

server.listen(3000, function () {
  console.log('server is up!');
  console.log('%s listening at %s', server.name, server.url);
  console.log('Hit on: ' + server.url + '/dice/d6');
});
