// ====== script.js (GU desconsidera apenas áreas de reserva / APP) ======
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
          boa:          Number(item['Lavoura Aptidão Boa'])      || 0,
          regular:      Number(item['Lavoura Aptidão Regular'])  || 0,
          restrita:     Number(item['Lavoura Aptidão Restrita']) || 0,
          pastagem:     Number(item['Pastagem Plantada'])        || 0,
          silvicultura: Number(item['Silvicultura'])             || 0,
          preservacao:  Number(item['Preservação'])              || 0
        };
      });
  })
  .then(populaMunicipios);

// ====== Elementos do DOM
const selMunicipio = document.getElementById('municipio');
const vtnInfo      = document.getElementById('vtnInfo');
const resultado    = document.getElementById('resultado');
const btnCalcular  = document.getElementById('calcularBtn');

const spanMun      = document.getElementById('vtnMunicipio');
const spanBoa      = document.getElementById('vtnBoa');
const spanRegular  = document.getElementById('vtnRegular');
const spanRestrita = document.getElementById('vtnRestrita');
const spanPastagem = document.getElementById('vtnPastagem');
const spanSilvic   = document.getElementById('vtnSilvicultura');
const spanPreserva = document.getElementById('vtnPreservacao');

const inpTotal = document.getElementById('areaTotal');
const inpApp   = document.getElementById('areaApp');           // APP/Reserva (isenta)
const inpBenfe = document.getElementById('areaBenfeitorias');  // Benfeitorias (entram na área tributável)

const inpAreas = {
  boa:          document.getElementById('areaBoa'),
  regular:      document.getElementById('areaRegular'),
  restrita:     document.getElementById('areaRestrita'),
  pastagem:     document.getElementById('areaPastagem'),
  silvicultura: document.getElementById('areaSilvicultura')
};

// ====== Helpers
function toNum(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ====== Popular municípios
function populaMunicipios() {
  selMunicipio.innerHTML = '<option value="">Selecione o município</option>';
  Object.keys(vtn2025).sort().forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    selMunicipio.appendChild(opt);
  });
}

// ====== Exibir VTN do município selecionado
selMunicipio.addEventListener('change', () => {
  const mun = selMunicipio.value;
  const dados = vtn2025[mun];

  if (!dados) {
    vtnInfo.style.display = 'none';
    return;
  }

  spanMun.textContent      = mun;
  // O HTML já possui "R$ " antes dos spans → exibimos só números
  spanBoa.textContent      = fmtNum.format(dados.boa);
  spanRegular.textContent  = fmtNum.format(dados.regular);
  spanRestrita.textContent = fmtNum.format(dados.restrita);
  spanPastagem.textContent = fmtNum.format(dados.pastagem);
  spanSilvic.textContent   = fmtNum.format(dados.silvicultura);
  spanPreserva.textContent = fmtNum.format(dados.preservacao);

  vtnInfo.style.display = 'block';
});

// ====== Alíquota por faixa oficial (retorna fração, ex.: 0.0007)
function calcularAliquota(areaTotalImovel, gu) {
  const faixas = [
    { limite: 50,      valores: [0.03, 0.2, 0.4, 0.7, 1] },
    { limite: 200,     valores: [0.07, 0.4, 0.8, 1.4, 2] },
    { limite: 500,     valores: [0.1,  0.6, 1.3, 2.3, 3.3] },
    { limite: 1000,    valores: [0.15, 0.85,1.9, 3.3, 4.7] },
    { limite: 5000,    valores: [0.3,  1.6, 3.4, 6,   8.6] },
    { limite: Infinity,valores: [0.45, 3,   6.4, 12,  20] }
  ];
  const idxGU = gu <= 30 ? 4 :
                gu <= 50 ? 3 :
                gu <= 65 ? 2 :
                gu <= 80 ? 1 : 0;

  const faixa = faixas.find(f => areaTotalImovel <= f.limite);
  return (faixa?.valores?.[idxGU] ?? 0) / 100;
}

