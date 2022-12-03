const storage = (browser.storage.session) ? browser.storage.session : browser.storage.sync;

browser.tabs.onRemoved.addListener(async tabId => {
    const data = await storage.get("volumes").catch(() => {});

    if(!data) return;
    if(!data.volumes) return;
    if(data.volumes[tabId] == undefined) return;

    delete data.volumes[tabId];

    await storage.set({ volumes: data.volumes }).catch(() => {});
});

browser.tabs.onUpdated.addListener(async tabId => {
    const data = await storage.get("volumes").catch(() => {});

    if(!data) return;
    if(!data.volumes) return;
    if(data.volumes[tabId] == undefined) return;

    const res = await browser.tabs.executeScript(tabId, {
        code: `document.querySelectorAll("video, audio")[0].volume`
    }).catch(() => {});

    if(Math.floor(res[0] * 100) != data.volumes[tabId])
        data.volumes[tabId] = Math.floor(res[0] * 100)

    await browser.tabs.executeScript(tabId, {
        code: `document.querySelectorAll("video, audio").forEach(elem => elem.volume = ${data.volumes[tabId] / 100})`
    }).catch(() => { data.volumes[tabId] = 100; });

    await storage.set({ volumes: data.volumes }).catch(() => {});
});
