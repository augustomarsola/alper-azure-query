export interface AzureDevOpsConfig {
  organization: string;
  project: string;
  pat: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
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