// ====== Cálculo principal
btnCalcular.addEventListener('click', () => {
  const mun   = selMunicipio.value;
  const total = toNum(inpTotal.value);
  const app   = toNum(inpApp.value);     // Reservas (desconsideradas no GU e na proporção do VTN)
  const benfe = toNum(inpBenfe.value);   // Entram na área tributável
  const dados = vtn2025[mun];

  if (!mun)       { resultado.textContent = 'Selecione um município.'; return; }
  if (total <= 0) { resultado.textContent = 'Informe a área total do imóvel.'; return; }
  if (!dados)     { resultado.textContent = 'Município sem VTN carregado.'; return; }

  // ====== Área Tributável do Imóvel (para GU e para proporção do VTN)
  // GU DESCONSIDERA APENAS RESERVAS → área de referência = total - app
  // Benfeitorias entram na área tributável.
  const areaTrib = total - app;
  if (areaTrib <= 0) {
    resultado.textContent = 'Área tributável inválida. Revise a área de reservas (APP/Reserva).';
    return;
  }

  // ====== Distribuição de utilização (somente culturas produtivas)
  const areaBoa      = toNum(inpAreas.boa.value);
  const areaRegular  = toNum(inpAreas.regular.value);
  const areaRestrita = toNum(inpAreas.restrita.value);
  const areaPastagem = toNum(inpAreas.pastagem.value);
  const areaSilvic   = toNum(inpAreas.silvicultura.value);

  const areaUtilizada = areaBoa + areaRegular + areaRestrita + areaPastagem + areaSilvic;

  // A soma da utilização não pode exceder a área tributável (total - reservas)
  if (areaUtilizada > areaTrib + 1e-9) {
    resultado.textContent = 'A soma da Área Utilizada não pode exceder a Área Tributável (total - reservas).';
    return;
  }

  // ====== VTN Total (R$) = Σ (área por classe × VTN/ha da classe)
  const vtnTotal =
      areaBoa      * (dados.boa ?? 0) +
      areaRegular  * (dados.regular ?? 0) +
      areaRestrita * (dados.restrita ?? 0) +
      areaPastagem * (dados.pastagem ?? 0) +
      areaSilvic   * (dados.silvicultura ?? 0);

  // ====== VTN Tributável (R$)
  // Regra: VTN_trib = VTN_total × (Área Tributável do Imóvel / Área Total)
  // Onde "Área Tributável do Imóvel" desconsidera APENAS reservas (APP).
  const vtnTributavel = vtnTotal * (areaTrib / total);

  // ====== Grau de Utilização (GU)
  // GU = Área Utilizada / (Área Total - Reservas) × 100
  const gu = (areaUtilizada / areaTrib) * 100;

  // ====== Alíquota e ITR
  const aliquota = calcularAliquota(total, gu);
  const itr = vtnTributavel * aliquota;

  // ====== Saída
  resultado.innerHTML = `
    <p><strong>Área Total:</strong> ${fmtNum.format(total)} ha</p>
    <p><strong>Área Reservas (APP/Reserva):</strong> ${fmtNum.format(app)} ha</p>
    <p><strong>Área Benfeitorias:</strong> ${fmtNum.format(benfe)} ha</p>
    <p><strong>Área Tributável (Total - Reservas):</strong> ${fmtNum.format(areaTrib)} ha</p>
    <p><strong>Área Utilizada (culturas):</strong> ${fmtNum.format(areaUtilizada)} ha</p>
    <p><strong>VTN (somatório por classe × R$/ha do município):</strong> ${fmtBRL.format(vtnTotal)}</p>
    <p><strong>VTN Tributável:</strong> ${fmtBRL.format(vtnTributavel)}</p>
    <p><strong>Grau de Utilização (GU):</strong> ${fmtNum.format(gu)}%</p>
    <p><strong>Alíquota Aplicada:</strong> ${fmtNum.format(aliquota * 100)}%</p>
    <p><strong>ITR Estimado:</strong> ${fmtBRL.format(itr)}</p>
    <ul style="margin-top:10px">
      <li>GU desconsidera <strong>apenas</strong> as áreas de reserva (APP/Reserva).</li>
      <li>Benfeitorias <strong>entram</strong> na área tributável, mas não compõem a “área utilizada” se não houver uso produtivo.</li>
    </ul>
  `;
});
