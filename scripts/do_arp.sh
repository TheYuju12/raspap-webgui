#!/bin/bash

function ip_to_binary() {
    CONV=({0..1}{0..1}{0..1}{0..1}{0..1}{0..1}{0..1}{0..1})

    ip=""
    for byte in `echo ${1} | tr "." " "`; do
        ip="${ip}.${CONV[${byte}]}"
    done
    echo ${ip:1}
}

function mask2cidr() {
    c=0 x=0$( printf '%o' ${1//./ } )
    while [ $x -gt 0 ]; do
        let c+=$((x%2)) 'x>>=1'
    done
    echo /$c
}

function get_subnet_from_binary_ip_and_mask() {
    # First, convert to binary
    bin_ip=`ip_to_binary ${1}`
    bin_mask=`ip_to_binary ${2}`
    # Then, obtain the 4 ip address digits (X.X.X.X) for ip and netmask
    declare -a ip_array
    declare -a mask_array
    while IFS='.' read -ra ADDR; do
    for i in "${ADDR[@]}"; do
        ip_array+=("$i")
    done
    done <<< "$bin_ip"
    while IFS='.' read -ra ADDR; do
    for i in "${ADDR[@]}"; do
        mask_array+=("$i")
    done
    done <<< "$bin_mask"
    # Finally, do a bitwise AND between every storaged binary digit of ip and netmask to get the subnet address
    subnet=""
    for i in {0..3}; do
    subnet+="$(( 2#${ip_array[i]} & 2#${mask_array[i]} ))"
        if [ "$i" -ne 3 ]; then
        subnet+="."
        fi
    done
    echo $subnet
}

# Get subnet and mask in cidr format
info=$(ifconfig $int | head -2 | tail +2 | xargs)
ip=$(echo $info | cut -d " " -f 2)
netmask=$(echo $info | cut -d " " -f 4)
cidr_mask=`mask2cidr $netmask`
subnet=`get_subnet_from_binary_ip_and_mask $ip $netmask`
subnet_cidr="${subnet}${cidr_mask}"
# Get interface to be used during ARP
int=$1
# Do ARP and save the data
arp-scan --interface=$int $subnet_cidr | head -n -3 | tail -n +3 | grep -v DUP > network_devices
cat network_devices | cut -f 1 > "/etc/raspap/networking/all_ips"
cat network_devices | cut -f 2 > "/etc/raspap/networking/all_macs"
cat network_devices | cut -f 3 > "/etc/raspap/networking/all_hostnames"
rm network_devices