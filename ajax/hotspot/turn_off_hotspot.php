<?php

require_once '../../includes/config.php';

exec("sudo service hostapd stop", $out, $code);

if ($code) {
    $jsonData = ['return'=>1,'output'=>'Hostapd failed to stop.'];
}
else {
    $jsonData = ['return'=>0,'output'=>'Hostapd stopped successfully.'];
}

echo json_encode($jsonData);

?>