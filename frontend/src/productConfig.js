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
      secondary: '#3b82f6',
      gradient: 'linear-gradient(135deg, #FFEA00 0%, #06b6d4 100%)'
    }
  },
  'goproject': {
    name: 'GoProject',
    logo: '/goprojectlogo.png',
    colors: {
      primary: '#E85B30',
      secondary: '#8DC63F',
      gradient: 'linear-gradient(135deg, #E85B30 0%, #8DC63F 100%)'
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
  }
}

export const getProductConfig = (productKey) => {
  return products[productKey] || products['ta-tum']
}
