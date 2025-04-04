"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Check,
  Copy,
  ExternalLink,
  Database,
  ArrowRight,
  ArrowLeft,
  Search,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IndexingConfiguration } from "@/services/indexingConf.sercices";

type ErrorResponse = {
  message: string;
  statusCode?: number;
};

export enum IndexingCategory {
  NFT_BIDS = "NFT_BIDS",
  NFT_PRICES = "NFT_PRICES",
  TOKEN_BORROW = "TOKEN_BORROW",
  TOKEN_PRICES = "TOKEN_PRICES",
  TRANSACTIONS = "TRANSACTIONS",
}

export enum BlockchainNetwork {
  SOLANA_MAINNET = "SOLANA_MAINNET",
  SOLANA_DEVNET = "SOLANA_DEVNET",
}

export const createDatabaseCredentialsSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().positive("Port must be a positive integer"),
  database: z.string().min(1, "Database name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  ssl: z.boolean().default(true),
});

export const indexingConfigSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters"),
  categories: z
    .array(z.nativeEnum(IndexingCategory))
    .min(1, "Select at least one category"),
  network: z
    .nativeEnum(BlockchainNetwork)
    .default(BlockchainNetwork.SOLANA_MAINNET),
  enabled: z.boolean().default(true),
  credentialId: z.string().min(1, "Database is required"),
});

export type DatabaseCredentials = z.infer<
  typeof createDatabaseCredentialsSchema
>;
export type IndexingConfig = z.infer<typeof indexingConfigSchema>;

export interface DatabaseType {
  id: string;
  host: string;
  port: number;
  database: string;
  username: string;
  createdAt: string;
}

export interface ConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  existingData?: IndexingConfig & { id?: string; webhookUrl?: string };
  onSuccess?: (data: { id?: string; webhookUrl?: string }) => void;
  createFn: (data: IndexingConfig) => Promise<any>;
  updateFn?: (params: { id: string; data: IndexingConfiguration }) => Promise<{
    data: {
      success: boolean;
      message: string;
      data: IndexingConfiguration & {
        id: string;
      };
    } | null;
    error: ErrorResponse | string | null;
  }>;
  fetchDatabasesFn?: () => Promise<{
    data: any;
    error: { message: string } | null;
  }>;
  createDatabaseFn?: (
    data: z.infer<typeof createDatabaseCredentialsSchema>
  ) => Promise<{
    data: any;
    error: { message: string } | null;
  }>;
}

