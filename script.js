// ====== script.js (benfeitorias entram na Área Tributável) ======
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
const inpApp   = document.getElementById('areaApp');           // APP + Reserva (isentas)
const inpBenfe = document.getElementById('areaBenfeitorias');  // Benfeitorias (AGORA entram na Área Tributável)

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
  // O HTML tem "R$ " antes do span; aqui exibimos somente números formatados
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
  const app   = toNum(inpApp.value);
  const benfe = toNum(inpBenfe.value); // entra no total, mas NÃO exclui da área tributável
  const dados = vtn2025[mun];

  if (!mun)       { resultado.textContent = 'Selecione um município.'; return; }
  if (total <= 0) { resultado.textContent = 'Informe a área total do imóvel.'; return; }
  if (!dados)     { resultado.textContent = 'Município sem VTN carregado.'; return; }

  // ====== Área Tributável do Imóvel
  // AGORA: Área Tributável = Área Total - APP/Reserva  (benfeitorias entram)
  const areaTrib = total - app;
  if (areaTrib <= 0) {
    resultado.textContent = 'Área tributável inválida. Revise APP/Reserva.';
    return;
  }

  // ====== Distribuição de utilização em culturas (todas tributáveis)
  const areaBoa      = toNum(inpAreas.boa.value);
  const areaRegular  = toNum(inpAreas.regular.value);
  const areaRestrita = toNum(inpAreas.restrita.value);
  const areaPastagem = toNum(inpAreas.pastagem.value);
  const areaSilvic   = toNum(inpAreas.silvicultura.value);

  const areaUtilizada = areaBoa + areaRegular + areaRestrita + areaPastagem + areaSilvic;

  // A soma da utilização NÃO pode exceder a Área Tributável
  if (areaUtilizada > areaTrib + 1e-9) {
    resultado.textContent = 'A soma da Área Utilizada não pode exceder a Área Tributável.';
    return;
  }

  // ====== VTN Total (R$) = Σ (área da classe × VTN/ha da classe no município)
  const vtnTotal =
      areaBoa      * (dados.boa ?? 0) +
      areaRegular  * (dados.regular ?? 0) +
      areaRestrita * (dados.restrita ?? 0) +
      areaPastagem * (dados.pastagem ?? 0) +
      areaSilvic   * (dados.silvicultura ?? 0);

  // ====== VTN Tributável (R$)
  // Aplicando a regra solicitada: VTNTributável = VTNTotal × (ÁreaTributável / ÁreaTotal)
  const vtnTributavel = vtnTotal * (areaTrib / total);

  // ====== GU e Alíquota
  // GU usa Área Tributável no denominador; benfeitorias entram na área tributável, mas tipicamente NÃO entram em "área utilizada" (se não forem culturas).
  const gu = (areaUtilizada / areaTrib) * 100;
  const aliquota = calcularAliquota(total, gu);

  // ====== ITR
  const itr = vtnTributavel * aliquota;

  // ====== Saída
  resultado.innerHTML = `
    <p><strong>Área Total:</strong> ${fmtNum.format(total)} ha</p>
    <p><strong>Área APP/Reserva (isenta):</strong> ${fmtNum.format(app)} ha</p>
    <p><strong>Área Benfeitorias:</strong> ${fmtNum.format(benfe)} ha</p>
    <p><strong>Área Tributável:</strong> ${fmtNum.format(areaTrib)} ha</p>
    <p><strong>Área Utilizada (culturas):</strong> ${fmtNum.format(areaUtilizada)} ha</p>
    <p><strong>VTN (somatório por classe × R$/ha do município):</strong> ${fmtBRL.format(vtnTotal)}</p>
    <p><strong>VTN Tributável:</strong> ${fmtBRL.format(vtnTributavel)}</p>
    <p><strong>Grau de Utilização (GU):</strong> ${fmtNum.format(gu)}%</p>
    <p><strong>Alíquota Aplicada:</strong> ${fmtNum.format(aliquota * 100)}%</p>
    <p><strong>ITR Estimado:</strong> ${fmtBRL.format(itr)}</p>
    <ul style="margin-top:10px">
      <li>APP/Reserva: isentas.</li>
      <li>Benfeitorias: <strong>entram</strong> na Área Tributável (podem reduzir o GU se não houver uso produtivo equivalente).</li>
    </ul>
  `;
});
