const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { usb } = require("usb");
const { execSync } = require("child_process");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");

let globalWindow = null;

const resetValue = "document.getElementById('inputField').value = ''";
const resetValuePassword = "document.getElementById('inputFieldPassword').value = ''";
const formDisplayNone = "document.getElementById('form').style.display = \"none\"";
const formDisplayBlock = "document.getElementById('form').style.display = \"block\"";
const retryButtonDisplayNone = "document.getElementById('retryButton').style.display = \"none\"";
const retryButtonDisplayBlock = "document.getElementById('retryButton').style.display = \"block\"";
const devicesSendMessage = "document.getElementById('devices').textContent = 'Insira um usb com a chave privada!'";

function getUnixDisks() {
    const dmesgResult = execSync("dmesg --notime | grep sd").toString().split("\n");
    let splitResult = dmesgResult[dmesgResult.length - 4].trim().split(":");
    if (splitResult.length !== 2) splitResult = dmesgResult[dmesgResult.length - 3].trim().split(":");
    const lines = execSync(`lsblk -pl | grep${splitResult[1]}`).toString().split(/ |\n/g);
    return lines.filter(e => e).slice(6).join(" ");
}

async function readDir(disk) {
    try {
        const files = await fs.readdirSync(disk, { withFileTypes: true });
        const pemFile = files.filter(file => file.name.includes(".pem"))[0];

        if (pemFile) {
            const filePath = `${disk}/${pemFile.name}`;
            const certContent = await fs.readFileSync(filePath);

            globalWindow.webContents.send("devices", "");
            globalWindow.webContents.executeJavaScript(formDisplayBlock);
            ipcMain.on('asynchronous-message', async (event, arg) => {
                if (arg.name && arg.senha) {
                    const encrypted = encryptStringWithPrivateKey(certContent, arg.senha);
                    globalWindow.webContents.executeJavaScript(resetValue);
                    globalWindow.webContents.executeJavaScript(resetValuePassword);
                    globalWindow.webContents.executeJavaScript(formDisplayNone);
                    if(encrypted) {
                        decryptStringWithPublicKey(encrypted, arg.name);
                    }
                }
                else dialog.showMessageBox(globalWindow, { message: "Forneça o seu nome e a senha da chave!", type: "error" });
            });
        } else {
            globalWindow.webContents.send("devices", "Nenhuma chave privada foi encontrada.");
        }
    } catch (err) {
        globalWindow.webContents.send("devices", `Erro ao gerar o texto criptografado.`);
    }
}

async function decryptStringWithPublicKey(toDecrypt, nomeUser) {
    const absolutePath = path.resolve(".");
    const file = `${absolutePath}/src/chaves/pub-${nomeUser}.pem`;
    if (fs.existsSync(file)) {
        const chavePublica = await fs.readFileSync(file);
        try {
            const buffer = Buffer.from(toDecrypt, "base64");
            const userName = new crypto.X509Certificate(chavePublica).issuer.match(/^CN.*$/gm)[0].replace("CN=", "");
            const decrypted = crypto.publicDecrypt(chavePublica, buffer);
            globalWindow.webContents.send("devices", `${decrypted.toString("utf-8")} Seu nome é ${userName}!`);
        } catch (err) {
            globalWindow.webContents.send("devices", "Acesso negado! Verifique os dados e tente novamente!");
            globalWindow.webContents.executeJavaScript(retryButtonDisplayBlock);
        }
    } else {
        globalWindow.webContents.send("devices", "Você não está na lista de autorizados!");
        globalWindow.webContents.executeJavaScript(retryButtonDisplayBlock);
    }
};

function encryptStringWithPrivateKey(key, passphrase) {
    try {
        const buffer = Buffer.from("Olá mundo!");
        const encrypted = crypto.privateEncrypt({ key, passphrase }, buffer);
        return encrypted.toString("base64");
    } catch (err) { 
        globalWindow.webContents.executeJavaScript(retryButtonDisplayBlock);
        globalWindow.webContents.send("devices", 'Acesso negado! Verifique os dados e tente novamente!');
    }
};

async function showDevices() {
    globalWindow.webContents.executeJavaScript(formDisplayNone);
    globalWindow.webContents.executeJavaScript(retryButtonDisplayNone);
    usb.on("attach", async function () {
        globalWindow.webContents.send("devices", "Carregando...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const disk = getUnixDisks();
        readDir(disk);
    });

    usb.on("detach", async function () {
        globalWindow.webContents.send("devices", "Insira um usb com a chave privada!");
    });
};

function createWindow() {
    const window = new BrowserWindow({
        width: 300,
        height: 160,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    globalWindow = window;
    globalWindow.loadFile("index.html");
    globalWindow.webContents.executeJavaScript(devicesSendMessage);
    showDevices();
};

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    app.quit();
});