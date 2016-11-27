var CoinOne = require('coinone-g');
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

var Trader = function(config) {
  _.bindAll(this);
  if (_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
  }
  // this.pair = [config.asset, config.currency].join('_').toLowerCase();
  this.name = 'coinone';
  this.coinone = new CoinOne(this.key, this.secret);
  this.lastTid = false;
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  var self = this;

  // make sure the callback (and any other fn)
  // is bound to Trader
  _.each(args, function(arg, i) {
    if (_.isFunction(arg))
      args[i] = _.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait
  setTimeout(
    function() {
      method.apply(self, args)
    },
    wait
  );
}

Trader.prototype.getTicker = function(callback) {
  var process = function(err, result) {
    if (err)
      return this.retry(this.coinone.orderbook());
    var data = JSON.parse(result);

    var ticker = {
      bid: data.bid[0].price,
      ask: data.ask[0].price
    }

    callback(err, ticker);
  }.bind(this);

  this.coinone.orderbook(process);

}

Trader.prototype.getTrades = function(since, callback, descending) {
  var process = function(err, result) {
    if (err)
      return this.retry(this.coinone.orderbook());
    var data = JSON.parse(result);
    var trades = _.map(data.completeOrders, function(trade) {
      return {
        price: +trade.price,
        amount: +trade.qty,
        date: trade.timestamp
      }
    })

    callback(null, trades);
  }.bind(this);

  this.coinone.trades(process);
}

Trader.prototype.getFee = function(callback) {
  var process = function(err, result) {
    if (err)
      return this.retry(this.coineone.userInfo(process));

    var fees = {
      takerFee: result.userInfo.feeRate.taker,
      makerFee: result.userInfo.feeRate.maker
    }

    callback(false, fees.takerFee);
  }.bind(this);

  this.coinone.userInfo({}, process);
}

Trader.prototype.getPortfolio = function(callback) {
  var calculate = function(err, result) {
    if (err) {
      if (err.message === 'invalid api key')
        util.die('Your API key is incorrect');
      return this.retry(this.coinone.balance, calculate);
    }

    var portfolio = [];
    _.each(result, function(amount, asset) {
      if (asset.length == 3)
        portfolio.push({
          name: asset.toUpperCase(),
          amount: +amount.avail
        });
    });

    callback(err, portfolio);

  }.bind(this);

  this.coinone.balance(null, calculate);
}

Trader.prototype.buy = function(qty, price, callback) {
  var amount = Math.floor(qty * 10000) / 10000;
  var params = {
    'price': price,
    'qty': amount
  }

  var buy = function(err, data) {
    if (err) {
      log.error('Unable to process order:', err, result);
    } else if (data.result == 'error') {
      log.error('Got errorCode: ', data.errorCode, ' retrying..');
      return this.retry(this.coinone.limitBuy, [params, buy])
    } else {
      log.info('Bid sent to exchange', data);
    }
    callback(null, data.orderId)

  }.bind(this);

  this.coinone.limitBuy(params, buy);
}

Trader.prototype.sell = function(qty, price, callback) {
  var amount = Math.floor(qty * 10000) / 10000;
  var params = {
    'price': price,
    'qty': amount
  }

  var sell = function(err, data) {
    if (err) {
      log.error('Unable to process order:', err, result);
    } else if (data.result == 'error') {
      log.error('Got errorCode: ', data.errorCode, ' retrying..');
      return this.retry(this.coinone.limitBuy, [params, buy])
    } else {
      log.info('Ask sent to exchange', data);
    }
    callback(null, data.orderId)

  }.bind(this);

  this.coinone.limitSell(params, sell);
}

Trader.prototype.checkOrder = function(orderId, callback) {
  var unfilled = false;
  var check = function(err, data) {
    if (err)
      return this.retry(this.coinone.unfilledOrders, check);
    else if (data.result == 'success') {
      _.each(data.completeOrders, function(value) {
        if (value.orderId == orderId) {
          unfilled = true;
          log.info('Trade is unfilled');
        }
      })
    }

    callback(null, unfilled);
  }.bind(this);

  this.coinone.unfilledOrders(orderId, check);
}

Trader.prototype.cancelOrder = function(order, callback) {
  var cancel = function(err, result) {
    if(err || !result)
      log.error('unable to cancel order', order, '(', err, result, ')');
    else
      log.info('All orders have been cancelled');
  }.bind(this);

  this.coinone.cancelAll(null, cancel);
}


module.exports = Trader;
