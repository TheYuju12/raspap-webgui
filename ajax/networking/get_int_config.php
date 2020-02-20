<?php

require '../../includes/csrf.php';

require_once '../../includes/config.php';
require_once '../../includes/functions.php';

if (isset($_POST['interface'])) {

    exec("python3 yaml_to_json" . NETPLAN_CONFIG);
    // TODO Read json file located in RASPI_CONFIG_NETWORKING and called 
    $jsonData = ['return'=>1,'output'=>['intConfig'=>$data]];
    echo json_encode($jsonData);
}
else {
    $jsonData = ['return'=>2,'output'=>['Error getting data']];
    echo json_encode($jsonData);
}
