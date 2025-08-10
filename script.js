// Dados de VTN por município para o ano de 2025
const vtnData = {
  "2025": {
    "Altinópolis": 4500,
    "Ribeirão Preto": 5200,
    "Batatais": 4800
    // adicione outros municípios conforme precisar
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const selMunicipio = document.getElementById('municipio');
  const selAno       = document.getElementById('ano');
  const vtnInfo      = document.getElementById('vtnInfo');
  const spanMun      = document.getElementById('vtnMunicipio');
  const spanAno      = document.getElementById('vtnAno');
  const spanValor    = document.getElementById('vtnValor');
  const inpValorTn   = document.getElementById('valorTn');

  // Preenche o select de municípios conforme vtnData[ano]
  function populaMunicipios() {
    const ano = selAno.value;
    selMunicipio.innerHTML = '<option value="">Selecione</option>';
    if (vtnData[ano]) {
      Object.keys(vtnData[ano]).forEach(mun => {
        const opt = document.createElement('option');
        opt.value = mun;
        opt.textContent = mun;
        selMunicipio.appendChild(opt);
      });
    }
    vtnInfo.style.display = 'none';
    inpValorTn.value = '';
  }

  // Exibe VTN e preenche o campo
  function atualizarVTN() {
    const mun = selMunicipio.value;
    const ano = selAno.value;
    if (vtnData[ano] && vtnData[ano][mun]) {
      const valor = vtnData[ano][mun];
      spanMun.textContent   = mun;
      spanAno.textContent   = ano;
      spanValor.textContent = valor.toFixed(2);
      inpValorTn.value      = valor;
      vtnInfo.style.display = 'block';
    } else {
      vtnInfo.style.display = 'none';
      inpValorTn.value      = '';
    }
  }

  selAno.addEventListener('change', populaMunicipios);
  selMunicipio.addEventListener('change', atualizarVTN);

  // Popula na carga inicial (já em 2025)
  populaMunicipios();
});

function calcularITR() {
  const municipio = document.getElementById('municipio').value;
  const areaTotal = parseFloat(document.getElementById('areaTotal').value) || 0;
  const valorTn   = parseFloat(document.getElementById('valorTn').value)    || 0;
  const resultado = document.getElementById('resultado');

  // Validações
  if (!municipio) {
    resultado.textContent = 'Selecione um município.';
    return;
  }
  if (areaTotal <= 0) {
    resultado.textContent = 'Informe a área total do imóvel.';
    return;
  }
  if (valorTn <= 0) {
    resultado.textContent = 'Não foi possível obter o Valor da Terra Nua.';
    return;
  }

  // Soma áreas utilizadas
  const areaUtilizada = [
    'lavouraBoa',
    'lavouraRegular',
    'lavouraRestrita',
    'pastagem',
    'silvicultura',
    'preservacao'
  ].reduce((sum, id) => sum + (parseFloat(document.getElementById(id).value) || 0), 0);

  const grauUso = (areaUtilizada / areaTotal) * 100;

  // Alíquota conforme grau de utilização
  let aliquota;
  if (grauUso <= 30)      aliquota = 0.05;
  else if (grauUso <= 50) aliquota = 0.04;
  else if (grauUso <= 70) aliquota = 0.035;
  else if (grauUso <= 90) aliquota = 0.03;
  else                    aliquota = 0.025;

  const valorVenal = areaTotal * valorTn;
  const itr        = valorVenal * aliquota;

  resultado.innerHTML = `
    <p>Município: ${municipio}</p>
    <p>Grau de Utilização: ${grauUso.toFixed(2)}%</p>
    <p>Alíquota Aplicada: ${(aliquota * 100).toFixed(2)}%</p>
    <p>Valor Venal: R$ ${valorVenal.toFixed(2)}</p>
    <p>ITR Estimado: R$ ${itr.toFixed(2)}</p>
  `;
}
