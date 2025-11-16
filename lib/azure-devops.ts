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

  /**
   * Get PBIs with rework analysis (PBIs with Bug children)
   */
  async getPBIsWithRework(project: string, year: number) {
    try {
      // Define semester date ranges
      const firstSemesterStart = `${year}-01-01`;
      const firstSemesterEnd = `${year}-06-30`;
      const secondSemesterStart = `${year}-07-01`;
      const secondSemesterEnd = `${year}-12-31`;

      // Query all PBIs for the year
      const wiql = {
        query: `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType], [System.AssignedTo], [System.CreatedDate]
                FROM WorkItems
                WHERE [System.TeamProject] = '${project}'
                AND [System.WorkItemType] = 'Product Backlog Item'
                AND [System.CreatedDate] >= '${year}-01-01'
                AND [System.CreatedDate] <= '${year}-12-31'
                ORDER BY [System.CreatedDate] ASC`,
      };

      const wiqlUrl = `${this.baseUrl}/${project}/_apis/wit/wiql?api-version=${API_VERSION}`;
      const wiqlResponse = await fetch(wiqlUrl, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(wiql),
        cache: "no-store",
      });

      if (!wiqlResponse.ok) {
        throw new Error(`Failed to query PBIs: ${wiqlResponse.statusText}`);
      }

      const wiqlResult = await wiqlResponse.json();

      if (!wiqlResult.workItems || wiqlResult.workItems.length === 0) {
        return {
          firstSemester: {
            semester: "1º Semestre",
            totalPBIs: 0,
            pbisWithRework: 0,
            percentage: 0,
            status: "Tranquilo" as const,
            statusColor: "green" as const,
          },
          secondSemester: {
            semester: "2º Semestre",
            totalPBIs: 0,
            pbisWithRework: 0,
            percentage: 0,
            status: "Tranquilo" as const,
            statusColor: "green" as const,
          },
          pbisWithRework: [],
        };
      }

      // Get PBI IDs
      const pbiIds = wiqlResult.workItems.map((wi: { id: number }) => wi.id);

      // Fetch full PBI details with relations
      const workItemsUrl = `${
        this.baseUrl
      }/_apis/wit/workitems?ids=${pbiIds.join(
        ","
      )}&$expand=relations&api-version=${API_VERSION}`;
      const workItemsResponse = await fetch(workItemsUrl, {
        headers: this.headers,
        cache: "no-store",
      });

      if (!workItemsResponse.ok) {
        throw new Error(
          `Failed to fetch PBI details: ${workItemsResponse.statusText}`
        );
      }

      const workItemsData = await workItemsResponse.json();
      const pbis = workItemsData.value || [];

      // Analyze PBIs for bugs
      const pbisWithBugs = [];

      for (const pbi of pbis) {
        const childRelations =
          pbi.relations?.filter(
            (rel: { rel: string }) =>
              rel.rel === "System.LinkTypes.Hierarchy-Forward"
          ) || [];

        if (childRelations.length === 0) continue;

        // Get child work item IDs
        const childIds = childRelations
          .map((rel: { url: string }) => {
            const match = rel.url.match(/\/(\d+)$/);
            return match ? match[1] : null;
          })
          .filter((id: string | null) => id !== null);

        if (childIds.length === 0) continue;

        // Fetch child work items to check if any are bugs
        const childrenUrl = `${
          this.baseUrl
        }/_apis/wit/workitems?ids=${childIds.join(
          ","
        )}&api-version=${API_VERSION}`;
        const childrenResponse = await fetch(childrenUrl, {
          headers: this.headers,
          cache: "no-store",
        });

        if (!childrenResponse.ok) continue;

        const childrenData = await childrenResponse.json();
        const children = childrenData.value || [];

        // Count bugs
        const bugCount = children.filter(
          (child: WorkItem) =>
            child.fields["System.WorkItemType"] === "Bug task"
        ).length;

        if (bugCount > 0) {
          pbisWithBugs.push({
            id: pbi.id,
            title: pbi.fields["System.Title"],
            createdDate: pbi.fields["System.CreatedDate"],
            state: pbi.fields["System.State"],
            assignedTo: pbi.fields["System.AssignedTo"]?.displayName,
            bugCount,
          });
        }
      }

      // Separate by semester
      const firstSemesterPBIs = pbis.filter((pbi: WorkItem) => {
        const createdDate = new Date(pbi.fields["System.CreatedDate"]);
        return (
          createdDate >= new Date(firstSemesterStart) &&
          createdDate <= new Date(firstSemesterEnd)
        );
      });

      const secondSemesterPBIs = pbis.filter((pbi: WorkItem) => {
        const createdDate = new Date(pbi.fields["System.CreatedDate"]);
        return (
          createdDate >= new Date(secondSemesterStart) &&
          createdDate <= new Date(secondSemesterEnd)
        );
      });

      const firstSemesterWithRework = pbisWithBugs.filter((pbi) => {
        const createdDate = new Date(pbi.createdDate);
        return (
          createdDate >= new Date(firstSemesterStart) &&
          createdDate <= new Date(firstSemesterEnd)
        );
      });

      const secondSemesterWithRework = pbisWithBugs.filter((pbi) => {
        const createdDate = new Date(pbi.createdDate);
        return (
          createdDate >= new Date(secondSemesterStart) &&
          createdDate <= new Date(secondSemesterEnd)
        );
      });

      // Calculate percentages
      const firstSemesterPercentage =
        firstSemesterPBIs.length > 0
          ? (firstSemesterWithRework.length / firstSemesterPBIs.length) * 100
          : 0;

      const secondSemesterPercentage =
        secondSemesterPBIs.length > 0
          ? (secondSemesterWithRework.length / secondSemesterPBIs.length) * 100
          : 0;

      // Determine status for first semester
      let firstStatus: "Tranquilo" | "Atenção" | "Perigo" = "Tranquilo";
      let firstColor: "green" | "yellow" | "red" = "green";
      if (firstSemesterPercentage > 10) {
        firstStatus = "Perigo";
        firstColor = "red";
      } else if (firstSemesterPercentage > 5) {
        firstStatus = "Atenção";
        firstColor = "yellow";
      }

      // Determine status for second semester
      let secondStatus: "Tranquilo" | "Atenção" | "Perigo" = "Tranquilo";
      let secondColor: "green" | "yellow" | "red" = "green";
      if (secondSemesterPercentage > 5) {
        secondStatus = "Perigo";
        secondColor = "red";
      } else if (secondSemesterPercentage > 2.5) {
        secondStatus = "Atenção";
        secondColor = "yellow";
      }

      return {
        firstSemester: {
          semester: "1º Semestre",
          totalPBIs: firstSemesterPBIs.length,
          pbisWithRework: firstSemesterWithRework.length,
          percentage: firstSemesterPercentage,
          status: firstStatus,
          statusColor: firstColor,
        },
        secondSemester: {
          semester: "2º Semestre",
          totalPBIs: secondSemesterPBIs.length,
          pbisWithRework: secondSemesterWithRework.length,
          percentage: secondSemesterPercentage,
          status: secondStatus,
          statusColor: secondColor,
        },
        pbisWithRework: pbisWithBugs,
      };
    } catch (error) {
      console.error("Error fetching PBIs with rework:", error);
      throw error;
    }
  }
}

export function createAzureClient(
  config: AzureDevOpsConfig
): AzureDevOpsClient {
  return new AzureDevOpsClient(config);
}
