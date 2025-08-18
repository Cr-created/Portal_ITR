// === SUBSTITUA O HANDLER ATUAL PELO TRECHO ABAIXO ===
btnCalcular.addEventListener('click', () => {
  const mun = selMunicipio.value;
  const total = parseFloat((inpTotal.value || '').toString().replace(',', '.')) || 0;
  const app = parseFloat((inpApp.value || '').toString().replace(',', '.')) || 0;           // APP + Reserva Legal (isentas)
  const benfe = parseFloat((inpBenfe.value || '').toString().replace(',', '.')) || 0;       // Benfeitorias (não compõem Área Tributável)
  const dados = vtn2025[mun];

  if (!mun) {
    resultado.textContent = 'Selecione um município.';
    return;
  }
  if (total <= 0) {
    resultado.textContent = 'Informe a área total do imóvel.';
    return;
  }

  // Área Tributável do Imóvel = Total - (APP/Reserva + Benfeitorias)
  const areaTrib = total - (app + benfe);
  if (areaTrib <= 0) {
    resultado.textContent = 'Área tributável inválida. Verifique APP/Reserva e Benfeitorias.';
    return;
  }

  // Soma da área utilizada informada nas classes tributáveis (todas em hectares)
  const areaUtilizada = Object.values(inpAreas)
    .map(input => parseFloat((input.value || '').toString().replace(',', '.')) || 0)
    .reduce((sum, val) => sum + val, 0);

  // Validação simples: não permitir utilizada maior que a área tributável
  if (areaUtilizada > areaTrib + 1e-9) {
    resultado.textContent = 'A soma da Área Utilizada não pode exceder a Área Tributável.';
    return;
  }

  // VTN Total do Imóvel (somente áreas tributáveis informadas nas classes)
  // obs: APP/Reserva e benfeitorias já ficam fora por não entrarem no somatório.
  const toNum = v => parseFloat((v || 0).toString().replace(',', '.')) || 0;

  const vtnTotal =
    toNum(inpAreas.boa.value)        * (dados.boa ?? 0) +
    toNum(inpAreas.regular.value)    * (dados.regular ?? 0) +
    toNum(inpAreas.restrita.value)   * (dados.restrita ?? 0) +
    toNum(inpAreas.pastagem.value)   * (dados.pastagem ?? 0) +
    toNum(inpAreas.silvicultura.value)* (dados.silvicultura ?? 0);

  // >>> ATUALIZAÇÃO SOLICITADA <<<
  // VTN Tributável = VTN Total * (Área Tributável / Área Total)
  const vtnTributavel = vtnTotal * (areaTrib / total);

  // Grau de Utilização (GU) = Área Utilizada / Área Tributável * 100
  const gu = (areaUtilizada / areaTrib) * 100;

  // Alíquota: permanece por faixas do tamanho do imóvel + GU
  const aliquota = calcularAliquota(total, gu); // mantém 'total' como referência de faixa

  // ITR = VTN Tributável * Alíquota
  const itr = vtnTributavel * aliquota;

  const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtNum = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  resultado.innerHTML = `
    <p><strong>Área Tributável:</strong> ${fmtNum.format(areaTrib)} ha</p>
    <p><strong>Área Utilizada:</strong> ${fmtNum.format(areaUtilizada)} ha</p>
    <p><strong>VTN Total (classes informadas):</strong> ${fmtBRL.format(vtnTotal)}</p>
    <p><strong>Proporção Tributável (Área Tributável / Total):</strong> ${fmtNum.format((areaTrib / total) * 100)}%</p>
    <p><strong>VTN Tributável (atualizado):</strong> ${fmtBRL.format(vtnTributavel)}</p>
    <p><strong>Grau de Utilização (GU):</strong> ${fmtNum.format(gu)}%</p>
    <p><strong>Alíquota Aplicada:</strong> ${fmtNum.format(aliquota * 100)}%</p>
    <p><strong>ITR Estimado:</strong> ${fmtBRL.format(itr)}</p>
    <ul style="margin-top:10px">
      <li>APP/Reserva: isentas (não entram no VTN Tributável).</li>
      <li>Benfeitorias: não integram a Área Tributável.</li>
    </ul>
  `;
});
