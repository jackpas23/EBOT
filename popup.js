// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const runScanBtn = document.getElementById("runScanBtn");
  const clearOutputBtn = document.getElementById("clearOutputBtn");
  const clearHostsBtn = document.getElementById("clearHostsBtn"); // New button for clearing targets
  const targetInput = document.getElementById("targetInput");
  const scanSelect = document.getElementById("scanSelect");
  const outputArea = document.getElementById("outputArea");
  const hostsArea = document.getElementById("hostsArea"); // New area for displaying hosts
  const deadly= document.getElementById("deadly");
  // Request stored scan output and hosts when the popup opens
  browser.runtime.sendMessage({ type: "getOutput" });
  browser.runtime.sendMessage({ type: "getHosts" });

  // Listen for updates from background.js
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "updateOutput") {
      outputArea.textContent = message.data; // Update the output area
      outputArea.scrollTop = outputArea.scrollHeight; // Auto-scroll to bottom
    } else if (message.type === "updateHosts") {
      hostsArea.textContent = message.data; // Update scanned hosts list
    }
  });

  // When user clicks "Run Scan"
  runScanBtn.addEventListener("click", () => {
    outputArea.textContent += "SCAN RUNNING:\n";
    const targetVal = targetInput.value.trim();
    const scanVal = scanSelect.value;
    const deadlyVal = deadly.value.trim();
    if (!targetVal) {
      outputArea.textContent += "Error: No target specified.\n";
      return;
    }

    // Notify background.js to run the scan
    browser.runtime.sendMessage({
      type: "runScan",
      target: targetVal,
      scanType: scanVal,
      deadly: deadlyVal
    });
  });

  // When user clicks "Clear Output"
  clearOutputBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "clearOutput" }); // Tell background.js to clear the output
  });

  // When user clicks "Clear Hosts"
  clearHostsBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "clearHosts" }); // Tell background.js to clear the scanned targets list
  });
});
