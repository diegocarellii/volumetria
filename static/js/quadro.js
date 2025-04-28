



const predefinedQueues = [
    631, 637, 636, 635, 634, 1037, 1189, 1188, 1190, 1028,
    1029, 1027, 1026, 66, 67, 59, 60, 58, 57, 56, 64,
    65, 63, 62, 61, 1294, 1208, 1202, 1381, 1388, 1385,
    1386, 1034, 1033, 1032, 1031, 630, 633, 51, 52,
    53, 1457, 1380, 1387, 1417, 1645, 1651, 1656, 1650,
    1652, 1655, 1657, 1653, 1660, 1666, 1658, 1654,
    1661, 1667, 1659, 1711, 1517, 1742, 1743, 1980,
    1981, 1990, 1991
];

//ALARES SAC + WEBBY MULTISKILL 
const sac_webby = [1822, 1819, 1866, 1820, 1823, 1821, 1817, 2001, 1034, 1033, 1032, 1031, 630, 633, 51, 52, 53, 1457, 1380, 1387, 1417, 1645, 1646, 1651, 1656, 1650, 1652, 1655, 1657, 1517, 1742, 1743, 1990, 1991];

//MULTI ALARES + SAC WEBBY
const multi_sacWebby = [631, 637, 636, 635, 634, 1037, 1189, 1188, 1190, 1028, 1029, 1027, 1026, 66, 67, 59, 60, 58, 57, 56, 64, 65, 63, 62, 61, 1294, 1208, 1202, 1381, 1388, 1385, 1386, 1034, 1033, 1032, 1031, 630, 633, 51, 52, 53, 1457, 1380, 1387, 1417, 1645, 1651, 1656, 1650, 1652, 1655, 1657, 1653, 1660, 1666, 1658, 1654, 1661, 1667, 1659, 1711, 1517, 1742, 1743, 1980, 1981, 1990, 1991, 2037, 1820, 1823, 1821, 1817, 2001];

const sac = [1034, 1033, 1032, 1031, 630, 633, 51, 52, 53, 1457, 1380, 1387, 1417, 1645, 1646, 1651, 1656, 1650, 1652, 1655, 1657, 1711, 1517, 1742, 1743, 1990, 1991];

const chat = [74];

const ret = [1662, 1663, 1818, 1517, 1664];

// Função para atualizar operadores
// Função para atualizar operadores
async function updateAgents() {
    // Seleciona a tabela e as linhas dela
    const table = document.getElementById("tbody");
    const rows = table.getElementsByTagName("tr");

    for (let row of rows) {
        // Seleciona o checkbox na linha atual
        const checkbox = row.querySelector("input[type='checkbox']");
        if (checkbox && checkbox.checked) {
            const agent_id = parseInt(row.cells[0].innerText); // ID na primeira coluna
            const name = row.cells[1].innerText; // Nome na segunda coluna
            const login = row.cells[2].innerText; // Login na terceira coluna

            // Usa o vetor de filas predefinidas
            const agent_data = {
                name: name,
                login: login,
                queues: predefinedQueues // Filas predefinidas
            };

            try {
                const options = {
                    method: "PUT",
                    headers: { "token": "91440272-3f9c-45b3-8177-b2dd49c49920", "Content-Type": "application/json" },
                    body: JSON.stringify(agent_data)
                };
                // Altera a URL para apontar para a rota do seu servidor Python
                const response = await fetch(`/update-agent/${agent_id}`, options);

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                // Exibe mensagem de sucesso
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Operadores Atualizados!",
                    showConfirmButton: false,
                    timer: 1500
                });
                console.log("Operadores Atualizados:", await response.json());
            } catch (error) {
                // Exibe mensagem de erro
                Swal.fire({
                    position: "top-end",
                    icon: "error",
                    title: "Erro Ao Realizar Atualização!",
                    showConfirmButton: false,
                    timer: 1500
                });
                console.error("Error updating agent:", error);
            }
        }
    }
}

//----------------------------------------------------

