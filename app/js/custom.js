function msgShow(retcode,msg) {
    if(retcode == 0) {
        var alertType = 'success';
    } else if(retcode == 2 || retcode == 1) {
        var alertType = 'danger';
    }
    var htmlMsg = '<div class="alert alert-'+alertType+' alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+msg+'</div>';
    return htmlMsg;
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
        $.each(jsonData,function(ind,value){
            loadSummary(value)
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

function loadCurrentSettings(strInterface) {
    $.post('ajax/networking/get_int_config.php',{interface:strInterface},function(data){
        jsonData = JSON.parse(data);
        console.log(jsonData);
        var int = "br0";
        var br = jsonData["output"]["network"]["bridges"][int];
        if (br["dhcp4"] || br["dhcp4"] === "true") {
            $('#'+int+'-dhcp').click();
        }
        else {
            $('#'+int+'-static').click();
            $('#'+int+'-nofailover').click();
            for (let addr of br["addresses"]) {
                var arrIPNetmask = addr.split('/');
                $('#'+int+'-ipaddress').val(arrIPNetmask[0]);
                $('#'+int+'-netmask').val(createNetmaskAddr(arrIPNetmask[1]));
            }
            $('#'+int+'-gateway').val(br["gateway4"]);
            $('#'+int+'-dnssvr').val(br["nameservers"]["addresses"][0]);
            $('#'+int+'-dnssvralt').val(br["nameservers"]["addresses"][1]);
        }
    });
}

function saveNetworkSettings(int) {
    var frmInt = $('#frm-'+int).find(':input');
    var arrFormData = {};
    $.each(frmInt,function(i3,v3){
        if($(v3).attr('type') == 'radio') {
		arrFormData[$(v3).attr('id')] = $(v3).prop('checked');
    } else {
	    arrFormData[$(v3).attr('id')] = $(v3).val();
    }
    });
    arrFormData['interface'] = int;
    $.post('ajax/networking/save_int_config.php',arrFormData,function(data){
        var jsonData = JSON.parse(data);
        $('#msgNetworking').html(msgShow(jsonData['return'],jsonData['output']));
    });
}

function applyNetworkSettings() {
    var int = $(this).data('int');
    arrFormData = {};
    arrFormData['generate'] = '';
    $.post('ajax/networking/gen_int_config.php',arrFormData,function(data){
        var jsonData = JSON.parse(data);
        $('#msgNetworking').html(msgShow(jsonData['return'],jsonData['output']));
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

function setupBtns() {
    $('#btnSummaryRefresh').click(function(){getAllInterfaces();});
    $('.intsave').click(function(){
        var int = $(this).data('int');
        saveNetworkSettings(int);
    });
    $('.intapply').click(function(){
        applyNetworkSettings();
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
    switch(pageCurrent) {
        case "network_conf":
            getAllInterfaces();
            setupTabs();
            setupBtns();
        case "hostapd_conf":
            loadChannel();
        break;
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
