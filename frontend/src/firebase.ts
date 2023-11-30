import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDheFFkRQobJ86eBcokkUfVQqEYafBQRFY",
  authDomain: "batalha-naval-d03f6.firebaseapp.com",
  projectId: "batalha-naval-d03f6",
  storageBucket: "batalha-naval-d03f6.appspot.com",
  messagingSenderId: "660867543293",
  appId: "1:660867543293:web:c84766cc5a2f141ab24e94"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export async function getChaves() {
  const q = query(collection(firestore, "chaves"))

  return await (await getDocs(q)).docs;
}