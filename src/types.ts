// ORO Commerce API Types based on existing Adomio integration

export interface OroConfig {
  shopUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface OroTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface OroCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  addresses?: OroCustomerAddress[];
  billingAddress?: OroCustomerAddress;
  account?: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface OroCustomerAddress {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  phone?: string;
  country: {
    id: string;
    name: string;
    iso3Code: string;
  };
  region?: {
    id: string;
    code: string;
    name: string;
  };
  types: Array<{
    addressType: 'billing' | 'shipping';
    default: boolean;
  }>;
}

export interface OroOrderLineItem {
  id: string;
  productSku: string;
  productName: string;
  quantity: number;
  productUnitCode: string;
  value: number;
  currency: string;
  priceType: string;
  comment?: string;
}

export interface OroOrder {
  id: string;
  poNumber?: string;
  currency: string;
  subtotalWithDiscounts?: number;
  subtotalValue: number;
  totalValue: number;
  shippingMethod?: string;
  createdAt: string;
  updatedAt: string;
  
  customer?: OroCustomer;
  customerUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  billingAddress?: OroOrderAddress;
  lineItems: OroOrderLineItem[];
  discounts?: OroOrderDiscount[];
  
  internalStatus: {
    id: string;
    name: string;
  };
  
  organization?: {
    id: string;
    name: string;
  };
  
  rfo?: any; // Designer data
}

export interface OroOrderAddress {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  street2?: string;
  city: string;
  postalCode: string;
  phone?: string;
  country: {
    id: string;
    name: string;
    iso3Code: string;
  };
  region?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface OroOrderDiscount {
  id: string;
  description: string;
  amount: number;
  percent?: number;
  type: string;
}

export interface OroApiResponse<T> {
  data: T[];
  meta?: {
    totalCount: number;
    page: number;
    pageSize: number;
  };
}

export interface OroApiSingleResponse<T> {
  data: T;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  details: Array<{
    id: string;
    status: 'success' | 'failed';
    message?: string;
  }>;
}

export interface CustomerImportOptions {
  includeAddresses?: boolean;
  customerGroup?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface OrderImportOptions {
  status?: string[];
  fromDate?: string;
  toDate?: string;
  includeCustomers?: boolean;
  limit?: number;
}

// Dynamic types for swagger-generated endpoints
export interface SwaggerEndpoint {
  path: string;
  method: string;
  operationId: string;
  summary: string;
  description: string;
  parameters: SwaggerParameter[];
  tags: string[];
  requestBody?: SwaggerRequestBody;
  responses: Record<string, SwaggerResponse>;
}

export interface SwaggerParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required: boolean;
  schema: any;
  example?: any;
}

export interface SwaggerRequestBody {
  description?: string;
  required: boolean;
  content: Record<string, any>;
}

export interface SwaggerResponse {
  description: string;
  content?: Record<string, any>;
}

export interface DynamicApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  endpoint: {
    path: string;
    method: string;
    operationId: string;
  };
}

export interface ParsedMCPTool {
  toolName: string;
  description: string;
  inputSchema: any;
  endpoint: SwaggerEndpoint;
}