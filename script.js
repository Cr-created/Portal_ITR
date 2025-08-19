btnCalcular.addEventListener('click', () => {
  const mun = selMunicipio.value;
  const total = parseFloat(inpTotal.value.replace(',', '.')) || 0;
  const app = parseFloat(inpApp.value.replace(',', '.')) || 0;
  const benfe = parseFloat(inpBenfe.value.replace(',', '.')) || 0;  // ← vamos usar!
  const dados = vtn2025[mun];

  if (!mun) {
    resultado.textContent = 'Selecione um município.';
    return;
  }
  if (total <= 0) {
    resultado.textContent = 'Informe a área total do imóvel.';
    return;
  }

  // (1) Área tributável inclui benfeitorias: TOTAL - APP
  const areaTrib = total - app;
  if (areaTrib <= 0) {
    resultado.textContent = 'Área tributável inválida.';
    return;
  }

  // Soma das áreas de uso informadas
  const somaClassesUso = Object.values(inpAreas)
    .map(input => parseFloat(input.value.replace(',', '.')) || 0)
    .reduce((sum, val) => sum + val, 0);

  // (2) GU considera também a área de benfeitorias
  const areaUtilizada = somaClassesUso + benfe;

  // (3) VTN Total: classes × VTN municipal + benfeitorias × VTN escolhido (campo valorTn)
  const vtnClasses =
    (parseFloat((inpAreas.boa.value || '0').replace(',', '.')) * (dados?.boa || 0)) +
    (parseFloat((inpAreas.regular.value || '0').replace(',', '.')) * (dados?.regular || 0)) +
    (parseFloat((inpAreas.restrita.value || '0').replace(',', '.')) * (dados?.restrita || 0)) +
    (parseFloat((inpAreas.pastagem.value || '0').replace(',', '.')) * (dados?.pastagem || 0)) +
    (parseFloat((inpAreas.silvicultura.value || '0').replace(',', '.')) * (dados?.silvicultura || 0));

  const vtnBenfe = benfe * (parseFloat((inpValorTn.value || '0').replace(',', '.')) || 0);
  const vtnTotal = vtnClasses + vtnBenfe;

  const gu = (areaUtilizada / areaTrib) * 100;
  const aliquota = calcularAliquota(total, gu); // mantém sua regra/tabela
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
