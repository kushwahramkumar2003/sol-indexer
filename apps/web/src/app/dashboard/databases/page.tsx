"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Server,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  createDatabaseHand,
  deleteDatabaseHandler,
  getAllDatabases,
  getDatabaseById,
  updateDatabaseHandler,
} from "@/services/credentials.services";

const createDatabaseCredentialsSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().positive("Port must be a positive integer"),
  database: z.string().min(1, "Database name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  ssl: z.boolean().default(true),
});

const updateDatabaseCredentialsSchema = z.object({
  id: z.string(),
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().positive("Port must be a positive integer"),
  database: z.string().min(1, "Database name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  ssl: z.boolean().default(true),
});

type DatabaseCredential = {
  id: string;
  host: string;
  port: number;
  database: string;
  username: string;
  createdAt: string;
};

type DatabaseCredentialFull = DatabaseCredential & {
  password: string;
  ssl: boolean;
};

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<DatabaseCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] =
    useState<DatabaseCredential | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const addForm = useForm<z.infer<typeof createDatabaseCredentialsSchema>>({
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

  const editForm = useForm<z.infer<typeof updateDatabaseCredentialsSchema>>({
    resolver: zodResolver(updateDatabaseCredentialsSchema),
    defaultValues: {
      id: "",
      host: "",
      port: 5432,
      database: "",
      username: "",
      password: "",
      ssl: true,
    },
  });

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (!isAddDialogOpen) {
      addForm.reset();
    }
  }, [isAddDialogOpen, addForm]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      editForm.reset();
    }
  }, [isEditDialogOpen, editForm]);

  useEffect(() => {
    if (selectedDatabase && isEditDialogOpen) {
      fetchDatabaseById(selectedDatabase.id);
    }
  }, [selectedDatabase, isEditDialogOpen]);

  const filteredDatabases = databases.filter(
    (db) =>
      db.database.toLowerCase().includes(searchQuery.toLowerCase()) ||
      db.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      db.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchDatabases = async () => {
    setIsLoading(true);
    try {
      const res = await getAllDatabases();

      if (res.error) {
        throw new Error(res.error.message);
      }

      const mockDatabases: DatabaseCredential[] = res.data.data;

      setDatabases(mockDatabases);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch databases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDatabases = async () => {
    setIsRefreshing(true);
    try {
      await fetchDatabases();
      toast({
        title: "Refreshed",
        description: "Database list has been refreshed.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchDatabaseById = async (id: string) => {
    try {
      const res = await getDatabaseById({ id });

      if (res.error) {
        throw new Error(res.error.message);
      }

      const mockDatabase: DatabaseCredentialFull = res.data.data;

      editForm.reset({
        id: mockDatabase.id,
        host: mockDatabase.host,
        port: mockDatabase.port,
        database: mockDatabase.database,
        username: mockDatabase.username,
        password: mockDatabase.password,
        ssl: mockDatabase.ssl,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch database details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addDatabase = async (
    data: z.infer<typeof createDatabaseCredentialsSchema>
  ) => {
    try {
      const res = await createDatabaseHand(data);

      if (res.error) {
        throw new Error(res.error.message);
      }

      const newDatabase: DatabaseCredential = res.data.data;

      setDatabases([...databases, newDatabase]);
      setIsAddDialogOpen(false);
      toast({
        title: "Database Added",
        description: "Database credentials have been added successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add database. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateDatabase = async (
    data: z.infer<typeof updateDatabaseCredentialsSchema>
  ) => {
    try {
      const res = await updateDatabaseHandler(data);

      if (res.error) {
        throw new Error(res.error.message);
      }

      const updatedDatabases = databases.map((db) =>
        db.id === data.id
          ? {
              ...db,
              host: data.host,
              port: data.port,
              database: data.database,
              username: data.username,
              ssl: data.ssl,
              createdAt: db.createdAt,
            }
          : db
      );
      setDatabases(updatedDatabases);
      setIsEditDialogOpen(false);
      toast({
        title: "Database Updated",
        description: "Database credentials have been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update database. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteDatabase = async () => {
    if (!selectedDatabase) return;

    try {
      const res = await deleteDatabaseHandler({ id: selectedDatabase.id });

      if (res.error) {
        throw new Error(res.error.message);
      }

      const updatedDatabases = databases.filter(
        (db) => db.id !== selectedDatabase.id
      );
      setDatabases(updatedDatabases);
      setIsDeleteDialogOpen(false);
      setSelectedDatabase(null);
      toast({
        title: "Database Deleted",
        description: "Database credentials have been deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete database. Please try again.",
        variant: "destructive",
      });
    }
  };

  const testConnection = async (
    data: z.infer<typeof createDatabaseCredentialsSchema>
  ) => {
    setIsTestingConnection(true);
    setConnectionStatus("testing");
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const isSuccess = Math.random() > 0.2;
      if (isSuccess) {
        setConnectionStatus("success");
        toast({
          title: "Connection Successful",
          description: "Successfully connected to the database.",
          variant: "default",
        });
      } else {
        setConnectionStatus("error");
        toast({
          title: "Connection Failed",
          description:
            "Failed to connect to the database. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus("error");
      toast({
        title: "Connection Error",
        description: "An error occurred while testing the connection.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
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
            Database Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your Postgres database connections for blockchain indexing
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Database
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
              <CardTitle>Database Connections</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search databases..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={refreshDatabases}
                  disabled={isRefreshing || isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
            <CardDescription>
              {databases.length}{" "}
              {databases.length === 1 ? "database" : "databases"} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            ) : filteredDatabases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Server className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Databases Found</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  {searchQuery
                    ? "No databases match your search criteria. Try a different search term."
                    : "You haven't added any database connections yet. Add one to get started."}
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                ) : (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Database
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Database Name</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredDatabases.map((db, index) => (
                        <motion.tr
                          key={db.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="group"
                        >
                          <TableCell className="font-medium">
                            {db.database}
                          </TableCell>
                          <TableCell>
                            {db.host}:{db.port}
                          </TableCell>
                          <TableCell>{db.username}</TableCell>
                          <TableCell>{formatDate(db.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedDatabase(db);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedDatabase(db);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Database Connection</DialogTitle>
            <DialogDescription>
              Connect to your Postgres database for blockchain data indexing.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            </TabsList>
            <Form {...addForm}>
              <form
                onSubmit={addForm.handleSubmit(addDatabase)}
                className="space-y-6 py-4"
              >
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="localhost or db.example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
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
                    control={addForm.control}
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
                      control={addForm.control}
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
                      control={addForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {showPassword
                                  ? "Hide password"
                                  : "Show password"}
                              </span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <FormField
                    control={addForm.control}
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

                  <div className="rounded-md border p-4">
                    <h4 className="text-sm font-medium mb-2">
                      Connection Status
                    </h4>
                    <div className="flex items-center gap-2 mb-4">
                      {connectionStatus === "idle" && (
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground"
                        >
                          Not Tested
                        </Badge>
                      )}
                      {connectionStatus === "testing" && (
                        <Badge
                          variant="outline"
                          className="bg-primary/20 text-primary"
                        >
                          Testing...
                        </Badge>
                      )}
                      {connectionStatus === "success" && (
                        <Badge
                          variant="outline"
                          className="bg-green-500/20 text-green-500"
                        >
                          Connected
                        </Badge>
                      )}
                      {connectionStatus === "error" && (
                        <Badge
                          variant="outline"
                          className="bg-red-500/20 text-red-500"
                        >
                          Connection Failed
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => testConnection(addForm.getValues())}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing Connection...
                        </>
                      ) : (
                        <>
                          <Server className="mr-2 h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Database</Button>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Database Connection</DialogTitle>
            <DialogDescription>
              Update your Postgres database connection details.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            </TabsList>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(updateDatabase)}
                className="space-y-6 py-4"
              >
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="localhost or db.example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
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
                    control={editForm.control}
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
                      control={editForm.control}
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
                      control={editForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {showPassword
                                  ? "Hide password"
                                  : "Show password"}
                              </span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <FormField
                    control={editForm.control}
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

                  <div className="rounded-md border p-4">
                    <h4 className="text-sm font-medium mb-2">
                      Connection Status
                    </h4>
                    <div className="flex items-center gap-2 mb-4">
                      {connectionStatus === "idle" && (
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground"
                        >
                          Not Tested
                        </Badge>
                      )}
                      {connectionStatus === "testing" && (
                        <Badge
                          variant="outline"
                          className="bg-primary/20 text-primary"
                        >
                          Testing...
                        </Badge>
                      )}
                      {connectionStatus === "success" && (
                        <Badge
                          variant="outline"
                          className="bg-green-500/20 text-green-500"
                        >
                          Connected
                        </Badge>
                      )}
                      {connectionStatus === "error" && (
                        <Badge
                          variant="outline"
                          className="bg-red-500/20 text-red-500"
                        >
                          Connection Failed
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => testConnection(editForm.getValues())}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing Connection...
                        </>
                      ) : (
                        <>
                          <Server className="mr-2 h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update Database</Button>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the database connection for{" "}
              <span className="font-medium">{selectedDatabase?.database}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDatabase}
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
