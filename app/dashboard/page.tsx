"use client";

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
import { ChartData, Team, WorkItem } from "@/lib/types";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export default function DashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
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
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch teams on mount
  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/squads");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch teams");
        }

        setTeams(data.teams || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load teams");
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  // Fetch tasks when team selection changes
  useEffect(() => {
    async function fetchTasks() {
      if (!selectedTeam) {
        // Load all tasks
        setTasksLoading(true);
        try {
          const response = await fetch("/api/tasks");
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
        return;
      }

      setTasksLoading(true);
      try {
        const response = await fetch(`/api/tasks?teamId=${selectedTeam}`);
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
  }, [selectedTeam]);

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
      {/* Header with Squad Selector */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Dashboard Azure DevOps
        </h1>
        <div className="flex justify-center">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="Selecione um squad (ou visualize todas as tarefas)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as Tarefas</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
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
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
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
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
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
                    <TableCell>{item.fields["System.WorkItemType"]}</TableCell>
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
    </div>
  );
}
