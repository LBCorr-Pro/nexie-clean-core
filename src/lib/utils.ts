import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ModuleDefinition, InstanceModuleDefinition } from "@/contexts/instance-acting-context";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // separate accent from letter
    .replace(/[\u0300-\u036f]/g, '') // remove all separated accents
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w-]+/g, '') // remove all non-word chars
    .replace(/--+/g, '-'); // replace multiple - with single -
}

export function generateUniqueId() {
  const timestamp = new Date().getTime();
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `id_${timestamp}_${randomPart}`;
}

export function isValidCPF(cpf: any): boolean {
  var Soma = 0;
  var Resto;

  var strCPF = String(cpf).replace(/[^\d]/g, '');
  
  if (strCPF.length !== 11)
     return false;
  
  if ([
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
    ].indexOf(strCPF) !== -1)
    return false;

  for (let i=1; i<=9; i++)
    Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (11 - i);

  Resto = (Soma * 10) % 11;

  if ((Resto == 10) || (Resto == 11)) 
    Resto = 0;

  if (Resto != parseInt(strCPF.substring(9, 10)) )
    return false;

  Soma = 0;

  for (let i = 1; i <= 10; i++)
    Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (12 - i);

  Resto = (Soma * 10) % 11;

  if ((Resto == 10) || (Resto == 11)) 
    Resto = 0;

  if (Resto != parseInt(strCPF.substring(10, 11) ) )
    return false;

  return true;
}

export function formatCPF(cpf: string): string {
  if (!cpf) return "";
  const cleaned = cpf.replace(/\D/g, ''); 
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
  if (!match) return cleaned;

  let formatted = "";
  if (match[1]) {
    formatted += match[1];
  }
  if (match[2]) {
    formatted += "." + match[2];
  }
  if (match[3]) {
    formatted += "." + match[3];
  }
  if (match[4]) {
    formatted += "-" + match[4];
  }
  return formatted;
}

export function isValidCnpj(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos

    // O CNPJ deve ter 14 dígitos
    if (cnpj.length != 14 || /^(\d)\1{13}$/.test(cnpj)) {
        return false;
    }

    // Calcula o primeiro dígito verificador
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7; // Posição inicial do peso para o cálculo

    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) {
            pos = 9;
        }
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != parseInt(digitos.charAt(0))) {
        return false;
    }

    // Calcula o segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) {
            pos = 9;
        }
    }

    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != parseInt(digitos.charAt(1))) {
        return false;
    }

    return true;
}

export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return "";
  const cleaned = cnpj.replace(/\D/g, ''); 
  const match = cleaned.match(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})$/);
  if (!match) return cleaned;

  let formatted = "";
  if (match[1]) formatted += match[1];
  if (match[2]) formatted += "." + match[2];
  if (match[3]) formatted += "." + match[3];
  if (match[4]) formatted += "/" + match[4];
  if (match[5]) formatted += "-" + match[5];
  
  return formatted;
}

export const kebabToPascalCase = (kebab?: string): string => {
  if (typeof kebab !== 'string' || kebab.trim() === "") return ''; 
  return kebab
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
};

export function areModuleDefinitionObjectsEqual(obj1: ModuleDefinition, obj2: ModuleDefinition): boolean {
  if (!obj1 && !obj2) return true;
  if (!obj1 || !obj2) return false;
  return (
    obj1.docId === obj2.docId &&
    obj1.id === obj2.id &&
    obj1.name === obj2.name &&
    (obj1.status === true) === (obj2.status === true) && // Normalize boolean
    (obj1.icon || "") === (obj2.icon || "") &&
    (obj1.description || "") === (obj2.description || "") &&
    (obj1.parentId || "") === (obj2.parentId || "") &&
    (obj1.useSameColor === true) === (obj2.useSameColor === true) && // Normalize boolean
    (obj1.unifiedColor || "") === (obj2.unifiedColor || "") &&
    (obj1.iconColor || "") === (obj2.iconColor || "") &&
    (obj1.textColor || "") === (obj2.textColor || "") &&
    (obj1.color || "") === (obj2.color || "") &&
    (obj1.wasCreatedInImportMode === true) === (obj2.wasCreatedInImportMode === true) && // Normalize boolean
    (obj1.imported === true) === (obj2.imported === true) // Normalize boolean
  );
}

export function areInstanceModuleDefinitionObjectsEqual(obj1: InstanceModuleDefinition, obj2: InstanceModuleDefinition): boolean {
  if (!obj1 && !obj2) return true;
  if (!obj1 || !obj2) return false;
  return (
    obj1.moduleId === obj2.moduleId &&
    (obj1.status === true) === (obj2.status === true) && // Normalize boolean
    (obj1.customizedSettings === true) === (obj2.customizedSettings === true) && // Normalize boolean
    (obj1.globalModuleDocId || "") === (obj2.globalModuleDocId || "")
  );
}

export function areMapsEqual<K, V>(
  map1: Map<K, V>,
  map2: Map<K, V>,
  valueComparator?: (a: V, b: V) => boolean
): boolean {
  if (map1.size !== map2.size) return false;
  for (const [key, val1] of map1) {
    if (!map2.has(key)) return false;
    const val2 = map2.get(key) as V;
    if (valueComparator) {
      if (!valueComparator(val1, val2)) return false;
    } else {
      if (val1 !== val2) return false;
    }
  }
  return true;
}

export interface LoginPageConfigForCompare {
  loginPageActive?: boolean;
  fallbackPageUrl?: string;
  devModeActive?: boolean;
}
export function areLoginConfigsEqual(config1: LoginPageConfigForCompare | null, config2: LoginPageConfigForCompare | null): boolean {
    if (config1 === config2) return true; // Same reference or both null
    if (!config1 || !config2) return false; // One is null, other is not

    return (
        (config1.loginPageActive === true) === (config2.loginPageActive === true) &&
        (config1.fallbackPageUrl || "") === (config2.fallbackPageUrl || "") &&
        (config1.devModeActive === true) === (config2.devModeActive === true)
    );
}

export function getInitials(name?: string): string {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
