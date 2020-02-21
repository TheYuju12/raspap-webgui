#!/usr/bin/env python

import sys
import json

class Device:
    mac = ""
    ip = ""
    name = ""

    def __init__(self, mac, ip, name):
        self.mac = mac
        self.ip = ip
        self.name = name

if __name__ == "__main__":
    with open(sys.argv[2], 'r') as connected_macs_file, \
        open(sys.argv[3], 'r') as all_macs_file, \
        open(sys.argv[4], 'r') as ips_file, \
        open(sys.argv[5], 'r') as names_file:
        # First store information about all network neighbours in a dictionary
        neighbours = []
        macs = all_macs_file.readlines()
        ips = ips_file.readlines()
        names = names_file.readlines()
        for i in range(0, len(macs)):
            neighbours.append(Device(macs[i], ips[i], names[i]))
        # And now write data about connected devices to json file
        output = []
        connected_macs = connected_macs_file.readlines()
        for mac in connected_macs:
            for n in neighbours:
                if mac == n.mac:
                    output.append(n.__dict__)
                    break
        to_dump = dict()
        to_dump["output"] = output
        resultant_file = sys.argv[1]
        with open(resultant_file, 'w') as f:
            json.dump(to_dump, f)

        