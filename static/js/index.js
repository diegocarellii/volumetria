document.addEventListener("DOMContentLoaded", function (event) {
  const showNavbar = (toggleId, navId, bodyId, headerId) => {
    const toggle = document.getElementById(toggleId),
      nav = document.getElementById(navId),
      bodypd = document.getElementById(bodyId),
      headerpd = document.getElementById(headerId);

    // Validate that all variables exist
    if (toggle && nav && bodypd && headerpd) {
      toggle.addEventListener("click", () => {
        // show navbar
        nav.classList.toggle("show");
        // change icon
        toggle.classList.toggle("bx-x");
        // add padding to body
        bodypd.classList.toggle("body-pd");
        // add padding to header
        headerpd.classList.toggle("body-pd");
      });
    }
  };

  showNavbar("header-toggle", "nav-bar", "body-pd", "header");

  /*===== LINK ACTIVE =====*/
  const linkColor = document.querySelectorAll(".nav_link");

  function colorLink() {
    if (linkColor) {
      linkColor.forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
    }
  }
  linkColor.forEach((l) => l.addEventListener("click", colorLink));

  // Your code to run since DOM is loaded and ready
});

//=======================================================================
async function fazGET_Geral() {
  try {
    const response = await fetch(`/update_geral`);
    const data = await response.json();

    // Função auxiliar para atualizar elemento com segurança
    const updateElement = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = value;
      } else {
        console.warn(`Elemento com ID '${id}' não encontrado`);
      }
    };

    // Geral
    updateElement("valor_recebidas", data[0]["Total"]);
    updateElement("valor_atendidas", data[0]["atendidas"]);
    updateElement("valor_pca", data[0]["Percent"]);
    updateElement("valor_aband", data[0]["Natendidas"]);
    updateElement("valor_tme", data[0]["tme"]);
    updateElement("valor_tma", data[0]["tma"]);

    // SAC
    updateElement("total_consolidadoSAC", data[1]["TotalSAC"]);
    updateElement("atendidas_consolidadoSAC", data[1]["atendidasSAC"]);
    updateElement("pca_consolidadoSAC", data[1]["PercentSAC"]);
    updateElement("abandonadas_consolidadoSAC", data[1]["NatendidasSAC"]);
    updateElement("tme_consolidadoSAC", data[1]["tmeSAC"]);
    updateElement("tma_consolidadoSAC", data[1]["tmaSAC"]);

    // HD
    updateElement("total_consolidadoHD", data[2]["TotalHD"]);
    updateElement("atendidas_consolidadoHD", data[2]["atendidasHD"]);
    updateElement("pca_consolidadoHD", data[2]["PercentHD"]);
    updateElement("abandonadas_consolidadoHD", data[2]["NatendidasHD"]);
    updateElement("tme_consolidadoHD", data[2]["tmeHD"]);
    updateElement("tma_consolidadoHD", data[2]["tmaHD"]);

    // WEBBY
    updateElement("total_consolidadoWEBBY", data[3]["Totalwebby"]);
    updateElement("atendidas_consolidadoWEBBY", data[3]["atendidaswebby"]);
    updateElement("pca_consolidadoWEBBY", data[3]["Percentwebby"]);
    updateElement("abandonadas_consolidadoWEBBY", data[3]["Natendidaswebby"]);
    updateElement("tme_consolidadoWEBBY", data[3]["tmewebby"]);
    updateElement("tma_consolidadoWEBBY", data[3]["tmawebby"]);

  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
  }
}

// Garantir que o DOM está carregado antes de executar
document.addEventListener('DOMContentLoaded', () => {
  fazGET_Geral();
  // Se precisar atualizar periodicamente
  // setInterval(fazGET_Geral, 5000); // atualiza a cada 5 segundos
});

//===============================================================================

