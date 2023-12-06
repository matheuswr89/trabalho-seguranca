const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { usb } = require("usb");
const { execSync } = require("child_process");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");

function getUnixDisks() {
    const dmesgResult = execSync("dmesg --notime | grep sd").toString().split("\n");
    let splitResult = dmesgResult[dmesgResult.length - 4].trim().split(":")
    if (splitResult.length !== 2) splitResult = dmesgResult[dmesgResult.length - 3].trim().split(":")
    const lines = execSync(`lsblk -pl | grep${splitResult[1]} | awk '{print $7}'`).toString().replace("\n", "");

    return lines;
}

async function readDir(disk, window) {
    try {
        const files = await fs.readdirSync(disk, { withFileTypes: true });
        const pemFile = files.filter(file => file.name.includes(".pem"))[0];

        if (pemFile) {
            const filePath = `${disk}/${pemFile.name}`;

            const certContent = await fs.readFileSync(filePath);
            const encrypted = await encryptStringWithPrivateKey(certContent);

            window.webContents.send("devices", "");
            window.webContents.executeJavaScript("document.getElementById('form').style.display = \"block\"")
            ipcMain.on('asynchronous-message', (event, arg) => {
                if (arg) {
                    window.webContents.executeJavaScript("document.getElementById('inputField').value = ''")
                    window.webContents.executeJavaScript("document.getElementById('form').style.display = \"none\"")
                    decryptStringWithPublicKey(encrypted, window, arg)
                }
                else dialog.showMessageBox(window, { message: "Forneça o seu nome!", type: "error" })
            });
        } else {
            window.webContents.send("devices", "Nenhuma chave privada foi encontrada.");
        }
    } catch (err) {
        window.webContents.send("devices", `Erro ao gerar o texto criptografado, verifique se o arquivo está corretamente formatado.`);
    }
}

async function decryptStringWithPublicKey(toDecrypt, window, nomeUser) {
    const pwd = execSync("pwd").toString().split("\n")[0];
    const files = await fs.readdirSync(`${pwd}/src/chaves/`, { withFileTypes: true });
    const file = files.filter(f => f.name.split(".")[0] === nomeUser)
    if (file.length === 1) {
        const chavePublica = await fs.readFileSync(`${file[0].path}/${file[0].name}`);
        try {
            const buffer = Buffer.from(toDecrypt, "base64");
            const userName = new crypto.X509Certificate(chavePublica).issuer.split("\n")[4].replace("CN=", "");
            const decrypted = crypto.publicDecrypt(chavePublica, buffer);
            const displayContent = `${decrypted.toString("utf-8")} Meu nome é ${userName}!`
            window.webContents.send("devices", displayContent);
        } catch (err) {
            console.log(err)
            window.webContents.send("devices", "Acesso negado!");
        }
    } else {
        window.webContents.send("devices", "Você não está na lista de autorizados!");
    }
};

function encryptStringWithPrivateKey(privateKey) {
    const buffer = Buffer.from("Olá mundo!");
    const encrypted = crypto.privateEncrypt(privateKey, buffer);
    return encrypted.toString("base64");
};

async function showDevices(window) {
    window.webContents.executeJavaScript("document.getElementById('form').style.display = \"none\"");
    usb.on("attach", async function (device) {
        window.webContents.send("devices", "Carregando...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const disk = getUnixDisks();
        readDir(disk, window);
    });

    usb.on("detach", async function (device) {
        window.webContents.send("devices", "Insira um usb com a chave privada!");
    });
};

function createWindow() {
    const window = new BrowserWindow({
        width: 300,
        height: 120,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    window.loadFile("index.html");
    window.webContents.executeJavaScript("document.getElementById('devices').textContent = 'Insira um usb com a chave privada!'");
    showDevices(window);
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