export type AssetType = 'Residential' | 'Commercial' | 'Industrial' | 'Land' | 'Mixed Use' | 'Vehicle' | 'Equipment' | 'Other';
export type Status = 'Owned' | 'Mortgaged' | 'Tenanted' | 'Vacant' | 'Under Renovation' | 'Listed for Sale' | 'Disposed' | 'Active' | 'In Maintenance';
export type ConditionRating = 'Good' | 'Fair' | 'Poor' | 'Critical';

export interface ConditionEntry {
  id: string;
  date: string;
  rating: ConditionRating;
  note: string;
}

export interface Unit {
  id: string;
  name: string;
  status: Status;
  tenantName?: string;
  monthlyRent?: string;
}

export interface Equipment {
  id: string;
  name: string;
  condition: ConditionRating;
  installDate: string;
  lastServiceDate: string;
  nextServiceDue: string;
}

export interface Document {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  blobUrl: string;
}

export interface CostEvent {
  id: string;
  date: string;
  category: 'Property Tax' | 'Maintenance and Repair' | 'Renovation' | 'Insurance Premium' | 'Other';
  description: string;
  amount: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  street: string;
  parish: string;
  country: string;
  registryNumber: string;
  lotSize: string;
  lotSizeUnit: 'sq ft' | 'sq m';
  buildYear: string;
  externalRefId: string;
  comments: string;
  status: Status;
  ownerName: string;
  acquisitionDate: string;
  purchasePrice: string;
  hasMortgage: boolean;
  mortgage?: {
    lender: string;
    balance: string;
    monthlyPayment: string;
  };
  hasRental: boolean;
  rental?: {
    monthlyIncome: string;
    tenantName: string;
    leaseStart?: string;
    leaseEnd?: string;
  };
  photoUrl?: string;
  conditionLog: ConditionEntry[];
  units: Unit[];
  equipment: Equipment[];
  documents: Document[];
  costEvents: CostEvent[];
}