async function fazGET_produtividade() {
  const response = await fetch(`/operador`);
  const data = await response.json();
  const tabelaBody = document.getElementById("tabelaBody");

  for (let i = 0; i < data.length; i++) {
    const rowData = data[i];
    const row = tabelaBody.insertRow();

    const loginCell = row.insertCell(0);
    loginCell.textContent = rowData.login;

    const operadorCell = row.insertCell(1);
    operadorCell.textContent = rowData.operador;

    const quantCell = row.insertCell(2);
    quantCell.textContent = rowData.quant;

    const ocupadoCell = row.insertCell(3);
    ocupadoCell.textContent = rowData.ocupado;

    const tmaCell = row.insertCell(4);
    tmaCell.textContent = rowData.tma;

    const duracaoCell = row.insertCell(5);
    duracaoCell.textContent = rowData.duracao;
  }
}
//===============================================================================

async function fazPESQUISA_bloqueios() {
  const response = await fetch("/pesquisa_demanda");
  const banco = await response.json();
  const assunto = Object.values(banco["data"]);
  const contagem = Object.values(banco["quantidade"]);

  // Modificação para pegar apenas o último dia
  const ultimoDia = contagem[10]; // Supondo que contagem[10] é o último dia
  const ultimoAssunto = assunto[10]; // Assunto correspondente ao último dia

  const data1 = [
    {
      values: [ultimoDia], // Apenas o último dia
      labels: [ultimoAssunto], // Assunto correspondente
      type: "pie",
      textinfo: "label+percent",
      hole: 0.4,
      marker: {
        colors: [ultimoDia > 20000 ? "#FF0000" : "#7B68EE"],
      },
    },
  ];
  var config = {
    displaylogo: false,
    displayModeBar: false
  };
  const layout1 = {
    height: 340,
    width: 200,
    title: "Bloqueios",
    colorway: ["#7B68EE"],
    font: {
      color: "#2b2b2b",
    },
  };

  // Limpa o gráfico anterior antes de desenhar o novo
  const renderElement = document.getElementById("invoiceChart");
  if (renderElement) {
    Plotly.purge(renderElement); // Remove o gráfico anterior
  }

  Plotly.newPlot("bloqueios", data1, layout1, config);
}

//===============================================================================

async function fazPESQUISA_DEMANDA() {
  // Exibir a mensagem de carregamento
  const loadingMessage = document.getElementById("loadingMessage");
  loadingMessage.style.display = "inline"; // Mostra a mensagem

  try {
    const response = await fetch("/pesquisa_demandaReport1");
    if (!response.ok) {
      throw new Error("Erro ao buscar os dados da API");
    }
    const banco = await response.json();
    const assunto = Object.values(banco["Assunto"]);
    const contagem = Object.values(banco["Contagem Alares"]);

    const assunto_webby = Object.values(banco["Assunto"]);
    const contagem_webby = Object.values(banco["Contagem Webby"]);

    const xarray = assunto;
    const yarray = contagem;

    const xarray1 = assunto_webby;
    const yarray1 = contagem_webby;
    
    // Atualiza o gráfico existente antes de desenhar o novo
    const renderElementG1 = document.getElementById("G1");
    const renderElementMyDiv1 = document.getElementById("myDiv1");
    if (renderElementG1) {
      Plotly.purge(renderElementG1); // Remove o gráfico anterior
    }
    if (renderElementMyDiv1) {
      Plotly.purge(renderElementMyDiv1); // Remove o gráfico anterior
    }

    const data = [
      {
        y: xarray,
        x: yarray,
        text: yarray1,
        textinfo: "label+text",
        type: "bar",
        orientation: 'h',
      },
    ];
    const data1 = [
      {
        y: xarray1,
        x: yarray1,
        text: yarray,
        textinfo: "label+text",
        type: "bar",
        orientation: 'h',
      },
    ];
    const layout = {
      title: "Assuntos Alares",
      height: 380,
      width: 600,
      colorway: ["#7B68EE", "#9680f2", "#ad98f5", "#c3b1f8", "#d8cbfb"],
      showlegend: false,
      font: {
        color: "black",
      },
      margin: {
        l: 270,
        r: 50,
        t: 50,
        b: 100
      }
    };
    var config = {
      displaylogo: false,
      displayModeBar: false
    };
    const layout1 = {
      title: "Assuntos Webby",
      height: 380,
      width: 600,
      colorway: ["#7B68EE", "#9680f2", "#ad98f5", "#c3b1f8", "#d8cbfb"],
      showlegend: false,
      font: {
        color: "black",
      },
      margin: {
        l: 270,
        r: 50,
        t: 50,
        b: 100
      }
    };
    var config1 = {
      displaylogo: false,
      displayModeBar: false
    };
    Plotly.newPlot("G1", data, layout, config);
    Plotly.newPlot("myDiv1", data1, layout1, config1);
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    // Ocultar a mensagem de carregamento após a conclusão
    loadingMessage.style.display = "none"; // Esconde a mensagem
  }
}


