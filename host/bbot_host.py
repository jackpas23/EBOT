#!/usr/bin/env python3
import sys
import json
import subprocess

def send_message(obj):
    """Send JSON message to Firefox."""
    message = json.dumps(obj)
    sys.stdout.write(chr(len(message) & 0xFF))
    sys.stdout.write(chr((len(message) >> 8) & 0xFF))
    sys.stdout.write(chr((len(message) >> 16) & 0xFF))
    sys.stdout.write(chr((len(message) >> 24) & 0xFF))
    sys.stdout.write(message)
    sys.stdout.flush()

def read_message():
    """Read JSON message from Firefox."""
    raw_length = sys.stdin.read(4)
    if not raw_length:
        return None
    length = (ord(raw_length[0]) |
              (ord(raw_length[1]) << 8) |
              (ord(raw_length[2]) << 16) |
              (ord(raw_length[3]) << 24))
    return json.loads(sys.stdin.read(length))

def run_scan(target, scantype, deadly, eventtype):
    """Run BBOT and return the final output."""
    cmd = ["bbot", "-t", target, "-y", "-p", scantype, deadly, "--event-types", eventtype]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    return result.stdout if result.stdout else "No output from BBOT."

def main():
    while True:
        msg = read_message()
        if msg is None:
            break

        if msg.get("command") == "scan":
            output = run_scan(msg.get("target", ""), msg.get("scantype", ""),msg.get("deadly",""),msg.get("eventtype",""))
            send_message({"type": "scanResult", "data": output})
        else:
            send_message({"type": "error", "data": "Unknown command"})

if __name__ == "__main__":
    main()
