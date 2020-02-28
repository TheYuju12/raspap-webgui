var adapter_type = "";
var saved_interfaces = {};

function msgShow(retcode,msg) {
    if(retcode == 0) {
        var alertType = 'success';
    } else if(retcode == 2 || retcode == 1) {
        var alertType = 'danger';
    }
    var htmlMsg = '<div class="alert alert-'+alertType+' alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+msg+'</div>';
    return htmlMsg;
}

function validateIPaddress(ipaddress) {  
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {  
      return true; 
    } 
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

function netmask2netplan(mask)
{
    var maskNodes = mask.match(/(\d+)/g);
    var cidr = 0;
    for(var i in maskNodes)
    {
    cidr += (((maskNodes[i] >>> 0).toString(2)).match(/1/g) || []).length;
    }
    return cidr;
}

function createNetmaskAddr(bitCount) {
  var mask=[];
  for(i=0;i<4;i++) {
    var n = Math.min(bitCount, 8);
    mask.push(256 - Math.pow(2, 8-n));
    bitCount -= n;
  }
  return mask.join('.');
}

function loadSummary(strInterface) {
    $.post('ajax/networking/get_ip_summary.php',{interface:strInterface},function(data){
        jsonData = JSON.parse(data);
        console.log(jsonData);
        if(jsonData['return'] == 0) {
            $('#'+strInterface+'-summary').html(jsonData['output'].join('<br />'));
        } else if(jsonData['return'] == 2) {
            $('#'+strInterface+'-summary').append('<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+jsonData['output'].join('<br />')+'</div>');
        }
    });
}

function getAllInterfaces() {
    $.get('ajax/networking/get_all_interfaces.php',function(data){
        jsonData = JSON.parse(data);
        $.each(jsonData,function(ind,int){
            loadSummary(int)
            // Set on change functions for DHCP and Static IP radio buttons in networking tab
            $('#'+int+'-dhcp').change(function(e) {
                hideNetworkingErrors(int);
                hideNetworkingAlerts(int);
                clearInterfaceSettings(int);
                $('#'+int+'-ipaddress').prop("disabled", true);
                $('#'+int+'-netmask').prop("disabled", true);
                $('#'+int+'-gateway').prop("disabled", true);
                $('#'+int+'-dnssvr').prop("disabled", true);
                $('#'+int+'-dnssvralt').prop("disabled", true);
            })
            $('#'+int+'-static').change(function(e) {
                hideNetworkingAlerts(int);
                if (adapter_type == "wifis") {
                    // Disable all fields but ip and netmask
                    $('#'+int+'-ipaddress').prop("disabled", false);
                    $('#'+int+'-netmask').prop("disabled", false);
                    $('#'+int+'-gateway').prop("disabled", true);
                    $('#'+int+'-dnssvr').prop("disabled", true);
                    $('#'+int+'-dnssvralt').prop("disabled", true);
                }
                else {
                    $('#'+int+'-ipaddress').prop("disabled", false);
                    $('#'+int+'-netmask').prop("disabled", false);
                    $('#'+int+'-gateway').prop("disabled", false);
                    $('#'+int+'-dnssvr').prop("disabled", false);
                    $('#'+int+'-dnssvralt').prop("disabled", false);
                }
            })
        });
    });
}

function setupTabs() {
    $('a[data-toggle="tab"]').on('shown.bs.tab',function(e){
        var target = $(e.target).attr('href');
        if(!target.match('summary')) {
            var int = target.replace("#","");
            loadCurrentSettings(int);
        }
    });
}

/**
 * Used by main method loadCurrentSettings to abstract functionality.
 * 
 * @param {*} int The interface whose settings we're loading.
 * @param {*} info Netplan information of a particular interface through an associative array (dict).
 * 
 */

function loadInterfaceSettings(int, info) {
    if (info["dhcp4"]) {
        $("input[name=" + int + "-addresstype]").prop("disabled", false);
        $('#'+int+'-dhcp').click();
    }
    else {
        $('#'+int+'-static').click();
        //$('#'+int+'-nofailover').click();
        for (let addr of info["addresses"]) {
            var arrIPNetmask = addr.split('/');
            $('#'+int+'-ipaddress').val(arrIPNetmask[0]);
            $('#'+int+'-netmask').val(createNetmaskAddr(arrIPNetmask[1]));
        }
        if (adapter_type == "wifis") {
            $("input[name=" + int + "-addresstype]").prop("disabled", true);
        }
        else {
            $("input[name=" + int + "-addresstype]").prop("disabled", false);
            // Fill fields
            $('#'+int+'-gateway').val(info["gateway4"]);
            $('#'+int+'-dnssvr').val(info["nameservers"]["addresses"][0]);
            $('#'+int+'-dnssvralt').val(info["nameservers"]["addresses"][1]);
        }
    }
}
/**
 * Gets information about the given interface and displays it through web UI.
 * @param {*} strInterface The interfaces whose settings we're loading.
 * @param {*} force_post False by default, if set to true previous saved settings in memory (if any) won't be used. Instead, 
 * a POST to PHP backend will always be performed to gather information about the interface.
 */
function loadCurrentSettings(strInterface, force_post=false) {
    hideNetworkingAlerts(strInterface);
    hideNetworkingErrors(strInterface);
    if (strInterface.includes("br")) {
        adapter_type = "bridges";
    }
    else if (strInterface.includes("eth")) {
        adapter_type = "ethernets";
    }
    else if (strInterface.includes("wlan")) {
        adapter_type = "wifis";
    }
    if (!force_post && strInterface in saved_interfaces) {
        // Use cached information (previously saved)
        loadInterfaceSettings(strInterface, saved_interfaces[strInterface]);
    }
    else {
        // Get the information directly from the configuration file (actually this isn't 100% true, see the php script for more info).
        $.post('ajax/networking/get_int_config.php',{interface:strInterface},function(data) {
            jsonData = JSON.parse(data);
            console.log(jsonData);
            var int = strInterface;
            var info = jsonData["output"]["network"][adapter_type][int];
            loadInterfaceSettings(strInterface, info);
        });
    }
    
}

function resetNetworkSettings(strInterface) {
    loadCurrentSettings(strInterface, true);
}

/**
 * Checks for configuration errors in a given interface and displays warnings about these errors, if any.
 * 
 * @param {*} int Interface whose configuration we're going to check.
 * @returns {boolean} True if any error is found, false otherwise.
 */

function networkSettingsHasErrors(int) {
    var error = false;
    var ip = $('#'+int+'-ipaddress').val()
    var mask = $('#'+int+'-netmask').val();
    var gw = $('#'+int+'-gateway').val();
    var dns1 = $('#'+int+'-dnssvr').val();
    var dns2 = $('#'+int+'-dnssvralt').val(); 
    if (!ip) {
        $('#'+int+'-ipaddress-empty').css("display", "inline");
        error = true;
    }
    else {
        $('#'+int+'-ipaddress-empty').css("display", "none");
        if (!validateIPaddress(ip)) {
            $('#'+int+'-ipaddress-invalid').css("display", "inline");
            error = true;
        }
        else 
            $('#'+int+'-ipaddress-invalid').css("display", "none");
    }
    if (!mask) {
        $('#'+int+'-netmask-empty').css("display", "inline");
        error = true;
    }
    else {
        $('#'+int+'-netmask-empty').css("display", "none");
        if (!validateIPaddress(mask)) {
            $('#'+int+'-netmask-invalid').css("display", "inline");
            error = true;
        }
        else 
            $('#'+int+'-netmask-invalid').css("display", "none");
    }
    if (!gw && adapter_type != "wifis") {
        $('#'+int+'-gateway-empty').css("display", "inline");
        error = true;
    }
    else {
        if (gw) {
            $('#'+int+'-gateway-empty').css("display", "none");
            if (!validateIPaddress(gw)) {
                $('#'+int+'-gateway-invalid').css("display", "inline");
                error = true;
            }
            else 
                $('#'+int+'-gateway-invalid').css("display", "none");
        }
        else 
            $('#'+int+'-dnssvr-invalid').css("display", "none");
        
    }
    if (!dns1 && adapter_type != "wifis") {
        $('#'+int+'-dnssvr-empty').css("display", "inline");
        error = true;
    }
    else {
        if (dns1) {
            $('#'+int+'-dnssvr-empty').css("display", "none");
            if (!validateIPaddress(dns1)) {
                $('#'+int+'-dnssvr-invalid').css("display", "inline");
                error = true;
            }
            else 
                $('#'+int+'-dnssvr-invalid').css("display", "none");
        }
        else 
            $('#'+int+'-dnssvr-invalid').css("display", "none");
    }
    if (dns2 && !validateIPaddress(dns2)) {
        $('#'+int+'-dnssvralt-invalid').css("display", "inline");
        error = true;
    }
    else $('#'+int+'-dnssvralt-invalid').css("display", "none");

    return error;
}

/**
 * Saves the network settings of an interface. If 'apply' is set to true this function also applies the new configuration using saved settings for all interfaces.
 * @param {*} strInterface The interface whose setting we're saving.
 * @param {*} apply False by default, when set to true the user will be asked for confirmation to apply the changes.
 */

function saveNetworkSettings(strInterface, apply=false) {
    hideNetworkingErrors(strInterface);
    hideNetworkingAlerts(strInterface);
    // Get current configuration as JSON in order to modify it
    $.post('ajax/networking/get_int_config.php',{interface:strInterface},function(data){
        var jsonData = JSON.parse(data);
        if (jsonData["return"]) {
            console.log("Error executing ajax routine: ajax/networking/get_int_config.php.");
            return;
        }
        jsonData = jsonData["output"];
        var int = strInterface;
        var info = jsonData["network"][adapter_type][int];
        if ($('#'+int+'-dhcp').prop("checked")) {
            // If dhcp, we're good to go, just delete static configuration fields (if any) from dict and clear static configuration values from view
            info["dhcp4"] = true;
            delete info["addresses"];
            delete info["gateway4"];
            delete info["nameservers"];
            clearInterfaceSettings(int);
        }
        else {
            // If static configuration, we need to check that all required inputs are filled (only dns2 is optional)
            if (networkSettingsHasErrors(int)) {
                return;
            }
            // If everything alright proceed
            if (info["dhcp4"]) {
                delete info["dhcp4"];
            }
            var ips = []; // Netplan uses an array of ip addresses, but we will only allow the user to establish one
            ips.push($('#'+int+'-ipaddress').val() + "/" + netmask2netplan($('#'+int+'-netmask').val()));
            info["addresses"] = ips;
            // If wlan we don't storage gateway and dns
            if (strInterface.includes("wlan")) {
                delete info["gateway4"];
                delete info["nameservers"];
            }
            else {
                info["gateway4"] = $('#'+int+'-gateway').val();
                var dns_addresses = [];
                dns_addresses.push($('#'+int+'-dnssvr').val())
                if ($('#'+int+'-dnssvralt').val()) {
                    dns_addresses.push($('#'+int+'-dnssvralt').val())
                }
                const nameserver = {
                    addresses: []
                }
                ns = Object.create(nameserver);
                ns.addresses = dns_addresses;
                info["nameservers"] = ns;
            }
        }
        // Save info apply changes if requested
        saved_interfaces[int] = info;
        console.log(jsonData);
        //Visual feedback
        $('#'+int+'-success-msg').css("display", "block");
        $('#'+int+'-success-msg-close').click(function (e) {
            $('#'+int+'-success-msg').css("display", "none");
        }); 
        if (apply) {
            applyNetworkSettings(jsonData);
        }
    });
}

function applyNetworkSettings(jsonData) {
    var confirm_msg = "A reboot is needed to apply a new network configuration.";
    $.confirm({
        title: 'Apply changes',
        content: confirm_msg,
        type: "orange",
        typeAnimated: true,
        buttons: {
            confirm: {
                text: "Continue",
                btnClass: "btn-orange",
                typeAnimated: true,
                action: function () {
                    // Put the pieces together
                    var interfaces = Object.keys(saved_interfaces);
                    $.each(interfaces, function (index, int) {
                        if (int.includes("wlan")) {
                            jsonData["network"]["wifis"][int] = saved_interfaces[int];
                        }
                        else if (int.includes("eth")) {
                            jsonData["network"]["ethernets"][int] = saved_interfaces[int];
                        }
                        else {
                            jsonData["network"]["bridges"][int] = saved_interfaces[int];
                        }
                    });
                    console.log(jsonData);
                    // Send a POST through Ajax to apply changes with a php script.
                    $.ajax({
                        type:"POST",
                        url: "ajax/networking/save_int_config.php",
                        data: {new_config: JSON.stringify(jsonData)},
                    }).done(function (response) {
                            data = JSON.parse(response);
                            if (!response["return"]) {
                                $.alert('Rebooting device...');
                                $.post("ajax/system/reboot.php", "", function() {
                                    // System will reboot
                                });
                            }
                            else {
                                $.alert({
                                    text: 'Ups, something were wrong. Network configuration was not updated.',
                                    type: "red",
                                    typeAnimated: true
                                });
                            }
                        });
                }
            },
            cancel: {
                text: "Cancel"
            }
        }
    }); 
}

$(document).on("click", ".js-add-dhcp-static-lease", function(e) {
    e.preventDefault();
    var container = $(".js-new-dhcp-static-lease");
    var mac = $("input[name=mac]", container).val().trim();
    var ip  = $("input[name=ip]", container).val().trim();
    if (mac == "" || ip == "") {
        return;
    }
    var row = $("#js-dhcp-static-lease-row").html()
        .replace("{{ mac }}", mac)
        .replace("{{ ip }}", ip);
    $(".js-dhcp-static-lease-container").append(row);

    $("input[name=mac]", container).val("");
    $("input[name=ip]", container).val("");
});

$(document).on("click", ".js-remove-dhcp-static-lease", function(e) {
    e.preventDefault();
    $(this).parents(".js-dhcp-static-lease-row").remove();
});

$(document).on("submit", ".js-dhcp-settings-form", function(e) {
    $(".js-add-dhcp-static-lease").trigger("click");
});

function clearInterfaceSettings(int) {
    $('#'+int+'-ipaddress').val("");
    $('#'+int+'-netmask').val("");
    $('#'+int+'-gateway').val("");
    $('#'+int+'-dnssvr').val("");
    $('#'+int+'-dnssvralt').val("");
}

function hideNetworkingAlerts(int) {
    $("#"+int+"-error-msg").css("display", "none");
    $("#"+int+"-success-msg").css("display", "none");
}

function hideNetworkingErrors(int) {
    $('#'+int+'-ipaddress-empty').css("display", "none");
    $('#'+int+'-netmask-empty').css("display", "none");
    $('#'+int+'-gateway-empty').css("display", "none");
    $('#'+int+'-dnssvr-empty').css("display", "none");
    $('#'+int+'-ipaddress-invalid').css("display", "none");
    $('#'+int+'-netmask-invalid').css("display", "none");
    $('#'+int+'-gateway-invalid').css("display", "none");
    $('#'+int+'-dnssvr-invalid').css("display", "none");
    $('#'+int+'-dnssvralt-invalid').css("display", "none");
}

function setupBtns() {
    $('#btnSummaryRefresh').click(function(){getAllInterfaces();});
    $('.intsave').click(function() {
        var int = $(this).data('int');
        saveNetworkSettings(int);
    });
    $('.intreset').click(function() {
        var int = $(this).data('int');
        resetNetworkSettings(int);
    });
    $('.intapply').click(function() {
        var int = $(this).data('int');
        saveNetworkSettings(int, true);
    });
}

function setCSRFTokenHeader(event, xhr, settings) {
    var csrfToken = $('meta[name=csrf_token]').attr('content');
    if (/^(POST|PATCH|PUT|DELETE)$/i.test(settings.type)) {
        xhr.setRequestHeader("X-CSRF-Token", csrfToken);
    }
}

function contentLoaded() {
    pageCurrent = window.location.href.split("?")[1].split("=")[1];
    pageCurrent = pageCurrent.replace("#","");
    var mode = $("#op_mode-select").val();
    //if (!mode) mode = "dhcp";
    $("#op_mode-description").text(op_mode_descriptions[mode]);
    if (pageCurrent == "network_conf") {
        getAllInterfaces();
        setupTabs();
        setupBtns();
    }
    else {
        // We will only maintain saved interface settings while we are in networking page
        saved_interfaces = [];
        if (pageCurrent == "hostapd_conf") {
            loadChannel();
        }
    }
}

function loadWifiStations(refresh) {
    return function() {
        var complete = function() { $(this).removeClass('loading-spinner'); }
        var qs = refresh === true ? '?refresh' : '';
        $('.js-wifi-stations')
            .addClass('loading-spinner')
            .empty()
            .load('ajax/networking/wifi_stations.php'+qs, complete);
    };
}

$(".js-reload-wifi-stations").on("click", loadWifiStations(true));

function loadChannel() {
    $.get('ajax/networking/get_channel.php',function(data){
        jsonData = JSON.parse(data);
        loadChannelSelect(jsonData);
    });
}

/*
Sets the wirelss channel select options based on hw_mode and country_code.

Methodology: In North America up to channel 11 is the maximum allowed WiFi 2.4Ghz channel,
except for the US that allows channel 12 & 13 in low power mode with additional restrictions.
Canada allows channel 12 in low power mode. Because it's unsure if low powered mode can be
supported the channels are not selectable for those countries. Also Uzbekistan and Colombia
allow up to channel 11 as maximum channel on the 2.4Ghz WiFi band.
Source: https://en.wikipedia.org/wiki/List_of_WLAN_channels
Additional: https://git.kernel.org/pub/scm/linux/kernel/git/sforshee/wireless-regdb.git
*/
function loadChannelSelect(selected) {

    // Fetch wireless regulatory data
    $.getJSON("config/wireless.json", function(json) {
        var hw_mode = $('#cbxhwmode').val();
        var country_code = $('#cbxcountries').val();
        var channel_select = $('#cbxchannel');
        var data = json["wireless_regdb"];
        var selectablechannels = Array.range(1,14);

        // Assign array of countries to valid frequencies (channels)
        var countries_2_4Ghz_max11ch = data["2_4GHz_max11ch"].countries;
        var countries_2_4Ghz_max14ch = data["2_4GHz_max14ch"].countries;
        var countries_5Ghz_max48ch = data["5Ghz_max48ch"].countries;

        // Map selected hw_mode and country to determine channel list
        if (($.inArray(country_code, countries_2_4Ghz_max11ch) !== -1) && (hw_mode !== 'ac') ) {
            selectablechannels = data["2_4GHz_max11ch"].channels;
        } else if (($.inArray(country_code, countries_2_4Ghz_max14ch) !== -1) && (hw_mode === 'b')) {
            selectablechannels = data["2_4GHz_max14ch"].channels;
        } else if (($.inArray(country_code, countries_5Ghz_max48ch) !== -1) && (hw_mode === 'ac')) {
            selectablechannels = data["5Ghz_max48ch"].channels;
        }

        // Set channel select with available values
        selected = (typeof selected === 'undefined') ? selectablechannels[0] : selected;
        channel_select.empty();
        $.each(selectablechannels, function(key,value) {
            channel_select.append($("<option></option>").attr("value", value).text(value));
        });
        channel_select.val(selected);
    });
}

// Static Array method
Array.range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

$(document).on("click", ".js-toggle-password", function(e) {
    var button = $(e.target)
    var field  = $(button.data("target"));
    if (field.is(":input")) {
        e.preventDefault();

        if (!button.data("__toggle-with-initial")) {
            button.data("__toggle-with-initial", button.text())
        }

        if (field.attr("type") === "password") {
            button.text(button.data("toggle-with"));
            field.attr("type", "text");
        } else {
            button.text(button.data("__toggle-with-initial"));
            field.attr("type", "password");
        }
    }
});

$(document).on("keyup", ".js-validate-psk", function(e) {
    var field  = $(e.target);
    var colors = field.data("colors").split(",");
    var target = $(field.data("target"));
    if (field.val().length < 8 || field.val().length > 63) {
        field.css("backgroundColor", colors[0]);
        target.attr("disabled", true);
    } else {
        field.css("backgroundColor", colors[1]);
        target.attr("disabled", false);
    }
});

$(function() {
    $('#theme-select').change(function() {
        var theme = themes[$( "#theme-select" ).val() ]; 
        set_theme(theme);
   });
   $('#op_mode-select').change(function() {
        var op_mode = $("#op_mode-select").val(); 
        $("#op_mode-description").html(op_mode_descriptions[op_mode]);
    });
});


function set_theme(theme) {
    $('link[title="main"]').attr('href', 'app/css/' + theme);
    // persist selected theme in cookie 
    setCookie('theme',theme,90);
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var regx = new RegExp(cname + "=([^;]+)");
    var value = regx.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

var themes = {
    "default": "custom.css",
    "hackernews" : "hackernews.css",
    "terminal" : "terminal.css",
}

var op_mode_descriptions = {
    "dhcp" : "A DHCP server powered by dnsmasq will be launched along with the AP.",
    "bridge" : "A shared connection between your wireless interface used as hotspot and your interface connected to the Internet will be established. \
                <strong>No DHCP server will be deployed</strong>. Instead, the AP will use the DHCP server of the connected interface added to the bridge. \
                This mode allows you to set up a pure access point (also known as <strong>Dumb AP</strong>)."
}

// Toggles the sidebar navigation.
// Overrides the default SB Admin 2 behavior
$("#sidebarToggleTopbar").on('click', function(e) {
    $("body").toggleClass("sidebar-toggled");
    $(".sidebar").toggleClass("toggled d-none");
});

// Overrides SB Admin 2
$("#sidebarToggle, #sidebarToggleTop").on('click', function(e) {
    var toggled = $(".sidebar").hasClass("toggled");
    // Persist state in cookie
    setCookie('sidebarToggled',toggled, 90);
});

$(function() {
    if ($(window).width() < 768) {
        $('.sidebar').addClass('toggled');
        setCookie('sidebarToggled',false, 90);
    }
});

$(window).on("load resize",function(e) {
    if ($(window).width() > 768) {
        $('.sidebar').removeClass('d-none d-md-block');
        if (getCookie('sidebarToggled') == 'false') {
            $('.sidebar').removeClass('toggled');
        }
    }    
});

// Adds active class to current nav-item
$(window).bind("load", function() {
    var url = window.location;
    $('ul.navbar-nav a').filter(function() {
      return this.href == url;
    }).parent().addClass('active');
});

$(document)
    .ajaxSend(setCSRFTokenHeader)
    .ready(contentLoaded)
    .ready(loadWifiStations());