//===============================================================================
function fazGET_exportar() {
  var exportButton = document.getElementById("export-button");
  var table = document.getElementById("example");

  exportButton.addEventListener("click", function () {
    var tableHTML = table.outerHTML.replace(/ /g, "%20");
    var downloadLink = document.createElement("a");
    downloadLink.href = "data:application/vnd.ms-excel," + tableHTML;
    downloadLink.download = "Operadores.xls";
    downloadLink.click();
  });
}

//===============================================================================
async function fazGET_Filas() {
  const response = await fetch(`/update_filas`);
  const data = await response.json();

  //SAC
  document.getElementById("valor_espera").innerHTML = data[0];
  document.getElementById("valor_chamando").innerHTML = data[1];
  document.getElementById("valor_pausado").innerHTML = data[2];
}

//===============================================================================

async function usoValidacao() {
  const response = await fetch(`/validacaoUSO`);
  const data = await response.json();
  const dados = {
    max_hora_cadastro: data[0]?.max_hora_cadastro || 'N/A',
    max_data_finalizacao: data[0]?.max_data_finalizacao || 'N/A'
  };
  console.log(dados)
  return dados;
}

//===============================================================================

async function fazGET_GRAFICO() {
  try {
    const response = await fetch("/grafico_index");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const xArray = [
      "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
      "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
      "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
      "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
    ];

    const vetor = [];
    const pca = [];
    const horariosComValores = new Set();

    // Verifica se data existe e é um array
    if (!Array.isArray(data)) {
      console.error('Dados inválidos recebidos da API');
      return;
    }

    // Coleta dados com verificação de segurança
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i] && data[i]["Total"] > 0) {
        vetor.push(data[i]["Total"]);
        horariosComValores.add(xArray[i]);
      }
    }

    for (let i = 0; i < data.length; i++) {
      if (data[i] && data[i]["Percent"] > 0) {
        pca.push(data[i]["Percent"] + "%");
        horariosComValores.add(xArray[i]);
      }
    }

    const horariosAtivos = [...horariosComValores].sort();

    const data1 = {
      x: horariosAtivos,
      y: horariosAtivos.map(horario => {
        const index = xArray.indexOf(horario);
        return data[index]?.["Total"] || null;
      }),
      type: "lines",
      line: { color: "#00fa97", width: 3, shape: "spline" },
      name: "Recebidas",
    };

    const data2 = {
      x: horariosAtivos,
      y: horariosAtivos.map(horario => {
        const index = xArray.indexOf(horario);
        return data[index]?.["Percent"] ? data[index]["Percent"] + "%" : null;
      }),
      type: "bar",
      marker: { color: "rgba(91, 67, 232, 0.5)", width: 1 },
      text: pca.map(String),
      textposition: "auto",
      hoverinfo: "none",
      name: "PCA",
    };

    const layout = {
      height: 340,
      yaxis: { title: "Ligações" },
      font: {
        color: "#2b2b2b",
      },
      shapes: [],
      annotations: [],
      xaxis: {
        tickmode: 'array',
        ticktext: horariosAtivos,
        tickvals: horariosAtivos,
        tickangle: -45
      }
    };

    const maxTotal = Math.max(...vetor);

    // Função para atualizar o gráfico com verificação do elemento
    function atualizarGrafico(mostrarPCA) {
      const renderElement = document.getElementById("myDiv");
      if (!renderElement) {
        console.warn("Elemento 'render_grafico' não encontrado");
        return;
      }

      const bd = mostrarPCA ? [data1, data2] : [data1];
      Plotly.newPlot("myDiv", bd, layout, { scrollZoom: true, displayModeBar: false });
    }

    // Adicionar eventos com verificação de elementos
    const checkboxPCA = document.getElementById('checkboxPCA');
    if (checkboxPCA) {
      checkboxPCA.addEventListener('change', (e) => {
        atualizarGrafico(e.target.checked);
      });
    } else {
      console.warn("Elemento 'checkboxPCA' não encontrado");
    }

    const adicionarLinhaBtn = document.getElementById('adicionarLinha');
    if (adicionarLinhaBtn) {
      adicionarLinhaBtn.addEventListener('click', () => {
        const horarioInput = document.getElementById('horarioInput');
        const textoInput = document.getElementById('textoInput');

        if (!horarioInput || !textoInput) {
          console.warn("Elementos de input não encontrados");
          return;
        }

        const horario = horarioInput.value;
        const texto = textoInput.value;

        if (!/^\d{2}:\d{2}$/.test(horario)) {
          alert('Formato de horário inválido. Use HH:MM');
          return;
        }

        if (horariosAtivos.includes(horario)) {
          layout.shapes.push({
            type: 'line',
            x0: horario,
            y0: 0,
            x1: horario,
            y1: maxTotal,
            line: {
              color: 'red',
              width: 2,
              dash: 'dash'
            }
          });

          layout.annotations.push({
            x: horario,
            y: maxTotal - 10,
            text: texto,
            showarrow: false,
            font: {
              size: 12,
              color: 'black'
            }
          });

          atualizarGrafico(checkboxPCA?.checked || false);
        }
      });
    } else {
      console.warn("Elemento 'adicionarLinha' não encontrado");
    }

    // Desenha o gráfico inicial com verificação
    const renderElement = document.getElementById("myDiv");
    if (renderElement) {
      Plotly.newPlot("myDiv", [data1, data2], layout, { scrollZoom: true, displayModeBar: false });
    } else {
      console.warn("Elemento 'myDiv' não encontrado");
    }

  } catch (error) {
    console.error('Erro ao carregar o gráfico:', error);
  }
}

