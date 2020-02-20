<?php

require '../../includes/csrf.php';

require_once '../../includes/config.php';
require_once '../../includes/functions.php';

if (isset($_POST['interface'])) {
    $jsonFile = RASPI_CONFIG_NETWORKING . CONFIG_NETWORK_FILENAME . ".json";
    // Check if json file exists: if it does, call python script to convert it into a yaml file
    if (file_exists($jsonFile)) {
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
