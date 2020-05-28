# Migration `20200528170656-init`

This migration has been generated at 5/28/2020, 5:06:56 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
CREATE TABLE `kkm2`.`Service` (
`id` int NOT NULL  AUTO_INCREMENT,`numberOfAllowedVisitors` int NOT NULL  ,`registrationStartsAt` datetime(3)   ,`startsAt` datetime(3) NOT NULL  ,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci

CREATE TABLE `kkm2`.`Visitor` (
`id` int NOT NULL  AUTO_INCREMENT,`name` varchar(191) NOT NULL  ,`serviceId` int NOT NULL ,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci

ALTER TABLE `kkm2`.`Visitor` ADD FOREIGN KEY (`serviceId`) REFERENCES `kkm2`.`Service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration ..20200528170656-init
--- datamodel.dml
+++ datamodel.dml
@@ -1,0 +1,26 @@
+// This is your Prisma schema file,
+// learn more about it in the docs: https://pris.ly/d/prisma-schema
+
+datasource db {
+  provider = "mysql"
+  url      = env("DATABASE_URL")
+}
+
+generator client {
+  provider = "prisma-client-js"
+}
+
+model Service {
+  id                      Int       @default(autoincrement()) @id
+  startsAt                DateTime
+  registrationStartsAt    DateTime?
+  numberOfAllowedVisitors Int
+  visitors                Visitor[]
+}
+
+model Visitor {
+  id        Int     @default(autoincrement()) @id
+  name      String
+  service   Service @relation(fields: [serviceId], references: [id])
+  serviceId Int
+}
```


