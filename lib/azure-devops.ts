import { AzureDevOpsConfig, Project, WorkItem } from "./types";

const API_VERSION = "7.0";

export class AzureDevOpsClient {
  private baseUrl: string;
  private headers: HeadersInit;
  private organization: string;

  constructor(config: AzureDevOpsConfig) {
    this.organization = config.organization;
    this.baseUrl = `https://dev.azure.com/${config.organization}`;

    // Create Basic Auth header with PAT
    const auth = Buffer.from(`:${config.pat}`).toString("base64");
    this.headers = {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Get all projects in the organization
   */
  async getProjects(): Promise<Project[]> {
    try {
      const url = `${this.baseUrl}/_apis/projects?api-version=${API_VERSION}`;
      const response = await fetch(url, {
        headers: this.headers,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  }

  /**
   * Get all work items for a project
   */
  async getWorkItemsByProject(project: string): Promise<WorkItem[]> {
    try {
      const wiql = {
        query: `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType], [System.AssignedTo], [System.CreatedDate], [System.ChangedDate] 
                FROM WorkItems 
                WHERE [System.TeamProject] = '${project}'
                ORDER BY [System.ChangedDate] DESC`,
      };

      const wiqlUrl = `${this.baseUrl}/${project}/_apis/wit/wiql?api-version=${API_VERSION}`;
      const wiqlResponse = await fetch(wiqlUrl, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(wiql),
        cache: "no-store",
      });

      if (!wiqlResponse.ok) {
        throw new Error(
          `Failed to query work items: ${wiqlResponse.statusText}`
        );
      }

      const wiqlResult = await wiqlResponse.json();

      if (!wiqlResult.workItems || wiqlResult.workItems.length === 0) {
        return [];
      }

      // Get work item IDs (limit to 200 for performance)
      const ids = wiqlResult.workItems
        .slice(0, 200)
        .map((wi: { id: number }) => wi.id)
        .join(",");

      // Fetch full work item details
      const workItemsUrl = `${this.baseUrl}/_apis/wit/workitems?ids=${ids}&api-version=${API_VERSION}`;
      const workItemsResponse = await fetch(workItemsUrl, {
        headers: this.headers,
        cache: "no-store",
      });

      if (!workItemsResponse.ok) {
        throw new Error(
          `Failed to fetch work items: ${workItemsResponse.statusText}`
        );
      }

      const workItemsData = await workItemsResponse.json();
      return workItemsData.value || [];
    } catch (error) {
      console.error("Error fetching work items:", error);
      throw error;
    }
  }
}

export function createAzureClient(
  config: AzureDevOpsConfig
): AzureDevOpsClient {
  return new AzureDevOpsClient(config);
}
