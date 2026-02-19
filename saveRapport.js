// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// 🔥 PLAK HIER JOUW FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB_kkCYenzuTUzVZLl9sjBlfxIBaQ5gGuY",
  authDomain: "rapport-site-bcdae.firebaseapp.com",
  projectId: "rapport-site-bcdae",
  storageBucket: "rapport-site-bcdae.firebasestorage.app",
  messagingSenderId: "310508712363",
  appId: "1:310508712363:web:aaa90993185fa218cd62ee"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ===============================
// DOM
// ===============================

const logoutButton = document.getElementById("logoutButton");
const loginForm = document.getElementById("loginForm");
const saveButton = document.getElementById("saveRapport");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const rapportList = document.getElementById("rapportList");


// ===============================
// AUTH
// ===============================

async function registerUser(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Registratie succesvol!");
  } catch (error) {
    alert(error.message);
  }
}

async function loginUser(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login succesvol!");
  } catch (error) {
    alert("Login mislukt!");
  }
}

logoutButton.addEventListener("click", async () => {
  await signOut(auth);
  alert("Je bent uitgelogd!");
    document.getElementById(`username`).value = "";
    document.getElementById(`password`).value = "";
  vakken.forEach((_, i) => {
        document.getElementById(`totaalVerdiend-${i}`).value = "";
        document.getElementById(`totaalTeVerdienen-${i}`).value = "";
        updateRow(i); // update procenten en verdiend/max (maakt leeg)
    });
});


// ===============================
// RAPPORT OPSLAAN
// ===============================

async function saveRapport() {

  const user = auth.currentUser;
  if (!user) {
    alert("Je moet inloggen!");
    return;
  }

  let rapportData = [];

  const rows = document.querySelectorAll("#rapportTable tr");

  for (let i = 0; i < rows.length - 1; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll("td");

    rapportData.push({
        vak: cells[0].textContent,
        totaalVerdiend: cells[1].querySelector("input").value,
        totaalTeVerdienen: cells[2].querySelector("input").value
    });
  }

  const reportName = prompt("Geef naam voor rapport:");
  if (!reportName) return;

  await addDoc(collection(db, "rapporten"), {
    uid: user.uid,
    name: reportName,
    data: rapportData,
    createdAt: serverTimestamp()
  });

  alert("Rapport opgeslagen!");
  loadRapporten();
}


// ===============================
// RAPPORTEN LADEN
// ===============================

async function loadRapporten() {
  rapportList.innerHTML = "";

  const user = auth.currentUser;
  if (!user) return;

  // 🔹 Haal alle documenten van de gebruiker
  const q = query(
    collection(db, "rapporten"),
    where("uid", "==", user.uid)
    // orderBy laten we hier weg om oude documenten zonder createdAt ook te tonen
  );

  const querySnapshot = await getDocs(q);

  // Converteer naar array en sorteer lokaal
  const reports = [];
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    reports.push({
      docId: docSnap.id,
      name: data.name,
      data: data.data,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(0) // fallback oude docs
    });
  });

  // Sorteer op createdAt: oudste eerst (asc) of nieuwste eerst (desc)
  reports.sort((a, b) => a.createdAt - b.createdAt); // asc = oudste bovenaan

  // Bouw de lijst
  reports.forEach(report => {
    const li = document.createElement("li");

    const info = document.createElement("span");
    info.innerHTML = `
      ${report.name} 
      (${report.createdAt.toLocaleString()})
    `;
    li.appendChild(info);

    // 🔹 Laad knop
    const loadBtn = document.createElement("button");
    loadBtn.textContent = "Laad";
    loadBtn.style.marginLeft = "10px";
    loadBtn.onclick = () => loadRapport(report);
    li.appendChild(loadBtn);

    // 🔹 Verwijder knop
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Verwijder";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.onclick = async () => {
      await deleteDoc(doc(db, "rapporten", report.docId));

      // Maak tabel leeg
      vakken.forEach((_, i) => {
        document.getElementById(`totaalVerdiend-${i}`).value = "";
        document.getElementById(`totaalTeVerdienen-${i}`).value = "";
        updateRow(i);
      });

      loadRapporten(); // lijst opnieuw laden
    };
    li.appendChild(deleteBtn);

    rapportList.appendChild(li);
  });
}

