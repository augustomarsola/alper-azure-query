import { createAzureClient } from "@/lib/azure-devops";
import { NextResponse } from "next/server";

// Cache configuration: revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    // Get configuration from environment variables
    const organization = process.env.AZURE_DEVOPS_ORGANIZATION;
    const pat = process.env.AZURE_DEVOPS_PAT;

    // Validate configuration
    if (!organization || !pat) {
      return NextResponse.json(
        {
          error: "Configuração do Azure DevOps ausente",
          details:
            "Por favor, defina AZURE_DEVOPS_ORGANIZATION e AZURE_DEVOPS_PAT nas suas variáveis de ambiente",
        },
        { status: 500 }
      );
    }

    // Create Azure DevOps client
    const client = createAzureClient({
      organization,
      pat,
    });

    // Fetch projects
    const projects = await client.getProjects();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        error: "Falha ao buscar projetos",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
