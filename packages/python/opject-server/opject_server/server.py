from flask import Flask, request, jsonify


server = Flask(__name__)



@server.route('/request', methods=['POST'])
def request():
    response = {
        "object": "",
    }
    return jsonify(response)


@server.route('/register', methods=['POST'])
def register():
    response = {
        "registered": False,
    }
    return jsonify(response)


@server.route('/check', methods=['POST'])
def check():
    response = {
        "checked": False,
    }
    return jsonify(response)


@server.route('/remove', methods=['POST'])
def remove():
    response = {
        "removed": False,
    }
    return jsonify(response)
