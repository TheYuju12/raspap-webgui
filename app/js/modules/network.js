import { cidr2netmask, netmask2cidr, is_a_valid_IP, loadConfigurableInterfaces, loadDumbapConf, loadNetworkConfig,
        net_conf, conf_ints, dumbap_conf
} from "./common.js";

export {
    setupNetworkUI
}

var hotspot;

function setupNetworkUI() {
    
    loadNetworkConfig(false);
    loadConfigurableInterfaces(false);
    loadDumbapConf(false);

    hotspot = dumbap_conf["hotspot"];

    getAllInterfaces();
    setupTabs();
    setupNetworkingBtns();
}

function getAllInterfaces() {
    $.get('ajax/networking/get_all_interfaces.php',function(data){
        var jsonData = JSON.parse(data);
        $.each(jsonData,function(ind,int){
            loadSummary(int);
        });
    });
}

function setupTabs() {
    var ints = Object.keys(conf_ints);
    for (let int of ints) {
        setupNetworkModeSelector(int);
        var type = conf_ints[int];
        loadInterfaceSettings(int, type, net_conf["network"][type][int]);
    };

    $('a[data-toggle="tab"]').on('shown.bs.tab',function(e){
        var target = $(e.target).attr('href');
        if(!target.match('summary')) {
            var int = target.replace("#","");
        }
    });
}

function setupNetworkingBtns() {
    $('#btnSummaryRefresh').click(function(){getAllInterfaces();});
    $('.intreset').click(function() {
        location.reload();
    });
    $('.intapply').click(function() {
        applySettings();
    });
}

/**
 * Applies current network settings by writing to the actual netplan's config file.
 */

