const ANO_FIXO = '2025';
let vtn2025 = {};

// Carrega os dados do VTN
fetch('VTN.json')
  .then(res => res.json())
  .then(data => {
    data
      .filter(item => item.ANO === ANO_FIXO)
      .forEach(item => {
        vtn2025[item.Município] = {
          boa: item['Lavoura Aptidão Boa'],
          regular: item['Lavoura Aptidão Regular'],
          restrita: item['Lavoura Aptidão Restrita'],
          pastagem: item['Pastagem Plantada'],
          silvicultura: item['Silvicultura'],
          preservacao: item['Preservação']
        };
      });
  })
  .then(populaMunicipios);

// Elementos do DOM
const selMunicipio = document.getElementById('municipio');
const vtnInfo = document.getElementById('vtnInfo');
const resultado = document.getElementById('resultado');
const btnCalcular = document.getElementById('calcularBtn');

const spanMun = document.getElementById('vtnMunicipio');
const spanBoa = document.getElementById('vtnBoa');
const spanRegular = document.getElementById('vtnRegular');
const spanRestrita = document.getElementById('vtnRestrita');
const spanPastagem = document.getElementById('vtnPastagem');
const spanSilvic = document.getElementById('vtnSilvicultura');
const spanPreserva = document.getElementById('vtnPreservacao');

const inpValorTn = document.getElementById('valorTn');
const inpTotal = document.getElementById('areaTotal');
const inpApp = document.getElementById('areaApp');
const inpBenfe = document.getElementById('areaBenfeitorias');

const inpAreas = {
  boa: document.getElementById('areaBoa'),
  regular: document.getElementById('areaRegular'),
  restrita: document.getElementById('areaRestrita'),
  pastagem: document.getElementById('areaPastagem'),
  silvicultura: document.getElementById('areaSilvicultura')
};

// Preenche os municípios no select
function populaMunicipios() {
  selMunicipio.innerHTML = '<option value="">Selecione o município</option>';
  Object.keys(vtn2025)
    .sort()
    .forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      selMunicipio.appendChild(opt);
    });
}

// Atualiza os valores do VTN ao selecionar município
selMunicipio.addEventListener('change', () => {
  const mun = selMunicipio.value;
  const dados = vtn2025[mun];

  if (!dados) {
    vtnInfo.style.display = 'none';
    inpValorTn.value = '';
    return;
  }

  const fmtNum = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 });

  spanMun.textContent = mun;
  spanBoa.textContent = fmtNum.format(dados.boa);
  spanRegular.textContent = fmtNum.format(dados.regular);
  spanRestrita.textContent = fmtNum.format(dados.restrita);
  spanPastagem.textContent = fmtNum.format(dados.pastagem);
  spanSilvic.textContent = fmtNum.format(dados.silvicultura);
  spanPreserva.textContent = fmtNum.format(dados.preservacao);

  inpValorTn.value = fmtNum.format(dados.boa);
  vtnInfo.style.display = 'block';
});

// Calcula a alíquota com base na tabela oficial
function calcularAliquota(area, gu) {
  const faixas = [
    { limite: 50, valores: [0.03, 0.2, 0.4, 0.7, 1] },
    { limite: 200, valores: [0.07, 0.4, 0.8, 1.4, 2] },
    { limite: 500, valores: [0.1, 0.6, 1.3, 2.3, 3.3] },
    { limite: 1000, valores: [0.15, 0.85, 1.9, 3.3, 4.7] },
    { limite: 5000, valores: [0.3, 1.6, 3.4, 6, 8.6] },
    { limite: Infinity, valores: [0.45, 3, 6.4, 12, 20] }
  ];

  const guFaixa = gu <= 30 ? 4 :
                  gu <= 50 ? 3 :
                  gu <= 65 ? 2 :
                  gu <= 80 ? 1 : 0;

  const faixa = faixas.find(f => area <= f.limite);
  return faixa.valores[guFaixa] / 100;
}

// Evento de cálculo do ITR
btnCalcular.addEventListener('click', () => {
  const mun = selMunicipio.value;
  const total = parseFloat(inpTotal.value.replace(',', '.')) || 0;
  const app = parseFloat(inpApp.value.replace(',', '.')) || 0;
  const benfe = parseFloat(inpBenfe.value.replace(',', '.')) || 0;
  const dados = vtn2025[mun];

  if (!mun) {
    resultado.textContent = 'Selecione um município.';
    return;
  }
  if (total <= 0) {
    resultado.textContent = 'Informe a área total do imóvel.';
    return;
  }

  const areaTrib = total - (app + benfe);
  if (areaTrib <= 0) {
    resultado.textContent = 'Área tributável inválida.';
    return;
  }

  const areaUtilizada = Object.values(inpAreas)
    .map(input => parseFloat(input.value.replace(',', '.')) || 0)
    .reduce((sum, val) => sum + val, 0);

  const vtnTotal =
    (inpAreas.boa.value.replace(',', '.') * dados.boa) +
    (inpAreas.regular.value.replace(',', '.') * dados.regular) +
    (inpAreas.restrita.value.replace(',', '.') * dados.restrita) +
    (inpAreas.pastagem.value.replace(',', '.') * dados.pastagem) +
    (inpAreas.silvicultura.value.replace(',', '.') * dados.silvicultura);

  const gu = (areaUtilizada / areaTrib) * 100;
  const aliquota = calcularAliquota(total, gu);
  const itr = vtnTotal * aliquota;

  const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtNum = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 });

  resultado.innerHTML = `
    <p><strong>Área Tributável:</strong> ${fmtNum.format(areaTrib)} ha</p>
    <p><strong>Área Utilizada:</strong> ${fmtNum.format(areaUtilizada)} ha</p>
    <p><strong>VTN Total:</strong> ${fmtBRL.format(vtnTotal)}</p>
    <p><strong>Grau de Utilização (GU):</strong> ${fmtNum.format(gu)}%</p>
    <p><strong>Alíquota Aplicada:</strong> ${fmtNum.format(aliquota * 100)}%</p>
    <p><strong>ITR Estimado:</strong> ${fmtBRL.format(itr)}</p>
  `;
});
