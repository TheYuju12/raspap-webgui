<?php

require '../../includes/config.php';

$network_conf = yaml_parse_file(RASPI_NETPLAN_CONFIG);
$jsonData = ['return'=>0,'output'=>$network_conf];
echo json_encode($jsonData);
