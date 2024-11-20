const vakken = [
  { naam: "Aardrijkskunde", maxPunten: 10 },
  { naam: "Biologie", maxPunten: 10 },
  { naam: "Chemie", maxPunten: 20 },
  { naam: "Engels", maxPunten: 20 },
  { naam: "Engineering", maxPunten: 40 },
  { naam: "Frans", maxPunten: 20 },
  { naam: "Fysica (Mechanica)", maxPunten: 20 },
  { naam: "Fysica (Elektriciteit/Elektronica)", maxPunten: 20 },
  { naam: "Geschiedenis", maxPunten: 10 },
  { naam: "Godsdienst", maxPunten: 20 },
  { naam: "FEV", maxPunten: 10 },
  { naam: "Nederlands", maxPunten: 30 },
  { naam: "Wiskunde", maxPunten: 70 },
  { naam: "LO", maxPunten: 20 },
];

const tableBody = document.getElementById("rapportTable");

// Dynamisch vakken toevoegen
vakken.forEach((vak, index) => {
  const row = document.createElement("tr");

  // Vaknaam
  const vakCell = document.createElement("td");
  vakCell.textContent = vak.naam;
  row.appendChild(vakCell);

  // Totaal te verdienen
  const totaalTeVerdienenCell = document.createElement("td");
  const totaalTeVerdienenInput = document.createElement("input");
  totaalTeVerdienenInput.type = "number";
  totaalTeVerdienenInput.id = `totaalTeVerdienen-${index}`;
  totaalTeVerdienenCell.appendChild(totaalTeVerdienenInput);
  row.appendChild(totaalTeVerdienenCell);

  // Totaal verdiend
  const totaalVerdiendCell = document.createElement("td");
  const totaalVerdiendInput = document.createElement("input");
  totaalVerdiendInput.type = "number";
  totaalVerdiendInput.id = `totaalVerdiend-${index}`;
  totaalVerdiendCell.appendChild(totaalVerdiendInput);
  row.appendChild(totaalVerdiendCell);

  // Procent
  const procentCell = document.createElement("td");
  procentCell.id = `procent-${index}`;
  row.appendChild(procentCell);

  // Verdiend / Max Punten
  const verdiendCell = document.createElement("td");
  verdiendCell.id = `verdiend-${index}`;
  row.appendChild(verdiendCell);

  tableBody.appendChild(row);

  // Berekeningen bij verandering
  totaalTeVerdienenInput.addEventListener("input", () => {
    updateRow(index);
    updateTotals();
  });
  totaalVerdiendInput.addEventListener("input", () => {
    updateRow(index);
    updateTotals();
  });
});

// Functie voor berekeningen per rij
function updateRow(index) {
  const totaalTeVerdienen = parseFloat(document.getElementById(`totaalTeVerdienen-${index}`).value) || 0;
  const totaalVerdiend = parseFloat(document.getElementById(`totaalVerdiend-${index}`).value) || 0;
  const maxPunten = vakken[index].maxPunten;

  // Procent
  const procent = totaalTeVerdienen ? (totaalVerdiend / totaalTeVerdienen) * 100 : 0;
  document.getElementById(`procent-${index}`).textContent = `${procent.toFixed(2)}%`;

  // Verdiend / Max Punten
  const verdiend = totaalTeVerdienen ? (totaalVerdiend / totaalTeVerdienen) * maxPunten : 0;
  document.getElementById(`verdiend-${index}`).textContent = `${verdiend.toFixed(2)} / ${maxPunten}`;
}

// Voeg een extra rij toe voor de totaalcijfers
const totalRow = document.createElement("tr");
totalRow.innerHTML = `
  <td><strong>Totaal</strong></td>
  <td></td>
  <td></td>
  <td id="totaalProcent"></td>
  <td id="totaalVerdiendMax"></td>
`;
tableBody.appendChild(totalRow);

// Functie voor berekening van de totaalcijfers
function updateTotals() {
  let totaalVerdiend = 0;
  let totaalMaxPunten = 0;

  vakken.forEach((vak, index) => {
    const verdiendCell = document.getElementById(`verdiend-${index}`).textContent;
    if (verdiendCell) {
      const [verdiend, maxPunten] = verdiendCell.split(" / ").map(Number);
      totaalVerdiend += verdiend || 0;
      totaalMaxPunten += maxPunten || 0;
    }
  });

  // Update de celwaarden
  document.getElementById("totaalVerdiendMax").textContent = `${totaalVerdiend.toFixed(2)} / ${totaalMaxPunten.toFixed(2)}`;
  document.getElementById("totaalProcent").textContent = totaalMaxPunten
    ? `${((totaalVerdiend / totaalMaxPunten) * 100).toFixed(2)}%`
    : "0.00%";
}

// Data voor de grafiek
const chartLabels = vakken.map(vak => vak.naam);
let chartData = vakken.map(() => 0); // Initialiseer alle percentages op 0
let procentChart;

// Functie om de grafiek bij te werken
function updateChart() {
  chartData = vakken.map((_, index) => {
    const procentCell = document.getElementById(`procent-${index}`).textContent;
    return parseFloat(procentCell.replace('%', '')) || 0; // Verwijder het '%' en zet om naar een getal
  });

  if (procentChart) {
    procentChart.data.datasets[0].data = chartData;
    procentChart.update();
  }
}

// Initialiseer de grafiek
function createChart() {
  const ctx = document.getElementById("procentChart").getContext("2d");
  procentChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: "Procent per vak",
          data: chartData,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: "Vakken",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Procent (%)",
          },
        },
      },
    },
  });
}

// Maak de grafiek bij het laden
createChart();

// Update de grafiek elke keer dat de tabelwaarden veranderen
function updateRow(index) {
  const totaalTeVerdienen = parseFloat(document.getElementById(`totaalTeVerdienen-${index}`).value) || 0;
  const totaalVerdiend = parseFloat(document.getElementById(`totaalVerdiend-${index}`).value) || 0;
  const maxPunten = vakken[index].maxPunten;

  // Procent
  const procent = totaalTeVerdienen ? (totaalVerdiend / totaalTeVerdienen) * 100 : 0;
  document.getElementById(`procent-${index}`).textContent = `${procent.toFixed(2)}%`;

  // Verdiend / Max Punten
  const verdiend = totaalTeVerdienen ? (totaalVerdiend / totaalTeVerdienen) * maxPunten : 0;
  document.getElementById(`verdiend-${index}`).textContent = `${verdiend.toFixed(2)} / ${maxPunten}`;

  // Update de grafiek
  updateChart();
}
