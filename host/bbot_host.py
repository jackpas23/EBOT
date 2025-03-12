#!/usr/bin/env python3
import sys
import json
import subprocess
import struct
import os
import re

#SUBDOMAINS_FILE = "/home/flaxo/.bbot/scans/moist_craig/subdomains.txt"
#SUBDOMAINS_FILE = ""

#  **Send JSON message to Firefox**
def send_message(obj):
    try:
        message = json.dumps(obj).encode("utf-8")  # Encode JSON
        message_length = struct.pack("I", len(message))  # Pack length
        
        sys.stdout.buffer.write(message_length)
        sys.stdout.buffer.write(message)
        sys.stdout.buffer.flush()
    except BrokenPipeError:
        sys.exit(1)  # Exit cleanly if Firefox disconnects

#  **Read JSON message from Firefox**
def read_message():
    raw_length = sys.stdin.buffer.read(4)  # Read exactly 4 bytes
    if not raw_length:
        return None

    # Unpack bytes to an integer (little-endian)
    message_length = struct.unpack("I", raw_length)[0]

    # Read and decode JSON message
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    return json.loads(message)


def run_scan(target, scantype, deadly, eventtype, moddep, flagtype, burp, viewtype, scope):
    """Run BBOT and stream output in real-time to Firefox."""
    cmd = ["bbot", "-t", target, "-y", "-p", scantype, "--event-types", eventtype, moddep,]

    if flagtype:
        cmd.extend(["-f", flagtype])

    if burp:
        cmd.extend(["-c", "web.http_proxy=http://127.0.0.1:8080"])

    if viewtype:
        cmd.append("--current-preset")
    if scope:
        cmd.append("--strict-scope")
    if deadly:
        cmd.append("--allow-deadly"),
        cmd.insert(0, "pkexec")

    try:
        with open("output.txt", "w", encoding="utf-8") as output_file:
            process = subprocess.Popen(
                cmd, stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True
            )
        
            for line in process.stdout:
                ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
                line = ansi_escape.sub('', line)
                line = line.strip()
                if line:
                    output_file.write(line + "\n")  
                    output_file.flush() 
                    send_message({"type": "scanResult", "data": line}) 

            process.stdout.close()
            process.wait()

        send_message({"type": "info", "data": "Scan completed. Output saved to output.txt."})
    except Exception as e:
        send_message({"type": "error", "data": f"Scan failed: {str(e)}"})

def read_subdomains(SUBDOMAINS_FILE):
    """Reads the subdomains file and returns its contents."""
    if not os.path.exists(SUBDOMAINS_FILE):
        return {"error": "File not found"}
    
    try:
        with open(SUBDOMAINS_FILE, "r", encoding="utf-8") as f:
            data = f.read()
        return {"data": data}
    except Exception as e:
        return {"error": f"Failed to read subdomains: {str(e)}"}

def main():
    while True:
        msg = read_message()
        if msg is None:
            break

        command = msg.get("command")

        if command == "scan":
            run_scan(
                msg.get("target", ""),
                msg.get("scantype", ""),
                msg.get("deadly", ""),
                msg.get("eventtype", ""),
                msg.get("moddep", ""),
                msg.get("flagtype", ""),
                msg.get("burp", ""),
                msg.get("viewtype", ""),
                msg.get("scope", "")
            )
        elif command == "getSubdomains":
            send_message(read_subdomains(msg.get("subdomains","")))
        else:
            send_message({"type": "error", "data": f"Unknown command: {command}"})

if __name__ == "__main__":
    main()
