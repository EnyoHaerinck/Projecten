document.addEventListener("DOMContentLoaded", () => {

    localStorage.removeItem("loggedInUser");

    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("loggedInUser");
        // Maak de loginvelden leeg
        usernameInput.value = "";
        passwordInput.value = "";
        alert("Je bent uitgelogd!");
        // Optioneel: maak ook de rapportlijst leeg
        rapportList.innerHTML = "";
    });


    const loginForm = document.getElementById("loginForm");
    const saveButton = document.getElementById("saveRapport");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rapportList = document.getElementById("rapportList");

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
    }

    function saveRapport() {
        let username = localStorage.getItem("loggedInUser");
        if (!username) {
            alert("Je moet inloggen!");
            return;
        }

        let rapporten = JSON.parse(localStorage.getItem("rapporten")) || {};
        let rapportData = [];
        
        // Selecteer alle rijen behalve de totaalrij (de laatste rij)
        const rows = document.querySelectorAll("#rapportTable tr");
        for (let i = 0; i < rows.length - 1; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll("td");
            if (cells.length >= 3) {
                const vak = cells[0].textContent;
                const totaalVerdiend = cells[1].querySelector("input").value || "0";
                const totaalTeVerdienen = cells[2].querySelector("input").value || "0";
                // Haal ook de berekende waarden (als je deze wilt opslaan)
                const computedProcent = cells[3].textContent || "";
                const computedVerdiend = cells[4].textContent || "";
                rapportData.push({ vak, totaalVerdiend, totaalTeVerdienen, computedProcent, computedVerdiend });
            }
        }
        
        // Haal de totaalcijfers uit de totaalrij
        const totalText = document.getElementById("totaalVerdiendMax").textContent; // bijv. "100.00 / 200.00"
        let totalVerdiend = "";
        let totalMaxPunten = "";
        if (totalText) {
            [totalVerdiend, totalMaxPunten] = totalText.split(" / ");
        }
        const totalPercentage = document.getElementById("totaalProcent").textContent || "";

        // Vraag de gebruiker een naam voor het rapport
        let reportName = prompt("Geef een naam op voor het rapport:");
        if (!reportName) {
            reportName = "Onbenoemd rapport ";
        }
        
        // Maak een rapportobject aan
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
        rapporten[username].push(reportObject);
        localStorage.setItem("rapporten", JSON.stringify(rapporten));
        alert("Rapport opgeslagen!");
        loadRapportList(username);
    }

    function loadRapportList(username) {
        let rapporten = JSON.parse(localStorage.getItem("rapporten")) || {};
        let userRapporten = rapporten[username] || [];
        rapportList.innerHTML = "";

        userRapporten.forEach((report, index) => {
            let li = document.createElement("li");
            li.style.marginBottom = "5px";
            
            // Toon de naam en de opslagtijd
            let reportInfo = document.createElement("span");
            reportInfo.textContent = `${report.name} (Opgeslagen: ${new Date(report.savedAt).toLocaleString()}) `;
            li.appendChild(reportInfo);
            
            // Laadknop
            let loadButton = document.createElement("button");
            loadButton.textContent = "Laad";
            loadButton.addEventListener("click", () => loadRapport(username, index));
            li.appendChild(loadButton);
            
            // Verwijderknop
            let deleteButton = document.createElement("button");
            deleteButton.textContent = "Verwijder";
            deleteButton.style.marginLeft = "10px";
            deleteButton.addEventListener("click", () => deleteRapport(username, index));
            li.appendChild(deleteButton);
            
            rapportList.appendChild(li);
        });
    }

    function loadRapport(username, index) {
        let rapporten = JSON.parse(localStorage.getItem("rapporten")) || {};
        let reportObject = rapporten[username]?.[index];
        if (!reportObject) return;
        let rapportData = reportObject.data;
        
        const rows = document.querySelectorAll("#rapportTable tr");
        // Doorloop de vakrijen (behalve de totaalrij)
        rapportData.forEach((rowData, i) => {
            if (i < rows.length - 1) {
                let cells = rows[i].querySelectorAll("td");
                // Laad de inputwaarden alleen als de opgeslagen waarde niet 0 is;
                // anders laat je het veld leeg zodat de placeholder blijft.
                const totaalVerdiend = rowData.totaalVerdiend;
                const totaalTeVerdienen = rowData.totaalTeVerdienen;
                cells[1].querySelector("input").value = (totaalVerdiend === "0" || totaalVerdiend == 0) ? "" : totaalVerdiend;
                cells[2].querySelector("input").value = (totaalTeVerdienen === "0" || totaalTeVerdienen == 0) ? "" : totaalTeVerdienen;
                // Update de berekeningen voor deze rij (de computed velden worden dan opnieuw berekend)
                updateRow(i);
            }
        });
        
        // Laad de totaalrij op dezelfde manier
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

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        loginUser(username, password);
    });

    // Voeg ook registratie-functionaliteit toe aan de registreerknop
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

    saveButton.addEventListener("click", saveRapport);
});
