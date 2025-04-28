
const Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 20000,
    timerProgressBar: false,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
    customClass: {
        popup: 'custom-toast'
    }
});

function showAlert(message, options) {
    return Toast.fire({
        title: message,
        ...options,
        position: 'bottom-end',
        showCloseButton: true,
        customClass: {
            popup: 'custom-toast'
        }
    });
}

function showAlert1(valor) {
    return showAlert('', {
        html: '<div style="display: flex; align-items: center; white-space: nowrap; width: 100%;"><img src="/static/img/giphy (3).gif" style="margin-right: 10px; width:150px;"><span style="background-color:white;border-radius: 10px;box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); padding:10px;">É hora de brilhar esse PCA - ' + valor + '%!</span></div>'
    });
}

function showAlert3() {
    return showAlert('', {
        html: '<div style="display: flex; align-items: center; white-space: nowrap; width: 100%;"><img src="/static/img/giphy (1).gif" style="margin-right: 10px; width:150px;"><span style="background-color:white;border-radius: 10px;box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); padding:10px;">Tenha atenção ao tamanho da fila no voz!</span></div>'
    });
}

function showAlert4() {
    return showAlert('', {
        html: '<div style="display: flex; align-items: center; white-space: nowrap; width: 100%;"><img src="/static/img/gmdKBCklQ7ElxAN7oH.webp" style="margin-right: 10px; width:150px;"><span style="background-color:white;border-radius: 10px;box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); padding:10px;">A fila do chat já passou de 100!</span></div>'
    });
}

function showAlert5() {
    return showAlert('', {
        html: '<div style="display: flex; align-items: center; white-space: nowrap; width: 100%;"><img src="/static/img/giphy (1).gif" style="margin-right: 10px; width:150px;"><span style="background-color:white;border-radius: 10px;box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); padding:10px;">A fila do chat já passou de 50!</span></div>'
    });
}

function showAlert6() {
    return showAlert('', {
        html: '<div style="display: flex; align-items: center; white-space: nowrap; width: 100%;"><img src="/static/img/giphy (2).gif" style="margin-right: 10px; width:150px;"><span style="background-color:white;border-radius: 10px;box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); padding:10px;">Você está ai ? ATENÇÃO, TÁ DURO DORME - Fila chat em 150!</span></div>'
    });
}

let valorAnteriorPca = null;
let valorAnteriorEsperaVoz = null;
let valorAnteriorChat = null;

function atualizarLocalStorage(chave, valor) {
    const vetor = JSON.parse(localStorage.getItem(chave)) || [];
    vetor.push(valor);
    localStorage.setItem(chave, JSON.stringify(vetor));
}

function calcularMediaMovel() {
    const vetorPca = JSON.parse(localStorage.getItem("valor_pca")) || [];
    if (vetorPca.length < 3) return;

    const mediaMovel =
        (parseFloat(vetorPca[vetorPca.length - 1]) +
            parseFloat(vetorPca[vetorPca.length - 2]) +
            parseFloat(vetorPca[vetorPca.length - 3])) / 3;

    const valorMaisRecente = parseFloat(vetorPca[vetorPca.length - 1]);
    if (mediaMovel < valorMaisRecente) {
        showAlert(valorMaisRecente, {
            icon: 'warning',
            html: '<div>PCA está subindo!</div>'
        });
    } else {
        showAlert1(valorMaisRecente);
    }
}

function filavoz() {
    const vetorEsperaVoz = JSON.parse(localStorage.getItem("espera_voz")) || [];
    if (vetorEsperaVoz.length > 0 && parseInt(vetorEsperaVoz[vetorEsperaVoz.length - 1]) >= 40) {
        showAlert3();
    }
}

function filachat() {
    const vetorChat = JSON.parse(localStorage.getItem("espera_chat")) || [];
    if (vetorChat.length > 0) {
        const valorAtual = parseInt(vetorChat[vetorChat.length - 1]);

        // Cálculo da taxa de crescimento médio
        let taxaCrescimento = 0;
        if (vetorChat.length > 1) {
            const ultimosValores = vetorChat.slice(-5); // Pega os últimos 5 valores
            const diferencas = [];
            for (let i = 1; i < ultimosValores.length; i++) {
                diferencas.push(parseInt(ultimosValores[i]) - parseInt(ultimosValores[i - 1]));
            }
            taxaCrescimento = diferencas.reduce((a, b) => a + b, 0) / diferencas.length;
        }

        if (valorAtual >= 150) {
            showAlert6();
            return;
        }
        if (valorAtual >= 100) {
            showAlert4(taxaCrescimento);
            return;
        }
        if (valorAtual >= 50) {
            showAlert5();
            return;
        }
    }
}

// Modifique a função showAlert4 para receber e exibir a taxa de crescimento
function showAlert4() {
    return showAlert('', {
        html: '<div style="display: flex; align-items: center; white-space: nowrap; width: 100%;"><img src="/static/img/gmdKBCklQ7ElxAN7oH.webp" style="margin-right: 10px; width:110px;"><span style="background-color:white;border-radius: 10px;box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); padding:10px;">Tem hora que cansa... A fila do chat já passou de 100!</span></div>'
    });
}

// Funções de monitoramento
function monitorarVariavelPca(mutations) {
    mutations.forEach(mutation => {
        const valorPca = mutation.target.textContent;
        if (valorPca !== valorAnteriorPca) {
            valorAnteriorPca = valorPca;
            atualizarLocalStorage("valor_pca", valorPca);
            calcularMediaMovel();
        }
    });
}

function monitorarVariavelEsperaVoz(mutations) {
    mutations.forEach(mutation => {
        const valorEsperaVoz = mutation.target.textContent;
        if (valorEsperaVoz !== valorAnteriorEsperaVoz) {
            valorAnteriorEsperaVoz = valorEsperaVoz;
            atualizarLocalStorage("espera_voz", valorEsperaVoz);
            filavoz();
        }
    });
}

function monitorarVariavelChat(mutations) {
    mutations.forEach(mutation => {
        const valorChat = mutation.target.textContent;
        if (valorChat !== valorAnteriorChat) {
            valorAnteriorChat = valorChat;
            atualizarLocalStorage("espera_chat", valorChat);
            filachat();
        }
    });
}

// Criando os Mutation Observers
const observerPca = new MutationObserver(monitorarVariavelPca);
const observerEsperaVoz = new MutationObserver(monitorarVariavelEsperaVoz);
const observerChat = new MutationObserver(monitorarVariavelChat);

// Configurações do observer
const config = {
    childList: true,
    subtree: true,
    characterData: true,
};

// Observando os elementos desejados
observerPca.observe(document.getElementById("valor_pca"), config);
observerEsperaVoz.observe(document.getElementById("valor_espera"), config);
observerChat.observe(document.getElementById("chatTotal"), config);

// CSS personalizado para o toast
const style = document.createElement('style');
style.innerHTML = `
  .custom-toast {
    background: transparent;
    border: none;
    box-shadow: none;
  }
`;
document.head.appendChild(style);