const storage = (browser.storage.session) ? browser.storage.session : browser.storage.sync;

browser.tabs.onRemoved.addListener(async tabId => {
    let data = await browser.storage.sync.get("volumes").catch(() => {});

    if(!data) return;
    if(!data.volumes) return;
    if(!data.volumes[tabId]) return;

    delete data.volumes[tabId];
    storage.set({ volumes: data.volumes }).catch(() => {});
})
