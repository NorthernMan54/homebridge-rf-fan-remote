// config.json

//{
//          "accessory": "http-rf-fan-remote",
//          "name": "Power",
//	  "url": "http://ESP_869815/msg?repeat=2&rdelay=100&pdelay=1&address=16388&code=538BC81:PANASONIC:48",
//    "fan_code": "1011100101100100"  // 16 Bits
//    "dimmable": true
//    "summer": "01"
//        }




"use strict";

var debug = require('debug')('RFRemote');
var request = require("request");
var Service, Characteristic;

var fanCommands = {
  fan0: "111101",
  fan25: "110111",
  fan50: "101111",
  fan75: "101110",
  fan100: "011111",
  Down: "110011",
  lightD: "111110",
  reverse: "111011",
  lightND: "111110",
  sync: "111111"
}

module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-rf-fan-remote", "RFRemote", RFRemote);
}

function RFRemote(log, config) {
  this.log = log;
  this.name = config.name;

  this.remote_code = config.remote_code;
  this.url = config.url;
  this.dimmable = config.dimmable || true;
  this.summer = config.summer || "10";
  this.out = config.out || 1;

  //

  if (this.dimmable) {
    fanCommands.light = fanCommands.lightD;
    fanCommands.dimmable = "1";
  } else {
    fanCommands.light = fanCommands.lightND;
    fanCommands.dimmable = "0";
  }

  // Below are the legacy settings

  this.stateful = config.stateful || false;
  this.on_busy = config.on_busy || 5;
  this.off_busy = config.off_busy || 1;
  this.down_busy = config.down_busy || 1;
  this.up_busy = config.up_busy || 1;
  this.rdelay = config.rdelay || 600;
  this.on_data = config.on_data;
  this.off_data = config.off_data;
  this.up_data = config.up_data;
  this.down_data = config.down_data;
  this.start = config.start || undefined;
  this.steps = config.steps || 4;
  this.count = config.count || 0;

  this.working = Date.now();


  debug("Adding Fan", this.name);
  this._fan = new Service.Fan(this.name);
  this._fan.getCharacteristic(Characteristic.On)
    .on('set', this._fanOn.bind(this));

  // Using RotationSpeed as a placeholder for up/down control

  this._fan
    .addCharacteristic(new Characteristic.RotationSpeed())
    .on('set', this._fanSpeed.bind(this))
    .setProps({
      minStep: 25
    });

  if (this.start) {
    this._fan.getCharacteristic(Characteristic.RotationSpeed).updateValue(this.start);
  }

  debug("Adding Light", this.name);
  this._light = new Service.Lightbulb(this.name);
  this._light.getCharacteristic(Characteristic.On)
    .on('set', this._lightOn.bind(this));

  this._light
    .addCharacteristic(new Characteristic.Brightness())
    .on('set', this._lightBrightness.bind(this));

  debug("Add Summer", this.name);

  this._summer = new Service.Switch(this.name + " Summer");
//  this._summer.getCharacteristic(Characteristic.On)
//    .on('set', this._summer.bind(this));

  if (this.start == undefined && this.on_data && this.up_data)
    this.resetDevice();

}

RFRemote.prototype.getServices = function() {
  return [this._fan, this._light, this._summer];
}

