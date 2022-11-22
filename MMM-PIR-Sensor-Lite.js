/* Magic Mirror
 * Module: MMM-PIR-Sensor-Lite
 *
 * Magic Mirror By Michael Teeuw https://magicmirror.builders
 * MIT Licensed.
 *
 * Module MMM-PIR-Sensor-Lite By Grena https://github.com/grenagit
 * MIT Licensed.
 */

Module.register("MMM-PIR-Sensor-Lite", {

	// Default module config
	defaults: {
		sensorPin: 0, // GPIO pin
		commandType: 'xrandr', // Type of command used
		title: "Automatic Standby",
		rotation: 'normal',
		deactivateDelay: 15 * 60 * 1000, // 15 minutes
		updateInterval: 1000, // 1 second
		animationSpeed: 1000, // 1 second
		hdmiPort: 1, // 1 or 2
		showCountDown: true,
		showDetection: true,
		hoursLabel: 'h',
		minutesLabel: 'm',
		secondsLabel: 's',
	},

	// Define required styles
	getStyles: function() {
		return ["font-awesome.css"];
	},

	// Define start sequence
	start: function() {
		Log.info("Starting module: " + this.name);

		this.resetCountdown();

		this.loaded = false;
		this.detected = false;
		this.sendSocketNotification("CONFIG", this.config);
	},

	// Override dom generator
	getDom: function() {
		var wrapper = document.createElement("div");

		if(this.config.sensorPin === 0) {
			wrapper.innerHTML = "Please set the <i>GPIO pin number</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if(!['vcgencmd', 'xrandr', 'xset'].includes(this.config.commandType)) {
			wrapper.innerHTML = "Please set <i>a command supported (vcgencmd, xrandr or xset)</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if(!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if(this.config.showCountDown) {
			if(this.config.title !== "") {
				var title = document.createElement("div");
				title.className = "light small";
				title.innerHTML = this.config.title;
				wrapper.appendChild(title);
			}

			var medium = document.createElement("div");
			medium.className = "medium";

			if(this.config.showDetection && this.detected) {
				var icon = document.createElement("span");
				icon.className = "fas fa-crosshairs bright";
				medium.appendChild(icon);
			}

			var spacer = document.createElement("span");
			spacer.innerHTML = "&nbsp;";
			medium.appendChild(spacer);

			var time = document.createElement("span");
			time.className = "bright";
			if(this.diffHours > 0) {
				time.innerHTML += this.diffHours + "<span class=\"dimmed small\">" + this.config.hoursLabel + "</span> ";
			}
			if(this.diffMinutes > 0) {
				time.innerHTML += this.diffMinutes + "<span class=\"dimmed small\">" + this.config.minutesLabel + "</span> " ;
			}
			time.innerHTML += this.diffSeconds + "<span class=\"dimmed small\">" + this.config.secondsLabel + "</span>";
			medium.appendChild(time);

			wrapper.appendChild(medium);
		}

		return wrapper;
	},

	// PIR sensor data reception with node_helper
	socketNotificationReceived: function(notification, payload) {
		if(notification === "STARTED") {
			this.loaded = true;
			this.updateDom(this.config.animationSpeed);
		} else if(notification === "USER_PRESENCE") {
			this.setIconTimeout();
			this.resetCountdown();
		} else if(notification === "POWER_ON") {
			Log.info(this.name + ": Turn on the monitor");
		} else if(notification === "POWER_OFF") {
			Log.info(this.name + ": Turn off the monitor");
		} else if(notification === "DEBUG") {
			Log.error(this.name + ": " + payload);
		}
	},

	// Capitalize the first letter of a string
	capFirst: function (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	// Set icon timeout
	setIconTimeout: function() {
		this.detected = true;
		this.updateDom();
		clearTimeout(this.iconTimeout);

		var self = this;
		self.iconTimeout = setTimeout(function() {
				self.detected = false;
				self.updateDom();
		}, self.config.animationSpeed);
	},

	// Reset the countdown
	resetCountdown: function() {
		this.remainingTime = this.config.deactivateDelay;
		this.updateCountdown();

		clearInterval(this.countdownInterval);

		var self = this;
		self.countdownInterval = setInterval(function() {
			self.remainingTime -= self.config.updateInterval;
			self.updateCountdown();
			if(self.remainingTime <= 0) {
				clearInterval(self.countdownInterval);
			}
		}, self.config.updateInterval);
	},

	// Update variables for countdown display
	updateCountdown: function() {
		this.diffHours = Math.floor((this.remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		this.diffMinutes = Math.floor((this.remainingTime % (1000 * 60 * 60)) / (1000 * 60));
		this.diffSeconds = Math.floor((this.remainingTime % (1000 * 60)) / 1000);

		this.updateDom();
	}

});
