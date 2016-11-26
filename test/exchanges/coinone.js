var Trader = require('./../../exchanges/coinone');
var chai = require('chai');
var expect = chai.expect;
var should = chai.should;
var sinon = require('sinon');
var proxyquire = require('proxyquire');


var _ = require('lodash');
var moment = require('moment');

var util = require(__dirname + '/../../core/util');
var config = util.getConfig();
var dirs = util.dirs();

var trader = new Trader(config.trader);


//
// describe('Coinone Tests', function() {
//   it('/getTicker', (done) => {
//     trader.getTicker(function(err, data) {
//       console.log(data);
//       done()
//     });
//
//     })
// })

//
// trader.getTicker(function(err, data) {
//   console.log(data);
//   trader.buy(0.001, data.ask, function(err, data) {
//     console.log(data);
//   })
//
//   trader.sell(0.001, data.bid, function(err, data) {
//     console.log(data);
//   })
//
// });
//
// trader.getTrades(function(err, data) {
//   console.log(data);
// })
//
// trader.getFee(function(err, data) {
//   console.log(data);
// })

trader.getPortfolio(function(err, data) {
  console.log(data);
})

let orderId = 'A49372AE-05CE-46D7-8C83';
trader.checkOrder(orderId.toUpperCase(), function(err, data) {
  console.log(data);
})

trader.cancelOrder(function(err, data) {
  console.log(data);
})
