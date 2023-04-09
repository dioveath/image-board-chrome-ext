console.log("background.js loaded")
importScripts("scripts/ExtPay.js");

const extPay = ExtPay('easy-image---clipboard-for-images');

extPay.startBackground();

extPay.getUser().then((user) => {
    console.log(user);
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("ImageBoard onInstalled");
});

chrome.storage.local.onChanged.addListener((changes, namespace) => {
    for(let key in changes) {
        let storageChange = changes[key];
        console.log('Storage key "%s" in namespace "%s" changed. ' +
                    'Old value was "%s", new value is "%s".',
                    key,
                    namespace,
                    storageChange.oldValue,
                    storageChange.newValue);
    }

    console.log("ImageBoard storage onChanged Listener");
});



