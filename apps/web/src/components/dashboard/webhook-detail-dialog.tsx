"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Clock,
  Activity,
  BarChart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getIndexingConfById } from "@/services/indexingConf.sercices";

type WebhookType = {
  id: string;
  configurationId: string;
  configurationName: string;
  webhookUrl: string;
  createdAt: string;
  status?: "active" | "inactive" | "error";
  lastTriggered?: string;
  eventCount?: number;
};

type WebhookEvent = {
  id: string;
  timestamp: string;
  type: string;
  status: "success" | "error";
  payload?: string;
  error?: string;
};

interface WebhookDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: WebhookType | null;
}

export function WebhookDetailDialog({
  open,
  onOpenChange,
  webhook,
}: WebhookDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    successRate: 0,
    avgResponseTime: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open && webhook) {
      fetchWebhookDetails();
    }
  }, [open, webhook]);

  const fetchWebhookDetails = async () => {
    setIsLoading(true);
    try {
      const res = await getIndexingConfById(webhook?.configurationId || "");

      if (res.error || !res.data) {
        toast({
          title: "Error",
          description: "Failed to fetch webhook details. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const events: WebhookEvent[] = res.data.data.syncLogs.map((log: any) => {
        return {
          id: log.id,
          timestamp: log.startTime,
          type: log.status,
          status: log.status,
          payload: JSON.stringify(
            { mintAddress: "7gb...", name: "Solana Monkey", price: 45.2 },
            null,
            2
          ),
        };
      });

      const stats = {
        totalEvents: webhook?.eventCount || 0,
        successRate: 85,
        avgResponseTime: 230,
      };

      setStats(stats);
      setEvents(events);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch webhook details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWebhookDetails = async () => {
    setIsRefreshing(true);
    try {
      await fetchWebhookDetails();
      toast({
        title: "Refreshed",
        description: "Webhook details have been refreshed.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyWebhookUrl = () => {
    if (!webhook) return;

    navigator.clipboard.writeText(webhook.webhookUrl);
    toast({
      title: "Copied",
      description: "Webhook URL copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" /> Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          >
            <AlertCircle className="mr-1 h-3 w-3" /> Inactive
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20"
          >
            <XCircle className="mr-1 h-3 w-3" /> Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Unknown
          </Badge>
        );
    }
  };

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" /> Success
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20"
          >
            <XCircle className="mr-1 h-3 w-3" /> Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Unknown
          </Badge>
        );
    }
  };

  if (!webhook) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Webhook Details</DialogTitle>
          <DialogDescription>
            View details and recent events for this webhook
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                {webhook.configurationName}
              </h3>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                  {webhook.webhookUrl}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyWebhookUrl}
                >
                  <Copy className="h-3 w-3" />
                  <span className="sr-only">Copy URL</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(webhook.status || "")}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshWebhookDetails}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs defaultValue="events">
            <TabsList className="mb-4">
              <TabsTrigger value="events">Recent Events</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-5 w-[150px]" />
                          <Skeleton className="h-5 w-[100px]" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Events Found</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    This webhook hasn't received any events yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <Card key={event.id}>
                      <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">
                              {event.type}
                            </h4>
                            {getEventStatusBadge(event.status)}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatDate(event.timestamp)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {event.status === "success" && event.payload ? (
                          <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto">
                            {event.payload}
                          </pre>
                        ) : event.status === "error" && event.error ? (
                          <div className="bg-red-500/10 text-red-500 p-2 rounded-md text-xs">
                            Error: {event.error}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-5 w-[100px]" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-10 w-[80px]" />
                        <Skeleton className="h-4 w-[120px] mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.totalEvents.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Since {formatDate(webhook.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.successRate}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.successRate >= 90
                          ? "Excellent"
                          : stats.successRate >= 75
                            ? "Good"
                            : "Needs attention"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Avg. Response Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.avgResponseTime}ms
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.avgResponseTime < 300
                          ? "Fast"
                          : stats.avgResponseTime < 500
                            ? "Average"
                            : "Slow"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Event History</CardTitle>
                    <CardDescription>
                      Event volume over the last 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[200px] flex items-center justify-center">
                    {isLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <BarChart className="h-16 w-16 mb-2" />
                        <p>Chart visualization would appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Configuration</CardTitle>
                  <CardDescription>
                    Manage your webhook settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Webhook URL</h4>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {webhook.webhookUrl}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={copyWebhookUrl}
                        >
                          <Copy className="h-3 w-3" />
                          <span className="sr-only">Copy URL</span>
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Status</h4>
                      <div>{getStatusBadge(webhook.status || "")}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Helius Integration
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      To use this webhook, you need to configure it in your
                      Helius dashboard.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href="https://dev.helius.xyz/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Helius Dashboard
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
