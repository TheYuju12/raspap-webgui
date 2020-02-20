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