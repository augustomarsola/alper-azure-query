import { createAzureClient } from "@/lib/azure-devops";
import { NextRequest, NextResponse } from "next/server";

// Cache configuration: revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET(request: NextRequest) {
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

    // Get project name from query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectName = searchParams.get("projectName");
    const year =
      searchParams.get("year") || new Date().getFullYear().toString();

    if (!projectName) {
      return NextResponse.json(
        {
          error: "Projeto não especificado",
          details:
            "Por favor, forneça o parâmetro 'projectName' na query string",
        },
        { status: 400 }
      );
    }

    // Create Azure DevOps client
    const client = createAzureClient({
      organization,
      pat,
    });

    // Get PBIs and their children for the specified year
    const result = await client.getPBIsWithRework(projectName, parseInt(year));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching PBI return rate:", error);
    return NextResponse.json(
      {
        error: "Falha ao buscar taxa de retorno de PBIs",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
