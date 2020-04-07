<?php

require_once '../../includes/config.php';

exec("sudo service dnsmasq stop", $out, $code);

if ($code) {
    $jsonData = ['return'=>1, 'output'=>'Dnsmasq failed to stop.'];
}
else {
    $jsonData = ['return'=>0, 'output'=>'Dnsmasq stopped successfully.'];
}

echo json_encode($jsonData);

?>