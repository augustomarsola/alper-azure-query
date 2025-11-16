export interface AzureDevOpsConfig {
  organization: string;
  pat: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  state?: string;
  visibility?: string;
}

export interface WorkItem {
  id: number;
  fields: {
    "System.Title": string;
    "System.WorkItemType": string;
    "System.State": string;
    "System.AssignedTo"?: {
      displayName: string;
      uniqueName: string;
    };
    "System.CreatedDate": string;
    "System.ChangedDate": string;
    "System.AreaPath"?: string;
    "System.IterationPath"?: string;
    "Microsoft.VSTS.Common.Priority"?: number;
    [key: string]: unknown;
  };
  relations?: Array<{
    rel: string;
    url: string;
    attributes?: {
      name?: string;
    };
  }>;
}

export interface WorkItemQueryResult {
  workItems: WorkItem[];
}

export interface ChartData {
  name: string;
  value: number;
  count?: number;
}

export interface PBIWithRework {
  id: number;
  title: string;
  createdDate: string;
  state: string;
  assignedTo?: string;
  bugCount: number;
}

export interface ReturnRateData {
  semester: string;
  totalPBIs: number;
  pbisWithRework: number;
  percentage: number;
  status: "Tranquilo" | "Atenção" | "Perigo";
  statusColor: "green" | "yellow" | "red";
}
