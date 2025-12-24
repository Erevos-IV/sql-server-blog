const blogPosts = [
    {
        id: 12,
        title: "SQL Server 2025: Critical Known Issues (Dec 2025)",
        category: "dba",
        categoryColor: "green-400",
        date: "Dec 24, 2025",
        readTime: "6 min",
        author: "Billy Gousetis",
        summary: "Before you upgrade, read this. From TLS 1.2 blocking installations to ZSTD configuration errors, here are the top known issues in SQL Server 2025.",
        content: `
# SQL Server 2025: What Breaks?

Every new release comes with teething issues. SQL Server 2025 is no exception. Before you deploy it to your sandbox or production, be aware of these critical known issues documented by Microsoft.

### 1. Installation Fails without TLS 1.2
**The Issue:** If you have disabled TLS 1.2 on your server (perhaps to enforce TLS 1.3 exclusively), the SQL Server 2025 installation **will fail**.
**The Fix:** You must enable TLS 1.2 in the registry before starting the installation. You can disable it again after (though verify connectivity).

### 2. In-Place Upgrade & C++ Redistributable
**The Issue:** Upgrading from SQL 2016/2017 may fail if the **Microsoft Visual C++ Redistributable for Visual Studio 2022** is missing or outdated.
**The Error:** You will see a log entry stating: *"This application requires Microsoft Visual C++ Redistributable... version 14.34 at minimum."*
**The Fix:** Manually install the latest C++ Redistributable before running the SQL Setup.

### 3. The 64-Core NUMA Limit
**The Issue:** SQL Server instances on Windows might fail to start if the machine has more than **64 logical cores per NUMA node**.
**The Fix:** This is a hard limit in the current build. You may need to adjust your BIOS/Virtualization settings to split cores into multiple NUMA nodes.

### 4. ZSTD Backup Compression Configuration
**The Issue:** While ZSTD is a great new feature, you cannot set it as the *default* server configuration using \`sp_configure\`.
**The Error:** Running \`sp_configure 'backup compression algorithm', 3\` returns *Msg 15129: '3' is not a valid value.*
**The Workaround:** You must specify it manually in your backup command:
\`\`\`sql
BACKUP DATABASE [MyDB] 
TO DISK = 'C:\\Backups\\MyDB.bak' 
WITH COMPRESSION (ALGORITHM = ZSTD);
\`\`\`

### 5. Linux Limitations
* **Database Mail:** Does not work if "Strict Encryption" is enforced.
* **SQLPS Module:** Does not work if "Strict Encryption" is enforced.
* **ONNX Models:** Local ONNX models are currently not supported on Linux.

### References
* [SQL Server 2025 Known Issues - Microsoft Learn](https://learn.microsoft.com/en-us/sql/sql-server/sql-server-2025-known-issues?view=sql-server-ver17)
        `
    },
    {
        id: 11,
        title: "Decoding Wait Statistics: The Pulse of Your Database",
        category: "performance",
        categoryColor: "primary",
        date: "Dec 07, 2025",
        readTime: "7 min",
        author: "Billy Gousetis",
        summary: "High CPU? Slow disks? Stop guessing. Learn how to use Wait Statistics to pinpoint exactly why SQL Server is running slow.",
        content: `
# Stop Guessing. Start Measuring.

When a server is slow, the amateur looks at **Task Manager**. The professional looks at **Wait Statistics**.

SQL Server tracks every millisecond it spends waiting for resources. Whether it's waiting for a disk to read a page, a lock to be released, or a CPU core to become available, it's all recorded in \`sys.dm_os_wait_stats\`.

### The "Big Three" Waits

If you tune a server, you will likely run into these three. Here is what they mean:

#### 1. CXPACKET
**The Myth:** "It means Parallelism is bad."
**The Reality:** It just means your query is using multiple cores. However, if it is excessive (over 50% of total waits), it usually means your **Cost Threshold for Parallelism** is too low (default is 5). Bump it to 50.

#### 2. PAGEIOLATCH_SH
**The Meaning:** SQL Server is waiting to read a data page from disk into memory.
**The Fix:** This is a physical I/O bottleneck. 
1. Check if you have enough RAM (is **Page Life Expectancy** dropping?).
2. Tune the query to read fewer pages (Indexing!).
3. Check storage latency.

#### 3. LCK_M_... (Blocking)
**The Meaning:** Process A is holding a lock that Process B needs.
**The Fix:** This is almost always a code issue. Look for long-running transactions, implicit transactions left open, or queries scanning too much data (escalating row locks to table locks).

### The Diagnostic Script

Don't just run \`SELECT * FROM sys.dm_os_wait_stats\`. That shows cumulative data since the last restart. You need to know what is hurting you *right now*.

Use this script to see the top waits on your server:

\`\`\`sql
WITH [Waits] AS
    (SELECT
        [wait_type],
        [wait_time_ms] / 1000.0 AS [WaitS],
        ([wait_time_ms] - [signal_wait_time_ms]) / 1000.0 AS [ResourceS],
        [signal_wait_time_ms] / 1000.0 AS [SignalS],
        [waiting_tasks_count] AS [WaitCount],
        100.0 * [wait_time_ms] / SUM ([wait_time_ms]) OVER() AS [Percentage],
        ROW_NUMBER() OVER(ORDER BY [wait_time_ms] DESC) AS [RowNum]
    FROM sys.dm_os_wait_stats
    WHERE [wait_type] NOT IN (
        -- Filter out benign background waits
        'BROKER_TASK_STOP', 'CLR_AUTO_EVENT', 'CLR_MANUAL_EVENT', 
        'DIRTY_PAGE_POLL', 'HADR_FILESTREAM_IOMGR_IOCOMPLETION', 
        'LAZYWRITER_SLEEP', 'LOGMGR_QUEUE', 'ONDEMAND_TASK_QUEUE',
        'REQUEST_FOR_DEADLOCK_SEARCH', 'SLEEP_TASK', 'TRACE_WRITE', 
        'WAITFOR', 'CHECKPOINT_QUEUE', 'XE_TIMER_EVENT'
    ))
SELECT
    [W1].[wait_type] AS [WaitType],
    CAST ([W1].[WaitS] AS DECIMAL (16, 2)) AS [Wait_S],
    CAST ([W1].[ResourceS] AS DECIMAL (16, 2)) AS [Resource_S],
    CAST ([W1].[SignalS] AS DECIMAL (16, 2)) AS [Signal_S],
    [W1].[WaitCount] AS [WaitCount],
    CAST ([W1].[Percentage] AS DECIMAL (5, 2)) AS [Percentage]
FROM [Waits] AS [W1]
INNER JOIN [Waits] AS [W2] ON [W2].[RowNum] <= [W1].[RowNum]
GROUP BY [W1].[RowNum], [W1].[wait_type], [W1].[WaitS], 
         [W1].[ResourceS], [W1].[SignalS], [W1].[WaitCount], [W1].[Percentage]
HAVING SUM ([W2].[Percentage]) - [W1].[Percentage] < 95; -- Top 95%
\`\`\`

### References
* [sys.dm_os_wait_stats (Transact-SQL) - Microsoft Learn](https://learn.microsoft.com/en-us/sql/relational-databases/system-dynamic-management-views/sys-dm-os-wait-stats-transact-sql)
* [SQLskills Wait Types Library](https://www.sqlskills.com/help/waits/)
        `
    },
    {
        id: 9,
        title: "How to Install SSMS Offline (Air-Gapped Servers)",
        category: "dba",
        categoryColor: "green-400",
        date: "Dec 04, 2025",
        readTime: "5 min",
        author: "Billy Gousetis",
        summary: "Need to install SQL Server Management Studio on a server without internet? Here is the step-by-step guide to creating a local layout.",
        content: `
# Installing SSMS on Secure Servers

In many enterprise environments (Banking, Defense, Healthcare), database servers are **air-gapped**—they have absolutely no internet access. 

Simply copying the \`SSMS-Setup-ENU.exe\` file is not enough. The installer is just a "bootstrapper" that tries to download the actual packages during installation. If it can't reach the internet, it fails.

Here is how to create a full offline layout.

### Step 1: Download the Bootstrapper
On a machine **with** internet access, download the latest SSMS installer from Microsoft. Let's assume it's saved to \`C:\\Downloads\\SSMS-Setup-ENU.exe\`.

### Step 2: Create the Offline Layout
You cannot just copy the exe. You must tell it to download *all* dependent components into a local folder.

1. Open **Command Prompt (CMD)** as Administrator.
2. Navigate to your download folder:
   \`\`\`cmd
   cd C:\\Downloads
   \`\`\`
3. Run the layout command:
   \`\`\`cmd
   SSMS-Setup-ENU.exe /layout "C:\\SSMS_Offline"
   \`\`\`
   *Replace \`C:\\SSMS_Offline\` with your desired folder path.*

The installer will launch a GUI window. It might look like it's installing, but it is actually downloading the packages (Payloads) to your specified folder. **Wait until it says "Setup Completed"**.

### Step 3: Transfer to the Server
1. You will now have a folder (e.g., \`C:\\SSMS_Offline\`) containing the \`.exe\` and a \`Payload\` folder.
2. Zip this entire folder.
3. Move it to your secure, offline server using your company's approved method (USB, Secure File Transfer, etc.).

### Step 4: Install on the Offline Server
1. Unzip the folder on the destination server (e.g. to \`C:\\SSMS_Layout\`).
2. **Crucial Step:** Before running setup, ensure you have the correct Root Certificates installed. 
   *(See my previous post: [Fix: SSMS Offline Installation Certificate Error](#))*
3. Run the following command to execute the installation without web access:
   \`\`\`cmd
   C:\\SSMS_Layout\\vs_SSMS.exe --noWeb --add Microsoft.Component.HelpViewer
   \`\`\`
4. It will now detect the local \`Payload\` folder and install without trying to connect to the internet.

### References
* [Install SQL Server Management Studio (SSMS) - Microsoft Learn](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
* [Create an offline installation of SSMS](https://learn.microsoft.com/en-us/ssms/install/create-offline)
        `
    },
    {
        id: 8,
        title: "SQL Server 2025 is Here: The Real Breakdown",
        category: "dba",
        categoryColor: "green-400",
        date: "Dec 02, 2025",
        readTime: "4 min",
        author: "Billy Gousetis",
        summary: "Native Vectors, ZSTD Compression, and a massive buff to Standard Edition. Here is the no-fluff breakdown of what actually matters in SQL Server 2025.",
        content: `
# SQL Server 2025 is Here

It’s officially here. If you haven't had time to dig through the release notes, here is the breakdown of what actually matters in SQL Server 2025.

Microsoft is clear: **Bring the AI to the data, not the data to the AI.**

### The Top 3 Developer Features
1. **Native Vectors:** We finally have a \`VECTOR\` data type. You can store embeddings and run semantic search directly in the engine. No more ETLing data to a niche vector DB.
2. **Native RegEx:** Goodbye, CLR functions. You can now use standard \`REGEXP_LIKE\` and \`REGEXP_REPLACE\` natively in T-SQL.
3. **True JSON Data Type:** JSON is no longer just \`NVARCHAR(MAX)\`. It is now a native binary data type with dedicated locking and compression.

### Quality Upgrades
1. **Standard Edition Buff:** This is huge. The limits have been raised to **32 Cores** (up from 24) and **256GB RAM** (up from 128GB).
2. **ZSTD Backup Compression:** A new compression algorithm that generally beats \`MS_XPRESS\` for speed and ratio on large datasets.
3. **TempDB Governance:** You can now "sandbox" noisy queries to prevent them from hogging TempDB and causing spills that hurt everyone else.

### Deprecated
* **Web Edition:** Officially discontinued. If you're on it, it's time to look at Standard or Azure SQL.
        `
    },
    {
        id: 7,
        title: "SQL Server 2022: Day 1 Configuration Checklist",
        category: "dba",
        categoryColor: "green-400",
        date: "Dec 01, 2025",
        readTime: "5 min",
        author: "Billy Gousetis",
        summary: "SQL Server 2022 is a beast, but out of the box, it’s sleeping. Here is my 'Day 1' configuration checklist to unlock 40% more performance immediately.",
        content: `
# SQL Server 2022 is a Beast. Wake it up.

We often talk about the new features in SQL Server 2022 - Intelligent Query Processing, Parameter Sensitive Plan optimization, etc. But if you install it with "Next, Next, Finish" defaults, you are leaving **40% of the performance on the table**.

Here is my "Day 1" configuration checklist for any new High-Performance instance.

### OS Level
1. **Power Plan:** "High Performance." Stop letting Windows throttle your CPU voltage through the Balanced Plan.
2. **IFI (Instant File Initialization):** Enabled. Don't make SQL write zeros to disk every time a file grows.
3. **Allocation Unit:** 64KB. Align your disk with SQL Server Extents (THIS SHOULD BE DONE BEFORE INSTALLING THE NEW INSTANCE).

### Engine Level
4. **Max Server Memory:** Cap it! Leave 4GB+ for the OS. If you leave this default, the OS will eventually panic and paging will kill your performance.
5. **MaxDOP:** Set to 8 (or match your NUMA node). The default (0) uses all cores for one query, which creates massive scheduling contention.
6. **Cost Threshold for Parallelism:** Bump it to 50. The default value (5) is from the 1990s.

### Version 2022 Specifics
* **Compat Level:** 160. Required to unlock the new magic.
* **Query Store:** It's on by default now (finally!), but change Capture Mode to **AUTO**. Don't let "ALL" fill your drive with trivial \`SELECT 1\` queries.

> **HINT:** Do your own research, and never trust a random guy on the internet. Testing before pushing to production is ESSENTIAL!

*(Stay tuned for my detailed Version 2025 hands-on post... once I finally get access to the bits!)*
        `
    },
    {
        id: 6,
        title: "Advanced Performance Tuning: Beyond Indexes",
        category: "performance",
        categoryColor: "primary",
        date: "Nov 30, 2025",
        readTime: "12 min",
        author: "Billy Gousetis",
        summary: "You have optimized every query and built every index, but the server is still struggling. It's time to look at the architecture: Partitioning, Archiving, and VLDB strategies.",
        content: `
# When Indexing is Not Enough

Every DBA knows the drill: capture the slow query, analyze the execution plan, add a missing index, and watch performance improve. But what happens when you have optimized every query, yet the system is still slowing down?

This usually happens when your **data volume** outgrows your **hardware capabilities**. When a table hits 100GB, 500GB, or 1TB, simple B-Tree indexing stops being a magic bullet. Maintenance windows exceed their time limits, and backups take forever.

Here are the advanced architectural strategies you need to implement when you enter the realm of **VLDBs (Very Large Databases)**.

### 1. Table Partitioning
Partitioning allows you to split a single large table into smaller, manageable chunks (partitions) based on a column (usually a date).

**Why it helps:**
* **Partition Elimination:** If you query \`WHERE OrderDate = '2025-01-01'\`, SQL Server only scans the partition for 2025, ignoring the terabytes of data from 2015-2024.
* **Maintenance:** You can rebuild indexes on just the *active* partition (current month) without locking the historical data.
* **Switching:** You can archive data instantly using \`SWITCH PARTITION\`, which is a metadata-only operation (milliseconds) compared to a massive \`DELETE\` (hours).

\`\`\`sql
-- Example: Creating a Partition Function
CREATE PARTITION FUNCTION [PF_Yearly] (datetime)
AS RANGE RIGHT FOR VALUES ('2023-01-01', '2024-01-01', '2025-01-01');
\`\`\`

### 2. Data Archiving (Cold Storage)
Do you really need 10 years of sales history in your primary transactional database? Probably not. The active application likely only touches the last 12-24 months.

**The Strategy:**
1.  Create a separate **Archive Database** (on cheaper storage).
2.  Use SSIS, Azure Data Factory, or T-SQL scripts to move data older than X years to the Archive DB.
3.  Delete the old data from the Production DB (using batch deletes to minimize transaction log growth).

**Benefit:** Your active indexes become smaller, RAM usage becomes more efficient, and backups become significantly faster.

### 3. Columnstore Indexes
If you are running analytical queries (SUM, AVG, COUNT) on millions of rows, standard Row-Store indexes are inefficient.

**Clustered Columnstore Indexes (CCI)** store data by column rather than by row. This allows for:
* **Massive Compression:** Up to 10x smaller footprint.
* **Batch Mode Execution:** Processing rows in batches of 900, speeding up aggregations by 10x-100x.

\`\`\`sql
-- Convert a large fact table to Columnstore
CREATE CLUSTERED COLUMNSTORE INDEX [CCI_FactSales] ON [FactSales];
\`\`\`

### 4. Data Compression
If you are I/O bound, enabling Page Compression can be a quick win. It trades a small amount of CPU for a significant reduction in Disk I/O.

\`\`\`sql
ALTER INDEX [IX_LargeTable] ON [LargeTable] REBUILD WITH (DATA_COMPRESSION = PAGE);
\`\`\`

### References
* [Partitioned Tables and Indexes - Microsoft Learn](https://learn.microsoft.com/en-us/sql/relational-databases/partitions/partitioned-tables-and-indexes)
* [Columnstore Indexes: Overview](https://learn.microsoft.com/en-us/sql/relational-databases/indexes/columnstore-indexes-overview)
* [Data Compression](https://learn.microsoft.com/en-us/sql/relational-databases/data-compression/data-compression)
        `
    },
    {
        id: 5,
        title: "SQL Server 2025: Native Vector Support & AI",
        category: "tsql",
        categoryColor: "secondary",
        date: "Nov 29, 2025",
        readTime: "5 min",
        author: "Billy Gousetis",
        summary: "Native support for Vector data types, AI integration, and Regular Expressions are finally here. Here is what you need to know about SQL Server 2025.",
        content: `
# SQL Server 2025 is Here

Microsoft has announced SQL Server 2025 (17.x), and it is packed with features that bridge the gap between traditional relational data and the AI revolution.

### 1. Native Vector Support
This is the game-changer. SQL Server now supports a native **Vector** data type, making it a viable vector database for RAG (Retrieval-Augmented Generation) applications.
- **New Data Type:** \`VECTOR(dimensions)\`
- **Functions:** \`VECTOR_DISTANCE\`, \`VECTOR_NORM\` for similarity search.
- **Indexing:** Dedicated vector indexes for high-performance similarity queries.

### 2. Regular Expressions (Regex)
Finally! We no longer need CLR integration for complex string matching. Native Regex functions are now built directly into the engine:
\`\`\`sql
-- Example of new Regex capability
SELECT * FROM Users 
WHERE REGEXP_LIKE(Email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
\`\`\`

### 3. Optimized Locking
SQL Server 2025 reduces lock memory consumption and avoids lock escalation for many workloads. This borrows the "Optimized Locking" architecture previously exclusive to Azure SQL Database, making high-concurrency workloads much smoother out of the box.

### 4. Native Binary JSON (Compression)
One of the most requested features is here. JSON is no longer stored as inefficient text (\`NVARCHAR\`). 
SQL Server 2025 introduces a **native binary format** for JSON data.
* **Compression:** This binary format significantly reduces storage footprint compared to text-based JSON.
* **Performance:** It allows the engine to seek directly into the document (parsing is 5-10x faster) without reading the entire text string.

### References
* [What's New in SQL Server 2025 - Microsoft Learn](https://learn.microsoft.com/en-us/sql/sql-server/what-s-new-in-sql-server-2025?view=sql-server-ver17)
        `
    },
    {
        id: 1,
        title: "Fix: SSMS Offline Installation Certificate Error",
        category: "dba",
        categoryColor: "green-400",
        date: "Nov 28, 2025",
        readTime: "3 min",
        author: "Billy Gousetis",
        summary: "Encountered 'Error 0x80131509: Signature verification failed' while installing SSMS offline? Here is the fix involving the Microsoft Windows Code Signing PCA 2024 certificate.",
        content: `
# SSMS Offline Installation Error: Invalid Certificate

I recently faced an issue while trying to perform an offline installation of SSMS (SQL Server Management Studio) on a secure server.

After moving the installation folder to the offline server and running the \`SETUP.exe\`, the installation failed immediately. Upon checking the logs in \`%TEMP%\`, I found the following error:

\`\`\`text
Certificate is invalid: <YourSSMSFolder>\\vs_installer.opc
Error: Unable to verify the certificate: InvalidCertificate
Error 0x80131509: Signature verification failed. 
Error: Unable to verify the integrity of the installation files: the certificate could not be verified.
\`\`\`

This usually happens because the offline machine is missing the newer root certificates required to validate the installer's signature.

### The Solution

To ensure the installation completes successfully, you need to manually install the missing certificate.

1.  **Download the Certificate:** On a machine with an internet connection, download the [Microsoft Windows Code Signing PCA 2024 certificate](https://www.microsoft.com/pkiops/certs/Microsoft%20Windows%20Code%20Signing%20PCA%202024.crt).
2.  **Transfer:** Move the \`.crt\` file to your offline machine.
3.  **Install:** Right-click the \`.crt\` file and select **Install Certificate**.
4.  **Store Location:** Select **Local Machine** and click Next.
5.  **Certificate Store:** Keep **"Automatically select the certificate store based on the type of certificate"** selected, then click Next.
6.  **Finish:** Click Finish. You should see the prompt: *"The import was successful."*

Once this is done, try running the SSMS installer again. It should now proceed without the signature verification error.

### References
* [Create an offline installation of SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/ssms/install/create-offline)
* [Validate a certificate for offline installations (Microsoft Learn)](https://learn.microsoft.com/en-us/ssms/install/install-certificates)
        `
    }
];
