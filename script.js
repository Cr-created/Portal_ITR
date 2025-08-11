// script.js

document.getElementById('calculateBtn').addEventListener('click', calculateVTN);

function calculateVTN() {
  // formatadores
  const moneyFmt = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  const numberFmt = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // lê valores de VTN municipal
  const vtn = {
    boa:         parseFloat(document.getElementById('vtnCulturaBoa').value)        || 0,
    regular:     parseFloat(document.getElementById('vtnCulturaRegular').value)    || 0,
    restrita:    parseFloat(document.getElementById('vtnCulturaRestrita').value)   || 0,
    pastagem:    parseFloat(document.getElementById('vtnPastagem').value)          || 0,
    silvicultura:parseFloat(document.getElementById('vtnSilvicultura').value)      || 0
  };

  // lê áreas por categoria
  const area = {
    boa:         parseFloat(document.getElementById('areaCulturaBoa').value)        || 0,
    regular:     parseFloat(document.getElementById('areaCulturaRegular').value)    || 0,
    restrita:    parseFloat(document.getElementById('areaCulturaRestrita').value)   || 0,
    pastagem:    parseFloat(document.getElementById('areaPastagem').value)          || 0,
    silvicultura:parseFloat(document.getElementById('areaSilvicultura').value)      || 0
  };

  // soma das áreas
  const totalArea = area.boa
                  + area.regular
                  + area.restrita
                  + area.pastagem
                  + area.silvicultura;

  // cálculo do VTN por categoria
  const vtnCalc = {
    boa:          area.boa * vtn.boa,
    regular:      area.regular * vtn.regular,
    restrita:     area.restrita * vtn.restrita,
    pastagem:     area.pastagem * vtn.pastagem,
    silvicultura: area.silvicultura * vtn.silvicultura
  };

  // VTN total
  const totalVTN = Object.values(vtnCalc).reduce((sum, val) => sum + val, 0);

  // exibe resultados formatados
  document.getElementById('totalArea').textContent = numberFmt.format(totalArea);
  document.getElementById('vtnTotal').textContent  = moneyFmt.format(totalVTN);
}
