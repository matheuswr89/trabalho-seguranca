import { useEffect } from "react";
import { getChaves } from "./firebase";
import jsonwebtoken from "jsonwebtoken"

export default function Home() {
  useEffect(() => {
    (async () => {
      const docs = await getChaves()
      const signature = "eyJhbGciOiJSUzI1NiJ9.T2zDoSBtdW5kbw.jdWev7EHOvL7ZCAaoPpWLtUoRCq-tFc0__9djTIvjKQfhoVoyP8_-lUbJv5DVJmzVUseyjUwrkPnQ3FOfLEReI-PVuYd82MygJD-ciIGUIowbB_LKrf2grSMlWD6H6dDACy-Q-F727NF2fNldBrtFbFjJJeYgpZKe6WncvLd8kSjCK7JnDYZKYxdzg89mWKArDjVKJRHSkN7hqAoDcgITn8cBG0JYFD-bSrOBuitMux9AkNfmczpYVJaaf5EtVTj6lYEdqwc7s-cSSc8bckrgHL8frg0_9Y55Cmxjfjpyz_DZC0rbbK6rEyLFZCoGXlL_VRu3TgDJ8pOk5gakV656w"
      console.log(jsonwebtoken.verify(signature,docs[1].data()['chave'], {algorithms: ['RS256']}))
    })()
  }, [])

  return (
    <div className="home-container">
      <div>
        <h1>Bem vindo, !</h1>
        <p>Você faz parte da organização: .</p>
      </div>
    </div>
  );
}
