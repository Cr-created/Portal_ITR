// ====== script.js (adequado ao Art. 10 e 11: VTNt e GU) ======
const ANO_FIXO = '2025';
let vtn2025 = {};

// Carrega os dados do VTN (R$/ha por classe) a partir do JSON
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
const inpApp   = document.getElementById('areaApp');           // Reservas (APP/Reserva Legal etc.)
const inpBenfe = document.getElementById('areaBenfeitorias');  // Benfeitorias úteis/necessárias (área ocupada)

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
  // O HTML já inclui "R$ " antes do <span>, exibimos apenas números
  spanBoa.textContent      = fmtNum.format(dados.boa);
  spanRegular.textContent  = fmtNum.format(dados.regular);
  spanRestrita.textContent = fmtNum.format(dados.restrita);
  spanPastagem.textContent = fmtNum.format(dados.pastagem);
  spanSilvic.textContent   = fmtNum.format(dados.silvicultura);
  spanPreserva.textContent = fmtNum.format(dados.preservacao);

  vtnInfo.style.display = 'block';
});

// ====== Alíquota por faixa (retorna fração; ex.: 0.0007 = 0,07%)
function calcularAliquota(areaTotalImovel, gu) {
  const faixas = [
    { limite: 50,      valores: [0.03, 0.2, 0.4, 0.7, 1] },
    { limite: 200,     valores: [0.07, 0.4, 0.8, 1.4, 2] },
    { limite: 500,     valores: [0.1,  0.6, 1.3, 2.3, 3.3] },
    { limite: 1000,    valores: [0.15, 0.85,1.9, 3.3, 4.7] },
    { limite: 5000,    valores: [0.3,  1.6, 3.4, 6,   8.6] },
    { limite: Infinity,valores: [0.45, 3,   6.4, 12,  20] }
  ];
  // GU → índice da coluna (quanto menor GU, maior %)
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
  const app   = toNum(inpApp.value);     // Áreas de reserva (APP/Reserva Legal etc.) — isentas
  const benfe = toNum(inpBenfe.value);   // Área ocupada por benfeitorias úteis/necessárias
  const dados = vtn2025[mun];

  if (!mun)       { resultado.textContent = 'Selecione um município.'; return; }
  if (total <= 0) { resultado.textContent = 'Informe a área total do imóvel.'; return; }
  if (!dados)     { resultado.textContent = 'Município sem VTN carregado.'; return; }

  // ====== Definições legais (Lei do ITR)
  // II - Área tributável = área total - áreas de reserva/APP/etc. (benfeitorias NÃO são excluídas aqui)
  const areaTributavel = total - app;

  if (areaTributavel <= 0) {
    // Art. 11, §1º: inexistindo área aproveitável/tributável, aplicar alíquota como GU>80 (tratado abaixo via GU=100)
    resultado.textContent = 'Área tributável inválida. Verifique as áreas de reserva (APP/Reserva Legal).';
    return;
  }

  // IV - Área aproveitável = área passível de exploração, EXCLUINDO:
  //     a) benfeitorias úteis e necessárias
  //     b) as mesmas áreas do inciso II (reservas/APP/etc.)
  const areaAproveitavel = Math.max(0, total - (app + benfe));

  // V - Área efetivamente utilizada = soma das culturas/pastagens/extrativas/etc.
  const areaBoa      = toNum(inpAreas.boa.value);
  const areaRegular  = toNum(inpAreas.regular.value);
  const areaRestrita = toNum(inpAreas.restrita.value);
  const areaPastagem = toNum(inpAreas.pastagem.value);
  const areaSilvic   = toNum(inpAreas.silvicultura.value);

  const areaUtilizada = areaBoa + areaRegular + areaRestrita + areaPastagem + areaSilvic;

  // A utilização não pode exceder a área aproveitável (capacidade de uso)
  if (areaUtilizada > areaAproveitavel + 1e-9) {
    resultado.textContent = 'A Área Utilizada não pode exceder a Área Aproveitável (Total - Reservas - Benfeitorias).';
    return;
  }

  // I - VTN = valor do imóvel EXCLUINDO construções/benfeitorias, culturas, pastagens cultivadas/melhoradas e florestas plantadas.
  // Na prática, usamos a valoração do terreno por classe (JSON de VTN/ha por classe de aptidão/uso),
  // multiplicando pela área informada da classe:
  const vtnTotal =
      areaBoa      * (dados.boa ?? 0) +
      areaRegular  * (dados.regular ?? 0) +
      areaRestrita * (dados.restrita ?? 0) +
      areaPastagem * (dados.pastagem ?? 0) +
      areaSilvic   * (dados.silvicultura ?? 0);

  // III - VTNt = VTN × (Área tributável / Área total)
  const vtnTributavel = vtnTotal * (areaTributavel / total);

  // VI - GU = (Área efetivamente utilizada / Área aproveitável) × 100
  // Art. 11, §1º: se não houver área aproveitável, GU considerado >80% para fins de alíquota
  const gu = areaAproveitavel > 0 ? (areaUtilizada / areaAproveitavel) * 100 : 100;

  // Alíquota conforme área total e GU
  const aliquota = calcularAliquota(total, gu);

  // Art. 11 - Imposto = VTNt × alíquota; §2º - mínimo de R$ 10,00
  const itrBruto = vtnTributavel * aliquota;
  const itr = Math.max(itrBruto, 10);

  // ====== Saída
  resultado.innerHTML = `
    <p><strong>Área Total:</strong> ${fmtNum.format(total)} ha</p>
    <p><strong>Área Utilizada:</strong> ${fmtNum.format(areaUtilizada)} ha</p>
    <p><strong>Valor da Terra Nua:</strong> ${fmtBRL.format(vtnTotal)}</p>
    <p><strong>Grau de Utilização:</strong> ${fmtNum.format(gu)}%</p>
    <p><strong>Alíquota:</strong> ${fmtNum.format(aliquota * 100)}%</p>
    <p><strong>Valor Estimado do Imposto:</strong> ${fmtBRL.format(itr)}</p>
  `;
});

