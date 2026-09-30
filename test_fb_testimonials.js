import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "athletic-brook-mmbw7",
  appId: "1:379563515285:web:8a6ea54339b725bfb12a9c",
  apiKey: "AIzaSyBHM6zi00JzjprLdiOiZ42Je84Mj1Iq0Tc",
  authDomain: "athletic-brook-mmbw7.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-kirisystemhr-392f0fc7-e858-439e-827d-8694b974cfe2");

async function run() {
  try {
    const snap = await getDocs(collection(db, "testimonials"));
    console.log("Success! Found", snap.size, "testimonials.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
run();
