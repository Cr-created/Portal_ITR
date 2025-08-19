// Evento de cálculo do ITR (ajustes pontuais: áreaTrib, áreaUtilizada, vtnTotal)
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

  // (1) AJUSTE: benfeitorias não são isentas → NÃO entram no desconto
  const areaTrib = total - app;
  if (areaTrib <= 0) {
    resultado.textContent = 'Área tributável inválida.';
    return;
  }

  // (2) AJUSTE: GU considera também a área de benfeitorias (além das áreas por aptidão)
  const areaUtilizadaAptidoes = Object.values(inpAreas)
    .map(input => parseFloat(input.value.replace(',', '.')) || 0)
    .reduce((sum, val) => sum + val, 0);
  const areaUtilizada = areaUtilizadaAptidoes + benfe;

  // (3) AJUSTE: VTN total inclui benfeitorias × valor de TN informado (inpValorTn)
  const valorTNBenfe = parseFloat((inpValorTn.value || '').toString().replace(',', '.'));
  const tnParaBenfe = Number.isFinite(valorTNBenfe) ? valorTNBenfe : (dados?.boa || 0);

  const vtnTotal =
    (parseFloat(inpAreas.boa.value.replace(',', '.')) || 0) * (dados?.boa || 0) +
    (parseFloat(inpAreas.regular.value.replace(',', '.')) || 0) * (dados?.regular || 0) +
    (parseFloat(inpAreas.restrita.value.replace(',', '.')) || 0) * (dados?.restrita || 0) +
    (parseFloat(inpAreas.pastagem.value.replace(',', '.')) || 0) * (dados?.pastagem || 0) +
    (parseFloat(inpAreas.silvicultura.value.replace(',', '.')) || 0) * (dados?.silvicultura || 0) +
    // inclusão das benfeitorias no VTN
    benfe * tnParaBenfe;

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
