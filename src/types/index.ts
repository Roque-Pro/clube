export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  vehicle: string;
  plate: string;
  planStart: string;
  planEnd: string;
  replacementsUsed: number;
  maxReplacements: number;
  active: boolean;
}

export interface Replacement {
  id: string;
  clientId: string;
  clientName: string;
  item: string;
  date: string;
  employeeId: string;
  employeeName: string;
  notes: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  hireDate: string;
  active: boolean;
  sales_count?: number;
  attendance_count?: number;
  installations_count?: number;
}

export interface Service {
  id: string;
  client_id: string;
  client_name: string;
  vehicle: string;
  plate: string;
  service_type: string;
  description: string;
  value: number;
  employee_id: string;
  employee_name: string;
  installations: number;
  service_date: string;
  created_at: string;
}
