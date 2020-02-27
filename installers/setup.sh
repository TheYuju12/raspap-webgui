#!/bin/bash

####################
# Get root access. #
####################

# [ "$UID" -eq 0 ] || exec sudo bash "$0" "$@"

sudo -i

###########################
# Install needed packages #
###########################
echo "#######################################"
echo "WELCOME TO THE not-so-DumbAP INSTALLER!"
echo "#######################################"
echo ""
echo "This routine will set everything up in a few minutes. Please, wait patiently."
sleep 2
echo ""
echo "[INFO] Checking for updates and needed packages..."
echo ""

apt update

# We're gonna install only those packages that are not already installed and store the names of those packages in a file, 
# so when the uninstaller is ran it will be able to only remove the packages that were installed by this script.

needed_pkgs=(netplan.io hostapd git lighttpd php7.1-cgi python3 python3-pip vnstat dnsmasq)
declare -a pkgs_to_install

for i in "${needed_pkgs[@]}"
do
    dpkg -s $i 2>/dev/null | grep -q "ok installed"
    return_code=$(echo $?)
    if [ $return_code -ne 0 ]; then
        if [ "$1" == "netplan.io" ]; then
            mkdir /etc/netplan_bak
            mv /etc/netplan/* > /etc/netplan_bak/
        fi
        pkgs_to_install+=($i)
        echo $i >> pkgs_to_uninstall
    fi
done

if [ ${#pkgs_to_install[@]} -ne 0 ]; then
    echo ""
    echo "[INFO] Installing needed software..."
    echo ""
    for i in "${pkgs_to_install[@]}"
    do
        apt install $i -y
    done
fi

# Install yaml support for python (using oyaml because it uses ordered dicts)
pip install oyaml

##########################
# Configure new packages #
##########################

echo ""
echo "[INFO] Configuring software...."
echo ""

systemctl unmask hostapd
systemctl enable hostapd

lighttpd-enable-mod fastcgi-php
service lighttpd restart

##################################################################################
# Clone the repository with all config files and begin the configuration process #
##################################################################################

echo ""
echo "[INFO] Setting up web interface...."
echo ""

git clone https://github.com/TheYuju12/raspap-webgui.git html

# Set executable permissions to uninstaller
chmod +x html/uninstaller/uninstall.sh
# Replace /var/www/html with our web hierarchy
rm -rf /var/www/html
mv html /var/www/
# Move the high-res favicons to the web root.
mv /var/www/html/app/icons/* /var/www/html
# Set the files ownership to www-data user.
chown -R www-data:www-data /var/www/html
# Move the RaspAP configuration file to /etc folder.
mkdir /etc/raspap
mv /var/www/html/raspap.php /etc/raspap/
# Move uninstall stuff to correct location
mv /var/www/html/uninstaller /etc/raspap/
if [ -f pkgs_to_uninstall ]; then
    mv pkgs_to_uninstall /etc/raspap/uninstaller/
fi
# Move scripts to proper location and set executable permissions to them
mv /var/www/html/scripts /etc/raspap/
chmod +x /etc/raspap/scripts/*
# Create folder for network related files
mkdir /etc/raspap/networking
# Set ownership of /etc/raspap
chown -R www-data:www-data /etc/raspap
# Move the HostAPD logging and service control shell scripts to /etc folder.
mkdir /etc/raspap/hostapd
mv /var/www/html/installers/*log.sh /etc/raspap/hostapd 
mv /var/www/html/installers/service*.sh /etc/raspap/hostapd
# Set ownership and permissions for logging and service control scripts.
chown -c root:www-data /etc/raspap/hostapd/*.sh 
chmod 750 /etc/raspap/hostapd/*.sh 
# Move the dumbap service to the correct location and enable it.
mv /var/www/html/installers/dumbap.service /lib/systemd/system
systemctl enable dumbap.service

# Set needed permissions in sudoers file
echo "www-data ALL=(ALL) NOPASSWD:/sbin/reboot" > /etc/sudoers.d/dumbap
echo "www-data ALL=(ALL) NOPASSWD:/etc/raspap/scripts/update_network_config.sh" >> /etc/sudoers.d/dumbap
echo "www-data ALL=(ALL) NOPASSWD:/etc/raspap/scripts/do_arp.sh" >> /etc/sudoers.d/dumbap

# Configure network to use netplan
echo "[INFO] Configuring networking..."

# Move all network-related config files to where they belong
mv /etc/dhcpcd.conf /etc/dhcpcd.conf.bak
mv /var/www/html/config/dhcpcd.conf /etc/dhcpcd.conf
mv /var/www/html/config/default_hostapd /etc/default/hostapd    
if [ ! -d "/etc/hostapd" ]; then
    mkdir /etc/hostapd
fi
mv /var/www/html/config/hostapd.conf /etc/hostapd/
mv /var/www/html/config/network-config.yaml /etc/netplan/
# Since networkd seems to be dumb and does not use dhcp-provided dns, we'll use google dns
dns="8.8.8.8"
# Set this dns as the default one in resolvconf.conf
echo "name_servers=$dns" >> /etc/resolvconf.conf
# Setup dnsmasq and forwarding
echo "[INFO] Finishing installation"

# dnsmasq
dhcp_min="10.9.9.10"
dhcp_max="10.9.9.110"
dhcp_netmask="255.255.255.0"
dhcp_lease_time="12h"
echo "dhcp-range=$dhcp_min,$dhcp_max,$dhcp_netmask,$dhcp_lease_time" > /etc/dnsmasq.conf
# forwarding
sed -i "s/#net.ipv4.ip_forward=1.*/net.ipv4.ip_forward=1/g" /etc/sysctl.conf
iptables -t nat -A  POSTROUTING -o eth0 -j MASQUERADE
# persist iptables rules 
sh -c "iptables-save > /etc/iptables.ipv4.nat"
mv /etc/rc.local / /etc/rc.local.bak
cat /etc/rc.local.bak | head -n -1 > /etc/rc.local
echo "iptables-restore < /etc/iptables.ipv4.nat" >> /etc/rc.local
echo "exit 0" >> /etc/rc.local

####################################
# Apply netplan changes and reboot #
####################################

echo "[INFO] Rebooting..." 
# netplan is gonna throw an error but it will work so we just redirect error output to /dev/null 
netplan apply 2> /dev/null
reboot