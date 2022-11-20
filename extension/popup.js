let volumes = {}

let request_handler = true;

const storage = (browser.storage.session) ? browser.storage.session : browser.storage.sync;

const rangeSlider = () => {
    const slider = $('.Slider');
    const range  = $('.SliderRange');
    const value  = $('.SliderValue');

    slider.each(function() {
        value.each(function() {
            $(this).html(
                $(this).prev().attr('value')
            );
        });

        range.on('input', function() {
            $(this).next(value).html(this.value);

            if(!request_handler) return;
            else request_handler = false;

            setTimeout(async () => {
                await browser.tabs.executeScript(Number(this.id), {
                    code: `document.querySelectorAll("video, audio").forEach(elem => elem.volume = ${this.value / 100})`
                }).catch(() => { request_handler = true; return; });

                volumes[this.id] = Number(this.value);
                await storage.set({ volumes: volumes });
                request_handler = true;
            }, 50);
        });
    });
};

const createLiEl = (tabTitle, tabId) => {
    const div = document.createElement("div");

    div.className = "Slider";

    const range = document.createElement("input");

    range.className = "SliderRange";
    range.value     = volumes[tabId];
    range.type      = "range";
    range.id        = tabId;
    range.max       = "100";
    range.min       = '0';
    range.step      = '1';

    const title = document.createElement("a");

    if(tabTitle.length > 20)
        tabTitle = tabTitle.slice(0, 17) + "...";
    else
        while(tabTitle.length < 20) tabTitle += ".";

    title.text = tabTitle;

    const span = document.createElement("a");

    span.text = String(volumes[tabId]);
    span.className = "SliderValue";

    div.appendChild(title);
    div.appendChild(range);
    div.appendChild(span);

    return div;
}

(async () => {
    const data = await storage.get("volumes").catch(() => {});
    const main = await browser.windows.getCurrent().catch(() => {});
    const tabs = await browser.tabs.query({}).catch(() => {});

    await storage.clear().catch(() => {});

    const list = document.getElementById("tbs");

    if(data.volumes) volumes = data.volumes;

    let atLeastOne = false;

    await Promise.all(tabs.map(async tab => {
        if(tab.windowId != main.id) return;

        const res = await browser.tabs.executeScript(Number(tab.id), {
            code: `document.querySelectorAll("video, audio").length`
        }).catch(() => {});

        if(!res || !res[0]) return;

        atLeastOne = true;

        if(volumes[`${tab.id}`] == undefined) volumes[tab.id] = 100;

        const newLi = document.createElement("li");

        newLi.appendChild(createLiEl(tab.title, tab.id));
        list.appendChild(newLi);
    })).catch(() => {});

    if(!atLeastOne) {
        const a = document.createElement("a");

        a.text  = "No tabs with audio open.";
        a.style.paddingRight = "30px";

        list.appendChild(
            document.createElement("li").appendChild(a)
        );
    }

    await storage.set({ volumes: volumes }).catch(() => {});
    rangeSlider();
})();
