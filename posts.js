const blogPosts = [
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
