// Gerar lista de horários esperados
const timeLabels = [];
for (let h = 0; h < 24; h++) {
    timeLabels.push(`${h.toString().padStart(2, '0')}:00:00`);
    timeLabels.push(`${h.toString().padStart(2, '0')}:30:00`);
}

// Inicializar gráfico
const ctx = document.getElementById('capacityChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: timeLabels,
        datasets: [
            {
                label: 'Volume',
                data: new Array(timeLabels.length).fill(0),
                borderColor: 'blue',
                fill: false,
                tension: 0.4
            },
            {
                label: 'Capacidade Alocada',
                data: new Array(timeLabels.length).fill(0),
                borderColor: 'red',
                fill: false,
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Capacidade Real',
                data: new Array(timeLabels.length).fill(0),
                borderColor: 'purple',
                fill: false,
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'PCA (%)',
                data: new Array(timeLabels.length).fill(0),
                borderColor: 'green',
                fill: false,
                tension: 0.4,
                yAxisID: 'y1'
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Quantidade' },
                ticks: {
                    stepSize: 1,
                    callback: function (value) { return Number.isInteger(value) ? value : null; }
                }
            },
            y1: {
                position: 'right',
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'PCA (%)' },
                grid: { drawOnChartArea: false },
                ticks: { stepSize: 10 }
            },
            x: {
                title: { display: true, text: 'Horário' },
                ticks: {
                    autoSkip: false,
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    }
});

// Função para calcular PCA
function calculatePCA(capacity, volume) {
    if (volume === 0) return 100;
    const pca = (capacity / volume) * 100;
    return Math.round(pca * 10) / 10; // 1 casa decimal
}

// Função para calcular número de operadores para atingir PCA alvo
function calculateOperatorsForPCA(volume, pcaTarget, capacityPerOperator) {
    if (volume === 0) return 0;
    const requiredCapacity = (volume * pcaTarget) / 100;
    return Math.ceil(requiredCapacity / capacityPerOperator);
}

// Função para ler o arquivo Excel
function readExcel(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        if (!json[0] || !json[0].Horario || json[0].Volume === undefined) {
            alert('Arquivo Excel inválido! Esperado: colunas "Horario" e "Volume".');
            return;
        }

        const dataMap = {};
        json.forEach(row => {
            const horario = row.Horario ? row.Horario.toString().trim() : '';
            const volume = parseFloat(row.Volume) || 0;
            if (horario) {
                dataMap[horario] = volume;
            }
        });
        callback(dataMap);
    };
    reader.readAsArrayBuffer(file);
}

// Função para atualizar gráfico e tabela
function updateChartAndTable() {
    const excelFile = document.getElementById('excelFile').files[0];
    if (!excelFile) {
        alert('Por favor, selecione um arquivo Excel (.xlsx).');
        return;
    }

    readExcel(excelFile, (excelData) => {
        // Mapear volumes dos horários
        const volumes = timeLabels.map(time => excelData[time] || 0);

        // Obter parâmetros
        const workHours = (parseFloat(document.getElementById('workHours').value)) / 12.6 || 8;
        const tma = parseFloat(document.getElementById('tma').value) || 5;
        const productiveTime = parseFloat(document.getElementById('productiveTime').value) / 100 || 0.85;
        const pcaTarget = parseFloat(document.getElementById('pcaTarget').value) || 80;

        // Calcular capacidade por operador
        const productiveMinutes = workHours * 60 * productiveTime;
        const capacityPerOperator = Math.floor(productiveMinutes / tma);

        // Distribuir operadores para atingir PCA alvo
        const operatorsPerSlot = volumes.map(volume =>
            calculateOperatorsForPCA(volume, pcaTarget, capacityPerOperator)
        );

        // Calcular capacidades, PCAs e inicializar capacidade real
        const capacities = operatorsPerSlot.map(operators => operators * capacityPerOperator);
        const pcas = capacities.map((capacity, index) => calculatePCA(capacity, volumes[index]));
        const capacityReal = new Array(timeLabels.length).fill(0); // Inicialmente 0

        // Atualizar tabela com inputs editáveis
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        timeLabels.forEach((time, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${time}</td>
            <td>${volumes[index]}</td>
            <td><input type="number" class="operator-input" id="operator_${index}" value="${operatorsPerSlot[index]}" min="0" onchange="updateOperator(${index}, ${capacityPerOperator}, ${volumes[index]})"></td>
            <td id="capacity_${index}">${capacities[index]}</td>
            <td><input type="number" class="capacity-real-input" id="capacity_real_${index}" value="${capacityReal[index]}" min="0" onchange="updateCapacityReal(${index}, ${volumes[index]})"></td>
            <td id="pca_${index}">${pcas[index]}</td>
        `;
            tableBody.appendChild(row);
        });

        // Atualizar gráfico
        chart.data.datasets[0].data = volumes;
        chart.data.datasets[1].data = capacities;
        chart.data.datasets[2].data = capacityReal;
        chart.data.datasets[3].data = pcas;
        chart.update();
    });
}

// Função para atualizar operadores e gráfico quando o input muda
function updateOperator(index, capacityPerOperator, volume) {
    const operatorInput = document.getElementById(`operator_${index}`);
    const newOperatorCount = parseInt(operatorInput.value) || 0;
    const capacityCell = document.getElementById(`capacity_${index}`);
    const pcaCell = document.getElementById(`pca_${index}`);

    // Atualizar capacidade e PCA na tabela
    const newCapacity = newOperatorCount * capacityPerOperator;
    capacityCell.textContent = newCapacity;
    const newPCA = calculatePCA(newCapacity, volume);
    pcaCell.textContent = newPCA;

    // Atualizar dados do gráfico
    const allocatedCapacity = timeLabels.map((_, i) => {
        const input = document.getElementById(`operator_${i}`);
        return (parseInt(input.value) || 0) * capacityPerOperator;
    });
    const pcas = allocatedCapacity.map((capacity, i) => calculatePCA(capacity, volumes[i]));
    chart.data.datasets[1].data = allocatedCapacity;
    chart.data.datasets[3].data = pcas;
    chart.update();
}

// Função para atualizar capacidade real
function updateCapacityReal(index, volume) {
    const capacityRealInput = document.getElementById(`capacity_real_${index}`);
    const newCapacityReal = parseInt(capacityRealInput.value) || 0;

    // Atualizar dados do gráfico para Capacidade Real
    const capacityRealData = timeLabels.map((_, i) => {
        const input = document.getElementById(`capacity_real_${i}`);
        return parseInt(input.value) || 0;
    });
    chart.data.datasets[2].data = capacityRealData;
    chart.update();
}

// Funções do Sidebar
function openNav() {
    document.getElementById("mySidebar").style.width = "250px";
    document.getElementsByClassName("main-content")[0].style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementsByClassName("main-content")[0].style.marginLeft = "0";
}
