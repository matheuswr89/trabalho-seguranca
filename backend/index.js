import { execSync } from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import notifier from "node-notifier"
import open from "open";
import * as os from "os";
import { usb } from "usb";
import jsonwebtoken from "jsonwebtoken"

function getWindowsDisks() {
  const lines = execSync("wmic logicaldisk where drivetype=2 get DeviceID")
    .toString()
    .split("\r\n");
  const disks = [];
  lines.shift();
  lines.forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length > 0 && parts[0] !== "") {
      const disk = "USB";
      const mountPoint = parts[0];
      disks.push({ disk, mountPoint });
    }
  });

  return disks;
}

function getUnixDisks() {
  const dmesgResult = execSync("dmesg --notime | grep sd").toString().split("\n");
  let splitResult = dmesgResult[dmesgResult.length - 4].trim().split(":")
  if (splitResult.length !== 2) splitResult = dmesgResult[dmesgResult.length - 3].trim().split(":")
  const lines = execSync(`lsblk -pl | grep${splitResult[1]}`).toString().replace("\n", "").split(/^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/);

  return lines[7];
}

async function readDir(disk) {
  try {
    const files = await fs.readdirSync(disk, { withFileTypes: true });
    const pemFile = files.filter(file => file.name.includes('.pem'))[0];

    if (pemFile) {
      const separator = os.platform() === 'win32' ? '\\' : '/';
      const filePath = `${disk}${separator}${pemFile.name}`;

      const certContent = await fs.readFileSync(filePath);
      const encrypted = await encryptStringWithPrivateKey(certContent);

      if (encrypted) {
        const url = `http://localhost:3000/?token=${encrypted}`;
        await open(url);
      } else {
        notifier.notify({
          title: 'Trabalho Segurança',
          message: 'Erro ao gerar o texto criptografado.'
        });
      }
    } else {
      notifier.notify({
        title: 'Trabalho Segurança',
        message: 'Nenhuma chave privada foi encontrada.'
      });
    }
  } catch (err) {
    notifier.notify({
      title: 'Trabalho Segurança',
      message: `Erro ao ler o disco "${disk}": ${err.message}`
    });
  }
}

function encryptStringWithPrivateKey(privateKey) {
  const token = jsonwebtoken.sign("Olá mundo", privateKey, {algorithm: "RS256"});
  console.log(token)
  return token;
};

function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

usb.on("attach", async function (device) {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const disks = os.platform() === "win32" ? getWindowsDisks() : getUnixDisks();
  readDir(disks);
});
