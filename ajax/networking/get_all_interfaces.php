<?php

require '../../includes/csrf.php';

exec("ls /sys/class/net", $interfaces);

echo json_encode($interfaces);
