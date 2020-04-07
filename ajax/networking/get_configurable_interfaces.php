<?php

require '../../includes/csrf.php';
require_once '../../includes/config.php';

$dumbap_config = yaml_parse_file(DUMBAP_CONFIG_FILE);
$network_config = yaml_parse_file(RASPI_NETPLAN_CONFIG);

$conf_ints = [];
$hotspot = $dumbap_config["hotspot"];
if (array_key_exists("bridge", $dumbap_config["mode"])) $gw = $dumbap_config["mode"]["bridge"]["gw"];

$conf = $network_config["network"];
if (array_key_exists("ethernets", $conf)) {
    $ethernets = array_keys($conf["ethernets"]);
    foreach ($ethernets as $int) {
        if ($int != $gw) $conf_ints[$int] = "ethernets";
    }
}
if (array_key_exists("wifis", $conf)) {
    $wifis = array_keys($conf["wifis"]);
    foreach ($wifis as $int) {
        if (!$gw) $conf_ints[$int] = "wifis";
        else if ($int != $gw && $int != $hotspot) $conf_ints[$int] = "wifis";
    }
}
if (array_key_exists("bridges", $conf)) {
    $bridges = array_keys($conf["bridges"]);
    foreach ($bridges as $int) {
        $conf_ints[$int] = "bridges";
    }
}
if (array_key_exists("vlans", $conf)) {
    $vlans = array_keys($conf["vlans"]);
    foreach ($vlans as $int) {
        if ($int != $gw) $conf_ints[$int] = "vlans";
    }
}

$jsonData = ["return" => 0, "output" => $conf_ints];

echo json_encode($jsonData);

?>