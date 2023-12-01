const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { usb } = require("usb");
const { getChaves } = require("./firebase")
const { execSync } = require("child_process");
const { app, BrowserWindow } = require("electron");

function getUnixDisks() {
    const dmesgResult = execSync("dmesg --notime | grep sd").toString().split("\n");
    let splitResult = dmesgResult[dmesgResult.length - 4].trim().split(":")
    if (splitResult.length !== 2) splitResult = dmesgResult[dmesgResult.length - 3].trim().split(":")
    const lines = execSync(`lsblk -pl | grep${splitResult[1]}`).toString().replace("\n", "").split(/^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/);

    return lines[7];
}

async function readDir(disk, window) {
    try {
        const files = await fs.readdirSync(disk, { withFileTypes: true });
        const pemFile = files.filter(file => file.name.includes(".pem"))[0];

        if (pemFile) {
            const filePath = `${disk}/${pemFile.name}`;

            const certContent = await fs.readFileSync(filePath);
            const encrypted = await encryptStringWithPrivateKey(certContent);

            if (encrypted) {
                decryptStringWithPublicKey(encrypted, window)
            } else {
                window.webContents.send("devices", "Erro ao gerar o texto criptografado.");
            }
        } else {
            window.webContents.send("devices", "Nenhuma chave privada foi encontrada.");
        }
    } catch (err) {
        window.webContents.send("devices", `Erro ao ler o disco "${disk}": ${err.message}`);
    }
}

async function decryptStringWithPublicKey(toDecrypt, window) {
    const chaves = await getChaves();
    chaves.every(key => {
        try {
            const replacedKey = key.data().chave
                .trim()
                .replace("-----BEGIN CERTIFICATE----- ", "")
                .replace("-----END CERTIFICATE-----", "")
                .replace(/ /g, "\n")
            const certContents =
                "-----BEGIN CERTIFICATE-----" + "\n" +
                replacedKey +
                "-----END CERTIFICATE-----"
            const buffer = Buffer.from(toDecrypt, "base64");
            const userName = new crypto.X509Certificate(certContents).issuer.split("\n")[4].replace("CN=", "");
            const decrypted = crypto.publicDecrypt(Buffer.from(certContents), buffer);
            const displayContent = `${decrypted.toString("utf-8")} Meu nome é ${userName}!`
            window.webContents.send("devices", displayContent);
            return;
        } catch (err) {
            window.webContents.send("devices", "Acesso negado!");
        }
    })
};

function encryptStringWithPrivateKey(privateKey) {
    const buffer = Buffer.from("Olá mundo!");
    const encrypted = crypto.privateEncrypt(privateKey, buffer);
    return encrypted.toString("base64");
};

async function showDevices(window) {
    usb.on("attach", async function (device) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const disks = getUnixDisks();
        readDir(disks, window);
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
            preload: path.join(__dirname, "preload.js")
        }
    });

    window.loadFile("index.html");
    window.webContents.send("devices", "Insira um usb com a chave privada!");
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