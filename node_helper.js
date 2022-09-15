'use strict';

/* Magic Mirror
 * Module: MMM-PIR-Sensor-Lite
 *
 * Magic Mirror By Michael Teeuw https://magicmirror.builders
 * MIT Licensed.
 *
 * Module MMM-PIR-Sensor-Lite By Grena https://github.com/grenagit
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;

module.exports = NodeHelper.create({

	start: function() {
		this.started = false;
	},

	getDataPIR: function() {
		//exec('pkill -f "python3 -u ' + __dirname + '/pir.py"', { timeout: 500 });
		const process = spawn('python3', ['-u', __dirname + '/pir.py', this.config.sensorPin]);

		var self = this;
		process.stdout.on('data', function(data) {
			if(data.indexOf("USER_PRESENCE") === 0) {
				self.sendSocketNotification("USER_PRESENCE", true);
				self.activateMonitor();
				self.resetTimeout();
			}
		});
	},
	
	activateMonitor: function() {
		switch(this.config.commandType) {
			case 'vcgencmd':
				this.sendSocketNotification("POWER_ON", true);
				exec("/usr/bin/vcgencmd display_power 1", null);
				break;
				
			case 'xrandr':
				exec("xrandr --output HDMI-1 --auto", null);
				break;
				
			case 'xset':
				exec("xset dpms force on", null);
				break;
		}
	},

	deactivateMonitor: function() {
		switch(this.config.commandType) {
			case 'vcgencmd':
				this.sendSocketNotification("POWER_OFF", true);
				exec("/usr/bin/vcgencmd display_power 0", null);
				break;
			
			case 'xrandr':
				exec("xrandr --output HDMI-1 --off", null);
				break;
				
			case 'xset':
				exec("xset dpms force on", null);
				break;
		}
	},

	resetTimeout: function() {
		var self = this;
		
		clearTimeout(self.timeout);

		self.timeout = setTimeout(function() {
				self.deactivateMonitor();
		}, self.config.deactivateDelay);
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if (notification === 'CONFIG' && self.started == false) {
			self.config = payload;
			self.activateMonitor();

			self.sendSocketNotification("STARTED", true);
			self.started = true;

			self.getDataPIR();
			self.resetTimeout();
		}
	}
});

