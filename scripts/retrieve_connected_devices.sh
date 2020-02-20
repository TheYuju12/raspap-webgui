#!/bin/bash

# Dump information about neighbours and connected devices and launch python script to handle it
iw dev wlan0 station dump | grep Station | cut -d ' ' -f 2 > "/etc/raspap/networking/connected_macs"
if [ -f  "/etc/raspap/networking/all_macs" ]; then
    bash /etc/cron.hourly/periodic_arp 
fi
python3 /etc/raspap/scripts/get_connected_devices.py $1 "/etc/raspap/networking/connected_macs" "/etc/raspap/networking/all_macs" "/etc/raspap/networking/all_ips" "/etc/raspap/networking/all_hostnames"