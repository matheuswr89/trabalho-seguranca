import { execSync } from "child_process";
import * as fs from "fs";
import open from "open";
import * as os from "os";
import { usb } from "usb";
import * as crypto from "crypto"
import jwt from "jsonwebtoken"

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
  const lines = execSync('lsblk -pl | awk \'$3 == "1" && $6 == "part"\'').toString().split("\n");
  lines.pop()
  const disks = [];
  lines.forEach((line) => {
    const splitLine = line.split(/\s+/);
    const disk = splitLine[0];
    const mountPoint = splitLine[6];
    disks.push({ disk, mountPoint });
  });
  console.log(disks)
  return disks;
}

async function readDir(disks) {
  for (let disk of disks) {
    try {
      const files = await fs.readdirSync(disk.mountPoint, { withFileTypes: true });

      for (let file of files) {
        if (file.name.includes('.pem')) {
          const separator = os.platform() === 'win32' ? '\\' : '/';
          const filePath = `${disk.mountPoint}${separator}${file.name}`;

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
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${disk.mountPoint}: ${err.message}`);
    }
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
