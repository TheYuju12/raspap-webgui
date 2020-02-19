#!/bin/bash

# Get root access. 

[ "$UID" -eq 0 ] || exec sudo bash "$0" "$@"

# Purge the installed packages one by one

input="pkgs_to_uninstall"
while IFS= read -r pkg
do
    echo "Removing $pkg..."
    apt purge --auto-remove $pkg
done < "$input"

# Disable raspap service
echo "Removing raspap service..."
systemctl disable raspap.service
rm -f /lib/systemd/system/raspap.service
# Remove all remaining files we used
echo "Removing remaining files..."
rm -rf /var/www/html
rm -rf /etc/raspap
rm -rf /etc/netplan
rm -rf /etc/hostapd
rm -f /etc/default/hostapd