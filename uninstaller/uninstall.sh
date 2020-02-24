#!/bin/bash

# Check if root.
if [ "$EUID" -ne 0 ]
  then echo "Root access is needed to perform this task. Tip: use 'sudo' to run the uninstaller."
  exit 1
fi
# Purge the installed packages one by one

echo ""
echo "[INFO] PREPARING TO UNINSTALL not-so-DumbAP..."
sleep 2

echo ""
echo "[INFO] Removing software..."
sleep 2

input="/etc/raspap/uninstaller/pkgs_to_uninstall"
restore_netplan=1
if [ -f $input ]; then
    while IFS= read -r pkg
    do
        if [ "$pkg" = "netplan.io" ]; then
            restore_netplan=0
        fi
        echo ""
        echo "[INFO] Purging $pkg..."
        echo ""
        apt purge --auto-remove $pkg -y
    done < "$input"
fi
# Disable raspap service
echo "[INFO] Removing raspap service..."
systemctl disable raspap.service
rm -f /lib/systemd/system/raspap.service
# Remove all remaining files we used
echo "[INFO] Erasing remaining files..."
rm -rf /var/www/html
rm -rf /etc/raspap
rm -rf /etc/netplan
rm -rf /etc/hostapd
rm -f /etc/default/hostapd
rm -f /etc/sudoers.d/dumbap
# Undo our changes in dhcpcd.conf
echo "[INFO] Restoring network configuration..."
sed -i '/denyinterfaces eth0/d' /etc/dhcpcd.conf
sed -i '/denyinterfaces wlan0/d' /etc/dhcpcd.conf
# Restore network it if was netplan based
if [ $restore_netplan -ne 0 ]; then
    mkdir /etc/netplan
    mv /etc/netplan_bak/* /etc/netplan/
    rmdir /etc/netplan_bak
fi

echo "[INFO] Rebooting..."
reboot