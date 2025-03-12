// background.js

const URLs = /\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b/g;
const logOutputs = /\/home\/[^\/]+\/\.bbot\/scans\/[^\/]+\/\S+/g;
let port = null;
let scanOutput = ""; // Store all BBOT output persistently while Firefox is running
let subdomains ="";
let hosts = new Set();
let stream = 1;
let target = "";


function connectNative() {
    port = browser.runtime.connectNative("bbot_host");

    port.onMessage.addListener((message) => {
        if (message.type === "scanResult") {
            scanOutput += message.data + "\n"; // Append scan results
            if (stream == 1) {
                browser.runtime.sendMessage({ type: "updateOutput", data: scanOutput }); // Send updated output to popup
            }
            else {
                console.log("streaming paused")
            }
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

function extractInfo(scanOutput) {
    console.log("Raw Scan Output:", scanOutput); // Log full output
    
    const markers = scanOutput.match(URLs) || []; 
    const uniqueMarkers = [...new Set(markers)];
    
    
    console.log("Extracted Markers (Unique):", uniqueMarkers);
    
    return { markers: uniqueMarkers };
}
function extractOutput(scanOutput) {
    console.log("Raw Scan Output:", scanOutput); 
    
    const outputs = (scanOutput.match(logOutputs) || []).filter(
        file => !/\b(wordcloud\.tsv|\.json|\.csv)\b/.test(file)
    );

    const uniqueOutputs = [...new Set(outputs)];

    
    return {outputs: uniqueOutputs };
}


connectNative();

function fetchSubdomains(filePath) {
    return new Promise((resolve, reject) => {
        browser.runtime.sendNativeMessage("bbot_host", { command: "getSubdomains", subdomains: filePath })
            .then(response => {
                if (response.error) {
                    console.error("Error loading subdomains:", response.error);
                    reject("Failed to load subdomains.");
                } else {
                    console.log("Subdomains:", response.data);
                    subdomains = response.data;
                    resolve(response.data);
                }
            })
            .catch(error => {
                console.error("Native Message Error:", error);
                reject("Error communicating with bbot_host.");
            });
    });
}

browser.runtime.onMessage.addListener((msg) => {
    if (!port) {
        connectNative();
    }
    

    if (msg.type === "runScan") {
        // Add target to hosts list
        hosts.add(msg.target);
        // Ensure eventType defaults to "*"
        const eventType = msg.eventType ? msg.eventType : "*";

        port.postMessage({
            command: "scan",
            target: msg.target,
            scantype: msg.scanType,
            deadly: msg.deadly,
            eventtype: eventType,
            moddep: msg.moddep,
            flagtype:msg.flagType,
            burp: msg.burp,
            viewtype: msg.viewtype,
            scope: msg.scope
        });


    } else if (msg.type === "getOutput") {
        stream = 1;
        browser.runtime.sendMessage({ type: "updateOutput", data: scanOutput });
    } else if (msg.type === "deployBbot") {
        browser.runtime.sendMessage({ type: "updateOutput", data: "###################################\n In Your terminal Please Run This!!\n###################################\n \ngit clone https://github.com/jackpas23/EBOT.git && cd EBOT && ./deploy.sh" });
    } else if (msg.type === "killScan") {
        port.postMessage({command: "killScan"});
    } else if (msg.type === "getHosts") {
        browser.runtime.sendMessage({ type: "updateHosts", data: Array.from(hosts).join('\n') }); // Send list of scanned hosts
    } else if (msg.type === "clearOutput") {
        scanOutput = ""; // Clear stored output
        browser.runtime.sendMessage({ type: "updateOutput", data: scanOutput }); // Notify popup
    } else if (msg.type === "clearHosts") {
        hosts.clear(); // Clear stored hosts
        browser.runtime.sendMessage({ type: "updateHosts", data: "" }); // Update Attacked Hosts
    } else if (msg.type === "getURLS") {
        const extractedData = extractInfo(scanOutput);
        stream = 0;
        let formattedOutput = `Extracted Markers:\n${extractedData.markers.join('\n')}`;
        console.log("Extracted Data Sent:", formattedOutput); // Debugging log
        browser.runtime.sendMessage({ type: "updateOutput", data: formattedOutput });

    } else if (msg.type === "getOutfile") {
        const extractedData = extractOutput(scanOutput);
        console.log("Extracted Outfiles:", extractedData.outputs); // Debugging log
    
        if (extractedData.outputs.length > 0) {
            browser.runtime.sendMessage({ type: "updateOutfileList", data: extractedData.outputs });
        } else {
            browser.runtime.sendMessage({ type: "updateOutfileList", data: ["No outfiles found"] });
        }
    } else if (msg.type === "getSubdomains") {
        fetchSubdomains(msg.subdomains)
            .then(data => browser.runtime.sendMessage({ type: "updateOutput", data: data }))
            .catch(error => browser.runtime.sendMessage({ type: "updateOutput", data: error }));
        
    }
});

