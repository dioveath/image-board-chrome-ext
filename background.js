console.log("background.js loaded")
importScripts("scripts/ExtPay.js");

const extPay = ExtPay('easy-image--clipboard-for-images');

extPay.startBackground();

extPay.getUser().then((user) => {
    // console.log(user);
});

chrome.runtime.onInstalled.addListener(() => {
    // console.log("ImageBoard onInstalled");
});

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     chrome.scripting.insertCSS({
//         target: { tabId: tab.id },
//         files: ["imageboard.css"]
//     }, () => {
//         console.log("ImageBoard CSS injected");
//     });    
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'insert-css') {
        chrome.scripting.insertCSS({
            target: { tabId: sender.tab.id },
            files: ["imageboard.css"]
        }, () => {
            console.log("ImageBoard CSS injected");
        });
    }

    if(request.message === 'init-slider') {
        console.log("message init-slider");
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            files: ["scripts/slider.js"]
        }, () => {
            console.log("ImageBoard content.js injected");
        });
    }        

    if(request.message === 'remove-css') {
        console.log("message remove-css");
        chrome.scripting.removeCSS({
            target: { tabId: sender.tab.id },
            files: ["imageboard.css"]
        }, () => {
            console.log("ImageBoard CSS removed");
        });
    }
});


chrome.storage.local.onChanged.addListener((changes, namespace) => {
    for (let key in changes) {
        let storageChange = changes[key];
        // console.log('Storage key "%s" in namespace "%s" changed. ' +
        //     'Old value was "%s", new value is "%s".',
        //     key,
        //     namespace,
        //     storageChange.oldValue,
        //     storageChange.newValue);
    }

    // console.log("ImageBoard storage onChanged Listener");
});