function loadRapport(reportObject) {
  reportObject.data.forEach((rowData, i) => {
    document.getElementById(`totaalVerdiend-${i}`).value = rowData.totaalVerdiend;
    document.getElementById(`totaalTeVerdienen-${i}`).value = rowData.totaalTeVerdienen;

    // updateRow() berekent automatisch procent en verdiend/max
    updateRow(i);
  });

  updateTotals();
  updateChart();
}


// ===============================
// EVENT LISTENERS
// ===============================

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginUser(usernameInput.value, passwordInput.value);
});

document.getElementById("registerUser").addEventListener("click", (e) => {
  e.preventDefault();
  registerUser(usernameInput.value, passwordInput.value);
});

saveButton.addEventListener("click", saveRapport);


// ===============================
// AUTO LOAD BIJ LOGIN
// ===============================

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Ingelogd:", user.email);

    // Toon logout knop
    logoutButton.style.display = "inline-block";

    // Verberg login knop
    document.getElementById("loginUser").style.display = "none";
    document.getElementById("registerUser").style.display = "none";

    loadRapporten();

  } else {
    console.log("Niet ingelogd");

    rapportList.innerHTML = "";

    logoutButton.style.display = "none";
    document.getElementById("loginUser").style.display = "inline-block";
    document.getElementById("registerUser").style.display = "inline-block";
  }
});

const pasteBtn = document.getElementById("pastePointsBtn");
const pasteModal = document.getElementById("pasteModal");
const closePaste = document.getElementById("closePaste");
const processPaste = document.getElementById("processPaste");
const pasteInput = document.getElementById("pasteInput");

pasteBtn.addEventListener("click", () => {
  pasteModal.style.display = "block";
});

closePaste.addEventListener("click", () => {
  pasteModal.style.display = "none";
});

processPaste.addEventListener("click", () => {
    vakken.forEach((_, i) => {
        document.getElementById(`totaalVerdiend-${i}`).value = "";
        document.getElementById(`totaalTeVerdienen-${i}`).value = "";
        updateRow(i); // update procenten en verdiend/max (maakt leeg)
    });
  const text = pasteInput.value;
  const lines = text.split("\n");

  lines.forEach(line => {
    if (!line.trim()) return;

    const parts = line.split("\t");
    const vakNaam = parts[0].trim();

    // Zoek juiste vak index
    const index = vakken.findIndex(v => 
      v.naam.toLowerCase().includes(vakNaam.toLowerCase())
    );

    if (index === -1) return;

    let totaalVerdiend = 0;
    let totaalTeVerdienen = 0;

    // Loop over alle kolommen behalve eerste
    for (let i = 1; i < parts.length; i++) {
      const punt = parts[i].replace(",", ".").trim();

      if (punt.includes("/")) {
        const [verdiend, max] = punt.split("/").map(Number);

        if (!isNaN(verdiend) && !isNaN(max)) {
          totaalVerdiend += verdiend;
          totaalTeVerdienen += max;
        }
      }
    }

    // Zet in inputvelden
    document.getElementById(`totaalVerdiend-${index}`).value =
        totaalVerdiend ? totaalVerdiend.toFixed(2) : "";

        document.getElementById(`totaalTeVerdienen-${index}`).value =
        totaalTeVerdienen ? totaalTeVerdienen.toFixed(2) : "";

        // Update berekening
        updateRow(index);
        
    });

    pasteModal.style.display = "none";
    pasteInput.value = "";
    updateTotals();
    updateChart();
});