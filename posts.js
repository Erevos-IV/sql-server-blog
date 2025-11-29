const blogPosts = [
    {
        id: 1,
        title: "Fix: SSMS Offline Installation Certificate Error",
        category: "dba",
        categoryColor: "green-400",
        date: "Nov 28, 2025",
        readTime: "2 min",
        author: "Billy",
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
