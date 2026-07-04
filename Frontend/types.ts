export interface Competitor {
  name: string;
  website: string;
}

export interface ReportData {
  companyName: string;
  website: string;
  phone: string;
  address: string;
  summary: string;
  products: string[];
  painPoints: string[];
  competitors: Competitor[];
}
