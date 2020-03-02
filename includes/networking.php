<?php

require_once 'status_messages.php';
require_once 'functions.php';

function DisplayNetworkingConfig()
{
    $status = new StatusMessages();

    exec("ls /sys/class/net", $all_interfaces);
    $network_config = getNetworkConfig();
    $configurable_interfaces = [];
    foreach ($all_interfaces as $interface) {
        exec("ip a show $interface", $$interface);
        if ($interface != "lo") {
            // Exclude loopback interface from config
            if ($network_config["network"]["bridges"] && $network_config["network"]["bridges"]["dumbap-br"]) {
                if ($interface == "wlan0" || in_array($interface, $network_config["network"]["bridges"]["dumbap-br"]["interfaces"])) {
                    // Don't add interface
                }
                else array_push($configurable_interfaces, $interface); 
            }
            else {
                if ($interface != "dumbap-br") {
                    array_push($configurable_interfaces, $interface);
                }
            }
        }
    }
    echo renderTemplate("networking", compact("status", "all_interfaces", "configurable_interfaces"));
}
