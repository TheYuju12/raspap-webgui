<?php

require '../../includes/csrf.php';

require_once '../../includes/config.php';
require_once '../../includes/functions.php';

// Get new network configuration in json format
$net_config = json_decode($_POST['net_config'], TRUE);
// Write new netplan's file (yaml)
yaml_emit_file(RASPI_NETPLAN_CONFIG, $net_config);
// Apply configuration
exec("sudo netplan apply", $output, $exit_code);

if (!$exit_code) {
    $jsonData = ['return'=>0,'output'=>'Successfully updated network configuration.', "net_config" => $net_config];
}
else if ($exit_code == 1) {
    $jsonData = ['return'=>0,'output'=>'Successfully updated network configuration. Python internal error detected, but no syntax errors found.', "net_config" => $net_config];
}
else {
    $jsonData = ['return'=>$exit_code,'output'=>'Netplan failed to update network configuration.'];
}

echo json_encode($jsonData);
?>