//===============================================================================
async function escalados_logados() {

  const response = await fetch("/logados");
  const data = await response.json();

  const table = $('#tbody').DataTable();

  // Limpar o conteúdo existente da tabela
  table.clear();

  // Iterar sobre os dados e adicionar as linhas à tabela
  for (const key in data.Setor) {
    const rowData = [
      data.Setor[key],
      data.Escalados[key],
      data.Logados[key],
      data.abs[key],
      data.hora[key]
    ];

    // Adicionar a linha à tabela usando o DataTables
    table.row.add(rowData);
  }

  // Atualizar a tabela para refletir as alterações
  table.draw();
}
//===============================================================================

// Função para iniciar os intervalos
function iniciarIntervalos() {
  setInterval(() => {
    fazGET_Filas();
  }, 300000);

  setInterval(() => {
    fazGET_Geral();
  }, 300000);

  setInterval(() => {
    updatconsolidsac();
  }, 900000);

  setInterval(() => {
    fazGET_consolidado_hd();
  }, 900000);

  setInterval(() => {
    fazGetChat();
  }, 60000);

  setInterval(() => {
    filavoz();
  }, 300000);

  setInterval(() => {
    filachat();
  }, 300000);

  setInterval(() => {
    fazGET_GRAFICO();
  }, 60000);

  setInterval(() => {
    fazGET_Geral();
  }, 60000);

  setInterval(() => {
    fazGET_produtividade();
  }, 3600000);
}

