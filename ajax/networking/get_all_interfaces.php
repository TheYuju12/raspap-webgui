<?php

require '../../includes/csrf.php';
require_once '../../includes/config.php';
require_once '../../includes/functions.php';

exec("ls /sys/class/net", $interfaces);

$dumbap_config = yaml_parse_file(DUMBAP_CONFIG_FILE);

if (array_key_exists("bridge", $dumbap_config["mode"])) {
    $bridge = $dumbap_config["mode"]["bridge"]["name"];
    if (!in_array($bridge, $interfaces)) {
        array_push($interfaces, $bridge);
    }
}

echo json_encode($interfaces);
