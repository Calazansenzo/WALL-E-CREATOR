// Este evento é disparado quando todo o conteúdo HTML do DOM é carregado e parseado.
// Ele garante que o script só tente acessar elementos HTML depois que eles existam na página.
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se o elemento com o ID 'projeto-form' existe na página.
  // Este ID é esperado na página 'add.html', que é usada para adicionar novos projetos.
  if (document.getElementById('projeto-form')) {
    // Se o elemento existir, inicializa as funcionalidades específicas da página de adicionar projeto.
    initAddProjectPage();
  }
  
  // Verifica se o elemento com o ID 'projetos-container' existe na página.
  // Este ID é esperado na página 'index.html', que exibe a lista de projetos.
  if (document.getElementById('projetos-container')) {
    // Se o elemento existir, inicializa as funcionalidades específicas da página principal.
    initIndexPage();
  }
});

// Funções para a página de adicionar projeto (add.html)

/**
 * @function initAddProjectPage
 * @description Inicializa os event listeners e funcionalidades para a página de adicionar projeto.
 *              Isso inclui o formulário de adição de projeto e o botão para adicionar componentes.
 */
function initAddProjectPage() {
  // Obtém a referência para o formulário de projeto pelo seu ID.
  const form = document.getElementById('projeto-form');
  // Obtém a referência para o botão de adicionar componente pelo seu ID.
  const adicionarComponenteBtn = document.getElementById('adicionar-componente');
  
  // Adiciona um event listener de 'click' ao botão 'adicionarComponenteBtn'.
  // Quando clicado, a função 'adicionarComponente' será executada.
  adicionarComponenteBtn.addEventListener('click', adicionarComponente);
  
  // Adiciona um event listener de 'submit' ao formulário.
  // Quando o formulário é submetido, a função 'handleFormSubmit' será executada.
  form.addEventListener('submit', handleFormSubmit);
}

/**
 * @function adicionarComponente
 * @description Adiciona dinamicamente um novo campo de componente ao formulário de projeto.
 *              Cria um novo elemento HTML para o componente e o anexa ao contêiner de componentes.
 */
function adicionarComponente() {
  // Obtém a referência para o contêiner onde os componentes serão adicionados.
  const container = document.getElementById('componentes-container');
  // Cria um novo elemento 'div' que representará um item de componente.
  const componenteItem = document.createElement('div');
  // Adiciona a classe CSS 'componente-item' ao novo elemento para estilização.
  componenteItem.className = 'componente-item';
  
  // Define o conteúdo HTML interno do novo item de componente.
  // Inclui campos de input para nome e quantidade, e um botão para remover o componente.
  componenteItem.innerHTML = `
    <div class="form-group">
      <label>Nome do Componente</label>
      <input type="text" name="componente-nome" placeholder="Ex: Resistor 10kΩ">
    </div>
    <div class="form-group">
      <label>Quantidade</label>
      <input type="number" name="componente-quantidade" min="0" value="1">
    </div>
    <button type="button" class="btn-remover" onclick="removerComponente(this)">×</button>
  `;
  
  // Anexa o novo item de componente ao contêiner de componentes na página.
  container.appendChild(componenteItem);
}

/**
 * @function removerComponente
 * @description Remove um campo de componente específico do formulário.
 *              Impede a remoção se for o último componente para garantir que sempre haja pelo menos um.
 * @param {HTMLElement} button - O botão de remoção que foi clicado, usado para encontrar o componente pai.
 */
function removerComponente(button) {
  // Encontra o elemento pai mais próximo com a classe 'componente-item', que é o componente a ser removido.
  const componenteItem = button.closest('.componente-item');
  // Obtém a referência para o contêiner de componentes.
  const container = document.getElementById('componentes-container');
  
  // Verifica se há mais de um componente no contêiner.
  // Se houver, permite a remoção do componente atual.
  if (container.children.length > 1) {
    componenteItem.remove(); // Remove o elemento do DOM.
  } else {
    // Se for o último componente, exibe um alerta informando que não pode ser removido.
    alert('Deve haver pelo menos um componente.');
  }
}

async function handleFormSubmit(event) {
  event.preventDefault(); 
  
  const formData = new FormData(event.target);
  const loading = document.getElementById('loading');
  
  loading.classList.remove('hidden');
  
  try {
    const nome = formData.get('nome');
    const descricao = formData.get('descricao') || '';
    // --- CORREÇÃO JÁ APLICADA ---
    const tinkercadLink = document.getElementById('tinkercadLink').value || '';
    
    // ... (restante do código para coletar componentes) ...
    
    const response = await fetch('/api/projetos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        nome: nome.trim(),
        descricao: descricao.trim(),
        // --- CORREÇÃO JÁ APLICADA ---
        tinkercad_link: tinkercadLink.trim(), 
        componentes: componentes
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao salvar projeto');
    }
    
    alert('Projeto salvo com sucesso!');
    window.location.href = '/';
    
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao salvar projeto: ' + error.message);
  } finally {
    loading.classList.add('hidden');
  }
}


