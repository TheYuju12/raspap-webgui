#!/bin/bash

# Root access
[ "$UID" -eq 0 ] || exec sudo bash "$0" "$@"

mv /etc/raspap/networking/network-config.yaml /etc/netplan
netplan apply