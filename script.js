// Ano sempre 2025
const ANO_FIXO = '2025';
let vtn2025 = {};

// 1. Carrega JSON e filtra apenas registros de 2025
fetch('VTN.json')
  .then(res => res.json())
  .then(data => {
    data
      .filter(item => item.ANO === ANO_FIXO)
      .forEach(item => {
        vtn2025[item.Município] = {
          boa:        item['Lavoura Aptidão Boa'],
          regular:    item['Lavoura Aptidão Regular'],
          restrita:   item['Lavoura Aptidão Restrita'],
          pastagem:   item['Pastagem Plantada'],
          silvicultura: item['Silvicultura'],
          preservacao:  item['Preservação']
        };
      });
  })
  .then(populaMunicipios);

// 2. Referências ao DOM
const selMunicipio   = document.getElementById('municipio');
const vtnInfo        = document.getElementById('vtnInfo');
const spanMun        = document.getElementById('vtnMunicipio');
const spanBoa        = document.getElementById('vtnBoa');
const spanRegular    = document.getElementById('vtnRegular');
const spanRestrita   = document.getElementById('vtnRestrita');
const spanPastagem   = document.getElementById('vtnPastagem');
const spanSilvic     = document.getElementById('vtnSilvicultura');
const spanPreserva   = document.getElementById('vtnPreservacao');
const inpValorTn     = document.getElementById('valorTn');
const inpTotal       = document.getElementById('areaTotal');
const inpApp         = document.getElementById('areaApp');
const inpBenfe       = document.getElementById('areaBenfeitorias');
const inpUtilizada   = document.getElementById('areaUtilizada');
const btnCalcular    = document.getElementById('calcularBtn');
const resultado      = document.getElementById('resultado');

// 3. Preenche lista de municípios dinamicamente
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

// 4. Ao trocar município, exibe todos os valores de VTN
selMunicipio.addEventListener('change', () => {
  const mun   = selMunicipio.value;
  const dados = vtn2025[mun];
  if (!dados) {
    vtnInfo.style.display = 'none';
    inpValorTn.value = '';
    return;
  }
  spanMun.textContent      = mun;
  spanBoa.textContent      = dados.boa.toFixed(2);
  spanRegular.textContent  = dados.regular.toFixed(2);
  spanRestrita.textContent = dados.restrita.toFixed(2);
  spanPastagem.textContent = dados.pastagem.toFixed(2);
  spanSilvic.textContent   = dados.silvicultura.toFixed(2);
  spanPreserva.textContent = dados.preservacao.toFixed(2);

  // valor padrão: Lavoura Aptidão Boa
  inpValorTn.value = dados.boa;
  vtnInfo.style.display = 'block';
});

// 5. Cálculo completo de ITR
btnCalcular.addEventListener('click', () => {
  const mun         = selMunicipio.value;
  const total       = parseFloat(inpTotal.value)     || 0;
  const app         = parseFloat(inpApp.value)       || 0;
  const benfe       = parseFloat(inpBenfe.value)     || 0;
  const utilizada   = parseFloat(inpUtilizada.value) || 0;
  const valorTn     = parseFloat(inpValorTn.value)   || 0;

  // Validações
  if (!mun) {
    resultado.textContent = 'Selecione um município.';
    return;
  }
  if (total <= 0) {
    resultado.textContent = 'Informe a área total do imóvel.';
    return;
  }
  // 1️⃣ Área Tributável
  const areaTrib = total - (app + benfe);
  if (areaTrib <= 0) {
    resultado.textContent = 'Área tributável inválida.';
    return;
  }

  // 2️⃣ VTN Total
  const vtnTotal = areaTrib * valorTn;

  // 3️⃣ Grau de Utilização
  const gu = (utilizada / areaTrib) * 100;

  // 4️⃣ Alíquota (imóvel >50 ha)
  let aliquota;
  if (gu <= 30)        aliquota = 0.0330;
  else if (gu <= 50)   aliquota = 0.0270;
  else if (gu <= 65)   aliquota = 0.0210;
  else if (gu <= 80)   aliquota = 0.0150;
  else                 aliquota = 0.0100;

  // 5️⃣ ITR devido
  const itr = vtnTotal * aliquota;

  // Exibe os resultados
  resultado.innerHTML = `
    <p><strong>Área Tributável:</strong> ${areaTrib.toFixed(2)} ha</p>
    <p><strong>VTN Total:</strong> R$ ${vtnTotal.toFixed(2)}</p>
    <p><strong>Grau de Utilização (GU):</strong> ${gu.toFixed(2)}%</p>
    <p><strong>Alíquota aplicada:</strong> ${(aliquota*100).toFixed(2)}%</p>
    <p><strong>ITR Devido:</strong> R$ ${itr.toFixed(2)}</p>
  `;
});
