<?php

require_once '../../includes/config.php';

$hostapd_conf = parse_ini_file(RASPI_HOSTAPD_CONFIG);
echo json_encode($hostapd_conf);

?>