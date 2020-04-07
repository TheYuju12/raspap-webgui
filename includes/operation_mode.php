<?php

require_once "functions.php";
require_once "config.php";

/**
 *
 *
 */
function DisplayOperationModeConfig()
{
    $modes = [
        "dhcp" => "DHCP Server (default)",
        "bridge" => "Bridge",
        "sdn" => "SDN managed"
    ];

    $dumbap_config = yaml_parse_file(DUMBAP_CONFIG_FILE);
    $hotspot = $dumbap_config["hotspot"];
    // Don't consider sdn case: when sdn is enabled this page won't be accesible
    if (array_key_exists("bridge", $dumbap_config["mode"])) {
        $selectedMode = "bridge";
        $bridge = $dumbap_config["mode"]["bridge"]["name"];
    }
    else {
        $selectedMode = "dhcp";
    }

    // An interface is allowed to be bridged if it's not lo, nor the hotspot nor the current bridge.

    $interfacesAvailableToBridge = array();

    // Use interfaces present in netplan file

    $net_conf = yaml_parse_file(RASPI_NETPLAN_CONFIG)["network"];


    if ($net_conf["ethernets"]) {
        $ethernets = array_keys($net_conf["ethernets"]);
        foreach ($ethernets as $int) {
            if ($int != "lo") array_push($interfacesAvailableToBridge, $int);
        }
    }
    if ($net_conf["wifis"]) {
        $wifis = array_keys($net_conf["wifis"]);
        foreach ($wifis as $int) {
            array_push($interfacesAvailableToBridge, $int);
        }
    }
    if ($net_conf["bridges"]) {
        $bridges = array_keys($net_conf["bridges"]);
        foreach ($bridges as $int) {
            if ($bridge) {
                if ($int != $bridge) array_push($interfacesAvailableToBridge, $int);
            }
            else array_push($interfacesAvailableToBridge, $int);
        }
    }

    $wireless_ints = $wifis;
    
    echo renderTemplate("operation_mode", compact("modes", "selectedMode", "hotspot", "wireless_ints","interfacesAvailableToBridge"));
}
