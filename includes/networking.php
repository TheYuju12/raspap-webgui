<?php

require_once 'includes/status_messages.php';

/**
 *
 *
 */
function DisplayNetworkingConfig()
{
    $status = new StatusMessages();

    exec("ls /sys/class/net | grep br0", $interfaces);

    foreach ($interfaces as $interface) {
        exec("ip a show $interface", $$interface);
    }

    if ($fh = fopen('/etc/systemd/network/bridge-br0.network', 'r')) {
        $dns_ocurrences = 0;
        while (!feof($fh)) {
            $line = fgets($fh);
            if (strpos($line, "Address")) {
                $ip_and_netmask = explode("=", $line)[1];
                $ip = explode("/", $ip_and_netmask)[0];
                $netmask = "/" . explode("/", $ip_and_netmask)[1];
                continue;
            }
            if (strpos($line, "Gateway")) {
                $gw = explode("=", $line)[1];
                continue;
            }
            if (strpos($line, "DNS")) {
                $dns_ocurrences++;
                if ($dns_ocurrences == 1) {
                    $dns1 = explode("=", $line)[1];
                }
                elseif ($dns_ocurrences == 2) {
                    $dns2 = explode("=", $line)[1];
                }
                continue;
            }
        }
        fclose($fh);
    }
    
    echo renderTemplate("networking", compact("status", "interfaces", "ip", "netmask", "gw", "dns1", "dns2"));
}