// Funções para a página principal (index.html)

/**
 * @function initIndexPage
 * @description Inicializa as funcionalidades para a página principal (index.html).
 *              Atualmente, apenas chama a função para carregar os projetos.
 */
function initIndexPage() {
  carregarProjetos(); // Chama a função para carregar e exibir a lista de projetos.
}

/**
 * @async
 * @function carregarProjetos
 * @description Carrega a lista de projetos da API e os renderiza na página principal.
 *              Exibe uma mensagem de estado vazio se não houver projetos ou uma mensagem de erro se a carga falhar.
 */
async function carregarProjetos() {
  // Obtém a referência para o contêiner onde os projetos serão exibidos.
  const container = document.getElementById('projetos-container');
  
  try {
    // Faz uma requisição GET para a API para obter a lista de projetos.
    const response = await fetch('/api/projetos');
    
    // Verifica se a resposta da API não foi bem-sucedida.
    if (!response.ok) {
      throw new Error('Erro ao carregar projetos');
    }
    
    // Parseia a resposta bem-sucedida da API como JSON para obter os dados dos projetos.
    const projetos = await response.json();
    
    // Verifica se não há projetos retornados.
    if (projetos.length === 0) {
      // Se não houver projetos, exibe um estado vazio com uma mensagem e um botão para criar um novo projeto.
      container.innerHTML = `
        <div class="empty-state">
          <h3>Nenhum projeto encontrado</h3>
          <p>Comece criando seu primeiro projeto!</p>
          <a href="/add.html" class="btn-primario">Criar Projeto</a>
        </div>
      `;
      return; // Sai da função, pois não há projetos para renderizar.
    }
    
    // Renderiza os projetos no contêiner.
    // Mapeia cada objeto de projeto para uma string HTML que representa um 'projeto-card'.
    container.innerHTML = projetos.map(projeto => `
      <div class="projeto-card">
        <div class="projeto-header">
          <h3 class="projeto-titulo">${escapeHtml(projeto.nome)}</h3>
          <span class="projeto-data">${formatarData(projeto.data_criacao)}</span>
        </div>
        
        ${projeto.descricao ? `<p class="projeto-descricao">${escapeHtml(projeto.descricao)}</p>` : ''} // Exibe a descrição se existir.
        
        <div class="componentes-resumo">
          <h4>Componentes (${projeto.componentes?.length || 0})</h4>
          <div class="componentes-lista">
            ${(projeto.componentes || []).map(comp => 
              `<span class="componente-tag">${escapeHtml(comp.nome)} (${comp.quantidade})</span>`
            ).join('')} // Mapeia e exibe os componentes do projeto.
          </div>
        </div>
        
        <div class="projeto-acoes">
          <button class="btn-pequeno btn-deletar" onclick="deletarProjeto(${projeto.id})">
            Deletar
          </button>
        </div>
      </div>
    `).join(''); // Junta todas as strings HTML dos projetos em uma única string.
    
  } catch (error) {
    // Captura e loga qualquer erro que ocorra durante o carregamento dos projetos.
    console.error('Erro ao carregar projetos:', error);
    // Exibe uma mensagem de erro na página com um botão para tentar novamente.
    container.innerHTML = `
      <div class="empty-state">
        <h3>Erro ao carregar projetos</h3>
        <p>${error.message}</p>
        <button onclick="carregarProjetos()" class="btn-primario">Tentar Novamente</button>
      </div>
    `;
  }
}

/**
 * @async
 * @function deletarProjeto
 * @description Deleta um projeto específico da API...
 */
async function deletarProjeto(id) {
    // ... (código da função deletarProjeto) ...
}

/**
 * @function abrirTinkercad
 * @description Abre o link do Tinkercad...
 */
function abrirTinkercad() {
    // ... (código da função abrirTinkercad) ...
}


// --- ADICIONE ESTAS FUNÇÕES NO FINAL DO ARQUIVO ---

/**
 * @function escapeHtml
 * @description Escapa caracteres HTML para prevenir ataques XSS.
 * @param {string} unsafe - A string a ser escapada.
 * @returns {string} A string segura.
 */
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) {
        return '';
    }
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/**
 * @function formatarData
 * @description Formata uma data no formato 'YYYY-MM-DDTHH:mm:ss' para 'DD/MM/YYYY'.
 * @param {string} dataString - A string da data do banco de dados.
 * @returns {string} A data formatada.
 */
function formatarData(dataString) {
    if (!dataString) {
        return 'Data desconhecida';
    }
    const data = new Date(dataString);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Meses são base 0
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}