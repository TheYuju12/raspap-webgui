<?php

require_once 'status_messages.php';
require_once 'functions.php';
require_once "config.php";

function DisplayNetworkingConfig()
{
    $status = new StatusMessages();
    // Get actual interfaces
    exec("ls /sys/class/net", $all_interfaces);
    
    // Only allow interfaces in netplan file to be configured

    $dumbap_config = yaml_parse_file(DUMBAP_CONFIG_FILE);
    $hotspot = $dumbap_config["hotspot"];
    // Don't consider sdn case: when sdn is enabled this page won't be accessible
    if (array_key_exists("bridge", $dumbap_config["mode"])) {
        $bridge = $dumbap_config["mode"]["bridge"]["name"];
        $gw = $dumbap_config["mode"]["bridge"]["gw"];
    }

    $net_conf = yaml_parse_file(RASPI_NETPLAN_CONFIG)["network"];

    $configurable_interfaces = [];

    if ($net_conf["ethernets"]) {
        $ethernets = array_keys($net_conf["ethernets"]);
        foreach ($ethernets as $int) {
            if ($int != "lo") {
                if ($bridge) {
                    if ($int != $gw) array_push($configurable_interfaces, $int);
                }
                else array_push($configurable_interfaces, $int);
            }
        }
    }
    if ($net_conf["wifis"]) {
        $wifis = array_keys($net_conf["wifis"]);
        foreach ($wifis as $int) {
            if ($bridge) {
                if ($int != $hotspot && $int != $gw) array_push($configurable_interfaces, $int);
            }
            else array_push($configurable_interfaces, $int);
        }
    }
    if ($net_conf["bridges"]) {
        $bridges = array_keys($net_conf["bridges"]);
        foreach ($bridges as $int) {
            array_push($configurable_interfaces, $int);
        }
    }
    if ($net_conf["vlans"]) {
        $vlans = array_keys($net_conf["vlans"]);
        foreach ($vlans as $int) {
            if ($int != $gw) array_push($configurable_interfaces, $int);
        }
    }

    /*

    $configurable_interfaces = [];
    foreach ($all_interfaces as $interface) {
        exec("ip a show $interface", $$interface);
        // Add all interfaces if dhcp mode (excluding lo), and only those that do not act as hotspot nor the gw of current bridge (except lo) in dumb mode
        if ($interface != "lo") {
            if ($dumbap_config["mode"] == "dhcp") {
                array_push($configurable_interfaces, $interface);
            }
            else {
                $bridge = $dumbap_config["mode"]["bridge"]["name"];
                if ($interface != $hotspot && $interface != $dumbap_config["mode"]["bridge"]["gw"]) {
                    array_push($configurable_interfaces, $interface);
                }
            }
        }
    }
    // If we just changed to bridge but did not reboot, the bridge has not been created yet and won't appear in /sys/class/net, so we add it in this case
    if (array_key_exists("bridge",$dumbap_config)) {
        if (!in_array($bridge, $all_interfaces)) {
            array_push($configurable_interfaces, $bridge);
        }
    }
    */
    echo renderTemplate("networking", compact("status", "all_interfaces", "configurable_interfaces"));
}