function applySettings() {
    if (sanitizeInput()) {
        var confirm_msg = "Do you want to apply the new configuration? <br><strong>Some features may not work until a reboot is performed</strong>.";
        $.confirm({
            title: 'Apply changes',
            content: confirm_msg,
            type: "orange",
            icon: "fas fa-exclamation-triangle",
            typeAnimated: true,
            columnClass: "medium",
            buttons: {
                reboot_now: {
                    text: "Reboot now",
                    btnClass: "btn-orange",
                    typeAnimated: true,
                    action: function () {
                        saveSettings();
                        console.log(net_conf);
                        // Send a POST through Ajax to apply changes with a php script.
                        $.ajax({
                            type:"POST",
                            url: "ajax/networking/update_network_config.php",
                            data: {net_config: JSON.stringify(net_conf)},
                        })
                        .done(function (response) {
                            var resp = JSON.parse(response);
                            if (!resp["return"]) {
                                $.dialog({
                                    title: 'Rebooting device...',
                                    content: false,
                                    typeAnimated: true,
                                    icon: 'fa fa-spinner fa-spin'
                                });
                                $.ajax({
                                    type: "post",
                                    url: "ajax/system/reboot.php",
                                });
                            }
                            else {
                                $.alert({
                                    title: 'Ups, something were wrong :(',
                                    content: "Network configuration could not be updated.",
                                    type: "red",
                                    typeAnimated: true,
                                    icon: 'fas fa-exclamation-circle',
                                    buttons: {
                                        ok: {
                                            text: "Ok",
                                            action: function() {
                                                location.reload();
                                            }
                                        }
                                    }
                                });
                            }
                        });
                    }
                },
                reboot_later: {
                    text: "Reboot later",
                    action: function () {
                        saveSettings();
                        console.log(net_conf);
                        $.dialog({
                            title: 'Applying changes...',
                            content: false,
                            type: "orange",
                            typeAnimated: true,
                            icon: 'fa fa-spinner fa-spin'
                        });
                        // Send a POST through Ajax to apply changes with a php script.
                        $.ajax({
                            type:"POST",
                            url: "ajax/networking/update_network_config.php",
                            data: {net_config: JSON.stringify(net_conf)},
                        })
                        .done(function (response) {
                            var resp = JSON.parse(response);
                            console.log(resp);
                            if (!resp["return"]) {
                                $.alert({
                                    title: "Configuration updated!",
                                    content: "Don't forget to reboot for it to take effect.",
                                    type: "green",
                                    icon: "fas fa-check-circle",
                                    buttons: {
                                        ok: {
                                            text: "Ok",
                                            action: function() {
                                                location.reload();
                                            }
                                        }
                                    }
                                });
                            }
                            else {
                                $.alert({
                                    title: 'Ups, something were wrong :(',
                                    content: "Network configuration could not be updated.",
                                    type: "red",
                                    typeAnimated: true,
                                    buttons: {
                                        ok: {
                                            text: "Ok",
                                            action: function() {
                                                location.reload();
                                            }
                                        }
                                    }
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
    else {
        // Show visual feedback (since errors may be in other tab)
        $.alert({
            title: "Configuration could not be applied",
            content: "One or more errors where found processing the new configuration. Correct them to apply the changes.",
            type: "red",
            icon: "fas fa-exclamation-circle",
            columnClass: "medium"
        })
    }
}

/**
 * Checks for configuration errors in a given interface and displays warnings about these errors, if any.
 * 
 * @returns {boolean} True if no errors are found, false otherwise.
 */

function sanitizeInput() {
    var errors_free = true;

    for (let int of Object.keys(conf_ints)) {

        // If dhcp, skip interface
        if ($("#"+int+"-dhcp").prop("checked")) continue;

        var ip = $('#'+int+'-ipaddress').val()
        var mask = $('#'+int+'-netmask').val();
        var gw = $('#'+int+'-gateway').val();
        var dns1 = $('#'+int+'-dnssvr').val();
        var dns2 = $('#'+int+'-dnssvralt').val();
        if (!ip) {
            $('#'+int+'-ipaddress-empty').css("display", "inline");
            errors_free = false;
        }
        else {
            $('#'+int+'-ipaddress-empty').css("display", "none");
            if (!is_a_valid_IP(ip)) {
                $('#'+int+'-ipaddress-invalid').css("display", "inline");
                errors_free = false;
            }
            else 
                $('#'+int+'-ipaddress-invalid').css("display", "none");
        }
        if (!mask) {
            $('#'+int+'-netmask-empty').css("display", "inline");
            errors_free = false;
        }
        else {
            $('#'+int+'-netmask-empty').css("display", "none");
            if (!is_a_valid_IP(mask)) {
                $('#'+int+'-netmask-invalid').css("display", "inline");
                errors_free = false;
            }
            else 
                $('#'+int+'-netmask-invalid').css("display", "none");
        }

        // If hotspot, dont process anything else
        if (int == hotspot) continue;
        
        // Else, check gw and dns

        if (!gw && adapter_type != "wifis") {
            $('#'+int+'-gateway-empty').css("display", "inline");
            errors_free = false;
        }
        else {
            if (gw) {
                $('#'+int+'-gateway-empty').css("display", "none");
                if (!is_a_valid_IP(gw)) {
                    $('#'+int+'-gateway-invalid').css("display", "inline");
                    errors_free = false;
                }
                else 
                    $('#'+int+'-gateway-invalid').css("display", "none");
            }
            else 
                $('#'+int+'-dnssvr-invalid').css("display", "none");
            
        }
        if (!dns1 && adapter_type != "wifis") {
            $('#'+int+'-dnssvr-empty').css("display", "inline");
            errors_free = false;
        }
        else {
            if (dns1) {
                $('#'+int+'-dnssvr-empty').css("display", "none");
                if (!is_a_valid_IP(dns1)) {
                    $('#'+int+'-dnssvr-invalid').css("display", "inline");
                    errors_free = false;
                }
                else 
                    $('#'+int+'-dnssvr-invalid').css("display", "none");
            }
            else 
                $('#'+int+'-dnssvr-invalid').css("display", "none");
        }
        if (dns2 && !is_a_valid_IP(dns2)) {
            $('#'+int+'-dnssvralt-invalid').css("display", "inline");
            errors_free = false;
        }
        else $('#'+int+'-dnssvralt-invalid').css("display", "none");
    }

    return errors_free;
}

/**
 * Saves the network settings of all interfaces.
 */

function saveSettings() {

    for (let int of Object.keys(conf_ints)) {
        // makes changes to copy then substitute the original
        var info = net_conf["network"][conf_ints[int]][int];
        if ($('#'+int+'-dhcp').prop("checked")) {
            // If dhcp, just delete static configuration fields (if any) from dict and clear static configuration values from view
            info["dhcp4"] = true;
            delete info["addresses"];
            delete info["gateway4"];
            delete info["nameservers"];
            //clearInterfaceSettings(int);
        }
        else {
            // If static
            if (info["dhcp4"]) {
                delete info["dhcp4"];
            }
            var ips = []; // Netplan uses an array of ip addresses, but we will only allow the user to establish one
            ips.push($('#'+int+'-ipaddress').val() + "/" + netmask2cidr($('#'+int+'-netmask').val()));
            info["addresses"] = ips;
            // If hotspot, dont storage gw nor dns (this is prevented through disabled fields in UI)
            var gw = $('#'+int+'-gateway').val();
            var dns1 = $('#'+int+'-dnssvr').val();
            var dns2 = $('#'+int+'-dnssvralt').val();

            if (gw) info["gateway4"] = gw;

            var dns_addresses = [];
            if (dns1) dns_addresses.push(dns1);
            if (dns2) dns_addresses.push(dns2);
            if (dns_addresses.length > 0) {
                const nameserver = {
                    addresses: []
                }
                ns = Object.create(nameserver);
                ns.addresses = dns_addresses;
                info["nameservers"] = ns;
            }
        }
        //net_conf["network"][conf_ints[int]][int] = info;
    }
}

/**
 * Gets information about the given interface and displays it through web UI.
 * 
 * @param {*} int The interface whose settings we're loading.
 * @param {*} info Netplan information of a particular interface through an associative array (dictionary).
 * 
 */

function loadInterfaceSettings(int, adapter_type, info) {
    console.log(info);
    if (info["dhcp4"]) {
        //$("input[name=" + int + "-addresstype]").prop("disabled", false);
        $('#'+int+'-dhcp').click();
    }
    else {
        $('#'+int+'-static').click();
        if (int == hotspot) {
            $("#"+int+"-mode-toggle").prop("disabled", true);
            $("#"+int+"-dhcp").prop("disabled", true);
            $("#"+int+"-static").prop("disabled", true);
        }
        //$('#'+int+'-nofailover').click();
        for (let addr of info["addresses"]) {
            var arrIPNetmask = addr.split('/');
            $('#'+int+'-ipaddress').val(arrIPNetmask[0]);
            $('#'+int+'-netmask').val(cidr2netmask(arrIPNetmask[1]));
        }
        if (adapter_type == "wifis") {
            $("input[name=" + int + "-addresstype]").prop("disabled", true);
        }
        else {
            $("input[name=" + int + "-addresstype]").prop("disabled", false);
            // Fill fields
            $('#'+int+'-gateway').val(info["gateway4"]);
            if ("nameservers" in info) {
                $('#'+int+'-dnssvr').val(info["nameservers"]["addresses"][0]);
                if (info["nameservers"].length > 1) 
                    $('#'+int+'-dnssvralt').val(info["nameservers"]["addresses"][1]);
            }
        }
    }
}

function loadSummary(strInterface) {
    $.post('ajax/networking/get_ip_summary.php',{interface:strInterface},function(data){
        var jsonData = JSON.parse(data);
        console.log(jsonData);
        if(jsonData['return'] == 0) {
            $('#'+strInterface+'-summary').html(jsonData['output'].join('<br />'));
        } else if(jsonData['return'] == 2) {
            $('#'+strInterface+'-summary').append('<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+jsonData['output'].join('<br />')+'</div>');
        }
    });
}

function setupNetworkModeSelector(int) {
    // Set on change functions for DHCP and Static IP radio buttons in networking tab
    $('#'+int+'-dhcp').change(function(e) {
        if (int != hotspot) {
            hideNetworkingErrors(int);
            hideNetworkingAlerts(int);
            clearInterfaceSettings(int);
            $('#'+int+'-ipaddress').prop("disabled", true);
            $('#'+int+'-netmask').prop("disabled", true);
            $('#'+int+'-gateway').prop("disabled", true);
            $('#'+int+'-dnssvr').prop("disabled", true);
            $('#'+int+'-dnssvralt').prop("disabled", true);
        }
    })
    $('#'+int+'-static').change(function(e) {
        hideNetworkingAlerts(int);
        if (int == hotspot) {
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
}

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