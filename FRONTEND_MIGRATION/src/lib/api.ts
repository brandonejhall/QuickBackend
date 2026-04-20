import axios from 'axios';
import { Asset, ConditionEntry, Unit, Equipment, Document, CostEvent } from '../types';

// ---------------------------------------------------------------------------
// Axios instance — all requests go through the Vite proxy to :8000
// ---------------------------------------------------------------------------

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('brims_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('brims_token');
      localStorage.removeItem('brims_role');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---------------------------------------------------------------------------
// Field mapping helpers (API snake_case → frontend camelCase)
// ---------------------------------------------------------------------------

export function mapAsset(d: any): Asset {
  return {
    id: String(d.id),
    name: d.name,
    type: d.type,
    street: d.street,
    parish: d.parish,
    country: d.country,
    registryNumber: d.registry_number || '',
    lotSize: d.lot_size || '',
    lotSizeUnit: d.lot_size_unit || 'sq ft',
    buildYear: d.build_year || '',
    externalRefId: d.external_ref_id || '',
    comments: d.comments || '',
    status: d.status,
    ownerName: d.owner_name || '',
    acquisitionDate: d.acquisition_date || '',
    purchasePrice: d.purchase_price || '',
    hasMortgage: d.has_mortgage,
    mortgage: d.mortgage
      ? {
          lender: d.mortgage.lender,
          balance: d.mortgage.balance,
          monthlyPayment: d.mortgage.monthly_payment,
        }
      : undefined,
    hasRental: d.has_rental,
    rental: d.rental
      ? {
          monthlyIncome: d.rental.monthly_income,
          tenantName: d.rental.tenant_name,
          leaseStart: d.rental.lease_start || '',
          leaseEnd: d.rental.lease_end || '',
        }
      : undefined,
    photoUrl: d.photo_url || '',
    conditionLog: (d.condition_log || []).map(mapConditionEntry),
    units: (d.units || []).map(mapUnit),
    equipment: (d.equipment || []).map(mapEquipment),
    documents: (d.documents || []).map(mapDocument),
    costEvents: (d.cost_events || []).map(mapCostEvent),
  };
}

export function mapConditionEntry(d: any): ConditionEntry {
  return { id: String(d.id), date: d.date, rating: d.rating, note: d.note || '' };
}

export function mapUnit(d: any): Unit {
  return {
    id: String(d.id),
    name: d.name,
    status: d.status,
    tenantName: d.tenant_name || '',
    monthlyRent: d.monthly_rent || '',
  };
}

export function mapEquipment(d: any): Equipment {
  return {
    id: String(d.id),
    name: d.name,
    condition: d.condition,
    installDate: d.install_date || '',
    lastServiceDate: d.last_service_date || '',
    nextServiceDue: d.next_service_due || '',
  };
}

export function mapDocument(d: any): Document {
  return {
    id: String(d.id),
    name: d.name,
    size: d.size || '',
    uploadDate: d.uploaded_at ? d.uploaded_at.split('T')[0] : '',
    blobUrl: d.blob_url || '',
  };
}

export function mapCostEvent(d: any): CostEvent {
  return {
    id: String(d.id),
    date: d.date,
    category: d.category,
    description: d.description || '',
    amount: Number(d.amount),
  };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const auth = {
  login: async (email: string, password: string) => {
    const res = await client.post('/auth/login', { email, password });
    return res.data as { access_token: string; token_type: string; role: string };
  },
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const users = {
  me: async () => {
    const res = await client.get('/users/me');
    return res.data as { id: number; email: string; fullname: string; role: string };
  },
};

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export const assets = {
  list: async (): Promise<Asset[]> => {
    const res = await client.get('/assets/');
    return res.data.map(mapAsset);
  },

  get: async (id: string): Promise<Asset> => {
    const res = await client.get(`/assets/${id}`);
    return mapAsset(res.data);
  },

  create: async (data: Partial<Asset>): Promise<Asset> => {
    const body = buildAssetBody(data);
    const res = await client.post('/assets/', body);
    return mapAsset(res.data);
  },

  update: async (id: string, data: Partial<Asset>): Promise<Asset> => {
    const body = buildAssetBody(data);
    const res = await client.patch(`/assets/${id}`, body);
    return mapAsset(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/assets/${id}`);
  },

  uploadPhoto: async (id: string, file: File): Promise<Asset> => {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post(`/assets/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapAsset(res.data);
  },

  // Condition log
  addConditionEntry: async (id: string, data: { date: string; rating: string; note: string }): Promise<ConditionEntry> => {
    const res = await client.post(`/assets/${id}/condition-log`, data);
    return mapConditionEntry(res.data);
  },
  deleteConditionEntry: async (id: string, entryId: string): Promise<void> => {
    await client.delete(`/assets/${id}/condition-log/${entryId}`);
  },

  // Units
  addUnit: async (id: string, data: Partial<Unit>): Promise<Unit> => {
    const body = { name: data.name, status: data.status, tenant_name: data.tenantName, monthly_rent: data.monthlyRent };
    const res = await client.post(`/assets/${id}/units`, body);
    return mapUnit(res.data);
  },
  updateUnit: async (id: string, unitId: string, data: Partial<Unit>): Promise<Unit> => {
    const body: any = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.status !== undefined) body.status = data.status;
    if (data.tenantName !== undefined) body.tenant_name = data.tenantName;
    if (data.monthlyRent !== undefined) body.monthly_rent = data.monthlyRent;
    const res = await client.patch(`/assets/${id}/units/${unitId}`, body);
    return mapUnit(res.data);
  },
  deleteUnit: async (id: string, unitId: string): Promise<void> => {
    await client.delete(`/assets/${id}/units/${unitId}`);
  },

  // Equipment
  addEquipment: async (id: string, data: Partial<Equipment>): Promise<Equipment> => {
    const body = {
      name: data.name,
      condition: data.condition,
      install_date: data.installDate || null,
      last_service_date: data.lastServiceDate || null,
      next_service_due: data.nextServiceDue || null,
    };
    const res = await client.post(`/assets/${id}/equipment`, body);
    return mapEquipment(res.data);
  },
  deleteEquipment: async (id: string, eqId: string): Promise<void> => {
    await client.delete(`/assets/${id}/equipment/${eqId}`);
  },

  // Documents
  uploadDocument: async (id: string, file: File): Promise<Document> => {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post(`/assets/${id}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapDocument(res.data);
  },
  deleteDocument: async (id: string, docId: string): Promise<void> => {
    await client.delete(`/assets/${id}/documents/${docId}`);
  },

  // Cost events
  addCostEvent: async (id: string, data: { date: string; category: string; description: string; amount: string }): Promise<CostEvent> => {
    const res = await client.post(`/assets/${id}/costs`, data);
    return mapCostEvent(res.data);
  },
  deleteCostEvent: async (id: string, costId: string): Promise<void> => {
    await client.delete(`/assets/${id}/costs/${costId}`);
  },
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const dashboard = {
  stats: async () => {
    const res = await client.get('/dashboard/stats');
    return res.data as {
      total_assets: number;
      total_portfolio_value: string;
      total_mortgage_balance: string;
      total_monthly_rental_income: string;
      assets_by_type: Record<string, number>;
      assets_by_status: Record<string, number>;
      assets_needing_attention: number;
    };
  },
};

// ---------------------------------------------------------------------------
// Cost events (global)
// ---------------------------------------------------------------------------

export const costEvents = {
  list: async (params?: { asset_id?: number; category?: string; start_date?: string; end_date?: string }) => {
    const res = await client.get('/cost-events/', { params });
    return res.data as Array<{
      id: number;
      asset_id: number;
      asset_name: string;
      date: string;
      category: string;
      description: string;
      amount: string;
      created_at: string;
    }>;
  },
};

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

export const activity = {
  list: async (params?: { limit?: number; offset?: number; event_type?: string }) => {
    const res = await client.get('/activity-feed/', { params });
    return res.data as Array<{
      id: number;
      event_type: string;
      user_email: string;
      action: string;
      target: string;
      asset_id: number | null;
      status: string;
      created_at: string;
    }>;
  },
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildAssetBody(data: Partial<Asset>) {
  const body: any = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.type !== undefined) body.type = data.type;
  if (data.street !== undefined) body.street = data.street;
  if (data.parish !== undefined) body.parish = data.parish;
  if (data.country !== undefined) body.country = data.country;
  if (data.registryNumber !== undefined) body.registry_number = data.registryNumber;
  if (data.lotSize !== undefined) body.lot_size = data.lotSize;
  if (data.lotSizeUnit !== undefined) body.lot_size_unit = data.lotSizeUnit;
  if (data.buildYear !== undefined) body.build_year = data.buildYear;
  if (data.externalRefId !== undefined) body.external_ref_id = data.externalRefId;
  if (data.comments !== undefined) body.comments = data.comments;
  if (data.status !== undefined) body.status = data.status;
  if (data.ownerName !== undefined) body.owner_name = data.ownerName;
  if (data.acquisitionDate !== undefined) body.acquisition_date = data.acquisitionDate || null;
  if (data.purchasePrice !== undefined) body.purchase_price = data.purchasePrice || null;
  if (data.hasMortgage !== undefined) body.has_mortgage = data.hasMortgage;
  if (data.mortgage !== undefined) {
    body.mortgage = data.mortgage
      ? { lender: data.mortgage.lender, balance: data.mortgage.balance, monthly_payment: data.mortgage.monthlyPayment }
      : null;
  }
  if (data.hasRental !== undefined) body.has_rental = data.hasRental;
  if (data.rental !== undefined) {
    body.rental = data.rental
      ? {
          monthly_income: data.rental.monthlyIncome,
          tenant_name: data.rental.tenantName,
          lease_start: data.rental.leaseStart || null,
          lease_end: data.rental.leaseEnd || null,
        }
      : null;
  }
  return body;
}

export default client;
