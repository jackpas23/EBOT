// background.js

let port = null;
let scanOutput = ""; // Store all BBOT output persistently while Firefox is running
let hosts = new Set(); // Store unique scan targets

function connectNative() {
  port = browser.runtime.connectNative("bbot_host");

  port.onMessage.addListener((message) => {
    if (message.type === "scanResult") {
      scanOutput += message.data + "\n"; // Append scan results
      browser.runtime.sendMessage({ type: "updateOutput", data: scanOutput }); // Send updated output to popup
    } else if (message.type === "error") {
      scanOutput += `[ERROR] ${message.data}\n`;
      browser.runtime.sendMessage({ type: "updateOutput", data: scanOutput });
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("Disconnected from bbot_host");
    port = null;
  });
}

// Connect when the extension loads
connectNative();

// Listen for scan requests and clear requests from popup.js
browser.runtime.onMessage.addListener((msg) => {
  if (!port) {
    connectNative();
  }

  if (msg.type === "runScan") {
    // Add target to hosts list
    hosts.add(msg.target);

    port.postMessage({
      command: "scan",
      target: msg.target,
      scantype: msg.scanType,
      deadly:  msg.deadly
    });
  } else if (msg.type === "getOutput") {
    browser.runtime.sendMessage({ type: "updateOutput", data: scanOutput }); // Send stored output to popup
  } else if (msg.type === "getHosts") {
    browser.runtime.sendMessage({ type: "updateHosts", data: Array.from(hosts).join("\n") }); // Send list of scanned hosts
  } else if (msg.type === "clearOutput") {
    scanOutput = ""; // Clear stored output
    browser.runtime.sendMessage({ type: "updateOutput", data: scanOutput }); // Notify popup
  } else if (msg.type === "clearHosts") {
    hosts.clear(); // Clear stored hosts
    browser.runtime.sendMessage({ type: "updateHosts", data: "" }); // Notify popup
  }
});
