export type BedUnitStatus = "AVAILABLE" | "OCCUPIED" | "NOTICE" | string;
export type TenancyContractStatus = "ACTIVE" | "NOTICE" | "ENDED" | string;
export type PaymentStatus = "PENDING" | "HALF_PAID" | "PAID" | "OVERDUE" | string;

export interface BedUnitDto {
  id: number;
  status: BedUnitStatus;
  roomId: number;
}

export interface RoomDto {
  id: number;
  name: string;
  propertyId: number;
  bedUnits: BedUnitDto[];
}

export interface PropertyDto {
  id: number;
  name: string;
  rooms: RoomDto[];
}

export interface InventoryMapDto {
  properties: PropertyDto[];
}

export interface RoomManagementDto {
  id: number;
  name: string;
  propertyId: number;
  propertyName: string;
  bedCount: number;
}

export interface BedUnitManagementDto {
  id: number;
  status: BedUnitStatus;
  roomId: number;
  roomName: string;
  propertyId: number;
  propertyName: string;
}

export interface PaymentDto {
  id: number;
  tenancyContractId: number | null;
  tenantName: string | null;
  paymentDate: string;
  dueDate: string;
  amountPaid: number;
  amountPending: number;
  status: PaymentStatus;
  propertyId: number | null;
  propertyName: string | null;
  roomId: number | null;
  roomName: string | null;
  bedUnitId: number | null;
  contractStatus: string | null;
  createdByUserId: number;
  createdByUsername: string;
  createdAt: string;
}

export interface TenancyContractDto {
  id: number;
  tenantName: string;
  tenantGovernmentId: string;
  tenantPhoneNumber: string;
  propertyId: number;
  propertyName: string;
  roomId: number;
  roomName: string;
  bedUnitId: number;
  bedStatus: BedUnitStatus;
  rentAmount: number;
  startDate: string;
  endDate: string;
  status: TenancyContractStatus;
  endedImmediately: boolean;
  actualEndDate: string | null;
  createdAt: string;
}

export interface PropertyRequest {
  name: string;
}

export interface RoomRequest {
  name: string;
  propertyId: number;
}

export interface BedUnitRequest {
  status: BedUnitStatus;
  roomId: number;
}

export interface PaymentRequest {
  paymentDate: string;
  dueDate: string;
  amountPaid: number;
  amountPending: number;
  status?: PaymentStatus;
  tenancyContractId: number;
}

export interface TenancyContractRequest {
  tenantName: string;
  tenantGovernmentId: string;
  tenantPhoneNumber: string;
  propertyId: number;
  roomId: number;
  bedUnitId: number;
  rentAmount: number;
  startDate: string;
  endDate: string;
}

export interface CurrentUser {
  username: string;
  email: string;
  role: string;
  name?: string;
}

interface CsrfPayload {
  token: string;
  headerName: string;
  parameterName: string;
}

export const INVENTORY_CHANGED_EVENT = "inventory:changed";

// Module-level username — set once after /auth/me resolves in AppLayout.
let agentUsername = "";
let cachedCsrfToken: string | null = null;

export function setAgentUsername(username: string) {
  agentUsername = username;
}

export function getAgentUsername(): string {
  return agentUsername;
}

let csrfBootstrapPromise: Promise<string | null> | null = null;

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("XSRF-TOKEN="));
  const token = match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
  if (token) {
    cachedCsrfToken = token;
  }
  return token;
}

function buildHeaders(includeBody = false): HeadersInit {
  const headers: HeadersInit = {};

  if (agentUsername.trim()) {
    headers["X-Agent-Username"] = agentUsername.trim();
  }

  if (includeBody) {
    headers["Content-Type"] = "application/json";
  }

  const csrfToken = getCsrfToken() ?? cachedCsrfToken;
  if (csrfToken) {
    headers["X-XSRF-TOKEN"] = csrfToken;
  }

  return headers;
}

async function ensureCsrfToken(): Promise<string | null> {
  const existingToken = getCsrfToken() ?? cachedCsrfToken;
  if (existingToken) {
    return existingToken;
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = fetch("/auth/csrf", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          return null;
        }
        const payload = (await res.json()) as CsrfPayload;
        cachedCsrfToken = getCsrfToken() ?? payload.token ?? null;
        return cachedCsrfToken;
      })
      .finally(() => {
        csrfBootstrapPromise = null;
      });
  }

  return csrfBootstrapPromise;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data.title === "string") {
        message = data.title;
      } else if (typeof data.detail === "string") {
        message = data.detail;
      } else if (typeof data.message === "string") {
        message = data.message;
      } else if (typeof data.error === "string") {
        message = data.error;
      }
    } catch {
      // ignore JSON parse errors, fall back to generic message
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

async function request<T>(input: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = await ensureCsrfToken();
    const headers = new Headers(init.headers ?? {});
    if (csrfToken && !headers.has("X-XSRF-TOKEN")) {
      headers.set("X-XSRF-TOKEN", csrfToken);
    }
    init = { ...init, headers };
  }

  const res = await fetch(input, {
    credentials: "include",
    ...init,
  });
  return handleResponse<T>(res);
}

