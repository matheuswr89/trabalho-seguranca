const { ipcRenderer } = require('electron')

document.getElementById("sendButton").addEventListener("click", readValues);
document.getElementById("retryButton").addEventListener("click", retryForm);
window.addEventListener("keyup", eventHandler, false);

function retryForm() {
  document.getElementById('form').style.display = "block"
  document.getElementById('retryButton').style.display = "none"
  document.getElementById('devices').innerHTML = ""
}

function readValues() {
  const inputValue = document.getElementById('inputField').value;
  const inputValuePassword = document.getElementById('inputFieldPassword').value;
  ipcRenderer.send('asynchronous-message', { name: inputValue, senha: inputValuePassword })
}

function eventHandler(e) {
  if (e.key === "Enter" && document.getElementById('form').style.display !== "none") {
    readValues();
  }
}