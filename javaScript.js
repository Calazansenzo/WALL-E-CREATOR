document.addEventListener('DOMContentLoaded', () => {
  const projectData = {
    title: "Projeto",
    description: "O que é o projeto e sua função",
    parts: [
      { name: "Componente 1", qty: 0 },
      { name: "Componente 2", qty: 0 },
      { name: "Componente 3", qty: 0 },
      { name: "Componente 4", qty: 0 },
      { name: "Componente 5", qty: 0 },
      { name: "Componente 6", qty: 0 }
    ],
    steps: [
      { title: "Passo 1", content: "" },
      { title: "Passo 2", content: "" },
      { title: "Passo 3", content: "" },
      { title: "Passo 4", content: "" },
      { title: "Passo 5", content: "" }
    ]
  };

  function renderProjectDetails() {
    const container = document.getElementById('project-details');
    if (container) {
      container.innerHTML = `
        <h1>${projectData.title}</h1>
        <p>${projectData.description}</p>
        
      `;
    }
  }

  function renderPartsList() {
    const container = document.getElementById('parts-list-container');
    if (container) {
      const partsHtml = projectData.parts.map(part => `
        <tr>
          <td><strong>${part.name}</strong></td>
          <td>${part.qty}</td>
        </tr>
      `).join('');

      container.innerHTML = `
        <table class="parts-table">
          <thead>
            <tr>
              <th>Componente</th>
              <th>Qtd.</th>
            </tr>
          </thead>
          <tbody>
            ${partsHtml}
          </tbody>
        </table>
      `;
    }
  }

  function renderSteps() {
    const container = document.getElementById('steps-container');
    if (container) {
      container.innerHTML = projectData.steps.map(step => `
        <div class="step">
          <div class="step-header">
            <span>${step.title}</span>
            <span class="arrow">▸</span>
          </div>
          <div class="step-content">
            <p>${step.content}</p>
          </div>
        </div>
      `).join('');
      addAccordionFunctionality();
    }
  }

  function addAccordionFunctionality() {
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
      const header = step.querySelector('.step-header');
      const content = step.querySelector('.step-content');

      header.addEventListener('click', () => {
        const isActive = step.classList.contains('active');
        steps.forEach(s => {
          s.classList.remove('active');
          s.querySelector('.step-content').style.maxHeight = null;
        });
        if (!isActive) {
          step.classList.add('active');
          content.style.maxHeight = content.scrollHeight + "px";
        }
      });
    });
  }

  renderProjectDetails();
  renderPartsList();
  renderSteps();
});
