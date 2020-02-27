<?php

require_once 'includes/status_messages.php';

/**
 *
 *
 */
function DisplayNetworkingConfig()
{
    $status = new StatusMessages();

    exec("ls /sys/class/net", $all_interfaces);

    foreach ($all_interfaces as $interface) {
        exec("ip a show $interface", $$interface);
    }

    exec("ls /sys/class/net | grep -i -E 'br|wlan'", $configurable_interfaces);

    
    echo renderTemplate("networking", compact("status", "all_interfaces", "configurable_interfaces"));
}
