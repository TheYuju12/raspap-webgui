<?php

require '../../includes/csrf.php';

require_once '../../includes/config.php';
require_once '../../includes/functions.php';

$new_config = json_decode($_POST['new_config']);
// Write new config to file
$jsonFile = RASPI_CONFIG_NETWORKING . "/" . CONFIG_NETWORK_FILENAME . ".json";
file_put_contents($jsonFile, json_encode($new_config));
// Export to yaml using python
exec("python3 " . RASPI_SCRIPTS . "/yaml_operations.py" . " json_to_yaml " . $jsonFile);
// And move resulting file to proper location
$yamlFile = RASPI_CONFIG_NETWORKING . "/" . CONFIG_NETWORK_FILENAME . ".yaml";
exec("sudo " . RASPI_SCRIPTS . "/update_network_config.sh " . $yamlFile, $output, $exit_code);

if (!$exit_code) {
    $jsonData = ['return'=>0,'output'=>['Successfully updated network configuration.'], "new_config" => $new_config];
}
else {
    exec("rm " . $jsonFile . " " . $yamlFile);
    $jsonData = ['return'=>1,'output'=>['Error saving network configuration to file.']];
}

echo json_encode($jsonData);