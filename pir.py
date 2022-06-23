#!/usr/bin/env python
#-- coding: utf-8 --

# Import necessary libraries
import RPi.GPIO as GPIO
import time, argparse

# Initialize variables
pin = None

# Get arguments
parser = argparse.ArgumentParser()

parser.add_argument("pin", type=int, help="The pin of the PIR sensor.")

args = parser.parse_args()

pin = args.pin

# Configure GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(pin, GPIO.IN)

# Script
try:
	time.sleep(2) # Sensor Stabilization Delay (2 seconds)
	
	# Infinite loop
	while True:
		if GPIO.input(pin):
			print("USER_PRESENCE")
			time.sleep(5) # Delay to avoid multiple detections (5 seconds)

		time.sleep(1) # Loop delay (1 second)


finally:
	GPIO.cleanup()
