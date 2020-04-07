import { isNumber, is_a_valid_IP, loadDumbapConf, loadHostapdConf,
        hostapd_conf, dumbap_conf
} from "./common.js";

export {
    setupHotspotUI
}

function setupHotspotUI() {
    loadChannel();
    loadDumbapConf(false);
    loadHostapdConf(false);

    var selector = $("#cbxwpa");
    selector.change(function (e) { 
        e.preventDefault();
        if (selector.val().includes("PSK")) {
            $("#eap").css("display", "none");
            $("#psk").css("display", "block");
        }
        else if (selector.val().includes("EAP")) {
            $("#psk").css("display", "none");
            $("#eap").css("display", "block");
        }
        else {
            $("#psk").css("display", "none");
            $("#eap").css("display", "none");
        }
    });
    $("#hotspot-apply").click(function (e) {
        applySettings();
    });
    
    $("#hotspot-start").click(function (e) { 
        startHotspot();
    });

    $("#hotspot-stop").click(function (e) { 
        stopHotspot();
    });
}

function loadChannel() {
    $.get('ajax/networking/get_channel.php',function(data){
        loadChannelSelect(JSON.parse(data));
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

function applySettings() {
    if (sanitizeInput()) {
        $.confirm({
            title: 'Apply changes',
            content: 'Do you want to apply the current configuration? This will restart the hotspot service.',
            typeAnimated: true,
            icon: 'fas fa-exclamation-triangle',
            type: "orange",
            columnClass: "medium",
            buttons: {
                ok: {
                    text: 'Ok',
                    btnClass: "btn-orange",
                    action: function() {
                        saveSettings();
                        $.ajax({
                            type: "post",
                            url: "ajax/hotspot/update_hostapd_and_dumbap_config.php",
                            data: {hostapd_conf: JSON.stringify(hostapd_conf), dumbap_conf: JSON.stringify(dumbap_conf)},
                        }).done (function (response) {
                            console.log(hostapd_conf);
                            console.log(dumbap_conf);
                            // Show visual feedback
                            $.alert({
                                title: 'Configuration applied',
                                content: "You may need to wait a few seconds for the changes to take effect.",
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
                            })
                        });
                    }
                },
                cancel: {
                    text: 'Cancel'
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

function sanitizeInput() {
    var errors_free = true;

    // Basic

    if ($("#txtssid").val().length < 1) {
        errors_free = false;
        // Show error
        $("#txtssid-error").css("display","inline");
    }
    else $("#txtssid-error").css("display","none");

    // Security

    var selector = $("#cbxwpa");
    if (selector.val().includes("PSK")) {
        if ($("#txtwpapassphrase").val().length < 8) {
            errors_free = false;
            // Show error
            $("#txtwpapassphrase-error").css("display","inline");
        }
        else $("#txtwpapassphrase-error").css("display","none");
    }
    else if (selector.val().includes("EAP")) {
        var port_limit = 65535;

        // Authentication (mandatory)

        var auth_addr = $("#txteapauthserveraddr").val();
        if (!auth_addr || !is_a_valid_IP(auth_addr)) {
            errors_free = false;
            // Show error
            $("#txteapauthserveraddr-error").css("display","inline");
        }
        else $("#txteapauthserveraddr-error").css("display","none");   

        var auth_port = $("#txteapauthserverport").val();
        if (!auth_port || !isNumber(auth_port) || auth_port < 0 || auth_port > port_limit) {
            errors_free = false;
            // Show error
            $("#txteapauthserverport-error").css("display","inline");
        }
        else $("#txteapauthserverport-error").css("display","none");   
        
        var auth_secret = $("#txteapauthserversecret").val();
        if (!auth_secret) {
            errors_free = false;
            // Show error
            $("#txteapauthserversecret-error").css("display","inline");
        }
        else $("#txteapauthserversecret-error").css("display","none");   
        
        // Accounting (optional, but if one field is filled, the others must be filled as well)

        var acc_addr = $("#txteapaccserveraddr").val();
        var acc_port = $("#txteapaccserverport").val();
        var acc_secret = $("#txteapaccserversecret").val();

        if (!acc_addr && !acc_port && !acc_secret) {
            $("#txteapaccserveraddr-error").css("display","none");
            $("#txteapaccserverport-error").css("display","none");
            $("#txteapaccserversecret-error").css("display","none");
        }
        else {
            if (acc_addr && !is_a_valid_IP(acc_addr)) {
                errors_free = false;
                // Show error
                $("#txteapaccserveraddr-error").css("display","inline");
            }
            else $("#txteapaccserveraddr-error").css("display","none");
            
            if (acc_port && (!isNumber(acc_port) || acc_port < 0 || acc_port > port_limit)) {
                errors_free = false;
                // Show error
                $("#txteapaccserverport-error").css("display","inline");
            }
            else $("#txteapaccserverport-error").css("display","none");

            if (acc_addr) {
                if (!acc_port) {
                    errors_free = false;
                    $("#txteapaccserverport-error").css("display","inline");
                }
                if (!acc_secret) {
                    errors_free = false;
                    $("#txteapaccserversecret-error").css("display","inline");
                }
            }
            if (acc_port) {
                if (!acc_addr) {
                    errors_free = false;
                    $("#txteapaccserveraddr-error").css("display","inline");
                }
                if (!acc_secret) {
                    errors_free = false;
                    $("#txteapaccserversecret-error").css("display","inline");
                }
            }
            if (acc_secret) {
                if (!acc_addr) {
                    errors_free = false;
                    $("#txteapaccserveraddr-error").css("display","inline");
                }
                if (!acc_port) {
                    errors_free = false;
                    $("#txteapaccserverport-error").css("display","inline");
                }
            }   
        }
    }
    else {
        errors_free = true;
    }

    // Advanced

    var sta_limit = 2007;
    if ($("#max_num_sta").val() < 0 || $("#max_num_sta").val() > sta_limit) {
        errors_free = false;
        // Show error
        $("#max_num_sta-error").css("display","inline");
    }
    else $("#max_num_sta-error").css("display","none");

    return errors_free;
}

function saveSettings() {

    // Basic 

    hostapd_conf["interface"] = $("#cbxinterface").val();
    dumbap_conf["hotspot"] = hostapd_conf["interface"];

    hostapd_conf["ssid"] = $("#txtssid").val();

    var bridge = $("#cbxbridge").val();
    if (bridge) {
        hostapd_conf["bridge"] = bridge;
        dumbap_conf["mode"]["bridge"]["name"] = hostapd_conf["bridge"];
    }
    else {
        if ("bridge" in hostapd_conf) delete hostapd_conf["bridge"];
    }
    switch ($("#cbxhwmode").val()) {
        case "b":
            hostapd_conf["hw_mode"] = "b";
            if ("ieee80211n" in hostapd_conf) delete hostapd_conf["ieee80211n"];
            if ("ieee80211ac" in hostapd_conf) delete hostapd_conf["ieee80211ac"];
            if ("wmm_enabled" in hostapd_conf) delete hostapd_conf["wmm_enabled"]; // QoS support, also required for full speed on 802.11n/ac/ax
            break;
        case "g":
            hostapd_conf["hw_mode"] = "g";
            if ("ieee80211n" in hostapd_conf) delete hostapd_conf["ieee80211n"];
            if ("ieee80211ac" in hostapd_conf) delete hostapd_conf["ieee80211ac"];
            if ("wmm_enabled" in hostapd_conf) delete hostapd_conf["wmm_enabled"];
            break;
        case "n":
            hostapd_conf["hw_mode"] = "g";
            hostapd_conf["ieee80211n"] = 1;
            hostapd_conf["wmm_enabled"] = 1;
            if ("ieee80211ac" in hostapd_conf) delete hostapd_conf["ieee80211ac"];
            break;
        case "ac":
            hostapd_conf["hw_mode"] = "a";
            hostapd_conf["ieee80211ac"] = 1;
            hostapd_conf["wmm_enabled"] = 1;
            if ("ieee80211n" in hostapd_conf) delete hostapd_conf["ieee80211n"];
            break;
        default:
            break;
    }

    hostapd_conf["channel"] = $("#cbxchannel").val();

    // Security

    var selector = $("#cbxwpa");

    if (selector.val() == "None") {
        // No security
        if ("auth_algs" in hostapd_conf) delete hostapd_conf["auth_algs"];

        if ("wpa" in hostapd_conf) delete hostapd_conf["wpa"];
        if ("wpa_passphrase" in hostapd_conf) delete hostapd_conf["wpa_passphrase"];
        if ("wpa_key_mgmt" in hostapd_conf) delete hostapd_conf["wpa_key_mgmt"];
        if ("wpa_pairwise" in hostapd_conf) delete hostapd_conf["wpa_pairwise"];

        if ("ieee8021x" in hostapd_conf) delete hostapd_conf["ieee8021x"];
        if ("nas_identifier" in hostapd_conf) delete hostapd_conf["nas_identifier"];
        if ("auth_server_addr" in hostapd_conf) delete hostapd_conf["auth_server_addr"];
        if ("auth_server_port" in hostapd_conf) delete hostapd_conf["auth_server_port"];
        if ("auth_server_shared_secret" in hostapd_conf) delete hostapd_conf["auth_server_shared_secret"];
        if ("acct_server_addr" in hostapd_conf) delete hostapd_conf["acct_server_addr"];
        if ("acct_server_port" in hostapd_conf) delete hostapd_conf["acct_server_port"];
        if ("acct_server_shared_secret" in hostapd_conf) delete hostapd_conf["acct_server_shared_secret"];
    }
    else {
        var aux = selector.val().split("-");
        var wpa_type; // 1 for WPA, 2 for WPA2
        var aux = selector.val().split("-");
        if (aux[0].includes("2")) wpa_type = 2;
        else wpa_type = 1;
        var key_mgmt = "WPA-" + aux[1]; // PSK or EAP

        hostapd_conf["auth_algs"] = 1; // 1 for WPA, 2 for WEP, 3 for both
        hostapd_conf["wpa"] = wpa_type;
        hostapd_conf["wpa_key_mgmt"] = key_mgmt;
        if (selector.val().includes("PSK")) {
            hostapd_conf["wpa_pairwise"] = $("#cbxwpapairwisepsk").val().replace("+", " ");
            hostapd_conf["wpa_passphrase"] = $("#txtwpapassphrase").val();

            if ("ieee8021x" in hostapd_conf) delete hostapd_conf["ieee8021x"];
            if ("nas_identifier" in hostapd_conf) delete hostapd_conf["nas_identifier"];
            if ("auth_server_addr" in hostapd_conf) delete hostapd_conf["auth_server_addr"];
            if ("auth_server_port" in hostapd_conf) delete hostapd_conf["auth_server_port"];
            if ("auth_server_shared_secret" in hostapd_conf) delete hostapd_conf["auth_server_shared_secret"];
            if ("acct_server_addr" in hostapd_conf) delete hostapd_conf["acct_server_addr"];
            if ("acct_server_port" in hostapd_conf) delete hostapd_conf["acct_server_port"];
            if ("acct_server_shared_secret" in hostapd_conf) delete hostapd_conf["acct_server_shared_secret"];
        }
        else if (selector.val().includes("EAP")) {
            if ("wpa_passphrase" in hostapd_conf) delete hostapd_conf["wpa_passphrase"];
            hostapd_conf["wpa_pairwise"] = $("#cbxwpapairwiseeap").val().replace("+", " ");

            hostapd_conf["ieee8021x"] = 1;
            
            if ($("#txteapnasid").val()) hostapd_conf["nas_identifier"] = $("#txteapnasid").val();
            else if (hostapd_conf["nas_identifier"]) delete hostapd_conf["nas_identifier"];

            hostapd_conf["auth_server_addr"] = $("#txteapauthserveraddr").val();
            hostapd_conf["auth_server_port"] = $("#txteapauthserverport").val();
            hostapd_conf["auth_server_shared_secret"] = $("#txteapauthserversecret").val();
            
            if ($("#txteapaccserveraddr").val()) hostapd_conf["acct_server_addr"] = $("#txteapaccserveraddr").val();
            else delete hostapd_conf["acct_server_addr"];
            if ($("#txteapaccserverport").val()) hostapd_conf["acct_server_port"] = $("#txteapaccserverport").val();
            else delete hostapd_conf["acct_server_port"];
            if ($("#txteapaccserversecret").val()) hostapd_conf["acct_server_shared_secret"] = $("#txteapaccserversecret").val();
            else delete hostapd_conf["acct_server_shared_secret"];
        }
    }

    // Advanced

    hostapd_conf["ieee80211d"] = 1; // Respect country bands limitations
    hostapd_conf["country_code"] = $("#cbxcountries").val();

    if ($("#chxhiddenssid").prop("checked")) hostapd_conf["ignore_broadcast_ssid"] = 1;
    else if (hostapd_conf["ignore_broadcast_ssid"]) delete hostapd_conf["ignore_broadcast_ssid"];

    var defaul_num_sta = 2007;
    if ($("#max_num_sta").val() && $("#max_num_sta").val() < defaul_num_sta+1) hostapd_conf["max_num_sta"] = $("#max_num_sta").val();
    else if ("max_num_sta" in hostapd_conf) delete hostapd_conf["max_num_sta"];
}

function startHotspot() {
    e.preventDefault();
    $.dialog({
        title: 'Starting hotspot...',
        type: "orange",
        content: false,
        typeAnimated: true,
        icon: 'fa fa-spinner fa-spin'
    });
    $.ajax({
        type: "post",
        url: "ajax/hotspot/turn_on_hotspot.php",
        success: function (response) {
            console.log(JSON.parse(response));
            location.reload();
        }
    });
}

function stopHotspot() {
    e.preventDefault();
    $.dialog({
        title: 'Stopping hotspot...',
        type: "orange",
        content: false,
        typeAnimated: true,
        icon: 'fa fa-spinner fa-spin'
    });
    $.ajax({
        type: "post",
        url: "ajax/hotspot/turn_off_hotspot.php",
        success: function (response) {
            console.log(JSON.parse(response));
            location.reload();
        }
    });
}