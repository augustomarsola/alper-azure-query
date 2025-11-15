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
}

export interface WorkItemQueryResult {
  workItems: WorkItem[];
}

export interface ChartData {
  name: string;
  value: number;
  count?: number;
}
