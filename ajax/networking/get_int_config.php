<?php

require '../../includes/csrf.php';

require_once '../../includes/config.php';
require_once "../../includes/functions.php";

$network_conf = getNetworkConfig();
$jsonData = ['return'=>0,'output'=>$network_conf];
echo json_encode($jsonData);
