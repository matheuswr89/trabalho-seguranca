import { execSync } from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import jwt from "jsonwebtoken";
import open from "open";
import * as os from "os";
import { usb } from "usb";

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

      try {
        const certContent = await fs.readFileSync(filePath);
        const certData = new crypto.X509Certificate(certContent);
        const authorized = await verifyAuthorization(certData.fingerprint);

        if (authorized) {
          const issuerSplit = certData.issuer.split('\n');
          const name = issuerSplit.find(line => line.startsWith('CN=')).split('=')[1];

          const organization = issuerSplit.find(line => line.startsWith('O=')).split('=')[1];

          const token = jwt.sign({
            fingerprint: certData.fingerprint,
            name,
            organization,
            exp: new Date(new Date().getTime() + 5 * 60000) / 1000
          }, "trabalho")

          const url = `https://trabalho-seguranca.vercel.app/?token=${token}`;
          await open(url);
        } else {
          console.error("Usuário não autorizado!");
          await open('https://trabalho-seguranca.vercel.app/error');
        }
      } catch (err) {
        console.error(`Error reading certificate file ${filePath}: ${err.message}`);
      }
    } else {
      console.error('Nenhum certificado foi encontrado.');
    }

  } catch (err) {
    console.error(`Error reading directory ${disk}: ${err.message}`);
  }
}


async function verifyAuthorization(fingerprint) {
  const response = await fetch("https://raw.githubusercontent.com/matheuswr89/trabalho-seguranca/master/Seguran%C3%A7a/autorizados.json");
  const authorizeds = await response.json()

  return authorizeds.some(auth => auth === fingerprint);
}

usb.on("attach", async function (device) {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const disks = os.platform() === "win32" ? getWindowsDisks() : getUnixDisks();
  readDir(disks);
});
