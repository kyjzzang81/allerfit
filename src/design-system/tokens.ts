export const colors = {
  primary: '#9fe870',
  primaryActive: '#cdffad',
  primaryNeutral: '#c5edab',
  primaryPale: '#e2f6d5',
  canvas: '#ffffff',
  canvasSoft: '#e8ebe6',
  ink: '#0e0f0c',
  inkDeep: '#163300',
  body: '#454745',
  mute: '#868685',
  positive: '#2ead4b',
  positiveDeep: '#054d28',
  warning: '#ffd11a',
  warningDeep: '#b86700',
  warningContent: '#4a3b1c',
  negative: '#d03238',
  negativeDeep: '#a72027',
  negativeDarkest: '#a7000d',
  negativeBg: '#320707',
} as const;

export const gradients = {
  appBackground:
    'radial-gradient(circle at 18% 0%, rgb(159 232 112 / 42%) 0%, transparent 34%), radial-gradient(circle at 96% 12%, rgb(255 219 230 / 70%) 0%, transparent 28%), linear-gradient(180deg, #f8faf5 0%, #e8ebe6 42%, #f4f1f3 100%)',
  appBackgroundOverlay:
    'radial-gradient(circle at 78% 36%, rgb(159 232 112 / 22%) 0%, transparent 26%), radial-gradient(circle at 14% 72%, rgb(255 244 249 / 86%) 0%, transparent 30%)',
} as const;

export const spacing = {
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
} as const;

export const rounded = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  pill: '9999px',
  full: '9999px',
} as const;
