import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formata o valor inserido com a máscara de CPF
export const formatarCPF = (valor: string) => {
  if (!valor) return '';
  return valor
    .replace(/\D/g, '') // Remove tudo o que não for número
    .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona o primeiro ponto
    .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona o segundo ponto
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Adiciona o traço
    .replace(/(-\d{2})\d+?$/, '$1'); // Impede que o usuário digite mais de 11 números
};

// Remove a máscara e devolve apenas os números para enviar para o banco
export const limparNumeros = (valor: string) => {
  if (!valor) return '';
  return valor.replace(/\D/g, '');
};