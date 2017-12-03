# homebridge-rf-fan-remote Plugin

[![NPM Downloads](https://img.shields.io/npm/dm/homebridge-rf-fan-remote.svg?style=flat)](https://npmjs.org/package/homebridge-rf-fan-remote)

I wrote this plugin as a wrapper around mdhiggins ESP8266-HTTP-IR-Blaster to control my GE Ceiling fan. This particular fan uses a 315Mhz RF Remote control with the Model FAN61T-4SP. To use this plugin, you need to build this ESP8266 based IR Blaster device https://github.com/mdhiggins/ESP8266-HTTP-IR-Blaster, except you need to substitute the LED with a 315Mhz RF Transmitter module.

# Installation

1. sudo npm install -g homebridge-rf-fan-remote

# configuration

The configuration is very straight forward, you need just a Button name and the URL to control the blaster.  

Example config.json:

```
 "accessory": "RFRemote",
 "name": "Master",
 "url": "http://192.168.1.175/json?simple=1",
 "remote_code": "1011100101100100",
 "dimmable": true,
 "summer": "01"
```

## Required settings

* accessory - This must be "RFRemote"
* name" - Name of the device
* "url" - URL of the device, including any options ie "http://192.168.1.175/json?simple=1",
* "remote_code" - This is the 16 Bit unique code for your fan.

## Optional settings

* "dimmable" - Is the dimmable, defaults to false
* "summer" - Is the fan in summer mode, defaults to true
* "out"     - out setting for IR Blaster, defaults to 1

# Finding remote code for your remote / fan

To find the remote code for fan, I used an RTL_SDR and rtl_433.  TBD

# Credits

* mdhiggins - Creating the ESP8266 based IR Blaster, sharing your plans and source.
* nfarina - For creating the dummy plugin which I used as base for this plugin.
