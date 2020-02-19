#!/bin/bash

####################
# Get root access. #
####################

[ "$UID" -eq 0 ] || exec sudo bash "$0" "$@"

###########################
# Install needed packages #
###########################

apt update

# We're gonna install only those packages that are not already installed and store the names of those packages in a file, 
# so when the uninstaller is ran it will be able to only remove the packages that were installed by this script.

needed_pkgs=(netplan hostapd git lighttpd php7.1-cgi vnstat)
declare -a pkgs_to_install

for i in "${needed_pkgs[@]}"
do
    dpkg -s $i 2>/dev/null | grep -q "ok installed"
    return_code=$(echo $?)
    if [ $return_code -ne 0 ]; then
        pkgs_to_install+=($i)
        echo $i >> html/uninstaller/pkgs_to_uninstall
    fi
done

echo ""
echo "[INFO] Installing needed software..."
echo ""

for i in "${pkgs_to_install[@]}"
do
    apt install $i -y
done


#apt install netplan hostapd git lighttpd php7.1-cgi vnstat -y

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
chown -R www-data:www-data /etc/raspap
# Move the HostAPD logging and service control shell scripts to /etc folder.
mkdir /etc/raspap/hostapd
mv /var/www/html/installers/*log.sh /etc/raspap/hostapd 
mv /var/www/html/installers/service*.sh /etc/raspap/hostapd
# Set ownership and permissions for logging and service control scripts.
chown -c root:www-data /etc/raspap/hostapd/*.sh 
chmod 750 /etc/raspap/hostapd/*.sh 
# Move the raspap service to the correct location and enable it.
mv /var/www/html/installers/raspap.service /lib/systemd/system
systemctl enable raspap.service

echo "[INFO] Configuring network..."

# Move all network-related config files to where they belong
#mv /var/www/html/config/dhcpcd.conf /etc/
mv /var/www/html/config/default_hostapd /etc/default/hostapd
mv /var/www/html/config/hostapd.conf /etc/hostapd/
mv /var/www/html/config/network-config.yaml /etc/netplan/
mv /var/www/html/config/config.php /var/www/html/includes/

####################################
# Apply netplan changes and reboot #
####################################

# Write this before adding eth0 to bridge because when we do that connection will be lost, and we want the user to know what is happening.
echo "[INFO] Rebooting..." 

netplan apply
reboot