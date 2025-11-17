export interface Company {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  industry?: string;
  location?: string;
  description?: string;
  logoUrl?: string;
  uid?: string;
}

export interface AuthContextType {
  company: Company | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  industry?: string;
  location?: string;
  description?: string;
  logoUrl?: string;
}
