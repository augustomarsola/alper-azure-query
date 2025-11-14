import { createAzureClient } from "@/lib/azure-devops";
import { NextResponse } from "next/server";

export async function GET() {
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

    // Create Azure DevOps client
    const client = createAzureClient({
      organization,
      project,
      pat,
    });

    // Fetch teams
    const teams = await client.getTeams(project);

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      {
        error: "Falha ao buscar times",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