async function updateChat() {
    // Seleciona a tabela e as linhas dela
    const table = document.getElementById("tbody");
    const rows = table.getElementsByTagName("tr");

    for (let row of rows) {
        // Seleciona o checkbox na linha atual
        const checkbox = row.querySelector("input[type='checkbox']");
        if (checkbox && checkbox.checked) {
            const agent_id = parseInt(row.cells[0].innerText); // ID na primeira coluna
            const name = row.cells[1].innerText; // Nome na segunda coluna
            const login = row.cells[2].innerText; // Login na terceira coluna

            // Usa o vetor de filas predefinidas
            const agent_data = {
                name: name,
                login: login,
                queues: chat // Filas predefinidas
            };

            try {
                const options = {
                    method: "PUT",
                    headers: { "token": "91440272-3f9c-45b3-8177-b2dd49c49920", "Content-Type": "application/json" },
                    body: JSON.stringify(agent_data)
                };
                // Altera a URL para apontar para a rota do seu servidor Python
                const response = await fetch(`/update-agent/${agent_id}`, options);

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                // Exibe mensagem de sucesso
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Operadores Atualizados!",
                    showConfirmButton: false,
                    timer: 1500
                });
                console.log("Operadores Atualizados:", await response.json());
            } catch (error) {
                // Exibe mensagem de erro
                Swal.fire({
                    position: "top-end",
                    icon: "error",
                    title: "Erro Ao Realizar Atualização!",
                    showConfirmButton: false,
                    timer: 1500
                });
                console.error("Error updating agent:", error);
            }
        }
    }
}

async function updateSACSAC() {
    // Seleciona a tabela e as linhas dela
    const table = document.getElementById("tbody");
    const rows = table.getElementsByTagName("tr");

    for (let row of rows) {
        // Seleciona o checkbox na linha atual
        const checkbox = row.querySelector("input[type='checkbox']");
        if (checkbox && checkbox.checked) {
            const agent_id = parseInt(row.cells[0].innerText); // ID na primeira coluna
            const name = row.cells[1].innerText; // Nome na segunda coluna
            const login = row.cells[2].innerText; // Login na terceira coluna

            // Usa o vetor de filas predefinidas
            const agent_data = {
                name: name,
                login: login,
                queues: sac // Filas predefinidas
            };

            try {
                const options = {
                    method: "PUT",
                    headers: { "token": "91440272-3f9c-45b3-8177-b2dd49c49920", "Content-Type": "application/json" },
                    body: JSON.stringify(agent_data)
                };
                // Altera a URL para apontar para a rota do seu servidor Python
                const response = await fetch(`/update-agent/${agent_id}`, options);
                console.log(response)
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                // Exibe mensagem de sucesso
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Operadores Atualizados!",
                    showConfirmButton: false,
                    timer: 1500
                });
                console.log("Operadores Atualizados:", await response.json());
            } catch (error) {
                // Exibe mensagem de erro
                Swal.fire({
                    position: "top-end",
                    icon: "error",
                    title: "Erro Ao Realizar Atualização!",
                    showConfirmButton: false,
                    timer: 1500
                });
                console.error("Error updating agent:", error);
            }
        }
    }
}

async function updateAlares_SAC_Webby_MULT() {
    // Seleciona a tabela e as linhas dela
    const table = document.getElementById("tbody");
    const rows = table.getElementsByTagName("tr");

    for (let row of rows) {
        // Seleciona o checkbox na linha atual
        const checkbox = row.querySelector("input[type='checkbox']");
        if (checkbox && checkbox.checked) {
            const agent_id = parseInt(row.cells[0].innerText); // ID na primeira coluna
            const name = row.cells[1].innerText; // Nome na segunda coluna
            const login = row.cells[2].innerText; // Login na terceira coluna

            // Usa o vetor de filas predefinidas
            const agent_data = {
                name: name,
                login: login,
                queues: sac_webby // Filas predefinidas
            };

            try {
                const options = {
                    method: "PUT",
                    headers: { "token": "91440272-3f9c-45b3-8177-b2dd49c49920", "Content-Type": "application/json" },
                    body: JSON.stringify(agent_data)
                };
                // Altera a URL para apontar para a rota do seu servidor Python
                const response = await fetch(`/update-agent/${agent_id}`, options);

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                // Exibe mensagem de sucesso
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Operadores Atualizados!",
                    showConfirmButton: false,
                    timer: 1500
                });
                console.log("Operadores Atualizados:", await response.json());
            } catch (error) {
                // Exibe mensagem de erro
                Swal.fire({
                    position: "top-end",
                    icon: "error",
                    title: "Erro Ao Realizar Atualização!",
                    showConfirmButton: false,
                    timer: 1500
                });
                console.error("Error updating agent:", error);
            }
        }
    }
}


