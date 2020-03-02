<?php

require_once "functions.php";

/**
 *
 *
 */
function DisplayOperationModeConfig()
{
    $modes = [
        "dhcp" => "DHCP Server (default)",
        "bridge" => "Bridge"
    ];

    $network_config = getNetworkConfig();
    if (array_key_exists("bridges", $network_config["network"]) && array_key_exists("dumbap-br", $network_config["network"]["bridges"])) {
        $selectedMode = "bridge";
    }
    else {
        $selectedMode = "dhcp";
    }
    // We're using wlan0 as hotspot by default, so we're excluding it from the selector so it cannot be added to the bridge by user.
    exec("ls /sys/class/net/ | grep -v -i -E 'lo|wlan0|dumbap-br'", $interfacesAvailableToBridge);

    echo renderTemplate("operation_mode", compact("modes", "selectedMode", "interfacesAvailableToBridge"));
}
