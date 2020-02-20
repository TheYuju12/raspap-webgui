#!/bin/bash
sudo -i
mv /etc/raspap/networking/network-config.yaml /etc/netplan
netplan apply