async function updateAlares_SAC_WEBBY() {
    // Seleciona a tabela e as linhas dela
    const table = document.getElementById("tbody");
    const rows = table.getElementsByTagName("tr");

    for (let row of rows) {
        // Seleciona o checkbox na linha atual
        const checkbox = row.querySelector("input[type='checkbox']");
        if (checkbox && checkbox.checked) {
            const agent_id = parseInt(row.cells[0].innerText); // ID na primeira coluna
            const name = row.cells[1].innerText; // Nome na segunda coluna
            const login = row.cells[2].innerText; // Login na terceira coluna

            // Usa o vetor de filas predefinidas
            const agent_data = {
                name: name,
                login: login,
                queues: multi_sacWebby // Filas predefinidas
            };

            try {
                const options = {
                    method: "PUT",
                    headers: { "token": "91440272-3f9c-45b3-8177-b2dd49c49920", "Content-Type": "application/json" },
                    body: JSON.stringify(agent_data)
                };
                // Altera a URL para apontar para a rota do seu servidor Python
                const response = await fetch(`/update-agent/${agent_id}`, options);

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                // Exibe mensagem de sucesso
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Operadores Atualizados!",
                    showConfirmButton: false,
                    timer: 1500
                });
                console.log("Operadores Atualizados:", await response.json());
            } catch (error) {
                // Exibe mensagem de erro
                Swal.fire({
                    position: "top-end",
                    icon: "error",
                    title: "Erro Ao Realizar Atualização!",
                    showConfirmButton: false,
                    timer: 1500
                });
                console.error("Error updating agent:", error);
            }
        }
    }
}

async function fazGet_quadro() {

    const response = await fetch('/quadro');
    const data = await response.json();
    const table = $('#tbody').DataTable();
    table.clear();

    for (const key in data.nome) {
        const rowData = [
            data.id[key],
            data.nome[key],
            data.login[key],
            data.grupo[key],
            data.tipo[key],
            `<input type="checkbox" class="row-checkbox" data-id="${data.id[key]}">`, // Checkbox com data-id
        ];

        table.row.add(rowData);
    }

    table.draw(); // Redesenha a tabela após adicionar as linhas

    // Adiciona o listener para o checkbox "Selecionar Todos"
    document.getElementById('select-all').addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}

async function fazGet_quadro_USO() {
    const response = await fetch('/quadroUSO')
    const data = await response.json()
    const table = $('#tbody_uso').DataTable();
    table.clear();

    for (const key in data.agente_id) {
        const rowData = [
            data.ID_plataforma[key],
            data.agente_id[key],
            data.nome_atendente[key],
            data.nome_formato[key],
            `<input type="checkbox" class="row-checkbox" data-id="${data.agente_id[key]}">`, // Checkbox com data-id
        ];

        table.row.add(rowData);
    }

    table.draw(); // Redesenha a tabela após adicionar as linhas

    // Adiciona o listener para o checkbox "Selecionar Todos"
    document.getElementById('select-all').addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    }

    async function updateAlterfilaUSO() {
        // Seleciona a tabela
        const table = $('#tbody_uso').DataTable();
        const selectedAgents = [];
    
        // Coleta todos os checkboxes marcados
        $('.row-checkbox:checked').each(function() {
            const row = $(this).closest('tr');
            const rowData = table.row(row).data();
            
            selectedAgents.push({
                id_plataforma: rowData[0], // Primeira coluna (ID Plataforma)
                agente_id: rowData[1],     // Segunda coluna (ID Agente)
            });
        });
    
        if (selectedAgents.length === 0) {
            Swal.fire({
                position: "top-end",
                icon: "warning",
                title: "Nenhum operador selecionado!",
                showConfirmButton: false,
                timer: 1500
            });
            return;
        }
    
        try {
            const response = await fetch('/alterfilaUSO', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agentes: selectedAgents
                })
            });
    
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor');
            }
    
            const result = await response.json();
            
            // Verifica se todas as atualizações foram bem-sucedidas
            const allSuccess = result.every(r => r.status === 200);
            
            if (allSuccess) {
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Operadores atualizados com sucesso!",
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                throw new Error('Algumas atualizações falharam');
            }
    
        } catch (error) {
            console.error('Erro:', error);
            Swal.fire({
                position: "top-end",
                icon: "error",
                title: "Erro ao atualizar operadores!",
                text: error.message,
                showConfirmButton: false,
                timer: 1500
            });
        }
    }
    

function carregar_Quadro() {
    fazGet_quadro();
}

function carregar_operadoresUSO(){
    fazGet_quadro_USO();
}

function reset_multiskill() {
    updateAgents();
}

function reset_chat() {
    updateChat();
}

function reset_sac(){
    updateSac();
}

function reset_webby() {
    updateWebby();
}


function reset_alares_webby(){
    updateAlares_SAC_Webby_MULT();
}

function reset_multi_sac(){
    updateAlares_SAC_WEBBY();
}

function SACSAC(){
    updateSACSAC();
}

function reset_filas_uso(){
    updateAlterfilaUSO()
}