export function ConfigurationDialog({
  open,
  onOpenChange,
  mode = "create",
  existingData,
  onSuccess,
  createFn,
  updateFn,
  fetchDatabasesFn,
  createDatabaseFn,
}: ConfigurationDialogProps) {
  const [step, setStep] = useState(mode === "edit" ? 2 : 1);
  const [isCreatingDatabase, setIsCreatingDatabase] = useState(false);
  const [isProcessingConfig, setIsProcessingConfig] = useState(false);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isRefreshingDatabases, setIsRefreshingDatabases] = useState(false);
  const [databases, setDatabases] = useState<DatabaseType[]>([]);
  const [filteredDatabases, setFilteredDatabases] = useState<DatabaseType[]>(
    []
  );
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType | null>(
    null
  );
  const [webhookUrl, setWebhookUrl] = useState(existingData?.webhookUrl || "");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const databasesRef = useRef<HTMLDivElement>(null);

  const fetchedRef = useRef(false);

  const databaseForm = useForm<DatabaseCredentials>({
    resolver: zodResolver(createDatabaseCredentialsSchema),
    defaultValues: {
      host: "",
      port: 5432,
      database: "",
      username: "",
      password: "",
      ssl: true,
    },
  });

  const configForm = useForm<IndexingConfig>({
    resolver: zodResolver(indexingConfigSchema),
    defaultValues: existingData || {
      name: "",
      categories: [],
      network: BlockchainNetwork.SOLANA_MAINNET,
      enabled: true,
      credentialId: "",
    },
  });

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDatabases(databases);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = databases.filter(
        (db) =>
          db.database.toLowerCase().includes(query) ||
          db.host.toLowerCase().includes(query) ||
          db.username.toLowerCase().includes(query)
      );
      setFilteredDatabases(filtered);
    }
  }, [searchQuery, databases]);

  useEffect(() => {
    if (open) {
      if (mode === "create") {
        setStep(1);
        databaseForm.reset();
        configForm.reset({
          name: "",
          categories: [],
          network: BlockchainNetwork.SOLANA_MAINNET,
          enabled: true,
          credentialId: "",
        });
        setSelectedDatabase(null);
      } else if (mode === "edit" && existingData) {
        setStep(2);
        configForm.reset(existingData);
        setSearchQuery("");
      }

      if (!fetchedRef.current) {
        fetchDatabases();
      }
    } else {
      fetchedRef.current = false;
    }
  }, [open, mode, existingData]);

  useEffect(() => {
    if (selectedDatabase) {
      configForm.setValue("credentialId", selectedDatabase.id);
    }
  }, [selectedDatabase]);

  useEffect(() => {
    if (mode === "edit" && selectedDatabase && databasesRef.current) {
      const selectedElement = databasesRef.current.querySelector(
        `[data-id="${selectedDatabase.id}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedDatabase, mode, filteredDatabases]);

  const fetchDatabases = async () => {
    if (isLoadingDatabases) return;

    setIsLoadingDatabases(true);
    try {
      const { getAllDatabases } = await import(
        "@/services/credentials.services"
      );

      const res = await getAllDatabases();

      if (res && res.error) {
        throw new Error(res.error.message);
      }

      const fetchedDatabases = res?.data.data as DatabaseType[];

      console.log("fetchedDatabases", fetchedDatabases);

      setDatabases(fetchedDatabases);
      setFilteredDatabases(fetchedDatabases);

      console.log("existingData:", existingData);
      console.log("fetchedDatabases:", fetchedDatabases);

      if (mode === "edit" && existingData?.credentialId) {
        const db = fetchedDatabases.find(
          (db) => db.id === existingData.credentialId
        );
        console.log("Selected DB:", db);
        if (db) {
          console.log("Setting selected DB:", db);
          setSelectedDatabase(db);
        }
      }

      fetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching databases:", error);
      toast({
        title: "Error",
        description: "Failed to fetch databases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const refreshDatabases = async () => {
    setIsRefreshingDatabases(true);

    fetchedRef.current = false;
    try {
      await fetchDatabases();
      toast({
        title: "Refreshed",
        description: "Database list has been refreshed.",
      });
    } finally {
      setIsRefreshingDatabases(false);
    }
  };

  const createDatabase = async (data: DatabaseCredentials) => {
    setIsCreatingDatabase(true);
    try {
      if (!createDatabaseFn) {
        throw new Error("No createDatabaseFn provided");
      }

      const res = await createDatabaseFn(data);

      if (res.error) {
        throw new Error(res.error.message);
      }

      console.log("createDatabaseFn result newDatabase :", res);

      const newDatabase: DatabaseType = res.data.data;

      setSelectedDatabase(newDatabase);

      fetchDatabases();

      toast({
        title: "Database Connected",
        description: "Your database has been successfully connected.",
        variant: "default",
      });

      setStep(2);
    } catch (error) {
      console.error("Error creating database:", error);
      toast({
        title: "Error",
        description:
          "Failed to connect database. Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingDatabase(false);
    }
  };

  const processConfiguration = async (data: IndexingConfig) => {
    setIsProcessingConfig(true);
    try {
      let result;

      if (mode === "create") {
        if (!selectedDatabase?.id) {
          throw new Error("No database selected");
        }

        const res = await createFn({
          ...data,
          credentialId: selectedDatabase.id,
        });

        if (res.error) {
          throw new Error(res.error.message);
        }

        console.log("createFn result:", res);

        setWebhookUrl(res.data.webhookUrl);
        toast({
          title: "Configuration Created",
          description:
            "Your indexing configuration has been successfully created.",
          variant: "default",
        });
      } else if (mode === "edit" && existingData?.id) {
        if (updateFn) {
          result = await updateFn({
            id: existingData.id,
            data: { ...data, credentialId: data.credentialId },
          });
        } else {
          result = {
            id: existingData.id,
            webhookUrl: existingData.webhookUrl,
            ...data,
          };
        }

        toast({
          title: "Configuration Updated",
          description:
            "Your indexing configuration has been successfully updated.",
          variant: "default",
        });
      }

      if (mode === "create") {
        setStep(3);
      } else {
        if (onSuccess) {
          //@ts-ignore
          onSuccess(result);
        }
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error processing configuration:", error);
      toast({
        title: "Error",
        description: `Failed to ${mode === "create" ? "create" : "update"} configuration. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessingConfig(false);
    }
  };

  const handleSelectDatabase = (database: DatabaseType) => {
    setSelectedDatabase(database);
  };

  const onDatabaseSubmit = (data: DatabaseCredentials) => {
    createDatabase(data);
  };

  const onConfigSubmit = (data: IndexingConfig) => {
    processConfiguration(data);
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "Copied",
      description: "Webhook URL copied to clipboard",
    });
  };

  const handleDialogClose = () => {
    if (step === 3 && webhookUrl && onSuccess) {
      onSuccess({ webhookUrl });
    }
    onOpenChange(false);
  };

  const resetSteps = () => {
    setStep(1);
    databaseForm.reset();
    configForm.reset({
      name: "",
      categories: [],
      network: BlockchainNetwork.SOLANA_MAINNET,
      enabled: true,
      credentialId: "",
    });
    setSelectedDatabase(null);
  };

  const renderDatabaseSelection = () => {
    if (isLoadingDatabases) {
      return (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center space-x-4 p-4 border rounded-md"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredDatabases.length === 0) {
      return (
        <div className="text-center p-6 border border-dashed rounded-md">
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "No databases match your search criteria."
              : "No databases found. Create a new one below."}
          </p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-auto pr-4" ref={databasesRef}>
        <div className="space-y-3">
          {filteredDatabases.map((db) => (
            <div
              key={db.id}
              data-id={db.id}
              className={`flex items-center space-x-4 p-4 border rounded-md cursor-pointer transition-colors ${
                selectedDatabase?.id === db.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-border hover:bg-accent/50"
              }`}
              onClick={() => handleSelectDatabase(db)}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{db.database}</p>
                <p className="text-sm text-muted-foreground">
                  {db.host}:{db.port} • {db.username}
                </p>
              </div>
              {selectedDatabase?.id === db.id ||
                (existingData?.credentialId === db.id && (
                  <Check className="h-5 w-5 text-primary" />
                ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? (
              <>
                {step === 1 && "Step 1: Connect Database Or Create"}
                {step === 2 && "Step 2: Create Indexing Configuration"}
                {step === 3 && "Configuration Complete"}
              </>
            ) : (
              "Edit Indexing Configuration"
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? (
              <>
                {step === 1 &&
                  "Connect to your Postgres database or select an existing one."}
                {step === 2 &&
                  "Configure what blockchain data you want to index."}
                {step === 3 &&
                  "Your configuration is ready. Use the webhook URL to start indexing."}
              </>
            ) : (
              "Update your indexing configuration settings."
            )}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      Select Existing Database
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshDatabases}
                      disabled={isRefreshingDatabases}
                      className="h-8"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 mr-1 ${isRefreshingDatabases ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search databases..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {renderDatabaseSelection()}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or create new
                    </span>
                  </div>
                </div>

                <Form {...databaseForm}>
                  <form
                    onSubmit={databaseForm.handleSubmit(onDatabaseSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={databaseForm.control}
                        name="host"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Host</FormLabel>
                            <FormControl>
                              <Input placeholder="localhost" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={databaseForm.control}
                        name="port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Port</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={databaseForm.control}
                      name="database"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Database Name</FormLabel>
                          <FormControl>
                            <Input placeholder="blockchain_data" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={databaseForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="postgres" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={databaseForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={databaseForm.control}
                      name="ssl"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Use SSL</FormLabel>
                            <FormDescription>
                              Connect to database using SSL/TLS encryption
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              <DialogFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  {selectedDatabase ? (
                    <Button onClick={() => setStep(2)}>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={databaseForm.handleSubmit(onDatabaseSubmit)}
                      disabled={isCreatingDatabase}
                    >
                      {isCreatingDatabase && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isCreatingDatabase
                        ? "Connecting..."
                        : "Connect Or Create Database"}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: mode === "create" ? 20 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "create" ? -20 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6 py-4">
                {/* Database Selection in Edit Mode */}
                {mode === "edit" && (
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        Database Connection
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshDatabases}
                        disabled={isRefreshingDatabases}
                        className="h-8"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 mr-1 ${isRefreshingDatabases ? "animate-spin" : ""}`}
                        />
                        Refresh
                      </Button>
                    </div>

                    <div className="relative mb-4">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search databases..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {renderDatabaseSelection()}
                  </div>
                )}

                {mode === "create" && selectedDatabase && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Database className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedDatabase.database}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedDatabase.host}:{selectedDatabase.port} •{" "}
                            {selectedDatabase.username}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Form {...configForm}>
                  <form
                    onSubmit={configForm.handleSubmit(onConfigSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={configForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Configuration Name</FormLabel>
                          <FormControl>
                            <Input placeholder="NFT Price Indexer" {...field} />
                          </FormControl>
                          <FormDescription>
                            A descriptive name for your indexing configuration
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="categories"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>Indexing Categories</FormLabel>
                            <FormDescription>
                              Select what blockchain data you want to index
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.values(IndexingCategory).map((category) => (
                              <FormField
                                key={category}
                                control={configForm.control}
                                name="categories"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={category}
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            category
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...field.value,
                                                  category,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== category
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        {category.replace(/_/g, " ")}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="network"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blockchain Network</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a network" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(BlockchainNetwork).map(
                                (network) => (
                                  <SelectItem key={network} value={network}>
                                    {network.replace(/_/g, " ")}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The blockchain network to index data from
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Enable Indexing</FormLabel>
                            <FormDescription>
                              {mode === "create"
                                ? "Start indexing data immediately after creation"
                                : "Enable or disable this indexing configuration"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              <DialogFooter className="flex justify-between">
                {mode === "create" ? (
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={configForm.handleSubmit(onConfigSubmit)}
                  disabled={isProcessingConfig}
                  className={
                    mode === "edit" ? "bg-primary hover:bg-primary/90" : ""
                  }
                >
                  {isProcessingConfig && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isProcessingConfig
                    ? mode === "create"
                      ? "Creating..."
                      : "Updating..."
                    : mode === "create"
                      ? "Create Configuration"
                      : "Update Configuration"}
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === 3 && mode === "create" && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-4"
            >
              <div className="flex flex-col items-center justify-center space-y-6 py-8">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">
                    Configuration Created Successfully
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your indexing configuration has been created. Use the
                    webhook URL below to start indexing data.
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <p className="text-sm font-medium">Webhook URL</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-muted rounded-md font-mono text-xs overflow-x-auto">
                      {webhookUrl}
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyWebhookUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="w-full p-4 border border-border/50 rounded-md bg-muted/50 space-y-3">
                  <h4 className="font-medium">Next Steps</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Copy the webhook URL above</li>
                    <li>Go to the Helius dashboard and create a new webhook</li>
                    <li>
                      Paste the URL and select the events you want to receive
                    </li>
                    <li>Save the webhook configuration</li>
                  </ol>
                  <Button variant="link" className="p-0 h-auto text-sm" asChild>
                    <a
                      href="https://docs.helius.dev/data-streaming/webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn more about Helius webhooks{" "}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <Button variant="outline" onClick={resetSteps}>
                  Create Another
                </Button>
                <Button onClick={handleDialogClose}>Done</Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
