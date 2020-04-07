import { 
    cidr2netmask, loadConfigurableInterfaces, loadDumbapConf, loadHostapdConf, loadNetworkConfig,
    net_conf, hostapd_conf, conf_ints, dumbap_conf
} from "./common.js";

export {
    setupOperationModeUI
}

var op_mode_descriptions = {
    "dhcp" : "A DHCP server powered by dnsmasq will be launched along with the AP.",
    "bridge" : "A shared connection between a wireless interface (used as hotspot) and an interface connected to the Internet will be established. \
                <strong>No DHCP server will be deployed</strong>. Instead, the access point will use the DHCP server of the interface connected to the \
                Internet added to the bridge. This mode allows you to set up a pure access point (also known as <strong>dumb AP</strong>).",
    "sdn" : "Taking advantage of the Software Defined Network paradigm, this mode allows a SDN controller to manage this device using protocols such as \
            <strong>OpenFlow</strong> or <strong>NETCONF</strong>."
}

function setupOperationModeUI() {
    loadNetworkConfig();
    loadDumbapConf();
    loadHostapdConf();
    loadConfigurableInterfaces();

    var selector = $("#op_mode-select");
    var mode = selector.val();
    $("#op_mode-description").html(op_mode_descriptions[mode]);

    selector.change(function() {
        var mode = selector.val();
        if (mode == "bridge") {
            $("#hotspot-options").css("display", "block");
            $("#bridge-options").css("display", "block");
        }
        else if (mode == "dhcp") {
            $("#bridge-options").css("display", "none");
            $("#hotspot-options").css("display", "block");
        }
        else {
            $("#bridge-options").css("display", "none");
            $("#hotspot-options").css("display", "none");
        }
        $("#op_mode-description").html(op_mode_descriptions[mode]);
    });

    $("#op_mode-apply").click(function () {
        applySettings();
    });


}

