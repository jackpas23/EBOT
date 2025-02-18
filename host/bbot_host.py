#!/usr/bin/env python3
import sys
import json
import subprocess

def send_message(obj):
    """Send JSON message to Firefox (native messaging)."""
    message = json.dumps(obj).encode("utf-8")  # Encode to bytes
    message_length = struct.pack("I", len(message))  # Pack message length

    sys.stdout.buffer.write(message_length)
    sys.stdout.buffer.write(message)
    sys.stdout.buffer.flush()
import struct

def read_message():
    """Read JSON message from Firefox."""
    raw_length = sys.stdin.buffer.read(4)  # Read exactly 4 bytes
    if not raw_length:
        return None

    # Unpack bytes to an integer (little-endian)
    message_length = struct.unpack("I", raw_length)[0]

    # Read the actual JSON message
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    return json.loads(message)
def run_scan(target, scantype, deadly, eventtype, moddep):
    """Run BBOT and return the final output."""
    cmd = ["bbot", "-t", target, "-y", "-p", scantype, deadly, "--event-types", eventtype, moddep]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    return result.stdout if result.stdout else "No output from BBOT."

def main():
    while True:
        msg = read_message()
        if msg is None:
            break

        if msg.get("command") == "scan":
            output = run_scan(msg.get("target", ""), msg.get("scantype", ""),msg.get("deadly",""),msg.get("eventtype",""),msg.get("moddep",""))
            send_message({"type": "scanResult", "data": output})
        else:
            send_message({"type": "error", "data": "Unknown command"})

if __name__ == "__main__":
    main()
