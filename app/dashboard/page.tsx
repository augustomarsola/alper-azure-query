"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartData,
  PBIWithRework,
  Project,
  ReturnRateData,
  WorkItem,
} from "@/lib/types";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [chartData, setChartData] = useState<{
    byStatus: ChartData[];
    byType: ChartData[];
    byUser: ChartData[];
  }>({
    byStatus: [],
    byType: [],
    byUser: [],
  });
  const [returnRateData, setReturnRateData] = useState<{
    firstSemester: ReturnRateData;
    secondSemester: ReturnRateData;
    pbisWithRework: PBIWithRework[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [returnRateLoading, setReturnRateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/squads");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch projects");
        }

        setProjects(data.projects || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  // Fetch tasks when project selection changes
  useEffect(() => {
    async function fetchTasks() {
      if (!selectedProject) {
        // Clear tasks when no project is selected
        setWorkItems([]);
        setChartData({ byStatus: [], byType: [], byUser: [] });
        return;
      }

      setTasksLoading(true);
      try {
        const response = await fetch(
          `/api/tasks?projectName=${encodeURIComponent(selectedProject)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch tasks");
        }

        setWorkItems(data.workItems || []);
        setChartData(data.charts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setTasksLoading(false);
      }
    }

    fetchTasks();
  }, [selectedProject]);

  // Fetch return rate data when project selection changes
  useEffect(() => {
    async function fetchReturnRate() {
      if (!selectedProject) {
        setReturnRateData(null);
        return;
      }

      setReturnRateLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const response = await fetch(
          `/api/pbi-return-rate?projectName=${encodeURIComponent(
            selectedProject
          )}&year=${currentYear}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch return rate data");
        }

        setReturnRateData(data);
      } catch (err) {
        console.error("Error loading return rate:", err);
        setReturnRateData(null);
      } finally {
        setReturnRateLoading(false);
      }
    }

    fetchReturnRate();
  }, [selectedProject]);

  // Definir cores diferentes para cada item dos gráficos
  const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
    "hsl(var(--chart-7))",
    "hsl(var(--chart-8))",
    "hsl(var(--chart-9))",
    "hsl(var(--chart-10))",
  ];

  const chartConfig: ChartConfig = {
    value: {
      label: "Count",
      color: "hsl(var(--chart-1))",
    },
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 space-y-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-10 w-96 mx-auto" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Por favor, verifique suas variáveis de ambiente e tente novamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Header with Project Selector */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Dashboard Azure DevOps
        </h1>
        <div className="flex justify-center">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.name}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs for different views */}
      {selectedProject && (
        <Tabs defaultValue="return-rate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="return-rate">
              Taxa de Retorno de PBIs
            </TabsTrigger>
            <TabsTrigger value="overview">Visão Geral das Tasks</TabsTrigger>
          </TabsList>

          {/* Return Rate Tab */}
          <TabsContent value="return-rate" className="space-y-6">
            {returnRateLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[200px]" />
                <Skeleton className="h-[200px]" />
              </div>
            ) : returnRateData ? (
              <>
                {/* Semester Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* First Semester */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {returnRateData.firstSemester.semester}
                        <Badge
                          variant={
                            returnRateData.firstSemester.statusColor === "green"
                              ? "default"
                              : returnRateData.firstSemester.statusColor ===
                                "yellow"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {returnRateData.firstSemester.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Meta: abaixo de 10% (ideal abaixo de 5%)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Total de PBIs:
                          </span>
                          <span className="text-2xl font-bold">
                            {returnRateData.firstSemester.totalPBIs}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            PBIs com retrabalho:
                          </span>
                          <span className="text-2xl font-bold">
                            {returnRateData.firstSemester.pbisWithRework}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Taxa de retorno:
                          </span>
                          <span
                            className={`text-3xl font-bold ${
                              returnRateData.firstSemester.statusColor ===
                              "green"
                                ? "text-green-500"
                                : returnRateData.firstSemester.statusColor ===
                                  "yellow"
                                ? "text-yellow-500"
                                : "text-red-500"
                            }`}
                          >
                            {returnRateData.firstSemester.percentage.toFixed(2)}
                            %
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Second Semester */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {returnRateData.secondSemester.semester}
                        <Badge
                          variant={
                            returnRateData.secondSemester.statusColor ===
                            "green"
                              ? "default"
                              : returnRateData.secondSemester.statusColor ===
                                "yellow"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {returnRateData.secondSemester.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Meta: abaixo de 5% (ideal abaixo de 2,5%)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Total de PBIs:
                          </span>
                          <span className="text-2xl font-bold">
                            {returnRateData.secondSemester.totalPBIs}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            PBIs com retrabalho:
                          </span>
                          <span className="text-2xl font-bold">
                            {returnRateData.secondSemester.pbisWithRework}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Taxa de retorno:
                          </span>
                          <span
                            className={`text-3xl font-bold ${
                              returnRateData.secondSemester.statusColor ===
                              "green"
                                ? "text-green-500"
                                : returnRateData.secondSemester.statusColor ===
                                  "yellow"
                                ? "text-yellow-500"
                                : "text-red-500"
                            }`}
                          >
                            {returnRateData.secondSemester.percentage.toFixed(
                              2
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* PBIs with Rework Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>PBIs com Retrabalho</CardTitle>
                    <CardDescription>
                      {returnRateData.pbisWithRework.length} PBI
                      {returnRateData.pbisWithRework.length !== 1 ? "s" : ""}{" "}
                      com bugs identificado
                      {returnRateData.pbisWithRework.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {returnRateData.pbisWithRework.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum PBI com retrabalho encontrado
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Data de Criação</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead className="text-center">Bugs</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {returnRateData.pbisWithRework.map((pbi) => (
                            <TableRow key={pbi.id}>
                              <TableCell className="font-mono text-sm">
                                {pbi.id}
                              </TableCell>
                              <TableCell className="max-w-md truncate">
                                {pbi.title}
                              </TableCell>
                              <TableCell>
                                {new Date(pbi.createdDate).toLocaleDateString(
                                  "pt-BR"
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset">
                                  {pbi.state}
                                </span>
                              </TableCell>
                              <TableCell>
                                {pbi.assignedTo || "Não atribuído"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="destructive">
                                  {pbi.bugCount}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Selecione um projeto para visualizar a taxa de retorno de
                    PBIs
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Charts */}
            {tasksLoading ? (
              <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-[300px]" />
                <Skeleton className="h-[300px]" />
                <Skeleton className="h-[300px]" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {/* Tasks by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tarefas por Status</CardTitle>
                    <CardDescription>
                      Distribuição dos estados dos itens de trabalho
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig}>
                      <BarChart data={chartData.byStatus}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" radius={4}>
                          {chartData.byStatus.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Tasks by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tarefas por Tipo</CardTitle>
                    <CardDescription>
                      Distribuição por tipo de item de trabalho
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig}>
                      <BarChart data={chartData.byType}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" radius={4}>
                          {chartData.byType.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Tasks by User */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tarefas por Usuário</CardTitle>
                    <CardDescription>Top 10 responsáveis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig}>
                      <BarChart data={chartData.byUser}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" radius={4}>
                          {chartData.byUser.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Task List */}
            <Card>
              <CardHeader>
                <CardTitle>Itens de Trabalho</CardTitle>
                <CardDescription>
                  {workItems.length} tarefa{workItems.length !== 1 ? "s" : ""}{" "}
                  encontrada{workItems.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : workItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma tarefa encontrada
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Responsável</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workItems.slice(0, 50).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">
                            {item.id}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {item.fields["System.Title"]}
                          </TableCell>
                          <TableCell>
                            {item.fields["System.WorkItemType"]}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset">
                              {item.fields["System.State"]}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.fields["System.AssignedTo"]?.displayName ||
                              "Não atribuído"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {workItems.length > 50 && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Mostrando as primeiras 50 de {workItems.length} tarefas
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
