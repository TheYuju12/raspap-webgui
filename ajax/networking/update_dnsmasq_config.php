<?php

require_once "../../includes/config.php";
require_once "../../includes/functions.php";

$config = json_decode($_POST["dnsmasq_conf"], TRUE);
write_php_ini($config, RASPI_DNSMASQ_CONFIG);

exec("sudo service dnsmasq restart", $out, $code);

if ($code) $jsonData = ["return" => 1, "output" => "Dnsmasq failed to restart."];
else $jsonData = ["return" => 0, "output" => "Dnsmasq restarted successfully."];

echo json_encode($jsonData);
 
?>