console.log("popup.js loaded");

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('takeScreenshot').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {message: 'takeScreenshot'}, function(response) {
                if (response && response.imageUrl) {
                    var link = document.createElement('a');
                    link.href = response.imageUrl;
                    link.download = 'screenshot.png';
                    link.click();
                }
            });
        });
    });
});
