"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Database, Plus, Server, Users, Bell } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ConfigurationDialog } from "@/components/dashboard/configuration-dialog";
import {
  createDatabaseHand,
  getAllDatabases,
} from "@/services/credentials.services";

export default function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const activities = [
    {
      name: "NFT Price Indexer",
      status: "healthy",
      updatedAt: "2 minutes ago",
    },
    {
      name: "Token Price Tracker",
      status: "healthy",
      updatedAt: "5 minutes ago",
    },
    {
      name: "Transaction Monitor",
      status: "warning",
      updatedAt: "15 minutes ago",
    },
    {
      name: "Wallet Tracker",
      status: "error",
      updatedAt: "1 hour ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleConfigurationCreated = (webhookUrl: string) => {
    toast({
      title: "Configuration Created",
      description: "Your new configuration has been created successfully.",
      variant: "default",
    });
    setIsDialogOpen(false);
  };

  const toggleLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="space-y-6 h-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your blockchain indexing performance and configurations.
          </p>
        </div>
        <Button
          size="sm"
          className="sm:w-auto w-full"
          onClick={handleOpenDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Configuration
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {isLoading ? (
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-[140px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[60px] mb-2" />
                  <Skeleton className="h-3 w-[100px]" />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {index === 0 && "Active Configurations"}
                    {index === 1 && "Database Connections"}
                    {index === 2 && "Events Processed"}
                    {index === 3 && "API Usage"}
                  </CardTitle>
                  {index === 0 && (
                    <Database className="h-4 w-4 text-muted-foreground" />
                  )}
                  {index === 1 && (
                    <Server className="h-4 w-4 text-muted-foreground" />
                  )}
                  {index === 2 && (
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  )}
                  {index === 3 && (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  {index === 0 && (
                    <>
                      <div className="text-2xl font-bold">12</div>
                      <p className="text-xs text-muted-foreground">
                        +2 from last month
                      </p>
                    </>
                  )}
                  {index === 1 && (
                    <>
                      <div className="text-2xl font-bold">4</div>
                      <p className="text-xs text-muted-foreground">
                        All healthy
                      </p>
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <div className="text-2xl font-bold">2.34M</div>
                      <p className="text-xs text-muted-foreground">
                        +12.3% from last week
                      </p>
                    </>
                  )}
                  {index === 3 && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-2xl font-bold">73%</div>
                        <div className="text-xs text-muted-foreground">
                          Of monthly quota
                        </div>
                      </div>
                      <Progress value={73} className="h-2" />
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" onClick={toggleLoading}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" onClick={toggleLoading}>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" onClick={toggleLoading}>
            Reports
          </TabsTrigger>
          <TabsTrigger value="notifications" onClick={toggleLoading}>
            Notifications
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent blockchain indexing activity across all
                  configurations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b border-border/40 pb-2">
                      <div>Configuration</div>
                      <div>Status</div>
                      <div>Last Updated</div>
                    </div>
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 md:gap-4 text-sm py-2 md:py-1 border-b border-border/10 last:border-0"
                      >
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b border-border/40 pb-2">
                      <div>Configuration</div>
                      <div>Status</div>
                      <div>Last Updated</div>
                    </div>
                    <div className="space-y-4 md:space-y-0">
                      {activities.map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                          className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 md:gap-4 text-sm py-2 md:py-1 border-b border-border/10 last:border-0"
                        >
                          <div className="font-medium">{activity.name}</div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${getStatusColor(activity.status)}`}
                            ></div>
                            <span className="capitalize">
                              {activity.status}
                            </span>
                          </div>
                          <div>{activity.updatedAt}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t border-border/10 pt-4">
                <Button variant="outline" size="sm">
                  View All Activity
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Detailed analytics for your blockchain indexing operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              {isLoading ? (
                <div className="w-full space-y-4">
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Activity className="h-16 w-16 text-muted-foreground/30" />
                  <p>Analytics charts will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Generate and view reports on your indexing performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              {isLoading ? (
                <div className="w-full space-y-4">
                  <div className="flex justify-between mb-4">
                    <Skeleton className="h-8 w-[150px]" />
                    <Skeleton className="h-8 w-[100px]" />
                  </div>
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-12 w-full mb-4" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Server className="h-16 w-16 text-muted-foreground/30" />
                  <p>Reports will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                View and manage your system notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              {isLoading ? (
                <div className="w-full space-y-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="flex gap-3 items-start border-b border-border/10 pb-3"
                    >
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-[80%]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Bell className="h-16 w-16 text-muted-foreground/30" />
                  <p>Notifications will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfigurationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        createDatabaseFn={createDatabaseHand}
        fetchDatabasesFn={getAllDatabases}
        mode="create"
      />
    </div>
  );
}
