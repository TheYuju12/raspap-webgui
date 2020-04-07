<?php

require_once '../../includes/config.php';

exec("sudo service hostapd restart", $out, $code);

if ($code) {
    $jsonData = ['return'=>1,'output'=>'Hostapd failed to start.'];
}
else {
    $jsonData = ['return'=>0,'output'=>'Hostapd started successfully.'];
}

echo json_encode($jsonData);

?>