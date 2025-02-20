document.addEventListener("DOMContentLoaded", async () => {
    
    //Buttons
    const runScanBtn = document.getElementById("runScanBtn");
    const clearOutputBtn = document.getElementById("clearOutputBtn");
    const clearOutfileBtn = document.getElementById("clearOutfileBtn");
    const clearTargetsBtn = document.getElementById("clearTargetsBtn");
    const streamOutputBtn = document.getElementById("streamOutputBtn");
    const extractStreamUrlsBtn = document.getElementById("extractStreamUrlsBtn");
    

    //CheckBoxes
    const deadlySelect = document.getElementById("deadly");
    const viewPreset = document.getElementById("viewPreset");
    const burpsuite = document.getElementById("burpsuite");
    const strictScope = document.getElementById("strictScope");
    

    //Scan DropDowns
    const targetDropdown = document.getElementById("targetInput");
    const scanSelect = document.getElementById("scanSelect");
    const eventTypeSelect = document.getElementById("eventTypeSelect");
    const flagSelect = document.getElementById("flagSelect");
    const moduleSelect = document.getElementById("modDeps");

    //Output Text Areas
    const outputArea = document.getElementById("outputArea");
    const hostsArea = document.getElementById("hostsArea");

    //FileParser
    const getSubdomainsDropdown = document.getElementById("getSubdomains");

    //Dynamically Updated Fields
    browser.runtime.sendMessage({ type: "getOutput" });
    browser.runtime.sendMessage({ type: "getOutfile" });
    browser.runtime.sendMessage({ type: "getHosts" });
    
    
    function updateDropdown(filePaths) {
        if (!filePaths || filePaths.length === 0) {
            console.warn("No outfiles found.");
            return;
        }
        let newOptions = filePaths.map(filePath => {
            let parts= filePath.split('/');
            let fileName = parts.pop();
            let scanName = parts.pop();
            let result = `${scanName}/${fileName}`;
            return `<option value="${filePath}">${result}</option>`;
        }).join("");

        
        getSubdomainsDropdown.innerHTML = newOptions;
        console.log("Dropdown updated successfully!");
    }


    async function fetchRecentDomains() {
        try {
            const historyItems = await browser.history.search({ text: "", maxResults: 15 }); // Get 15 history items
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
            targetDropdown.innerHTML = "";
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
        const deadlyVal = deadlySelect.checked;
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

    
    clearOutputBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "clearOutput" });
    });
    extractStreamUrlsBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "getURLS" });
    });
    streamOutputBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "getOutput" });
    });
    browser.runtime.onMessage.addListener((message) => {
        if (message.type === "updateOutfileList") {
            updateDropdown(message.data);}
    });
    getSubdomains.addEventListener("click", () => {
        const selectedPath = getSubdomains.value;
        browser.runtime.sendMessage({ type: "getSubdomains" , subdomains: selectedPath });
    });
    clearTargetsBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "clearHosts" });
    });
    clearOutfileBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "clearOutfile" });
    });
});
