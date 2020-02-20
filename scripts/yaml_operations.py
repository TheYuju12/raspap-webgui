#!/usr/bin/env python

import yaml
import sys
import json

filepath = "/etc/raspap/networking/"
filename = "network-config"

# PHP will pass the name of the function to execute and one parameter but first parameter will always be function's name
function = sys.argv[1]
argument = sys.argv[2]

def yaml_to_json(path):
    with open(path, 'r') as yaml_input, open(filepath + filename + ".json", "w") as json_out:
        try:
            yaml_object = yaml.safe_load(yaml_input)
            json.dump(yaml_object, json_out)
        except yaml.YAMLError as exc:
            print(exc)

def json_to_yaml(path):
    with open(path, 'r') as json_input, open(filepath + filename + ".yaml", "w") as yaml_out:
        try:
            json_object = json.load(json_input)
            yaml.dump(json_object, yaml_out)
        except yaml.YAMLError as exc:
            print(exc)

if __name__ == "__main__":
    if function == "yaml_to_json":
        yaml_to_json(argument)
    elif function == "json_to_yaml":
        json_to_yaml(argument)