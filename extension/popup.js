let volumes = {}

const storage = (browser.storage.session) ? browser.storage.session : browser.storage.sync;

const throttle = (callback, delay) => {
    let shouldWait = false;
    let waitingArgs = undefined;

    const timeoutFunc = () => {
        if(waitingArgs == undefined) {
            shouldWait = false;
        } else {
            callback(...waitingArgs);
            waitingArgs = undefined;
            setTimeout(timeoutFunc, delay);
        }
    }

    return (...args) => {
        if(shouldWait) {
            waitingArgs = args;
        } else {
            callback(...args);
            shouldWait = true;
            setTimeout(timeoutFunc, delay);
        }
    }
}

const updateRange = throttle(async (id, value) => {
    await browser.tabs.executeScript(id, {
        code: `document.querySelectorAll("video, audio").forEach(elem => elem.volume = ${value / 100})`
    }).catch(() => { return; });

    volumes[id] = value;

    await storage.set({ volumes: volumes }).catch(() => {});
}, 50);

const rangeSlider = () => {
    const slider = document.querySelectorAll('.Slider');
    const ranges = document.querySelectorAll('.SliderRange');
    const value = document.querySelectorAll('.SliderValue');

    slider.forEach(() => {
        value.forEach((currentTarget) => {
            currentTarget.innerHTML = currentTarget.previousElementSibling.value;
        });

        ranges.forEach((range) => {
            range.addEventListener('input', ({ currentTarget }) => {
                currentTarget.nextElementSibling.innerHTML = currentTarget.value;

                updateRange(Number(currentTarget.id), Number(currentTarget.value));
            });
        });
    });
}

const createLiEl = async (tabTitle, tabId) => {
    const div = document.createElement("div");

    div.className = "Slider";

    const range = document.createElement("input");

    range.className = "SliderRange";
    range.value     = volumes[tabId];
    range.type      = "range";
    range.id        = String(tabId);
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

    const pause = document.createElement("button");

    pause.id = "btn" + String(tabId);
    pause.classList.add("button");

    const is_paused = await browser.tabs.executeScript(tabId, {
        code: `
            Array.from(document.querySelectorAll("video, audio")).reduce((n, el) => {
                if(el.paused != undefined)
                    if(el.paused == false)
                        return n + 1;
                    else
                        return n;
                else
                    return n;
            }, 0)
        `
    });

    if(is_paused[0]) pause.textContent = "Pause  |"
    else             pause.textContent = "Resume |"

    pause.onclick = async () => {
        const btn = document.getElementById("btn" + String(tabId));
        if(btn.textContent == "Pause  |") {
            await browser.tabs.executeScript(tabId, {
                code: `document.querySelectorAll("video, audio").forEach(elem => elem.pause())`
            }).catch(() => { return; });
            btn.textContent = "Resume |";
        } else {
            await browser.tabs.executeScript(tabId, {
                code: `document.querySelectorAll("video, audio").forEach(elem => elem.play())`
            }).catch(() => { return; });
            btn.textContent = "Pause  |";
        }
    }

    div.appendChild(pause);
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

        if(volumes[Number(tab.id)] == undefined) volumes[Number(tab.id)] = 100;

        const newLi = document.createElement("li");

        newLi.appendChild(await createLiEl(tab.title, Number(tab.id)));
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
