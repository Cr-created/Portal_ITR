// Apenas 2025 será considerado
const ANO_FIXO = '2025'
let vtn2025 = {}

// Carrega JSON local e filtra ANO = 2025
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
        }
      })
  })
  .then(() => populaMunicipios())

// DOM
const selMunicipio = document.getElementById('municipio')
const vtnInfo      = document.getElementById('vtnInfo')
const spanMun      = document.getElementById('vtnMunicipio')
const spanBoa      = document.getElementById('vtnBoa')
const spanRegular  = document.getElementById('vtnRegular')
const spanRestrita = document.getElementById('vtnRestrita')
const spanPast     = document.getElementById('vtnPastagem')
const spanSilv     = document.getElementById('vtnSilvicultura')
const spanPres     = document.getElementById('vtnPreservacao')
const inpValorTn   = document.getElementById('valorTn')
const btnCalcular  = document.getElementById('calcularBtn')
const resultado    = document.getElementById('resultado')

// Popula lista de municípios
function populaMunicipios() {
  selMunicipio.innerHTML = '<option value="">Selecione o município</option>'
  Object.keys(vtn2025)
    .sort()
    .forEach(mun => {
      const opt = document.createElement('option')
      opt.value = mun
      opt.textContent = mun
      selMunicipio.appendChild(opt)
    })
}

// Ao mudar município, exibe TODOS os valores de VTN
selMunicipio.addEventListener('change', () => {
  const mun = selMunicipio.value
  const dados = vtn2025[mun]
  if (!dados) {
    vtnInfo.style.display = 'none'
    inpValorTn.value = ''
    return
  }
  spanMun.textContent      = mun
  spanBoa.textContent      = dados.boa.toFixed(2)
  spanRegular.textContent  = dados.regular.toFixed(2)
  spanRestrita.textContent = dados.restrita.toFixed(2)
  spanPast.textContent     = dados.pastagem.toFixed(2)
  spanSilv.textContent     = dados.silvicultura.toFixed(2)
  spanPres.textContent     = dados.preservacao.toFixed(2)

  // usa aptidão boa como padrão para o cálculo
  inpValorTn.value = dados.boa
  vtnInfo.style.display = 'block'
})

// Ao clicar, calcula o ITR
btnCalcular.addEventListener('click', () => {
  const mun      = selMunicipio.value
  const areaTot  = parseFloat(document.getElementById('areaTotal').value) || 0
  const valorTn  = parseFloat(inpValorTn.value) || 0

  // soma de todas as áreas informadas
  const areaUtil = ['lavouraBoa','lavouraRegular','lavouraRestrita',
                    'pastagem','silvicultura','preservacao']
    .reduce((sum, id) => sum + (parseFloat(document.getElementById(id).value)||0), 0)

  // validações
  if (!mun) {
    resultado.textContent = 'Selecione um município.'
    return
  }
  if (areaTot <= 0) {
    resultado.textContent = 'Informe a área total do imóvel.'
    return
  }
  if (valorTn <= 0) {
    resultado.textContent = 'Valor da Terra Nua inválido.'
    return
  }

  const grauUso = (areaUtil / areaTot) * 100
  let aliquota
  if (grauUso <= 30)      aliquota = 0.05
  else if (grauUso <= 50) aliquota = 0.04
  else if (grauUso <= 70) aliquota = 0.035
  else if (grauUso <= 90) aliquota = 0.03
  else                    aliquota = 0.025

  const valorVenal = areaTot * valorTn
  const itr        = valorVenal * aliquota

  resultado.innerHTML = `
    <p><strong>Município:</strong> ${mun}</p>
    <p><strong>Grau de Utilização:</strong> ${grauUso.toFixed(2)}%</p>
    <p><strong>Alíquota aplicada:</strong> ${(aliquota*100).toFixed(2)}%</p>
    <p><strong>Valor Venal:</strong> R$ ${valorVenal.toFixed(2)}</p>
    <p><strong>ITR Estimado:</strong> R$ ${itr.toFixed(2)}</p>
  `
})
