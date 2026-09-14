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

/** Parse '#RGB', '#RRGGBB' or 'rgb(r, g, b)' into [r, g, b]. */
function parseColor(color) {
  const rgb = color.match(/rgba?\(([^)]+)\)/)
  if (rgb) {
    const [r, g, b] = rgb[1].split(',').map((n) => parseFloat(n))
    return [r, g, b]
  }

  let hex = color.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  if (hex.length !== 6) return null

  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
}

/** WCAG relative luminance. */
function luminance([r, g, b]) {
  const [rl, gl, bl] = [r, g, b]
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/**
 * Text colour that stays readable on a product's primary colour.
 *
 * The palette runs from bright yellow (#FFEA00) to dark slate, so white text is
 * not safe everywhere: on GoSteam it measures 1.2:1 against WCAG's 4.5:1
 * minimum, which made the headline revenue figure almost invisible. Deriving
 * the colour means a new product is readable without anyone remembering to
 * pick a text colour for it.
 */
export const getOnPrimaryColor = (productKey) => {
  const parsed = parseColor(getProductConfig(productKey).colors.primary)
  if (!parsed) return '#ffffff'

  // Contrast against white vs. against the dark ink used elsewhere in the UI.
  const bg = luminance(parsed)
  const contrastWhite = 1.05 / (bg + 0.05)
  const contrastDark = (bg + 0.05) / (luminance([30, 41, 59]) + 0.05)

  return contrastDark > contrastWhite ? '#1e293b' : '#ffffff'
}
