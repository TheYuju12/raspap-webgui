#!/bin/bash

# This script is meant to be executed periodically, in order to know our neighbours and update cache files used by get_connected_devices.py.
# /etc/cron.hourly/ may be a good place.

# Root access
[ "$UID" -eq 0 ] || exec sudo bash "$0" "$@"

# TODO: find a way to do this no matter the network ip
# this may be useful: $ ifconfig -a br0 | head -2 | tail +2

arp-scan --interface=br0 192.168.0.0/24 | head -n -3 | tail -n +3 | grep -v DUP > network_devices
cat network_devices | cut -f 1 > "/etc/raspap/networking/all_ips"
cat network_devices | cut -f 2 > "/etc/raspap/networking/all_macs"
cat network_devices | cut -f 3 > "/etc/raspap/networking/all_hostnames"
rm network_devices