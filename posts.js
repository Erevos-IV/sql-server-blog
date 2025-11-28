const blogPosts = [
    {
        id: 1,
        title: "Understanding Parameter Sniffing",
        category: "performance",
        categoryColor: "primary",
        date: "Nov 28, 2025",
        readTime: "10 min",
        author: "John Doe",
        summary: "When SQL Server compiles a stored procedure, it creates an execution plan based on the parameters provided at that specific moment. This is the 'Goldilocks' problem.",
        content: `
# The Parameter Sniffing Problem

Parameter sniffing is a feature, not a bug. It refers to the process where SQL Server's query optimizer "sniffs" the parameter values during compilation.

### Why is it bad?
The issue arises when the first parameter used to compile the plan is not representative of the typical workload. 

For example:
1. You compile with \`@ID = 1\` (returns 1 row) -> **Index Seek**
2. You run with \`@ID = 2\` (returns 1M rows) -> **Index Seek** (Should be Scan!)

### Example Code
\`\`\`sql
CREATE PROCEDURE GetOrders (@ClientID INT)
AS
SELECT * FROM Orders WHERE ClientID = @ClientID;
-- If run with ClientID=1 (returns 1 row) -> Plan A (Seek)
-- If run with ClientID=2 (returns 1M rows) -> Plan A crashes performance
\`\`\`

### The Solution: PSP Optimization
In SQL Server 2022, Microsoft introduced **Parameter Sensitive Plan (PSP) optimization**.
        `
    },
    {
        id: 2,
        title: "Identify Unused Indexes Quickly",
        category: "tsql",
        categoryColor: "secondary",
        date: "Nov 25, 2025",
        readTime: "3 min",
        author: "SysAdmin",
        summary: "Indexes that aren't used for seeks or scans still incur overhead during inserts. Find the dead weight with this simple DMV query.",
        content: `
# Finding Dead Indexes

Every index on your table slows down \`INSERT\`, \`UPDATE\`, and \`DELETE\` operations. If an index isn't being used for reads, it is pure overhead.

Here is the query to find them:

\`\`\`sql
SELECT 
    o.name AS ObjectName,
    i.name AS IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups
FROM sys.dm_db_index_usage_stats s
JOIN sys.indexes i ON i.object_id = s.object_id AND i.index_id = s.index_id
JOIN sys.objects o ON i.object_id = o.object_id
WHERE 
    s.database_id = DB_ID()
    AND s.user_seeks = 0
    AND s.user_scans = 0
    AND s.user_lookups = 0
    AND i.type_desc = 'NONCLUSTERED';
\`\`\`

**Note:** Be careful, these stats reset when SQL Server restarts!
        `
    },
    {
        id: 3,
        title: "Transaction Log Management",
        category: "dba",
        categoryColor: "green-400",
        date: "Nov 22, 2025",
        readTime: "15 min",
        author: "John Doe",
        summary: "Is your T-Log filling up? Before you shrink it, understand why it's growing. We discuss VLF fragmentation and recovery models.",
        content: `
# Stop Shrinking Your Logs!

Transaction logs need to grow. If you shrink them, they just have to grow again, which causes **VLF Fragmentation**.

### What is a VLF?
A Virtual Log File (VLF) is a unit of internal management. Too many VLFs make recovery slow.

> "The only time you should shrink a log file is if it grew due to an abnormal event that won't happen again."

### Best Practices
- Pre-grow your log files.
- Set autogrowth to a fixed size (e.g., 512MB), not a percentage.
        `
    }
];