function applySettings() {
    // Check hotspot and bridged interface are not the same
    var int = $("#bridge-interface-select").val();
    var new_op_mode = $("#op_mode-select").val();
    if (new_op_mode == "bridge" && int == dumbap_conf["hotspot"]) {
        // Do not perform any further action and inform the user
        $.alert({
            title: 'Invalid bridge configuration',
            type: "red",
            icon: "fas fa-exclamation-circle",
            columnClass: "medium",
            content: "A bridge is meant to use at least two <strong>different</strong> interfaces.",
            typeAnimated: true,
        });
    }
    else {
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
                        $.dialog({
                            title: 'Applying changes...',
                            content: false,
                            type: "orange",
                            typeAnimated: true,
                            icon: 'fa fa-spinner fa-spin'
                        });
                        // Modify network, dumbap and hostapd
                        changeOperatingMode();
                        console.log(net_conf);
                        console.log(dumbap_conf);
                        console.log(hostapd_conf);

                        var errors = 0;
                        // Write changes to dumbap and hostapd files
                        $.ajax({
                            type:"POST",
                            url: "ajax/hotspot/update_hostapd_and_dumbap_config.php",
                            data: {dumbap_conf: JSON.stringify(dumbap_conf), hostapd_conf: JSON.stringify(hostapd_conf)},
                        })
                        .done(function(response) {
                            var resp = JSON.parse(response);
                            console.log(resp);
                            if (resp["return"]) errors++;
                            // Then, write network changes
                            $.ajax({
                                type:"POST",
                                url: "ajax/networking/update_network_config.php",
                                data: {net_config: JSON.stringify(net_conf)},
                            })
                            .done(function(response) {
                                var resp = JSON.parse(response);
                                console.log(resp);
                                if (resp["return"]) errors++;
                                // Finally, if bridge, turn off dnsmasq
                                if ("bridge" in dumbap_conf["mode"]) {
                                    $.ajax({
                                        type:"POST",
                                        url: "ajax/networking/turn_off_dnsmasq.php",
                                    })
                                    .done(function (response) {
                                        var resp = JSON.parse(response);
                                        console.log(resp);
                                        if (resp["return"]) errors++;
                                        if (!errors) {
                                            $.dialog({
                                                title: 'Rebooting device...',
                                                content: false,
                                                typeAnimated: true,
                                                icon: 'fa fa-spinner fa-spin'
                                            });
                                            $.ajax({
                                                type: "post",
                                                url: "ajax/system/reboot.php"
                                            });
                                        }
                                        else {
                                            $.alert({
                                                title: 'Ups, something were wrong :(',
                                                content: "Configuration could not be fully updated. " + errors + " found.",
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
                                else if ("dhcp" in dumbap_conf["mode"]) {
                                    // If dhcp, restart dnsmasq
                                    $.ajax({
                                        type:"POST",
                                        url: "ajax/networking/turn_on_dnsmasq.php",
                                    })
                                    .done(function (response) {
                                        var resp = JSON.parse(response);
                                        console.log(resp);
                                        if (resp["return"]) errors++;
                                        if (!errors) {
                                            $.dialog({
                                                title: 'Rebooting device...',
                                                content: false,
                                                typeAnimated: true,
                                                icon: 'fa fa-spinner fa-spin'
                                            });
                                            $.ajax({
                                                type: "post",
                                                url: "ajax/system/reboot.php"
                                            });
                                        }
                                        else {
                                            $.alert({
                                                title: 'Ups, something were wrong :(',
                                                content: "Configuration could not be fully updated. " + errors + " found.",
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
                            });
                        });
                    }
                },
                reboot_later: {
                    text: "Reboot later",
                    typeAnimated: true,
                    action: function () { 
                        $.dialog({
                            title: 'Applying changes...',
                            content: false,
                            type: "orange",
                            typeAnimated: true,
                            icon: 'fa fa-spinner fa-spin'
                        });
                        // Modify network, dumbap and hostapd
                        changeOperatingMode();
                        console.log(net_conf);
                        console.log(dumbap_conf);
                        console.log(hostapd_conf);
                        
                        var errors = 0;
                        // Write changes to dumbap and hostapd files
                        $.ajax({
                            type:"POST",
                            url: "ajax/hotspot/update_hostapd_and_dumbap_config.php",
                            data: {dumbap_conf: JSON.stringify(dumbap_conf), hostapd_conf: JSON.stringify(hostapd_conf)},
                        })
                        .done(function(response) {
                            var resp = JSON.parse(response);
                            console.log(resp);
                            if (resp["return"]) errors++;
                            // Then, write network changes
                            $.ajax({
                                type:"POST",
                                url: "ajax/networking/update_network_config.php",
                                data: {net_config: JSON.stringify(net_conf)},
                            })
                            .done(function(response) {
                                var resp = JSON.parse(response);
                                console.log(resp);
                                if (resp["return"]) errors++;
                                // Finally, if bridge, turn off dnsmasq
                                if ("bridge" in dumbap_conf["mode"]) {
                                    $.ajax({
                                        type:"POST",
                                        url: "ajax/networking/turn_off_dnsmasq.php",
                                    })
                                    .done(function (response) {
                                        resp = JSON.parse(response);
                                        console.log(resp);
                                        if (resp["return"]) errors++;
                                        if (!errors) {
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
                                                content: "Configuration could not be fully updated. " + errors + " found.",
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
                                else if ("dhcp" in dumbap_conf["mode"]) {
                                    // If dhcp, restart dnsmasq
                                    $.ajax({
                                        type:"POST",
                                        url: "ajax/networking/turn_on_dnsmasq.php",
                                    })
                                    .done(function (response) {
                                        var resp = JSON.parse(response);
                                        console.log(resp);
                                        if (resp["return"]) errors++;
                                        if (!errors) {
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
                                                content: "Configuration could not be fully updated. " + errors + " found.",
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
                            });
                        });
                    }
                },
                cancel: {
                    text: "Cancel"
                }
            }
        });
    }
}


/**
 * Changes the current operation mode of the AP (bridge, dhcp or sdn).
 */
function changeOperatingMode() {
    var new_op_mode = $("#op_mode-select").val();
    var hotspot = $("#hotspot-select").val();
    var bridge_name = "dumbap-br";

    if (new_op_mode == "bridge") {
        var int = $("#bridge-interface-select").val();
        var adapter_type = conf_ints[int];
        // Copy configuration of selected interface
        var int_config = Object.assign({}, net_conf["network"][adapter_type][int]);
        // Add the interface to the array of interfaces
        int_config["interfaces"] = [];
        int_config["interfaces"].push(int);
        // Add simple entry for the added-to-bridge interface and hostapd wireless interface
        net_conf["network"][adapter_type][int] = {"dhcp4" : false};
        var wireless = {
            "dhcp4" : false, 
            "access-points" : {"dumbap" : {"password" : ""}}
        }
        net_conf["network"]["wifis"][hotspot] = wireless;
        // Add interface to bridge (same as previous config of selected interface)
        if (!("bridges" in net_conf["network"])) net_conf["network"]["bridges"] = {};
        net_conf["network"]["bridges"][bridge_name] = int_config;
        // Setup new dumbap config
        dumbap_conf["hotspot"] = {};
        dumbap_conf["hotspot"] = hotspot;
        dumbap_conf["mode"] = {}
        dumbap_conf["mode"]["bridge"] = {};
        dumbap_conf["mode"]["bridge"]["name"] = bridge_name;
        dumbap_conf["mode"]["bridge"]["gw"] = int;
        // Setup hostapd
        hostapd_conf["bridge"] = bridge_name;
        hostapd_conf["interface"] = hotspot;
    }
    else if (new_op_mode == "dhcp") {
        // Check if previous mode was bridge or sdn
        var old_mode = dumbap_conf["mode"];
        if ("bridge" in old_mode) {
            // Restore default configuration for wireless interface
            var ip = "10.9.9.1";
            var mask = 24;
            var wireless = {
                "dhcp4" : false, 
                "addresses" : [ip + "/" + mask],
                "access-points" : {"dumbap" : {"password" : ""}}
            };
            // Delete bridged interface and use its configuration to set up gw.
            var bridged_int = net_conf["network"]["bridges"][bridge_name]["interfaces"][0];

            var adapter_type;
            if (net_conf["network"]["ethernets"] && bridged_int in net_conf["network"]["ethernets"]) adapter_type = "ethernets";
            if (bridged_int in net_conf["network"]["wifis"]) adapter_type = "wifis";
            if (bridged_int in net_conf["network"]["bridges"]) adapter_type = "bridges";
            if (net_conf["network"]["vlans"] && bridged_int in net_conf["network"]["vlans"]) adapter_type = "vlans";

            net_conf["network"][adapter_type][bridged_int] = {"dhcp4" : true};
            net_conf["network"]["wifis"][hotspot] = wireless;
            delete net_conf["network"]["bridges"][bridge_name];
            if (!net_conf["network"]["bridges"].length) delete net_conf["network"]["bridges"];
            // Setup new dumbap config
            dumbap_conf["hotspot"] = hotspot;
            dumbap_conf["mode"] = {};
            dumbap_conf["mode"]["dhcp"] = {};
            dumbap_conf["mode"]["dhcp"]["address"] = ip;
            dumbap_conf["mode"]["dhcp"]["mask"] = cidr2netmask(mask);
            // Setup hostapd
            delete hostapd_conf["bridge"];
            hostapd_conf["interface"] = hotspot;
        }
        else {
            // Only change hotspot
            dumbap_conf["hotspot"] = hotspot;
            // Setup hostapd
            hostapd_conf["interface"] = hotspot;
        }
    }
    else {
        // SDN
    }
}