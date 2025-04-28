let chartInstance = null;
let categories = [];
let percentages = [];
let ajustes = {};

function updateChart() {
    const originalData = percentages;
    const adjustedData = categories.map((categoria, index) => {
        const originalPercent = percentages[index];
        const ajuste = ajustes[categoria];
        const adjustedValue = ajuste !== undefined ? originalPercent * parseFloat(ajuste) : originalPercent;
        return Number(adjustedValue.toFixed(2));
    });

    if (chartInstance) {
        chartInstance.data.datasets[0].data = originalData;
        chartInstance.data.datasets[1].data = adjustedData;
        chartInstance.update();
    } else {
        const ctx = document.getElementById('percentChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: '% Curva Original',
                        data: originalData,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: '% Curva Ajustada',
                        data: adjustedData,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percentual (%)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Curva Proporcional por Categoria'
                    }
                }
            }
        });
        document.getElementById('percentChart').style.display = 'block';
    }
}

function processData() {
    const totalVolumeInput = document.getElementById('totalVolume').value;
    const fileInput = document.getElementById('excelFile').files[0];

    if (!totalVolumeInput || !fileInput) {
        alert('Por favor, insira o volume total e selecione um arquivo Excel.');
        return;
    }

    const totalVolume = parseFloat(totalVolumeInput);
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

        // Extrair meses únicos e ordenar
        const months = [...new Set(jsonData.map(row => {
            const date = new Date(row.Data);
            if (isNaN(date)) return null;
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        }).filter(Boolean))].sort();

        // Atualizar cabeçalhos e cards com nomes dos meses
        const monthNames = months.slice(0, 3).map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
        });
        document.getElementById('month1').textContent = monthNames[0] || 'Mês 1';
        document.getElementById('month2').textContent = monthNames[1] || 'Mês 2';
        document.getElementById('month3').textContent = monthNames[2] || 'Mês 3';
        document.getElementById('percent1').textContent = `% ${monthNames[0] || 'Mês 1'}`;
        document.getElementById('percent2').textContent = `% ${monthNames[1] || 'Mês 2'}`;
        document.getElementById('percent3').textContent = `% ${monthNames[2] || 'Mês 3'}`;
        document.getElementById('cardMonth1').textContent = monthNames[0] || 'Mês 1';
        document.getElementById('cardMonth2').textContent = monthNames[1] || 'Mês 2';
        document.getElementById('cardMonth3').textContent = monthNames[2] || 'Mês 3';

        // Calcular totais por mês
        let totalVolumeMonth1 = 0, totalVolumeMonth2 = 0, totalVolumeMonth3 = 0;
        jsonData.forEach(row => {
            const date = new Date(row.Data);
            if (isNaN(date)) return;
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const volume = parseInt(row.Volume) || 0;
            if (monthYear === months[0]) totalVolumeMonth1 += volume;
            else if (monthYear === months[1]) totalVolumeMonth2 += volume;
            else if (monthYear === months[2]) totalVolumeMonth3 += volume;
        });

        // Atualizar cards com totais
        document.getElementById('totalMonth1').textContent = totalVolumeMonth1;
        document.getElementById('totalMonth2').textContent = totalVolumeMonth2;
        document.getElementById('totalMonth3').textContent = totalVolumeMonth3;
        document.getElementById('monthCards').style.display = 'flex';

        // Organizar dados por categoria e mês
        const categorizedData = jsonData.reduce((acc, row) => {
            const date = new Date(row.Data);
            if (isNaN(date)) return acc;
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const categoria = row.Categoria;
            const volume = parseInt(row.Volume) || 0;

            if (!acc[categoria]) {
                acc[categoria] = { volumes: {} };
            }
            acc[categoria].volumes[monthYear] = volume;
            return acc;
        }, {});

        // Gerar tabela
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        categories = [];
        percentages = [];
        ajustes = {};

        // Ordenar categorias
        const sortedCategories = Object.keys(categorizedData).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );

        sortedCategories.forEach(categoria => {
            const volumes = months.slice(0, 3).map(month =>
                categorizedData[categoria].volumes[month] || 0
            );
            const percentagesMonth = volumes.map((volume, index) => {
                if (volume === 0) return 0;
                const total = index === 0 ? totalVolumeMonth1 : index === 1 ? totalVolumeMonth2 : totalVolumeMonth3;
                return total > 0 ? Number(((volume / total) * 100).toFixed(2)) : 0;
            });

            // Calcular SOMARPRODUTO
            const totalVolumesSum = totalVolumeMonth1 + totalVolumeMonth2 + totalVolumeMonth3;
            const somarProduto = totalVolumesSum > 0 ? Number(
                ((percentagesMonth[0] / 100) * volumes[0] +
                    (percentagesMonth[1] / 100) * volumes[1] +
                    (percentagesMonth[2] / 100) * volumes[2]) / (volumes[0] + volumes[1] + volumes[2]) * 100
            ).toFixed(2) : 0;
            console.log(percentagesMonth[0], percentagesMonth[1], percentagesMonth[2], totalVolumeMonth1, totalVolumeMonth2, totalVolumeMonth3, somarProduto, volumes);
            categories.push(categoria);
            percentages.push(Number(somarProduto));

            const volume1 = volumes[0] ? volumes[0] : '0';
            const volume2 = volumes[1] ? volumes[1] : '0';
            const volume3 = volumes[2] ? volumes[2] : '0';

            const row = `
                <tr>
                    <td>${categoria}</td>
                    <td>${volume1}</td>
                    <td>${volume2}</td>
                    <td>${volume3}</td>
                    <td>${percentagesMonth[0]}%</td>
                    <td>${percentagesMonth[1]}%</td>
                    <td>${percentagesMonth[2]}%</td>
                    <td>${somarProduto}%</td>
                    <td><input type="number" step="0.1" class="form-control ajuste-input" data-categoria="${categoria}" placeholder="Ajuste" onchange="updateAjuste(this, '${categoria}')"></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        document.getElementById('resultTable').style.display = 'table';
        updateChart();
    };

    reader.readAsArrayBuffer(fileInput);
}

function updateAjuste(input, categoria) {
    const value = input.value ? parseFloat(input.value) : undefined;
    ajustes[categoria] = value;
    updateChart();
}

function openNav() {
    document.getElementById("mySidebar").style.width = "250px";
    document.getElementsByClassName("main-content")[0].style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementsByClassName("main-content")[0].style.marginLeft = "0";
}
