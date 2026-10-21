-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "publicApiKey" TEXT NOT NULL,
    "adminApiKey" TEXT NOT NULL,
    "adminKeyHash" TEXT,
    "webhookSecret" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "branding" TEXT,
    "defaultVpa" TEXT,
    "allowClientPricing" BOOLEAN NOT NULL DEFAULT false,
    "maxOffsetPaise" INTEGER NOT NULL DEFAULT 25,
    "activeWindowMs" INTEGER NOT NULL DEFAULT 300000,
    "verifyWindowMs" INTEGER NOT NULL DEFAULT 30000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReceivingAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "vpa" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "isSlotBusy" BOOLEAN NOT NULL DEFAULT false,
    "dailyLimitPaise" INTEGER NOT NULL DEFAULT 10000000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReceivingAccount_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mobileNumber" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "riskTier" TEXT NOT NULL DEFAULT 'LOW',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomerSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT,
    "receivingAccountId" TEXT,
    "orderId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "description" TEXT,
    "customerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "queuePosition" INTEGER,
    "utr" TEXT,
    "verificationTier" INTEGER NOT NULL DEFAULT 0,
    "observationSources" TEXT,
    "expiresAt" DATETIME,
    "activatedAt" DATETIME,
    "processingAt" DATETIME,
    "settledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentSession_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PaymentSession_receivingAccountId_fkey" FOREIGN KEY ("receivingAccountId") REFERENCES "ReceivingAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "rawText" TEXT,
    "parsedAmountPaise" INTEGER,
    "parsedUtr" TEXT,
    "senderVpa" TEXT,
    "receivingAccountId" TEXT,
    "paymentSessionId" TEXT,
    "clusterHash" TEXT,
    "verificationTier" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Observation_receivingAccountId_fkey" FOREIGN KEY ("receivingAccountId") REFERENCES "ReceivingAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Observation_paymentSessionId_fkey" FOREIGN KEY ("paymentSessionId") REFERENCES "PaymentSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "signingKeyHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastHeartbeatAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Device_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT,
    "paymentSessionId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "requestId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_paymentSessionId_fkey" FOREIGN KEY ("paymentSessionId") REFERENCES "PaymentSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentSessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" DATETIME,
    "responseCode" INTEGER,
    "responseError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WebhookDelivery_paymentSessionId_fkey" FOREIGN KEY ("paymentSessionId") REFERENCES "PaymentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_publicApiKey_key" ON "Merchant"("publicApiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_adminApiKey_key" ON "Merchant"("adminApiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_adminKeyHash_key" ON "Merchant"("adminKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivingAccount_merchantId_vpa_key" ON "ReceivingAccount"("merchantId", "vpa");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_mobileNumber_key" ON "Customer"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSession_token_key" ON "CustomerSession"("token");

-- CreateIndex
CREATE INDEX "CustomerSession_customerId_idx" ON "CustomerSession"("customerId");

-- CreateIndex
CREATE INDEX "PaymentSession_merchantId_status_idx" ON "PaymentSession"("merchantId", "status");

-- CreateIndex
CREATE INDEX "PaymentSession_receivingAccountId_status_idx" ON "PaymentSession"("receivingAccountId", "status");

-- CreateIndex
CREATE INDEX "PaymentSession_orderId_idx" ON "PaymentSession"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Observation_clusterHash_key" ON "Observation"("clusterHash");

-- CreateIndex
CREATE INDEX "Observation_receivingAccountId_idx" ON "Observation"("receivingAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- CreateIndex
CREATE INDEX "AuditLog_merchantId_createdAt_idx" ON "AuditLog"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDelivery_deliveryId_key" ON "WebhookDelivery"("deliveryId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_paymentSessionId_idx" ON "WebhookDelivery"("paymentSessionId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_nextRetryAt_idx" ON "WebhookDelivery"("status", "nextRetryAt");
