import { createAzureClient } from "@/lib/azure-devops";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get configuration from environment variables
    const organization = process.env.AZURE_DEVOPS_ORGANIZATION;
    const project = process.env.AZURE_DEVOPS_PROJECT;
    const pat = process.env.AZURE_DEVOPS_PAT;

    // Validate configuration
    if (!organization || !project || !pat) {
      return NextResponse.json(
        {
          error: "Configuração do Azure DevOps ausente",
          details:
            "Por favor, defina AZURE_DEVOPS_ORGANIZATION, AZURE_DEVOPS_PROJECT e AZURE_DEVOPS_PAT nas suas variáveis de ambiente",
        },
        { status: 500 }
      );
    }

    // Get team ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get("teamId");

    // Create Azure DevOps client
    const client = createAzureClient({
      organization,
      project,
      pat,
    });

    // Fetch work items
    let workItems;
    if (teamId) {
      workItems = await client.getWorkItemsByTeam(project, teamId);
    } else {
      workItems = await client.getAllWorkItems(project);
    }

    // Transform data for charts
    const tasksByStatus: Record<string, number> = {};
    const tasksByType: Record<string, number> = {};
    const tasksByUser: Record<string, number> = {};

    workItems.forEach((item) => {
      const status = item.fields["System.State"];
      const type = item.fields["System.WorkItemType"];
      const assignee =
        item.fields["System.AssignedTo"]?.displayName || "Não atribuído";

      tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
      tasksByType[type] = (tasksByType[type] || 0) + 1;
      tasksByUser[assignee] = (tasksByUser[assignee] || 0) + 1;
    });

    return NextResponse.json({
      workItems,
      charts: {
        byStatus: Object.entries(tasksByStatus).map(([name, value]) => ({
          name,
          value,
        })),
        byType: Object.entries(tasksByType).map(([name, value]) => ({
          name,
          value,
        })),
        byUser: Object.entries(tasksByUser)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10), // Top 10 users
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      {
        error: "Falha ao buscar tarefas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
