"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ConfigurationDialog,
  type IndexingCategory,
  BlockchainNetwork,
} from "@/components/dashboard/configuration-dialog";
import {
  Webhook,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Power,
  PowerOff,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WebhookDetailDialog } from "@/components/dashboard/webhook-detail-dialog";

import { useToast } from "@/hooks/use-toast";
import {
  createIndexingConf,
  updateIndexingConf,
} from "@/services/indexingConf.sercices";

type WebhookType = {
  id: string;
  configurationId: string;
  configurationName: string;
  webhookUrl: string;
  createdAt: string;
  status?: "active" | "inactive" | "error";
  lastTriggered?: string;
  eventCount?: number;
  enabled?: boolean;
  categories?: string[];
  network?: string;
  credentialId?: string;
};

type IndexingConfiguration = {
  id: string;
  name: string;
  categories: string[];
  network: string;
  enabled: boolean;
  createdAt: string;
  credentialId: string;
  webhookUrl?: string;
};

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [configurations, setConfigurations] = useState<IndexingConfiguration[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookType | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("all");
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWebhooks();
    fetchConfigurations();
  }, []);

  const filteredWebhooks = webhooks.filter((webhook) => {
    const matchesSearch =
      webhook.configurationName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      webhook.webhookUrl.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active")
      return matchesSearch && webhook.status === "active";
    if (activeTab === "inactive")
      return matchesSearch && webhook.status === "inactive";
    if (activeTab === "error")
      return matchesSearch && webhook.status === "error";

    return matchesSearch;
  });

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      const { listWebhooks } = await import("@/services/indexingConf.sercices");

      const res = await listWebhooks();

      if (res.error) {
        throw new Error(res.error.message);
      }

      const webhooksData: WebhookType[] = res?.data?.webhooks || [];
      setWebhooks(webhooksData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch webhooks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfigurations = async () => {
    try {
      const { getAllIndexingConfs } = await import(
        "@/services/indexingConf.sercices"
      );
      const res = await getAllIndexingConfs();

      if (res.error) {
        throw new Error(res.error.message);
      }

      if (!res?.data?.data) {
        throw new Error("Failed to fetch configurations");
      }

      const configurationsData: IndexingConfiguration[] =
        (res?.data?.data as unknown as IndexingConfiguration[]) || [];
      setConfigurations(configurationsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch configurations. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshWebhooks = async () => {
    setIsRefreshing(true);
    try {
      await fetchWebhooks();
      await fetchConfigurations();
      toast({
        title: "Refreshed",
        description: "Webhook list has been refreshed.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      const { deleteWebhook } = await import(
        "@/services/indexingConf.sercices"
      );

      const res = await deleteWebhook(selectedWebhook.id);

      if (res.error) {
        throw new Error(res.error.message);
      }

      const updatedWebhooks = webhooks.filter(
        (webhook) => webhook.id !== selectedWebhook.id
      );
      setWebhooks(updatedWebhooks);
      setIsDeleteDialogOpen(false);
      setSelectedWebhook(null);

      toast({
        title: "Webhook Deleted",
        description: "Webhook has been deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete webhook. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    setIsTogglingStatus(id);
    try {
      const { toggleIndexingConfEnabled } = await import(
        "@/services/indexingConf.sercices"
      );

      const res = await toggleIndexingConfEnabled(id);

      if (res.error) {
        throw new Error(res.error.message);
      }

      if (!res.data) {
        throw new Error("Failed to toggle webhook status");
      }

      console.log(res.data);

      const updatedWebhooks = webhooks.map((webhook) =>
        webhook.configurationId === id
          ? {
              ...webhook,
              enabled: res.data?.data?.enabled ?? false,
              status: res.data?.data?.enabled
                ? "active"
                : ("inactive" as "active" | "inactive"),
            }
          : webhook
      );

      setWebhooks(updatedWebhooks);

      toast({
        title: res.data.data.enabled ? "Webhook Enabled" : "Webhook Disabled",
        description: `Webhook has been ${res.data.data.enabled ? "enabled" : "disabled"} successfully.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle webhook status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
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
    }).format(date);
  };

  const getStatusBadge = (status: string, enabled?: boolean) => {
    if (enabled === false) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
        >
          <PowerOff className="mr-1 h-3 w-3" /> Disabled
        </Badge>
      );
    }

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

  const handleWebhookCreated = (data: { webhookUrl?: string }) => {
    refreshWebhooks();
    toast({
      title: "Webhook Created",
      description: "New webhook has been created successfully.",
      variant: "default",
    });
  };

  const handleWebhookUpdated = (data: { id?: string; webhookUrl?: string }) => {
    refreshWebhooks();
    toast({
      title: "Webhook Updated",
      description: "Webhook has been updated successfully.",
      variant: "default",
    });
  };

  const prepareWebhookForEdit = (webhook: WebhookType) => {
    const config = configurations.find((c) => c.id === webhook.configurationId);
    console.log("configurations", configurations);
    if (config) {
      return {
        id: webhook.id,
        name: webhook.configurationName,
        categories: config.categories.map((cat) => cat as IndexingCategory),
        network: config.network as BlockchainNetwork,
        enabled: config.enabled,
        credentialId: config.id,
        webhookUrl: webhook.webhookUrl,
      };
    }

    return {
      id: webhook.id,
      name: webhook.configurationName,
      categories:
        webhook.categories?.map((cat) => cat as IndexingCategory) || [],
      network:
        (webhook.network as BlockchainNetwork) ||
        BlockchainNetwork.SOLANA_MAINNET,
      enabled: webhook.enabled !== false,
      credentialId: webhook.configurationId || "",
      webhookUrl: webhook.webhookUrl,
    };
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Webhook Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your blockchain data indexing webhooks
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Webhook
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <CardTitle>Webhooks</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search webhooks..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={refreshWebhooks}
                  disabled={isRefreshing || isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
            <CardDescription>
              {webhooks.length} {webhooks.length === 1 ? "webhook" : "webhooks"}{" "}
              configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="all"
              className="mb-6"
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger value="all">All Webhooks</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="error">Error</TabsTrigger>
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-[250px]" />
                  <Skeleton className="h-5 w-[100px]" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-[200px]" />
                      <Skeleton className="h-6 w-[100px]" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-[300px]" />
                      <Skeleton className="h-4 w-[80px]" />
                    </div>
                    <Skeleton className="h-[1px] w-full" />
                  </div>
                ))}
              </div>
            ) : filteredWebhooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Webhook className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Webhooks Found</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  {searchQuery
                    ? "No webhooks match your search criteria. Try a different search term."
                    : "You haven't created any webhooks yet. Create one to get started."}
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                ) : (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Webhook
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Configuration</TableHead>
                      <TableHead>Webhook URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredWebhooks.map((webhook, index) => (
                        <motion.tr
                          key={webhook.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="group"
                        >
                          <TableCell className="font-medium">
                            {webhook.configurationName}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 max-w-xs">
                              <span className="truncate text-xs">
                                {webhook.webhookUrl}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() =>
                                  copyWebhookUrl(webhook.webhookUrl)
                                }
                              >
                                <Copy className="h-3 w-3" />
                                <span className="sr-only">Copy URL</span>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(
                              webhook.status || "",
                              webhook.enabled
                            )}
                          </TableCell>
                          <TableCell>{formatDate(webhook.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    console.log("data for view data", webhook);
                                    setSelectedWebhook(webhook);
                                    setIsDetailDialogOpen(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    console.log(
                                      "data for edit webhook",
                                      webhook
                                    );
                                    setSelectedWebhook(webhook);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Configuration
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    copyWebhookUrl(webhook.webhookUrl)
                                  }
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy URL
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    window.open(
                                      "https://dev.helius.xyz/dashboard",
                                      "_blank"
                                    );
                                  }}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Open in Helius
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={isTogglingStatus === webhook.id}
                                  onClick={() =>
                                    handleToggleStatus(webhook.configurationId)
                                  }
                                >
                                  {isTogglingStatus === webhook.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : webhook.status === "inactive" ? (
                                    <Power className="mr-2 h-4 w-4" />
                                  ) : (
                                    <PowerOff className="mr-2 h-4 w-4" />
                                  )}
                                  {webhook.status === "inactive"
                                    ? "Enable Webhook"
                                    : "Disable Webhook"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setSelectedWebhook(webhook);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Webhook
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <div className="text-sm text-muted-foreground">
              Showing {filteredWebhooks.length} of {webhooks.length} webhooks
            </div>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://docs.helius.dev/data-streaming/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Info className="mr-2 h-4 w-4" />
                Webhook Documentation
              </a>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <ConfigurationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
        onSuccess={handleWebhookCreated}
        createFn={createIndexingConf}
      />

      {selectedWebhook && (
        <ConfigurationDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          mode="edit"
          existingData={prepareWebhookForEdit(selectedWebhook)}
          onSuccess={handleWebhookUpdated}
          updateFn={updateIndexingConf}
          createFn={createIndexingConf}
        />
      )}

      <WebhookDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        webhook={selectedWebhook}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the webhook for{" "}
              <span className="font-medium">
                {selectedWebhook?.configurationName}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWebhook}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
