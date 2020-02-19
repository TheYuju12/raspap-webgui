<?php

require '../../includes/csrf.php';

exec("ls /sys/class/net | grep br", $interfaces);
echo json_encode($interfaces);
