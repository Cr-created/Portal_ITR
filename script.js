const ANO_FIXO = '2025';
let vtn2025 = {};

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

const selMunicipio = document.getElementById('municipio');
const vtnInfo = document.getElementById('vtnInfo');
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
const btnCalcular = document.getElementById('calcularBtn');
const resultado = document.getElementById('resultado');

const inpAreas = {
  boa: document.getElementById('areaBoa'),
  regular: document.getElementById('areaRegular'),
  restrita: document.getElementById('areaRestrita'),
  pastagem: document.getElementById('areaPastagem'),
  silvicultura: document.getElementById('areaSilvicultura')
};

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

selMunicipio.addEventListener('change', () => {
  const mun = selMunicipio.value;
  const dados = vtn2025[mun];
  if (!dados) {
    vtnInfo.style.display = 'none';
    inpValorTn.value = '';
    return;
  }
  spanMun.textContent = mun;
  spanBoa.textContent = dados.boa.toFixed(2);
  spanRegular.textContent = dados.regular.toFixed(2);
  spanRestrita.textContent = dados.restrita.toFixed(2);
  spanPastagem.textContent = dados.pastagem.toFixed(2);
  spanSilvic.textContent = dados.silvicultura.toFixed(2);
  spanPreserva.textContent = dados.preservacao.toFixed(2);
  inpValorTn.value = dados.boa;
  vtnInfo.style.display = 'block';
});

btnCalcular.addEventListener('click', () => {
  const mun = selMunicipio.value;
  const total = parseFloat(inpTotal.value) || 0;
  const app = parseFloat(inpApp.value) || 0;
  const benfe = parseFloat(inpBenfe.value) || 0;
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

  const areaUtilizada = Object.keys(inpAreas)
    .map(k => parseFloat(inpAreas[k].value) || 0)
    .reduce((sum, val) => sum + val, 0);

  const vtnTotal =
    (inpAreas.boa.value * dados.boa) +
    (inpAreas.regular.value * dados.regular) +
    (inpAreas.restrita.value * dados.restrita) +
    (inpAreas.pastagem.value * dados.pastagem) +
    (inpAreas.silvicultura.value * dados.silvicultura);

  const gu = (areaUtilizada / areaTrib) * 100;

  let aliquota;
  if (gu <= 30) aliquota = 0.0330;
  else if (gu <= 50) aliquota = 0.0270;
  else if (gu <= 65) aliquota = 0.0210;
  else if (gu <= 80) aliquota = 0.0150;
  else aliquota = 0.0100;

  const itr = vtnTotal * aliquota;

  const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtNum = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 });

  resultado.innerHTML = `
    <p><strong>Área Tributável:</strong> ${fmtNum.format(areaTrib)} ha</p>
    <p><strong>Área Utilizada:</strong> ${fmtNum.format(areaUtilizada)} ha</p>
    <p><strong>VTN Total:</strong> ${fmtBRL.format(vtnTotal)}</p>
    <p><strong>Grau de Utilização (GU):</strong> ${fmtNum.format(gu)}%</p>
     <p><strong>ITR Estimado:</strong> ${fmtBRL.format(itr)}</p>
  `;
});
