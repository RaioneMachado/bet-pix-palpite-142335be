/**
 * Cliente Asaas (server-only).
 * Documentação: https://docs.asaas.com/
 */

const ENV = process.env.ASAAS_ENV?.toLowerCase() === "production" ? "production" : "sandbox";

const BASE_URL =
  ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurado");
  return key;
}

async function asaasFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: getApiKey(),
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* not json */
  }
  if (!res.ok) {
    console.error("[Asaas] erro", res.status, text);
    throw new Error(
      `Asaas ${res.status}: ${json?.errors?.[0]?.description ?? text ?? "erro desconhecido"}`,
    );
  }
  return json as T;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj?: string;
  mobilePhone?: string;
}

export interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
}

export interface AsaasPixQr {
  encodedImage: string; // base64 PNG (sem prefixo data:)
  payload: string;     // copia-e-cola
  expirationDate: string;
}

/** Cria ou recupera customer simples (Asaas exige CPF/CNPJ; usamos placeholder padrão para identificar via name+phone). */
export async function createCustomer(params: {
  name: string;
  whatsapp: string;
}): Promise<AsaasCustomer> {
  const phone = params.whatsapp.replace(/\D/g, "");
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      mobilePhone: phone,
      // Asaas exige cpfCnpj — apostadores não fornecem, então usamos um identificador genérico.
      // Em produção, recomenda-se coletar CPF; aqui o gerente do bolão validará via WhatsApp.
      cpfCnpj: "24971563792", // CPF placeholder válido para sandbox; substituir em prod se obrigatório
      notificationDisabled: true,
    }),
  });
}

export async function createPixCharge(params: {
  customerId: string;
  value: number;
  description: string;
  externalReference: string;
  dueDateISO: string; // YYYY-MM-DD
}): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "PIX",
      value: params.value,
      dueDate: params.dueDateISO,
      description: params.description,
      externalReference: params.externalReference,
    }),
  });
}

export async function getPixQrCode(paymentId: string): Promise<AsaasPixQr> {
  return asaasFetch<AsaasPixQr>(`/payments/${paymentId}/pixQrCode`);
}

export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${paymentId}`);
}

export const ASAAS_ENV_NAME = ENV;