// Verifica se a página é a rota painelVoz
document.addEventListener('DOMContentLoaded', () => {
  const painelVozElement = document.getElementById('valor_aband'); // Substitua pelo ID ou classe do elemento específico da página

  if (painelVozElement) {
    iniciarIntervalos();
  } else {
    console.warn("A página não é a rota painelVoz. Os intervalos não foram iniciados.");
  }
});

//===============================FUNÇÔES================================================
function update_filas() {
  fazGET_Filas();
}

function updatgeral() {
  fazGET_Geral();
}

function updatprodutividade() {
  fazGET_produtividade();
}

function demanda() {
  fazPESQUISA_bloqueios();
}

function pesquisaDemanda() {
  fazPESQUISA_DEMANDA();
}

function pausachat() {
  fazGet_produtividadeUso();
}

function exportar() {
  fazGET_exportar();
}

function updatconsolidsac() {
  fazGET_consolidado_sac();
}
function updatconsolidhd() {
  fazGET_consolidado_hd();
}

function updateGrafico() {
  fazGET_GRAFICO();
}

function validaZAP() {
  zapValidacao();
}

function escalados() {
  escalados_logados();
}

function chat() {
  fazGetChat();
}
function alertas() {
  fazGetAlertas();
}
setInterval(() => {
  showAlert7();
}, 3600000);

//=======================================================================================
async function fazGetChat() {
  try {
    // Captura o valor do ID 'biscoito'
    const biscoitoElement = document.getElementById("biscoito");
    const biscoitoValue = biscoitoElement ? biscoitoElement.value : null;

    // Envia o valor do biscoito para o backend (exemplo usando fetch)
    if (biscoitoValue) {
      await fetch("/set-biscoito", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ biscoito: biscoitoValue })
      });
    }

    const response = await fetch("/teste");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");

    const table = doc.getElementById("tb_1");
    if (!table) {
      console.error("Tabela 'tb_1' não encontrada no HTML");
      return;
    }

    const rows = table.querySelectorAll("tbody tr");
    const departments = [
      "HELP DESK SUDESTE1", "SAC", "HELP DESK WEBBY", "SAC WEBBY",
      "HELP DESK CE", "HELP DESK RN/PB", "HELP DESK AZZA", "SAC AZZA"
    ];

    for (const row of rows) {
      try {
        const departmentCell = row.querySelector("td:nth-child(1)");
        if (!departmentCell) continue;
        console.log(departmentCell)
        const department = departmentCell.textContent.trim();

        if (departments.includes(department)) {
          const qtyCell = row.querySelector("td:nth-child(2)");
          if (!qtyCell) continue;
          console.log(qtyCell)

          const qty = parseInt(qtyCell.textContent.trim()) || 0;

          // Atualiza o elemento correspondente ao departamento
          const elementId = `counter-${department.replace(/\s+/g, '-').toUpperCase()}`; // Formata o ID
          const element = document.getElementById(elementId);
          if (element) {
            element.innerHTML = qty; // Atualiza o valor
          } else {
            console.warn(`Elemento com ID '${elementId}' não encontrado: ${elementId}`);
          }
        }
      } catch (rowError) {
        console.warn("Erro ao processar linha:", rowError);
        continue;
      }
    }

  } catch (error) {
    console.error('Erro ao carregar dados do chat:', error);
  }
}



