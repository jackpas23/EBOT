#!/usr/bin/env python3
import sys
import json
import subprocess
import struct

def send_message(obj):
    """Send JSON message to Firefox (native messaging)."""
    message = json.dumps(obj).encode("utf-8")  # Encode to bytes
    message_length = struct.pack("I", len(message))  # Pack message length
    
    sys.stdout.buffer.write(message_length)
    sys.stdout.buffer.write(message)
    sys.stdout.buffer.flush()

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

def run_scan(target, scantype, deadly, eventtype, moddep, flagtype, burp, viewtype, scope):
    """Run BBOT and stream output in real-time."""
    cmd = ["bbot", "-t", target, "-y", "-p", scantype, deadly, "--event-types", eventtype, moddep, "-v"]

    if flagtype:
        cmd.append("-f")
        cmd.append(flagtype)

    if burp:
        cmd.append("-c")
        cmd.append("web.http_proxy=http://127.0.0.1:8080")

    if viewtype:
        cmd.append("--current-preset")
    if scope:
        cmd.append("--strict-scope")

    
    with open("output.txt", "w", encoding="utf-8") as output_file:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, universal_newlines=True)

        
        for line in process.stdout:
            line = line.strip()
            if line:
                output_file.write(line + "\n")  
                output_file.flush() 
                send_message({"type": "scanResult", "data": line}) 

        process.stdout.close()
        process.wait()  

    return "Scan completed. Live output saved to output.txt."

def main():
    while True:
        msg = read_message()
        if msg is None:
            break

        if msg.get("command") == "scan":
            run_scan(
                msg.get("target", ""),
                msg.get("scantype", ""),
                msg.get("deadly", ""),
                msg.get("eventtype", ""),
                msg.get("moddep", ""),
                msg.get("flagtype", ""),
                msg.get("burp", ""),
                msg.get("viewtype", ""),
                msg.get("scope","")
            )
        else:
            send_message({"type": "error", "data": "Unknown command"})

if __name__ == "__main__":
    main()
