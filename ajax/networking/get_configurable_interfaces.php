<?php

require '../../includes/csrf.php';

exec("ls /sys/class/net | grep -i -E 'br|wlan'", $interfaces);

echo json_encode($interfaces);
