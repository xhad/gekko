var PushBullet = require('pushbullet');
var _ = require('lodash');
var log = require('../core/log.js');
var util = require('../core/util.js');
var config = util.getConfig();
var pbConfig = config.pushbullet;

var Pushbullet = function(done) {
  _.bindAll(this);

  this.client;
  this.price = 'N/A';

  this.done = done;
  this.setup();
}

Pushbullet.prototype.setup = function(done) {
	var errors = [];
    if(_.isEmpty(pbConfig.authToken))
      errors.push("No AuthToken configured for Pushbullet Config");

	var api = new PushBullet(pbConfig.authToken);
    this.client = api;
	
	debugger;
	
    if(pbConfig.sendMailOnStart && errors.length === 0) {
		var messageText = [
			  "Watching: ",
			  config.watch.exchange,
			  ' ',
			  config.watch.currency,
			  '/',
			  config.watch.asset,
			  ". Advice soon."
			].join('');
			
		this.mail(
			"Gekko has started",
				messageText,
			_.bind(function(err) {
			  this.checkResults(err);
			  this.done();
			}, this)
		);
		
    } else if(errors.length !== 0){
      throw new Error(errors);
	  
    } else {
      this.done();
    }
	
	if(pbConfig.testProcessAdvice){
		  this.testProcessAdvice();
	}
	
    log.debug('Setup email adviser.');
  }


Pushbullet.prototype.mail = function(subject, content, done) {
	var self = this;
	self.client.note(pbConfig.deviceId, subject, content, function(error, response) {
	if(error){
        // note, reponse will contain status code.
        self.checkResults(error);
        if(done){
			done();
        }
      } else {
			log.debug("Pushbullet sent successfully: ", response);
        if(done){
			done();
        }
      }
	});
}

Pushbullet.prototype.processTrade = function(trade) {
  this.price = trade.price;
}

Pushbullet.prototype.processAdvice = function(advice) {
  var text = [
    'Gekko is watching ',
    config.watch.exchange,
    ' and has detected a new trend, advice is to go ',
    advice.recommandation,
    '.\n\nThe current ',
    config.watch.asset,
    ' price is ',
    this.price
  ].join('');

  var subject = 'New advice: go ' + advice.recommandation;

  this.mail(subject, text);
}

Pushbullet.prototype.checkResults = function(err) {
  if(err)
    log.warn('error sending email', err);
  else
    log.info('Send advice via email.');
}

module.exports = Pushbullet;
