const { ipcRenderer } =  require("electron")

window.addEventListener("DOMContentLoaded", () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    ipcRenderer.on("devices", (_event, text) => replaceText("devices", text))
})
