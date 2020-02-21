#!/bin/bash

# Root access
[ "$UID" -eq 0 ] || exec sudo bash "$0" "$@"

mv $1 /etc/netplan
netplan apply