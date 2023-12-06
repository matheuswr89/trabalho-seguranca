const { ipcRenderer } = require('electron')

document.getElementById("myButton").addEventListener("click", myFunction);

function myFunction() {
  var inputValue = document.getElementById('inputField').value;
  ipcRenderer.send('asynchronous-message', inputValue)
}