RFRemote.prototype._fanOn = function(on, callback) {

  this.log("Setting " + this.name + " to " + on);

  if (on) {

    this.httpRequest("toggle", this.url, fanCommands.fan25, 1, this.on_busy, function(error, response, responseBody) {
      if (error) {
        this.log('RFRemote failed: %s', error.message);
        callback(error);
      } else {
        debug('RFRemote succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else {
    this.httpRequest("toggle", this.url, fanCommands.fan0, 1, this.on_busy, function(error, response, responseBody) {
      if (error) {
        this.log('RFRemote failed: %s', error.message);
        callback(error);
      } else {
        debug('RFRemote succeeded!', this.url);
        callback();
      }
    }.bind(this));
  }
}

RFRemote.prototype._fanSpeed = function(value, callback) {

  this.log("Setting " + this.name + " to " + value);

  var command;
  switch (true) {
    case (value < 15):
      command = fanCommands.fan0;
      break;
    case (value < 40):
      command = fanCommands.fan25;
      break;
    case (value < 65):
      command = fanCommands.fan50;
      break;
    case (value < 90):
      command = fanCommands.fan75;
      break;
    case (value < 101):
      command = fanCommands.fan100;
      break;
  }

  this.httpRequest("toggle", this.url, command, 1, this.on_busy, function(error, response, responseBody) {
    if (error) {
      this.log('RFRemote failed: %s', error.message);
      callback(error);
    } else {
      debug('RFRemote succeeded!', this.url);
      callback();
    }
  }.bind(this));

}

RFRemote.prototype._lightOn = function(on, callback) {

  this.log("Setting " + this.name + " to " + on);

  if (on) {

    this.httpRequest("toggle", this.url, fanCommands.light, 1, this.on_busy, function(error, response, responseBody) {
      if (error) {
        this.log('RFRemote failed: %s', error.message);
        callback(error);
      } else {
        debug('RFRemote succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else {
    this.httpRequest("toggle", this.url, fanCommands.light, 1, this.on_busy, function(error, response, responseBody) {
      if (error) {
        this.log('RFRemote failed: %s', error.message);
        callback(error);
      } else {
        debug('RFRemote succeeded!', this.url);
        callback();
      }
    }.bind(this));
  }
}

RFRemote.prototype._summer = function(on, callback) {

  this.log("Setting " + this.name + " to " + on);

  if (on) {
    this.summer = "10";
    this.httpRequest("toggle", this.url, fanCommands.reverse, 1, this.on_busy, function(error, response, responseBody) {
      if (error) {
        this.log('RFRemote failed: %s', error.message);
        callback(error);
      } else {
        debug('RFRemote succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else {
    this.summer = "00";
    this.httpRequest("toggle", this.url, fanCommands.reverse, 1, this.on_busy, function(error, response, responseBody) {
      if (error) {
        this.log('RFRemote failed: %s', error.message);
        callback(error);
      } else {
        debug('RFRemote succeeded!', this.url);
        callback();
      }
    }.bind(this));
  }
}

RFRemote.prototype._lightBrightness = function(value, callback) {

  //debug("Device", this._fan);

  this.log("Setting " + this.name + " to " + value);

  var current = this._fan.getCharacteristic(Characteristic.RotationSpeed)
    .value;

  if (current == undefined)
    current = this.start;

  if (value == 100 && current == 0) {
    callback(null, current);
    return;
  }

  var _value = Math.floor(value / (100 / this.steps));
  var _current = Math.floor(current / (100 / this.steps));
  var delta = Math.round(_value - _current);

  debug("Values", this.name, value, current, delta);

  if (delta < 0) {
    // Turn down device
    this.log("Turning down " + this.name + " by " + Math.abs(delta));
    this.httpRequest("down", this.url, this.down_data, Math.abs(delta) + this.count, this.down_busy, function(error, response, responseBody) {
      if (error) {
        this.log('RFRemote failed: %s', error.message);
        callback(error);
      } else {
        debug('RFRemote succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else if (delta > 0) {

    // Turn up device
    this.log("Turning up " + this.name + " by " + Math.abs(delta));
    this.httpRequest("up", this.url, this.up_data, Math.abs(delta) + this.count, this.up_busy, function(error, response, responseBody) {
      if (error) {
        this.log('RFRemote failed: %s', error.message);
        callback(error);
      } else {
        debug('RFRemote succeeded!', this.url);
        callback();
      }
    }.bind(this));

  } else {
    this.log("Not controlling " + this.name, value, current, delta);
    callback();
  }
}

RFRemote.prototype._setState = function(on, callback) {

  this.log("Turning " + this.name + " to " + on);

  debug("_setState", this.name, on, this._fan.getCharacteristic(Characteristic.On).value);

  if (on && !this._fan.getCharacteristic(Characteristic.On).value) {
    this.httpRequest("on", this.url, this.on_data, 1, this.on_busy, function(error, response, responseBody) {
      if (error) {
        this.log('RFRemote failed: %s', error.message);
        callback(error);
      } else {
        debug('RFRemote succeeded!', this.url);
        var current = this._fan.getCharacteristic(Characteristic.RotationSpeed)
          .value;
        if (current != this.start && this.start != undefined) {
          debug("Setting level after turning on ", this.start);
          this._fan.getCharacteristic(Characteristic.RotationSpeed).updateValue(this.start);
        }
        callback();
      }
    }.bind(this));
  } else if (!on && this._fan.getCharacteristic(Characteristic.On).value) {
    this.httpRequest("off", this.url, this.off_data, 1, this.off_busy, function(error, response, responseBody) {
      if (error) {
        this.log('RFRemote failed: %s', error.message);
        callback(error);
      } else {
        debug('RFRemote succeeded!', this.url);
        callback();
      }
    }.bind(this));
  } else {
    debug("Do nothing");
    callback();
  }
}

RFRemote.prototype.resetDevice = function() {
  debug("Reseting volume on device", this.name);
  this.httpRequest("on", this.url, this.on_data, 1, this.on_busy, function(error, response, responseBody) {

    setTimeout(function() {
      this.httpRequest("down", this.url, this.down_data, this.steps, this.down_busy, function(error, response, responseBody) {

        setTimeout(function() {
          this.httpRequest("up", this.url, this.up_data, 2, this.up_busy, function(error, response, responseBody) {

            setTimeout(function() {
              this.httpRequest("off", this.url, this.off_data, 1, this.off_busy, function(error, response, responseBody) {
                this._fan.getCharacteristic(Characteristic.RotationSpeed).updateValue(2);
              }.bind(this));
            }.bind(this), this.off_busy);

          }.bind(this));

        }.bind(this), this.steps * this.down_busy);
      }.bind(this));

    }.bind(this), this.on_busy);
  }.bind(this));


}

RFRemote.prototype.httpRequest = function(name, url, data, count, sleep, callback) {
  //debug("url",url,"Data",data);
  // Content-Length is a workaround for a bug in both request and ESP8266WebServer - request uses lower case, and ESP8266WebServer only uses upper case

  debug("HttpRequest", name, url, count, sleep);

  //debug("time",Date.now()," ",this.working);

  if (Date.now() > this.working) {
    this.working = Date.now() + sleep * count;

    if (data) {

  //    data[0].repeat = count;
  //    data[0].rdelay = this.rdelay;

      var body = JSON.stringify(buildBody(command));
      //      debug("Body", body);
      request({
          url: url,
          method: "POST",
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length
          },
          body: body
        },
        function(error, response, body) {
          if (response) {
            debug("Response", response.statusCode, response.statusMessage);
          } else {
            debug("Error", name, url, count, sleep, callback, error);
          }

          if (callback) callback(error, response, body);
        }.bind(this));
    } else {
      // Simple URL Format
      request({
          url: url,
          method: "GET",
          timeout: 500
        },
        function(error, response, body) {
          if (response) {
            debug("Response", response.statusCode, response.statusMessage);
          } else {
            debug("Error", error);
          }

          if (callback) callback(error, response, body);
        })
    }
  } else {
    debug("NODEMCU is busy", name);
    if (callback) callback(new Error("Device Busy"));
  }
}

function buildBody(command) {
  // This is the command structure for
  var remoteCommand = "0" + this.summer + this.remote_code + fanCommands.dimmable + command;
  debug("This is the command", remoteCommand);
  var body = [{
    "type": "raw",
    "out": this.out,
    "khz": 500,
    "data": [200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 700, 200, 200, 700, 200, 700, 200, 700, 700, 200, 200, 700, 700, 200, 700, 200, 700, 200, 200, 700, 200, 700, 200, 700, 700, 200, 700, 200, 200, 700, 700, 200, 700, 200, 700, 200],
    "pulse": 10,
    "pdelay": 30
  }];
  debug("This is the body", body);
  return body;
}