//=================================REQUESTS USO PRODUTIVIDADE==============================================
/*
async function fazGet_produtividadeUso() {
    try {
        // Verificar elementos de input
        const dataStartElement = document.getElementById('data_start');
        const dataEndElement = document.getElementById('data_end');

        if (!dataStartElement || !dataEndElement) {
            throw new Error('Elementos de data não encontrados');
        }

        const data_start = dataStartElement.value;
        const data_end = dataEndElement.value;

        if (!data_start || !data_end) {
            throw new Error('Por favor, selecione as datas');
        }

        const response = await fetch('/tempoPausa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data_start, data_end })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, "text/html");

        // Verificar se a tabela DataTable existe
        const tableElement = $('#tbody1');
        if (!tableElement.length) {
            throw new Error('Tabela não encontrada');
        }

        const table = tableElement.DataTable();
        table.clear();

        const tbElement = doc.getElementById("tb2");
        if (!tbElement) {
            throw new Error('Tabela tb2 não encontrada no HTML retornado');
        }

        const tbody = tbElement.getElementsByTagName("tbody")[0];
        if (!tbody) {
            throw new Error('Tbody não encontrado na tabela');
        }

        const rows = tbody.getElementsByTagName("tr");

        for (const row of rows) {
            try {
                const cells = row.getElementsByTagName('td');
                if (cells.length < 8) {
                    console.warn('Linha com número insuficiente de células');
                    continue;
                }

                const rowData = Array.from(cells, cell => cell.innerHTML);

                // Função auxiliar para converter tempo em minutos
                const convertTimeToMinutes = (timeString) => {
                    try {
                        const [hours, minutes, seconds] = timeString.split(':').map(Number);
                        return hours * 60 + minutes + Math.ceil(seconds / 60);
                    } catch (error) {
                        console.warn('Erro ao converter tempo:', timeString);
                        return 0;
                    }
                };

                // Calcular tempo total trabalhado
                const loginMinutes = convertTimeToMinutes(rowData[2]);
                const logoutMinutes = convertTimeToMinutes(rowData[3]);

                if (loginMinutes && logoutMinutes) {
                    const totalMinutes = logoutMinutes - loginMinutes;
                    const totalHours = Math.floor(totalMinutes / 60);
                    const totalMinutesRemainder = totalMinutes % 60;
                    const totalTimeWorked = `${totalHours.toString().padStart(2, '0')}:${totalMinutesRemainder.toString().padStart(2, '0')}`;
                    rowData.push(totalTimeWorked);

                    // Verificar tempo de pausa
                    const pauseMinutes = convertTimeToMinutes(rowData[4]);
                    if (pauseMinutes > 20) {
                        rowData[4] = `<span style="background-color: red; color: white;">${rowData[4]}</span>`;
                    }

                    table.row.add(rowData);
                }
            } catch (rowError) {
                console.warn('Erro ao processar linha:', rowError);
                continue;
            }
        }

        table.draw();

    } catch (error) {
        console.error('Erro ao carregar dados de produtividade:', error);
        alert(`Erro: ${error.message}`);
    }
}

// Garantir que o DOM está carregado antes de adicionar event listeners
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            fazGet_produtividadeUso();
        });
    }
});
*/
//======================================================================================
function fazGetAlertas() {
  fetch("/alertas")
    .then(response => response.json())
    .then(data => {

      const table = $('#tbody2').DataTable();
      table.clear();

      for (const key in data.alertas) {
        const impactados = data.impactados[key];
        const rowData = [data.alertas[key], impactados];

        if (parseInt(impactados) > 100) {
          // Add the CSS styles for background color and text color
          rowData[1] = `<span style="background-color: red; color: white;">${impactados}</span>`;
        }

        table.row.add(rowData);
      }

      table.draw();
    })
    .catch(error => {
      console.error('Error fetching alerts:', error);
    });
}
//

// Inicializa o vetor no Local Storage
if (!localStorage.getItem("valor_pca")) {
  localStorage.setItem("espera_voz", "[]");
  localStorage.setItem("espera_chat", "[]");
  localStorage.setItem("valor_pca", "[]");

}
