document.addEventListener("DOMContentLoaded", () => {

    // Verwijder de ingelogde gebruiker bij het laden (optioneel)
    localStorage.removeItem("loggedInUser");

    const logoutButton = document.getElementById("logoutButton");
    const loginForm = document.getElementById("loginForm");
    const saveButton = document.getElementById("saveRapport");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rapportList = document.getElementById("rapportList");
    let loadedRapportIndex = null; // Houdt bij welk rapport geladen is

    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("loggedInUser");
        usernameInput.value = "";
        passwordInput.value = "";
        alert("Je bent uitgelogd!");
        rapportList.innerHTML = "";
        logoutButton.style.display = "none";
    });

    function saveUser(username, password) {
        let users = JSON.parse(localStorage.getItem("users")) || [];
        if (users.find(u => u.username === username)) {
            alert("Gebruiker bestaat al!");
            return;
        }
        users.push({ username, password });
        localStorage.setItem("users", JSON.stringify(users));
        alert("Registratie succesvol!");
    }

    function loginUser(username, password) {
        let users = JSON.parse(localStorage.getItem("users")) || [];
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            alert("Ongeldige login!");
            return;
        }
        localStorage.setItem("loggedInUser", username);
        alert("Login succesvol!");
        loadRapportList(username);
        logoutButton.style.display = "inline-block";
    }

    // Functie om een rapport op te slaan. Als update true is, wordt het geladen rapport overschreven.
    function saveRapport(update = false) {
        let username = localStorage.getItem("loggedInUser");
        if (!username) {
            alert("Je moet inloggen!");
            return;
        }

        let rapporten = JSON.parse(localStorage.getItem("rapporten")) || {};
        let rapportData = [];

        // Verzamelen van data uit de dynamische tabel (behalve de totaalrij)
        const rows = document.querySelectorAll("#rapportTable tr");
        for (let i = 0; i < rows.length - 1; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll("td");
            if (cells.length >= 3) {
                const vak = cells[0].textContent;
                const totaalVerdiend = cells[1].querySelector("input").value;
                const totaalTeVerdienen = cells[2].querySelector("input").value;
                const computedProcent = cells[3].textContent;
                const computedVerdiend = cells[4].textContent;
                rapportData.push({ vak, totaalVerdiend, totaalTeVerdienen, computedProcent, computedVerdiend });
            }
        }

        // Haal de totaalrij op
        const totalText = document.getElementById("totaalVerdiendMax").textContent;
        let totalVerdiend = "";
        let totalMaxPunten = "";
        if (totalText) {
            [totalVerdiend, totalMaxPunten] = totalText.split(" / ");
        }
        const totalPercentage = document.getElementById("totaalProcent").textContent || "";

        let reportName = update ? rapporten[username][loadedRapportIndex].name : prompt("Geef een naam op voor het rapport:");
        if (!reportName) {
            reportName = "Onbenoemd rapport";
        }

        const reportObject = {
            name: reportName,
            data: rapportData,
            totals: {
                totalVerdiend,
                totalMaxPunten,
                totalPercentage
            },
            savedAt: new Date().toISOString()
        };

        if (!rapporten[username]) {
            rapporten[username] = [];
        }
        if (update && loadedRapportIndex !== null) {
            rapporten[username][loadedRapportIndex] = reportObject;
        } else {
            rapporten[username].push(reportObject);
        }

        localStorage.setItem("rapporten", JSON.stringify(rapporten));
        alert(update ? "Rapport geüpdatet!" : "Rapport opgeslagen!");
        clearInputs();
        loadRapportList(username);
        loadedRapportIndex = null; // Reset geladen rapport
    }

    function clearInputs() {
        document.querySelectorAll("#rapportTable input").forEach(input => input.value = "");
        document.getElementById("totaalVerdiendMax").textContent = "";
        document.getElementById("totaalProcent").textContent = "";
    }

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        loginUser(username, password);
    });

    document.getElementById("registerUser").addEventListener("click", (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        if (!username || !password) {
            alert("Vul een gebruikersnaam en wachtwoord in!");
            return;
        }
        saveUser(username, password);
    });

    saveButton.addEventListener("click", () => saveRapport(false));

    // In plaats van een aparte updateRapport-knop in de HTML voegen we de update-knop toe in de rapportlijst.

    function loadRapportList(username) {
        let rapporten = JSON.parse(localStorage.getItem("rapporten")) || {};
        let userRapporten = rapporten[username] || [];
        rapportList.innerHTML = "";

        userRapporten.forEach((report, index) => {
            let li = document.createElement("li");
            li.style.marginBottom = "5px";

            let reportInfo = document.createElement("span");
            reportInfo.innerHTML = `${report.name} <strong>${report.totals.totalPercentage}</strong> (Opgeslagen: ${new Date(report.savedAt).toLocaleString()}) `;
            li.appendChild(reportInfo);

            let loadButton = document.createElement("button");
            loadButton.textContent = "Laad";
            loadButton.addEventListener("click", () => {
                loadRapport(username, index);
                loadedRapportIndex = index; // Markeer dit rapport als geladen
                loadRapportList(username); // Herlaad de lijst zodat de update-knop verschijnt voor dit rapport
            });
            li.appendChild(loadButton);

            let deleteButton = document.createElement("button");
            deleteButton.textContent = "Verwijder";
            deleteButton.style.marginLeft = "10px";
            deleteButton.addEventListener("click", () => deleteRapport(username, index));
            li.appendChild(deleteButton);

            // Voeg update-knop toe als dit rapport momenteel geladen is
            if (loadedRapportIndex === index) {
                let updateButton = document.createElement("button");
                updateButton.textContent = "Update";
                updateButton.style.marginLeft = "10px";
                updateButton.addEventListener("click", () => saveRapport(true));
                li.appendChild(updateButton);
            }

            rapportList.appendChild(li);
        });
    }

    function loadRapport(username, index) {
        let rapporten = JSON.parse(localStorage.getItem("rapporten")) || {};
        let reportObject = rapporten[username]?.[index];
        if (!reportObject) return;
        let rapportData = reportObject.data;

        const rows = document.querySelectorAll("#rapportTable tr");
        // Loop door de vakrijen (behalve de totaalrij)
        rapportData.forEach((rowData, i) => {
            if (i < rows.length - 1) {
                let cells = rows[i].querySelectorAll("td");
                const totaalVerdiend = rowData.totaalVerdiend;
                const totaalTeVerdienen = rowData.totaalTeVerdienen;
                cells[1].querySelector("input").value = (totaalVerdiend === "0" || totaalVerdiend == 0) ? "" : totaalVerdiend;
                cells[2].querySelector("input").value = (totaalTeVerdienen === "0" || totaalTeVerdienen == 0) ? "" : totaalTeVerdienen;
                updateRow(i);
            }
        });

        if (reportObject.totals) {
            const totalVerdiend = reportObject.totals.totalVerdiend;
            const totalMaxPunten = reportObject.totals.totalMaxPunten;
            const totalPercentage = reportObject.totals.totalPercentage;
            document.getElementById("totaalVerdiendMax").textContent =
                ((totalVerdiend === "0" || totalVerdiend == 0 || totalMaxPunten === "0" || totalMaxPunten == 0)
                    ? ""
                    : `${totalVerdiend} / ${totalMaxPunten}`);
            document.getElementById("totaalProcent").textContent =
                ((totalPercentage === "0" || totalPercentage === "0.00%")
                    ? ""
                    : totalPercentage);
        }

        alert(`Rapport "${reportObject.name}" geladen!`);
    }

    function deleteRapport(username, index) {
        let rapporten = JSON.parse(localStorage.getItem("rapporten")) || {};
        if (rapporten[username]) {
            rapporten[username].splice(index, 1);
            localStorage.setItem("rapporten", JSON.stringify(rapporten));
            alert("Rapport verwijderd!");
            loadRapportList(username);
        }
    }

    // updateRow functie met controle op lege invoervelden
    function updateRow(index) {
        const verdiendInput = document.getElementById(`totaalVerdiend-${index}`).value;
        const teVerdienenInput = document.getElementById(`totaalTeVerdienen-${index}`).value;

        if (verdiendInput === "" || teVerdienenInput === "") {
            document.getElementById(`procent-${index}`).textContent = "";
            document.getElementById(`verdiend-${index}`).textContent = "";
            return;
        }

        const totaalVerdiend = parseFloat(verdiendInput) || 0;
        const totaalTeVerdienen = parseFloat(teVerdienenInput) || 0;
        const maxPunten = vakken[index].maxPunten;

        const procent = totaalTeVerdienen ? (totaalVerdiend / totaalTeVerdienen) * 100 : 0;
        document.getElementById(`procent-${index}`).textContent = procent ? `${procent.toFixed(2)}%` : "";

        const verdiend = totaalTeVerdienen ? (totaalVerdiend / totaalTeVerdienen) * maxPunten : 0;
        document.getElementById(`verdiend-${index}`).textContent = verdiend ? `${verdiend.toFixed(2)} / ${maxPunten}` : "";
    }

    

});
