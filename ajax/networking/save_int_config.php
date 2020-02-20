<?php

require '../../includes/csrf.php';

require_once '../../includes/config.php';
require_once '../../includes/functions.php';

$int = $_POST['interface'];

if (isset($int)) {
    $jsonFile = RASPI_CONFIG_NETWORKING . CONFIG_NETWORK_FILENAME . ".json";
    // Check if json file exists: if it does, modify it and call python script to convert it into a yaml file
    if (file_exists($jsonFile)) {
        $filedata = json_decode($jsonFile, true);
        $data = $filedata["network"]["bridges"]["br0"];
        $dhcp = !$_POST[$int . "-static"];
        if ($dhcp) {
            if (!$data["dhcp4"]) {
                $data["dhcp4"] = true;
            }
            if ($data["addresses"]) {
                unset($data["addresses"]);
            }
            if ($data["gateway4"]) {
                unset($data["gateway4"]);
            }
            if ($data["nameservers"]) {
                unset($data["nameservers"]);
            }
        }
        else {
            $ip = $_POST[$int . "-static"];
            $netmask = mask2cidr($_POST[$int . "-netmask"]);
            $gw = $_POST[$int . "-routers"];
            $dns1 = $_POST[$int . "-dnssvr"];
            $dns2 = $_POST[$int . "-dnssvralt"];
            if ($data["dhcp4"]) {
                unset($data["dhcp4"]);
            }
            $data["addresses"] = "[" . $ip . "/" . $netmask . "]";
            $data["gateway4"] = $gw;
            if ($dns1) {
                $data["nameservers"]["addresses"] = "[" . $dns1;
                if ($dns2) {
                    $data["nameservers"]["addresses"] = $data["nameservers"]["addresses"] . ", " . $dns2 . "]";
                }
                else {
                    $data["nameservers"]["addresses"] = $data["nameservers"]["addresses"] . "]";
                }
            }
            
        }
        // Save changes to file
        file_put_contents($jsonFile, json_encode($filedata));
        // Export to yaml using python
        exec("python3 " . YAML_SCRIPT . "json_to_yaml " . $jsonFile);
        // And move resulting file to proper location
        $yamlFile = RASPI_CONFIG_NETWORKING . CONFIG_NETWORK_FILENAME . ".yaml";
        exec("mv " . $yamlFile . NETPLAN_CONFIG_DIR);
        $jsonData = ['return'=>0,'output'=>['Successfully Updated Network Configuration']];
    }
    else {
        $jsonData = ['return'=>1,'output'=>['Error saving network configuration to file']];
    }
} else {
    $jsonData = ['return'=>2,'output'=>'Unable to detect interface'];
}

echo json_encode($jsonData);
