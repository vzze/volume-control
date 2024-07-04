const storage     = browser.storage.session;
const syncStorage = browser.storage.sync;

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
    const sync = await syncStorage.get("nonLinearVolume").catch(() => {});

    if(!data) return;
    if(!data.volumes) return;
    if(data.volumes[tabId] == undefined) return;

    const nonLinearVolume = (sync.nonLinearVolume) ? true : false;

    const newVolume = (vol) => {
        if(nonLinearVolume)
            return (vol / 100) ** 2;
        else
            return (vol / 100);
    }

    const res = await browser.tabs.executeScript(tabId, {
        code: `document.querySelectorAll("video, audio")[0].volume`
    }).catch(() => {});

    if(Math.floor(res[0] * 100) != data.volumes[tabId])
        data.volumes[tabId] = Math.floor(res[0] * 100)

    await browser.tabs.executeScript(tabId, {
        code: `document.querySelectorAll("video, audio").forEach(elem => elem.volume = ${newVolume(data.volumes[tabId])})`
    }).catch(() => { data.volumes[tabId] = 100; });

    await storage.set({ volumes: data.volumes }).catch(() => {});
});
