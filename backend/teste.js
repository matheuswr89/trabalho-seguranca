import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const encryptStringWithPrivateKey = function(toEncrypt, pathKey) {
    const absolutePath = path.resolve(pathKey);
    const publicKey = fs.readFileSync(absolutePath, "utf8");
    const buffer = Buffer.from(toEncrypt);
    const encrypted = crypto.privateEncrypt(publicKey, buffer);
    return encrypted.toString("base64");
};

const decryptStringWithPublicKey = function(toDecrypt, pathKey) {
    const absolutePath = path.resolve(pathKey);
    const privateKey = fs.readFileSync(absolutePath, "utf8");
    const buffer = Buffer.from(toDecrypt, "base64");
    const decrypted = crypto.publicDecrypt(privateKey, buffer);
    return decrypted.toString("utf8");
};

const encryptedString = encryptStringWithPrivateKey("Essa é a string Teste", "./priv-minhachave.pem")
console.log(encryptedString)
console.log()
const dencryptedString = decryptStringWithPublicKey(encryptedString, "./cert-matheus.pem")
console.log(dencryptedString)