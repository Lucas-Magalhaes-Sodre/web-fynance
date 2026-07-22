import type { AppLanguage, TranslationKey } from './translations';
import { i18n } from './index';

const categoryKeys: Record<string, TranslationKey> = {
  economias: 'savings',
  salario: 'catSalary',
  freelance: 'catFreelance',
  rendimentos: 'catYield',
  'renda extra': 'catExtraIncome',
  'cashback/reembolso': 'catCashback',
  vendas: 'catSales',
  beneficios: 'catBenefits',
  outros: 'catOthers',
  moradia: 'catHousing',
  alimentacao: 'catFood',
  transporte: 'catTransport',
  'cartao de credito': 'catCreditCards',
  'cartoes de credito': 'catCreditCards',
  saude: 'catHealth',
  educacao: 'catEducation',
  assinaturas: 'catSubscriptions',
  lazer: 'catLeisure',
  impostos: 'catTaxes',
  compras: 'catShopping',
  poupanca: 'catPiggyBank',
  caixinha: 'catBox',
  cofrinho: 'catCoinBox',
  'renda fixa': 'catFixedIncome'
};

export const monthsByLanguage: Record<AppLanguage, string[]> = {
  'pt-BR': ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  en: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function translateCategoryName(name: string, language: AppLanguage) {
  const key = categoryKeys[normalize(name)];
  return key ? i18n.t(key, { lng: language }) : name;
}

export function typeLabel(type: 'INCOME' | 'EXPENSE' | string, language: AppLanguage) {
  if (type === 'INCOME') return i18n.t('income', { lng: language });
  if (type === 'EXPENSE') return i18n.t('expense', { lng: language });
  return type;
}