async function requestVoid(input: string, init: RequestInit = {}): Promise<void> {
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = await ensureCsrfToken();
    const headers = new Headers(init.headers ?? {});
    if (csrfToken && !headers.has("X-XSRF-TOKEN")) {
      headers.set("X-XSRF-TOKEN", csrfToken);
    }
    init = { ...init, headers };
  }

  const res = await fetch(input, {
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    await handleResponse<never>(res);
  }
}

function notifyInventoryChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INVENTORY_CHANGED_EVENT));
  }
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/me", {
    method: "GET",
  });
}

export async function primeCsrfToken(): Promise<void> {
  await ensureCsrfToken();
}

export async function logoutUser(): Promise<void> {
  await requestVoid("/auth/logout", {
    method: "POST",
    headers: buildHeaders(),
  });
}

export async function getInventoryMap(): Promise<InventoryMapDto> {
  return request<InventoryMapDto>("/api/inventory/map", {
    method: "GET",
    headers: buildHeaders(),
  });
}

export async function listProperties(): Promise<PropertyDto[]> {
  return request<PropertyDto[]>("/api/properties", {
    method: "GET",
    headers: buildHeaders(),
  });
}

export async function createProperty(payload: PropertyRequest): Promise<PropertyDto> {
  const property = await request<PropertyDto>("/api/properties", {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  notifyInventoryChanged();
  return property;
}

export async function updateProperty(id: number, payload: PropertyRequest): Promise<PropertyDto> {
  const property = await request<PropertyDto>(`/api/properties/${id}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  notifyInventoryChanged();
  return property;
}

export async function deleteProperty(id: number): Promise<void> {
  await requestVoid(`/api/properties/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  notifyInventoryChanged();
}

export async function listRooms(): Promise<RoomManagementDto[]> {
  return request<RoomManagementDto[]>("/api/rooms", {
    method: "GET",
    headers: buildHeaders(),
  });
}

export async function createRoom(payload: RoomRequest): Promise<RoomManagementDto> {
  const room = await request<RoomManagementDto>("/api/rooms", {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  notifyInventoryChanged();
  return room;
}

export async function updateRoom(id: number, payload: RoomRequest): Promise<RoomManagementDto> {
  const room = await request<RoomManagementDto>(`/api/rooms/${id}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  notifyInventoryChanged();
  return room;
}

export async function deleteRoom(id: number): Promise<void> {
  await requestVoid(`/api/rooms/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  notifyInventoryChanged();
}

export async function listBeds(): Promise<BedUnitManagementDto[]> {
  return request<BedUnitManagementDto[]>("/api/beds", {
    method: "GET",
    headers: buildHeaders(),
  });
}

export async function createBed(payload: BedUnitRequest): Promise<BedUnitManagementDto> {
  const bed = await request<BedUnitManagementDto>("/api/beds", {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  notifyInventoryChanged();
  return bed;
}

export async function updateBed(id: number, payload: BedUnitRequest): Promise<BedUnitManagementDto> {
  const bed = await request<BedUnitManagementDto>(`/api/beds/${id}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  notifyInventoryChanged();
  return bed;
}

export async function deleteBed(id: number): Promise<void> {
  await requestVoid(`/api/beds/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  notifyInventoryChanged();
}

export async function listPayments(): Promise<PaymentDto[]> {
  return request<PaymentDto[]>("/api/payments", {
    method: "GET",
    headers: buildHeaders(),
  });
}

export async function listContracts(): Promise<TenancyContractDto[]> {
  return request<TenancyContractDto[]>("/api/contracts", {
    method: "GET",
    headers: buildHeaders(),
  });
}

export async function createContract(payload: TenancyContractRequest): Promise<TenancyContractDto> {
  return request<TenancyContractDto>("/api/contracts", {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
}

export async function updateContract(id: number, payload: TenancyContractRequest): Promise<TenancyContractDto> {
  return request<TenancyContractDto>(`/api/contracts/${id}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
}

export async function endContract(id: number, immediateEnd: boolean): Promise<TenancyContractDto> {
  return request<TenancyContractDto>(`/api/contracts/${id}/end`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({ immediateEnd }),
  });
}

export async function deleteContract(id: number): Promise<void> {
  return requestVoid(`/api/contracts/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
}

export async function createPayment(payload: PaymentRequest): Promise<PaymentDto> {
  return request<PaymentDto>("/api/payments", {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
}

export async function updatePayment(id: number, payload: PaymentRequest): Promise<PaymentDto> {
  return request<PaymentDto>(`/api/payments/${id}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
}

export async function deletePayment(id: number): Promise<void> {
  return requestVoid(`/api/payments/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
}

export async function logPayment(payload: {
  date: string;
  dueDate: string;
  amountPaid: number;
  amountPending: number;
  tenancyContractId: number;
}): Promise<PaymentDto> {
  return request<PaymentDto>("/api/payments/log", {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
}
