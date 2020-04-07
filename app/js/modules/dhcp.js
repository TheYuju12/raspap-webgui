import { isNumber, is_a_valid_IP, loadDumbapConf, dumbap_conf } from "./common.js";

export {
    setupDhcpUI,
}

function setupDhcpUI() {
    loadDumbapConf(false);
    var selector = $("#interval-select");
    selector.change(function (e) { 
        e.preventDefault();
        if (selector.val() == "infinite") {
            $("#txtleasetime").prop("disabled", true);
        }
        else {
            $("#txtleasetime").prop("disabled", false);
        }
    });
    $("#dnsmasq-apply").click(function (e) {
        applySettings();
    });
    
    $("#dnsmasq-start").click(function (e) { 
        e.preventDefault();
        startDhcp();
    });

    $("#dnsmasq-stop").click(function (e) { 
        e.preventDefault();
        stopDhcp();
    });
}

function applySettings() {
    if (sanitizeInput()) {
        $.confirm({
            title: 'Apply changes',
            content: 'Do you want to apply the current configuration? This will restart the DHCP server.',
            typeAnimated: true,
            icon: 'fas fa-exclamation-triangle',
            type: "orange",
            columnClass: "medium",
            buttons: {
                ok: {
                    text: 'Ok',
                    btnClass: "btn-orange",
                    action: function() {
                        var dnsmasq_conf = saveDhcpInput();
                        $.ajax({
                            type: "post",
                            url: "ajax/networking/update_dnsmasq_config.php",
                            data: {dnsmasq_conf: JSON.stringify(dnsmasq_conf)},
                        }).done (function (response) {
                            console.log(dnsmasq_conf);
                            console.log(JSON.parse(response));
                            // Show visual feedback
                            $.alert({
                                title: 'Configuration applied',
                                content: "You may need to wait a few seconds for the changes to take effect.",
                                type: "green",
                                icon: "fas fa-check-circle"
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
}

function sanitizeInput() {

    var errors_free = true;

    var range_start = $("#dhcprangestart").val();
    if (!range_start || !is_a_valid_IP(range_start)) {
        $("#dhcprangestart-error").css("display", "inline");
        errors_free = false;
    }
    else $("#dhcprangestart-error").css("display", "none");

    var range_end = $("#dhcprangeend").val();
    if (!range_end || !is_a_valid_IP(range_end)) {
        $("#dhcprangeend-error").css("display", "inline");
        errors_free = false;
    }
    else $("#dhcprangeend-error").css("display", "none");

    var leaseTime = $("#txtleasetime").val();
    if (!leaseTime || !isNumber(leaseTime)) {
        $("#txtleasetime-error").css("display", "inline");
        errors_free = false;
    }
    else $("#txtleasetime-error").css("display", "none");

    var dns1 = $("#dhcpdns1").val();
    if (!dns1 || !is_a_valid_IP(dns1)) {
        $("#dhcpdns1-error").css("display", "inline");
        errors_free = false;
    }
    else $("#dhcpdns1-error").css("display", "none");

    var dns2 = $("#dhcpdns2").val();
    if (dns2 && !is_a_valid_IP(dns2)) {
        $("#dhcpdns2-error").css("display", "inline");
        errors_free = false;
    }
    else $("#dhcpdns2-error").css("display", "none");

    return errors_free;
}

function saveDhcpInput() {
    var conf = {};
    conf["interface"] = $("#txtdhcpint").val();

    var mask = dumbap_conf["mode"]["dhcp"]["mask"];
    var interval = $("#interval-select").val();
    if (interval == "infinite") {
        conf["dhcp-range"] = $("#dhcprangestart").val() + "," + $("#dhcprangeend").val() + "," + mask + "," + interval;
    }
    else {
        conf["dhcp-range"] = $("#dhcprangestart").val() + "," + $("#dhcprangeend").val() + "," + mask + "," + $("#txtleasetime").val() + interval;
    }

    var dns2 = $("#dhcpdns2").val();
    if (dns2) conf["dhcp-option"] = "6" + "," + $("#dhcpdns1").val() + "," + dns2;
    else conf["dhcp-option"] = "6" + "," + $("#dhcpdns1").val();

    return conf;
}

function stopDhcp() {
    $.dialog({
        title: 'Stopping DHCP server...',
        type: "orange",
        content: false,
        typeAnimated: true,
        icon: 'fa fa-spinner fa-spin'
    });
    $.ajax({
        type: "post",
        url: "ajax/networking/turn_off_dnsmasq.php",
        success: function (response) {
            console.log(JSON.parse(response));
            location.reload();
        }
    });
}

function startDhcp() {
    $.dialog({
        title: 'Starting DHCP server...',
        type: "orange",
        content: false,
        typeAnimated: true,
        icon: 'fa fa-spinner fa-spin'
    });
    $.ajax({
        type: "post",
        url: "ajax/networking/turn_on_dnsmasq.php",
        success: function (response) {
            console.log(JSON.parse(response));
            location.reload();
        }
    });
}