<?php

require '../../includes/csrf.php';

require_once '../../includes/config.php';
require_once '../../includes/functions.php';

// Get new hostapd and dumbap configuration in json format and write to files
$hostapd_config = json_decode($_POST['hostapd_conf'], TRUE);
write_php_ini($hostapd_config, RASPI_HOSTAPD_CONFIG);
$dumbap_config = json_decode($_POST['dumbap_conf'], TRUE);
yaml_emit_file(DUMBAP_CONFIG_FILE, $dumbap_config);
// Restart hostapd
exec("sudo service hostapd restart", $output, $exit_code);
// Return status code
if (!$exit_code) {
    $jsonData = ['return'=>0,'output'=>'Hostapd was restarted correctly.'];
}
else {
    $jsonData = ['return'=>1,'output'=>'Hostapd failed to restart.'];
}

echo json_encode($jsonData);