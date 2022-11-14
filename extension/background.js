browser.tabs.onRemoved.addListener(async function(tabId){
    let volumes = await browser.storage.sync.get("volumes").catch(() => {})
    if(!volumes) return;
    if(!volumes[tabId]) return;
    delete volumes[tabId]
    browser.storage.sync.set({ volumes: volumes })
})
