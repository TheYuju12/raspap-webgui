<?php
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
    exec("ifconfig | grep dumbap-br", $out, $return_value);
    if ($return_value) {
        $selectedMode = "dhcp";
    }
    else {
        $selectedMode = "bridge";
    }
    echo renderTemplate("operation_mode", compact("modes", "selectedMode"));
}
