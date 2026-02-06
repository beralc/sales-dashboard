// Product configuration for branding and colors

export const products = {
  'ta-tum': {
    name: 'Ta-Tum',
    logo: '/ta-tum_logo.png',
    colors: {
      primary: 'rgb(251, 186, 0)',
      secondary: 'rgb(255, 200, 40)',
      gradient: 'linear-gradient(135deg, rgb(251, 186, 0) 0%, rgb(255, 200, 40) 100%)'
    }
  },
  'gosteam': {
    name: 'GoSteam',
    logo: '/gosteamlogo.svg',
    colors: {
      primary: '#FFEA00',
      secondary: '#FFEA00',
      gradient: '#FFEA00'
    }
  },
  'goproject': {
    name: 'GoProject',
    logo: '/goprojectlogo.png',
    colors: {
      primary: '#E85B30',
      secondary: '#E85B30',
      gradient: '#E85B30'
    }
  },
  'globaleduca': {
    name: 'GlobalEduca',
    logo: '/globaleducalogo.png',
    colors: {
      primary: '#0066CC',
      secondary: '#00AAFF',
      gradient: 'linear-gradient(135deg, #0066CC 0%, #00AAFF 100%)'
    }
  },
  'dispositivos': {
    name: 'Dispositivos',
    logo: null,
    colors: {
      primary: '#475569',
      secondary: '#475569',
      gradient: '#475569'
    }
  },
  'ondemand': {
    name: 'On Demand',
    logo: null,
    colors: {
      primary: '#7c3aed',
      secondary: '#7c3aed',
      gradient: '#7c3aed'
    }
  }
}

export const getProductConfig = (productKey) => {
  return products[productKey] || products['ta-tum']
}
