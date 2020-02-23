#!/bin/bash

mv $1 /etc/netplan
netplan apply
exit 0