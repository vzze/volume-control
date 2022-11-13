let volumes = {}

let request_handler = true;
var rangeSlider = function() {
    var slider = $('.range-slider'),
    range = $('.range-slider__range'),
    value = $('.range-slider__value');

    slider.each(function(){
        value.each(function(){
            var value = $(this).prev().attr('value');
            $(this).html(value);
        });
        range.on('input', function(){
            $(this).next(value).html(this.value);

            if(!request_handler) return;
            else request_handler = false;

            setTimeout(async () => {
                browser.tabs.executeScript(Number(this.id), {
                    code: `document.querySelectorAll("video, audio").forEach( elem => elem.volume = ${this.value / 100} );`
                })

                volumes[this.id] = Number(this.value)

                browser.storage.sync.set({ volumes: volumes })

                request_handler = true;
            }, 50)
        });
    });
};

function createLiEl(tabTitle, tabId) {
    let div = document.createElement("div")
    div.className = "range-slider"

    let range = document.createElement("input")
    range.className = "range-slider__range"
    range.type      = "range"
    range.value     = volumes[tabId]
    range.step      = "1"
    range.min       = "0"
    range.max       = "100"
    range.id        = tabId

    let title = document.createElement("a")
    if(tabTitle.length > 20)
        tabTitle = tabTitle.slice(0, 17) + "...";
    else
        while(tabTitle.length < 20)
            tabTitle += "."
    title.text = tabTitle

    let span = document.createElement("a")
    span.text = String(volumes[tabId])
    span.className = "range-slider__value"

    div.appendChild(title)
    div.appendChild(range)
    div.appendChild(span)

    return div
}

browser.storage.sync.get("volumes", async function(vols) {
    await browser.storage.sync.clear().catch(() => {})

    const main = await browser.windows.getCurrent().catch(() => {});

    browser.tabs.query({}, function(tabs) {
        let list = document.getElementById("tbs")
        if(vols.volumes) volumes = vols.volumes;

        tabs.forEach(tab => {
            if(tab.windowId == main.id) {
                if(volumes[`${tab.id}`] == undefined) volumes[tab.id] = 100

                let newLi = document.createElement("li")

                newLi.appendChild(createLiEl(tab.title, tab.id))

                list.appendChild(newLi)
            }
        })

        rangeSlider();
    })
})
