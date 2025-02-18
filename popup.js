document.addEventListener("DOMContentLoaded", async () => {
    const runScanBtn = document.getElementById("runScanBtn");
    const clearOutputBtn = document.getElementById("clearOutputBtn");
    const getHostsBtn = document.getElementById("getHostsBtn");
    const clearHostsBtn = document.getElementById("clearHostsBtn");
    const getOutputBtn = document.getElementById("getOutputBtn");
    const targetDropdown = document.getElementById("targetInput"); // Now a <select>
    const getUrlsBtn = document.getElementById("getUrlsBtn");
    const scanSelect = document.getElementById("scanSelect");
    const eventTypeSelect = document.getElementById("eventTypeSelect");
    const deadlySelect = document.getElementById("deadly");
    const moduleSelect = document.getElementById("modDeps");
    const flagSelect = document.getElementById("flagSelect");
    const outputArea = document.getElementById("outputArea");
    const hostsArea = document.getElementById("hostsArea");
    const burpsuite = document.getElementById("burpsuite");
    const viewPreset = document.getElementById("viewPreset");
    const strictScope = document.getElementById("strictScope");
    browser.runtime.sendMessage({ type: "getOutput" });
    browser.runtime.sendMessage({ type: "getHosts" });
    

    // Function to fetch recent domains
    async function fetchRecentDomains() {
        try {
            const historyItems = await browser.history.search({ text: "", maxResults: 15 }); // Get last 10 history items
            let uniqueDomains = new Set();

            historyItems.forEach(item => {
                try {
                    let urlObj = new URL(item.url);
                    uniqueDomains.add(urlObj.hostname); // Extract domain
                } catch (e) {
                    console.error("Invalid URL:", item.url);
                }
            });

            // Populate the dropdown with domains
            targetDropdown.innerHTML = ""; // Clear previous options
            uniqueDomains.forEach(domain => {
                let option = document.createElement("option");
                option.value = domain;
                option.textContent = domain;
                targetDropdown.appendChild(option);
            });

            // Set the most recent domain as selected
            if (targetDropdown.options.length > 0) {
                targetDropdown.selectedIndex = 0;
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    }

    await fetchRecentDomains(); // Load recent domains when popup opens

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
        const targetVal = targetDropdown.value.trim(); // Get selected domain
        const scanVal = scanSelect.value;
        const deadlyVal = deadlySelect.value.trim();
        const burpVal = burpsuite.checked;

        const eventTypeVal = eventTypeSelect.value.trim() || "*";
        const modDepsVal = moduleSelect.value.trim();
        const flagVal = flagSelect.value.trim();
        const viewPresetVal = viewPreset.checked;
        const scopeVal = strictScope.checked;

        if (!targetVal) {
            outputArea.textContent += "Error: No target selected.\n";
            return;
        }

        // Notify background.js to run the scan
        browser.runtime.sendMessage({
            type: "runScan",
            target: targetVal,
            scanType: scanVal,
            deadly: deadlyVal,
            eventType: eventTypeVal,
            moddep: modDepsVal,
            flagType: flagVal,
            burp: burpVal,
            viewtype: viewPresetVal,
            scope: scopeVal
        });
    });

    // When user clicks "Clear Output"
    clearOutputBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "clearOutput" });
    });
    getHostsBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "getHosts" });
    });
    getUrlsBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "getURLS" });
    });
    getOutputBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "getOutput" });
    });

    // When user clicks "Clear Hosts"
    clearHostsBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "clearHosts" });
    });
});
