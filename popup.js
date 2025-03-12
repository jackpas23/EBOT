document.addEventListener("DOMContentLoaded", async () => {
    
    //Buttons
    const runScanBtn = document.getElementById("runScanBtn");
    const deployBbotBtn = document.getElementById("deployBbotBtn");
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
    let mybutton = document.getElementById("myBtn");

// When the user scrolls down 20px from the top of the document, show the button
    window.onscroll = function() {scrollFunction()};

    function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
    }

    // When the user clicks on the button, scroll to the top of the document
    
    
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
            hostsArea.textContent = message.data;
        }
    });

    // When user clicks "Run Scan"
    runScanBtn.addEventListener("click", () => {
        outputArea.textContent += "SCAN RUNNING:\n";
        const targetVal = targetDropdown.value.trim();
        const scanVal = scanSelect.value;
        const deadlyVal = deadlySelect.checked;
        const burpVal = burpsuite.checked;
        const eventTypeVal = eventTypeSelect.value.trim() || "*";
        const modDepsVal = moduleSelect.value.trim();
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
            burp: burpVal,
            viewtype: viewPresetVal,
            scope: scopeVal
        });
        setTimeout(() => {
            outputArea.scrollTop = outputArea.scrollHeight; 
            outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 1500);
    });

    
    clearOutputBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "clearOutput" });
    });
    myBtn.addEventListener("click", () => {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0;
    });
    extractStreamUrlsBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "getURLS" });
        setTimeout(() => {
            outputArea.scrollTop = outputArea.scrollHeight; 
            outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 20);
    });
    deployBbotBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "deployBbot" });
        setTimeout(() => {
            outputArea.scrollTop = outputArea.scrollHeight; 
            outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 20);
    });
    streamOutputBtn.addEventListener("click", () => {
        
        setTimeout(() => {
            outputArea.scrollTop = outputArea.scrollHeight; 
            outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 20);
        
    });
    browser.runtime.onMessage.addListener((message) => {
        if (message.type === "updateOutfileList") {
            updateDropdown(message.data);}
    });
    getSubdomains.addEventListener("change", () => {
        const selectedPath = getSubdomains.value;
        browser.runtime.sendMessage({ type: "getSubdomains" , subdomains: selectedPath });
        outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    clearTargetsBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "clearHosts" });
    });
    clearOutfileBtn.addEventListener("click", () => {
        browser.runtime.sendMessage({ type: "clearOutfile" });
    });
});
