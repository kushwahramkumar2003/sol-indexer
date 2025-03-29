-- AlterTable
ALTER TABLE "indexing_configurations" ADD COLUMN     "databaseCredentialId" TEXT;

-- AddForeignKey
ALTER TABLE "indexing_configurations" ADD CONSTRAINT "indexing_configurations_databaseCredentialId_fkey" FOREIGN KEY ("databaseCredentialId") REFERENCES "database_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
