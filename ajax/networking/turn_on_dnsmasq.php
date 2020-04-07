<?php

require_once '../../includes/config.php';

exec("sudo service dnsmasq restart", $out, $code);

if ($code) {
    $jsonData = ['return'=>1, 'output'=> 'Dnsmasq failed to start.'];
}
else {
    $jsonData = ['return'=>0, 'output'=> 'Dnsmasq started successfully.'];
}

echo json_encode($jsonData);

?>