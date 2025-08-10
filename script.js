function calcularITR() {
  const areaTotal = parseFloat(document.getElementById('areaTotal').value) || 0;
  const areas = {
    boa: parseFloat(document.getElementById('lavouraBoa').value) || 0,
    regular: parseFloat(document.getElementById('lavouraRegular').value) || 0,
    restrita: parseFloat(document.getElementById('lavouraRestrita').value) || 0,
    pastagem: parseFloat(document.getElementById('pastagem').value) || 0,
    silvicultura: parseFloat(document.getElementById('silvicultura').value) || 0,
    preservacao: parseFloat(document.getElementById('preservacao').value) || 0
  };

  const valorTn = parseFloat(document.getElementById('valorTn').value) || 0;

  const areaUtilizada = areas.boa + areas.regular + areas.restrita + areas.pastagem + areas.silvicultura + areas.preservacao;

  if (areaTotal === 0) {
    document.getElementById('resultado').innerText = "Informe a área total do imóvel.";
    return;
  }

  const grauUso = (areaUtilizada / areaTotal) * 100;

  // Tabela de alíquotas (exemplo simplificado)
  let aliquota;
  if (grauUso <= 30) {
    aliquota = 0.05;
  } else if (grauUso <= 50) {
    aliquota = 0.04;
  } else if (grauUso <= 70) {
    aliquota = 0.035;
  } else if (grauUso <= 90) {
    aliquota = 0.03;
  } else {
    aliquota = 0.025;
  }

  const valorVenal = areaTotal * valorTn;
  const itr = valorVenal * aliquota;

  document.getElementById('resultado').innerHTML = `
    <p>Grau de Utilização: ${grauUso.toFixed(2)}%</p>
    <p>Alíquota Aplicada: ${(aliquota * 100).toFixed(2)}%</p>
    <p>Valor Venal: R$ ${valorVenal.toFixed(2)}</p>
    <p>ITR Estimado: R$ ${itr.toFixed(2)}</p>
  `;
}
