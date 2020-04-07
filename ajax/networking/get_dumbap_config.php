<?php 

require '../../includes/config.php';
require "../../includes/functions.php";

$dumbap_data = yaml_parse_file(DUMBAP_CONFIG_FILE);
$jsonData = ['return'=>0,'output'=>$dumbap_data];
echo json_encode($jsonData);