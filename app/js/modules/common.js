export {
    is_a_valid_IP, isNumber, ip2long, netmask2cidr, cidr2netmask, 
    loadNetworkConfig, loadHostapdConf, loadDumbapConf, loadConfigurableInterfaces,
    net_conf, hostapd_conf, conf_ints, dumbap_conf
}

var net_conf, hostapd_conf, conf_ints, dumbap_conf;

function loadNetworkConfig(asynchronous=true) {
    $.ajax({
        type: "get",
        url: 'ajax/networking/get_int_config.php',
        async: asynchronous,
        success: function (data) {
            net_conf = JSON.parse(data)["output"];
            console.log(net_conf);
            return net_conf;
        }
    });
}

function loadHostapdConf(asynchronous=true) {
    $.ajax({
        type: "get",
        url: 'ajax/hotspot/get_hostapd_conf.php',
        async: asynchronous,
        success: function (data) {
            hostapd_conf = JSON.parse(data);
            console.log(hostapd_conf);
        }
    });
}

function loadDumbapConf(asynchronous=true) {
    $.ajax({
        type: "get",
        url: 'ajax/networking/get_dumbap_config.php',
        async: asynchronous,
        success: function (data) {
            dumbap_conf = JSON.parse(data)["output"];
            console.log(dumbap_conf);
        }
    });
}

function loadConfigurableInterfaces(asynchronous=true) {
    $.ajax({
        type: "get",
        url: 'ajax/networking/get_configurable_interfaces.php',
        async: asynchronous,
        success: function (data) {
            conf_ints = JSON.parse(data)["output"];
            console.log(conf_ints);
        }
    });
}


function is_a_valid_IP(ipaddress) {  
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {  
      return true; 
    } 
    return false;
}

function isNumber(string) {
    if (/^\d+$/.test(string)) return true;
    return false;
}

function ip2long (ip_address) {  
    // Converts a string containing an (IPv4) Internet Protocol dotted address into a proper address    
    //   
    // version: 901.714  
    // discuss at: http://phpjs.org/functions/ip2long  
    // +   original by: Waldo Malqui Silva  
    // +   improved by: Victor  
    // *     example 1: ip2long( '192.0.34.166' );  
    // *     returns 1: 3221234342  
    var output = false;  
    var parts = [];  
    if (ip_address.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {  
        parts  = ip_address.split('.');  
        output = ( parts[0] * 16777216 +  
        ( parts[1] * 65536 ) +  
        ( parts[2] * 256 ) +  
        ( parts[3] * 1 ) );  
    }  
    return output;  
}  

/*
    Transforms a given netmask with format X.X.X.X into a netmask with format /X
*/

function netmask2cidr(mask)
{
    var maskNodes = mask.match(/(\d+)/g);
    var cidr = 0;
    for(var i in maskNodes)
    {
    cidr += (((maskNodes[i] >>> 0).toString(2)).match(/1/g) || []).length;
    }
    return cidr;
}

function cidr2netmask(bitCount) {
  var mask=[];
  for(let i=0;i<4;i++) {
    var n = Math.min(bitCount, 8);
    mask.push(256 - Math.pow(2, 8-n));
    bitCount -= n;
  }
  return mask.join('.');
}