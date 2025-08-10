let dadosVTN = [];

fetch('VTN.json')
  .then(response => response.json())
  .then(data => {
    dadosVTN = data;
    preencherMunicipios(data);
  });

function preencherMunicipios(data) {
  const select = document.getElementById('municipio');
  const municipiosUnicos = [...new Set(data.map(item => item.Município))];
  municipiosUnicos.sort().forEach(mun => {
    const option = document.createElement('option');
    option.value = mun;
    option.textContent = mun;
    select.appendChild(option);
  });
}

function calcularVTN() {
  const municipioSelecionado = document.getElementById('municipio').value;
  const registro = dadosVTN.find(item => item.Município === municipioSelecionado);

  if (!registro) {
    document.getElementById('resultado').textContent = 'Município não encontrado.';
    return;
  }

  const areas = {
    boa: parseFloat(document.getElementById('boa').value) || 0,
    regular: parseFloat(document.getElementById('regular').value) || 0,
    restrita: parseFloat(document.getElementById('restrita').value) || 0,
    pastagem: parseFloat(document.getElementById('pastagem').value) || 0,
    silvicultura: parseFloat(document.getElementById('silvicultura').value) || 0,
    preservacao: parseFloat(document.getElementById('preservacao').value) || 0
  };

  const total =
    areas.boa * registro["Lavoura Aptidão Boa"] +
    areas.regular * registro["Lavoura Aptidão Regular"] +
    areas.restrita * registro["Lavoura Aptidão Restrita"] +
    areas.pastagem * registro["Pastagem Plantada"] +
    areas.silvicultura * registro["Silvicultura"] +
    areas.preservacao * registro["Preservação"];

  document.getElementById('resultado').textContent =
    `VTN Total: R$ ${total.toFixed(2).replace('.', ',')}`;

}
