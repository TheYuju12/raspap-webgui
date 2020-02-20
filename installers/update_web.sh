#!/bin/bash

sudo -i

echo ""
echo "[INFO] Setting up web interface...."
echo ""

git clone https://github.com/TheYuju12/raspap-webgui.git html

# Move the file which contains the software we installed to correct location (if it exists)
if [ -f /var/www/html/uninstaller/pkgs_to_uninstall ]; then
    mv /var/www/html/uninstaller/pkgs_to_uninstall html/uninstaller/pkgs_to_uninstall
fi
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