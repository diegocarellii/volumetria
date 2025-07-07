let chartInstance = null;
let categories = [];
let percentages = [];
let ajustes = {};
let outlierChartInstance = null;

function updateChart() {
    document.getElementById('outlierChart').style.display = 'none';
    document.getElementById('percentChart').style.display = 'block';
    const totalVolumeInput = parseFloat(document.getElementById('totalVolume').value); // Valor total do input
    if (isNaN(totalVolumeInput)) {
        alert('Por favor, insira um valor total válido.');
        return;
    }

    // Função para converter "1 - dom" em uma data no formato dd/mm/aaaa
    function convertToDate(categoria) {
        const [weekNumber, dayOfWeek] = categoria.split(' - ');
        const daysOfWeekMap = {
            dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sáb: 6
        };

        const referenceMonth = 0; // Janeiro (0 = Janeiro, 1 = Fevereiro, etc.)
        const referenceYear = 2025; // Ano de referência
        const firstDayOfMonth = new Date(referenceYear, referenceMonth, 1);
        const dayOffset = daysOfWeekMap[dayOfWeek.toLowerCase()];
        const firstTargetDay = new Date(firstDayOfMonth);

        // Encontrar o primeiro dia da semana correspondente no mês
        while (firstTargetDay.getDay() !== dayOffset) {
            firstTargetDay.setDate(firstTargetDay.getDate() + 1);
        }

        // Adicionar semanas para chegar à semana desejada
        const targetDate = new Date(firstTargetDay);
        targetDate.setDate(targetDate.getDate() + (parseInt(weekNumber) - 1) * 7);

        // Retornar a data formatada como dd/mm/aaaa
        return targetDate.toLocaleDateString('pt-BR');
    }

    // Mapear categorias para volumes
    const categoryVolumes = categories.map((categoria, index) => {
        const percentage = percentages[index];
        const volume = (percentage / 100) * totalVolumeInput; // Calcular volume baseado na % Curva
        return { categoria, volume };
    });

    // Gerar as datas de maio de 2025
    const may2025Dates = [];
    const may2025Start = new Date(2025, 4, 1); // Maio de 2025 (mês 4 porque é zero-based)
    const may2025End = new Date(2025, 4, 31);

    for (let d = new Date(may2025Start); d <= may2025End; d.setDate(d.getDate() + 1)) {
        may2025Dates.push({
            date: d.toLocaleDateString('pt-BR'),
            dayOfWeek: d.getDay(), // Índice do dia da semana (0 = domingo, 1 = segunda, etc.)
            volume: 0 // Inicialmente sem volume
        });
    }

    // Associar volumes às datas de maio de 2025
    may2025Dates.forEach(dateObj => {
        const matchingCategory = categoryVolumes.find(catVol => {
            const [weekNumber, dayOfWeek] = catVol.categoria.split(' - ');
            const daysOfWeekMap = {
                dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sáb: 6
            };
            return daysOfWeekMap[dayOfWeek.toLowerCase()] === dateObj.dayOfWeek;
        });

        if (matchingCategory) {
            dateObj.volume = matchingCategory.volume; // Atribuir o volume correspondente
        }
    });

    // Logar as datas e os volumes
    console.log("Datas e Volumes:");
    may2025Dates.forEach(item => {
        console.log(`Data: ${item.date}, Volume: ${item.volume.toFixed(2)}`);
    });

    // Preparar os dados para o gráfico
    const labels = may2025Dates.map(item => item.date); // Datas no eixo X
    const data = may2025Dates.map(item => item.volume); // Volumes no eixo Y

    if (chartInstance) {
        chartInstance.data.labels = labels; // Atualize os rótulos do eixo X
        chartInstance.data.datasets[0].data = data; // Atualize os volumes
        chartInstance.update();
    } else {
        const ctx = document.getElementById('percentChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels, // Use as datas como rótulos
                datasets: [
                    {
                        label: 'Volume Total Baseado na % Curva',
                        data: data, // Use os volumes calculados
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
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
                            text: 'Volume Total'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Datas'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Volume Total por Data'
                    }
                }
            }
        });
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

        // Primeiro, calcular os valores de %Curva Ajustada para todas as categorias
        let curvaAjustadaArray = [];
        sortedCategories.forEach(categoria => {
            const volumes = months.slice(0, 3).map(month =>
                categorizedData[categoria].volumes[month] || 0
            );
            const percentagesMonth = volumes.map((volume, index) => {
                if (volume === 0) return 0;
                const total = index === 0 ? totalVolumeMonth1 : index === 1 ? totalVolumeMonth2 : totalVolumeMonth3;
                return total > 0 ? Number(((volume / total) * 100).toFixed(2)) : 0;
            });
            const totalVolumesSum = totalVolumeMonth1 + totalVolumeMonth2 + totalVolumeMonth3;
            const somarProduto = totalVolumesSum > 0 ? Number(
                ((percentagesMonth[0] / 100) * volumes[0] +
                    (percentagesMonth[1] / 100) * volumes[1] +
                    (percentagesMonth[2] / 100) * volumes[2]) / (volumes[0] + volumes[1] + volumes[2]) * 100
            ).toFixed(2) : 0;
            curvaAjustadaArray.push({ categoria, valor: Number(somarProduto) });
        });
        // Ordenar decrescente e atribuir ranking
        curvaAjustadaArray.sort((a, b) => b.valor - a.valor);
        const rankingMap = {};
        curvaAjustadaArray.forEach((item, idx) => {
            rankingMap[item.categoria] = idx + 1;
        });

        // Agora gerar as linhas da tabela incluindo a coluna DMM
        sortedCategories.forEach(categoria => {
            const volumes = months.slice(0, 3).map(month =>
                categorizedData[categoria].volumes[month] || 0
            );
            const percentagesMonth = volumes.map((volume, index) => {
                if (volume === 0) return 0;
                const total = index === 0 ? totalVolumeMonth1 : index === 1 ? totalVolumeMonth2 : totalVolumeMonth3;
                return total > 0 ? Number(((volume / total) * 100).toFixed(2)) : 0;
            });
            const totalVolumesSum = totalVolumeMonth1 + totalVolumeMonth2 + totalVolumeMonth3;
            const somarProduto = totalVolumesSum > 0 ? Number(
                ((percentagesMonth[0] / 100) * volumes[0] +
                    (percentagesMonth[1] / 100) * volumes[1] +
                    (percentagesMonth[2] / 100) * volumes[2]) / (volumes[0] + volumes[1] + volumes[2]) * 100
            ).toFixed(2) : 0;
            categories.push(categoria);
            percentages.push(Number(somarProduto));
            ajustes[categoria] = Number(somarProduto);
            const volume1 = volumes[0] ? volumes[0] : '0';
            const volume2 = volumes[1] ? volumes[1] : '0';
            const volume3 = volumes[2] ? volumes[2] : '0';
            const dmm = rankingMap[categoria];
            const row = `
                <tr>
                    <td>${dmm}</td>
                    <td>${categoria}</td>
                    <td>${volume1}</td>
                    <td>${volume2}</td>
                    <td>${volume3}</td>
                    <td>${percentagesMonth[0]}%</td>
                    <td>${percentagesMonth[1]}%</td>
                    <td>${percentagesMonth[2]}%</td>
                    <td>${somarProduto}%</td>
                    <td>
                        <input type="number" step="0.1" class="form-control ajuste-input"
                            data-categoria="${categoria}"
                            placeholder="Ajuste"
                            value="${somarProduto}"
                            onchange="updateAjuste(this, '${categoria}')">
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        // Calcular a soma da coluna "% Curva"
        const somaCurva = percentages.reduce((acc, val) => acc + val, 0).toFixed(2);

        // Adicionar linha de somatório ao final da tabela
        const totalRow = `
            <tr style="font-weight: bold; background: #f0f0f0;">
                <td colspan="8" style="text-align: right;">Somatório % Curva:</td>
                <td>${somaCurva}%</td>
                <td id="somaCurvaAjustada"></td>
            </tr>
        `;
        tableBody.innerHTML += totalRow;
        atualizarSomaCurvaAjustada();
        classificarCurvaAjustada();
        document.getElementById('resultTable').style.display = 'table';
        updateChart();
    };

    reader.readAsArrayBuffer(fileInput);
}

function updateAjuste(input, categoria) {
    const value = input.value ? parseFloat(input.value) : undefined;
    ajustes[categoria] = value;
    updateChart();
    atualizarSomaCurvaAjustada();
}

function openNav() {
    document.getElementById("mySidebar").style.width = "250px";
    document.getElementsByClassName("main-content")[0].style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementsByClassName("main-content")[0].style.marginLeft = "0";
}

function atualizarSomaCurvaAjustada() {
    const inputs = document.querySelectorAll('.ajuste-input');
    let soma = 0;
    inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) soma += val;
    });
    const cell = document.getElementById('somaCurvaAjustada');
    if (cell) cell.textContent = soma.toFixed(2) + '%';
}

function processOutlier() {
    const fileInput = document.getElementById('outlierFile').files[0];
    if (!fileInput) {
        alert('Por favor, selecione um arquivo Excel para análise de outlier.');
        return;
    }

    // Pega os multiplicadores dos inputs
    const multSup = parseFloat(document.getElementById('limiteSuperiorInput').value) || 1.5;
    const multInf = parseFloat(document.getElementById('limiteInferiorInput').value) || 1.5;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

        // Agrupar volumes por mês
        const meses = {};
        jsonData.forEach(row => {
            if (row.Data && row.Volume) {
                const dataObj = new Date(row.Data);
                const mesAno = `${dataObj.getFullYear()}-${(dataObj.getMonth() + 1).toString().padStart(2, '0')}`;
                if (!meses[mesAno]) meses[mesAno] = 0;
                meses[mesAno] += Number(row.Volume);
            }
        });

        // Montar arrays de datas e percentuais
        const datas = [];
        const percentuais = [];
        jsonData.forEach(row => {
            if (row.Data && row.Volume) {
                const dataObj = new Date(row.Data);
                const mesAno = `${dataObj.getFullYear()}-${(dataObj.getMonth() + 1).toString().padStart(2, '0')}`;
                const totalMes = meses[mesAno];
                const percentual = totalMes > 0 ? (Number(row.Volume) / totalMes) * 100 : 0;
                datas.push(row.Data);
                percentuais.push(percentual);
            }
        });

        if (datas.length === 0 || percentuais.length === 0) {
            alert('Arquivo inválido. Certifique-se de que há colunas "Data" e "Volume".');
            return;
        }

        // Calcular limites de controle (média ± multiplicador*desvio padrão dos percentuais)
        const media = percentuais.reduce((a, b) => a + b, 0) / percentuais.length;
        const desvio = Math.sqrt(percentuais.reduce((a, b) => a + Math.pow(b - media, 2), 0) / percentuais.length);
        const limiteSuperior = media + multSup * desvio;
        const limiteInferior = media - multInf * desvio;

        // Destruir gráfico anterior se existir
        if (outlierChartInstance) {
            outlierChartInstance.destroy();
        }

        document.getElementById('outlierChart').style.display = 'block';

        const ctx = document.getElementById('outlierChart').getContext('2d');
        outlierChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: datas,
                datasets: [
                    {
                        label: '% do Volume Diário no Mês',
                        data: percentuais,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.2,
                        pointRadius: 3,
                        type: 'line',
                        order: 0
                    },
                    {
                        label: 'Limite Superior',
                        data: Array(datas.length).fill(limiteSuperior),
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0,
                        type: 'line',
                        order: 1
                    },
                    {
                        label: 'Limite Inferior',
                        data: Array(datas.length).fill(limiteInferior),
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0,
                        type: 'line',
                        order: 1
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '% do Volume Diário no Mês'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Data'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Gráfico de Controle de Outlier (% do Volume Diário no Mês)'
                    }
                }
            }
        });
    };
    reader.readAsArrayBuffer(fileInput);
}

// Atualize o gráfico ao mudar os multiplicadores
document.getElementById('limiteSuperiorInput').addEventListener('change', processOutlier);
document.getElementById('limiteInferiorInput').addEventListener('change', processOutlier);

function classificarCurvaAjustada() {
    // Seleciona todas as linhas do corpo da tabela
    const linhas = document.querySelectorAll('#resultTable tbody tr');
    linhas.forEach(linha => {
        // Pega a célula da %Curva Ajustada (penúltima célula se for input, última se for valor)
        let celula = linha.querySelector('td:last-child input') ? linha.querySelector('td:last-child input') : linha.querySelector('td:last-child');
        if (!celula) return;
        // Se for input, pega o valor do input, senão pega o texto
        let valor = celula.value !== undefined ? celula.value : celula.textContent;
        valor = parseFloat(valor.toString().replace('%', '').replace(',', '.'));
        if (isNaN(valor)) return;
        // Define a cor de acordo com o valor
        let cor = '';
        if (valor >= 5) {
            cor = '#ff6f6f'; // vermelho
        } else if (valor >= 4.5) {
            cor = '#ffb36f'; // laranja
        } else if (valor >= 2.5) {
            cor = '#ffe96f'; // amarelo
        } else if (valor <= 1.5) {
            cor = '#b6e97c'; // verde claro
        } else {
            cor = '#6fdc6f'; // verde forte
        }
        // Aplica cor de fundo e negrito
        if (celula.tagName === 'INPUT') {
            celula.style.backgroundColor = cor;
            celula.style.fontWeight = 'bold';
        } else {
            celula.style.backgroundColor = cor;
            celula.style.fontWeight = 'bold';
        }
    });
}


