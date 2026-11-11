using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace VocaFlowAI.Installer
{
    public class SetupForm : Form
    {
        private TextBox txtTarget;
        private Button btnBrowse;
        private Button btnInstall;
        private ProgressBar progressBar;
        private Label lblStatus;
        private CheckBox chkDesktopShortcut;
        private CheckBox chkStartMenuShortcut;
        private CheckBox chkLaunchNow;

        public SetupForm()
        {
            this.Text = "VocaFlow AI — Setup & Packager";
            this.Size = new Size(540, 380);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(13, 17, 23);
            this.ForeColor = Color.White;

            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app.ico");
            if (!File.Exists(iconPath))
            {
                iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "desktop", "app.ico");
            }
            if (File.Exists(iconPath))
            {
                try { this.Icon = new Icon(iconPath); } catch { }
            }

            InitUI();
        }

        private void InitUI()
        {
            // Title Header
            Label lblTitle = new Label();
            lblTitle.Text = "VocaFlow AI Studio";
            lblTitle.Font = new Font("Segoe UI", 16, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(0, 229, 153);
            lblTitle.Location = new Point(24, 20);
            lblTitle.AutoSize = true;
            this.Controls.Add(lblTitle);

            Label lblSubtitle = new Label();
            lblSubtitle.Text = "Your Music. Your Voice. Your Stage. (Desktop Edition)";
            lblSubtitle.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(148, 163, 184);
            lblSubtitle.Location = new Point(26, 52);
            lblSubtitle.AutoSize = true;
            this.Controls.Add(lblSubtitle);

            // Install Path Label
            Label lblPath = new Label();
            lblPath.Text = "Destination Directory:";
            lblPath.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            lblPath.Location = new Point(24, 90);
            lblPath.AutoSize = true;
            this.Controls.Add(lblPath);

            // Path Input Box
            txtTarget = new TextBox();
            string defaultPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "VocaFlow-AI");
            txtTarget.Text = defaultPath;
            txtTarget.Font = new Font("Segoe UI", 9.5f);
            txtTarget.Location = new Point(24, 114);
            txtTarget.Size = new Size(380, 26);
            txtTarget.BackColor = Color.FromArgb(24, 30, 42);
            txtTarget.ForeColor = Color.White;
            txtTarget.BorderStyle = BorderStyle.FixedSingle;
            this.Controls.Add(txtTarget);

            // Browse Button
            btnBrowse = new Button();
            btnBrowse.Text = "Browse...";
            btnBrowse.Location = new Point(414, 112);
            btnBrowse.Size = new Size(88, 28);
            btnBrowse.FlatStyle = FlatStyle.Flat;
            btnBrowse.BackColor = Color.FromArgb(30, 41, 59);
            btnBrowse.ForeColor = Color.White;
            btnBrowse.Click += (s, e) =>
            {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                {
                    fbd.SelectedPath = txtTarget.Text;
                    if (fbd.ShowDialog() == DialogResult.OK)
                    {
                        txtTarget.Text = fbd.SelectedPath;
                    }
                }
            };
            this.Controls.Add(btnBrowse);

            // Checkboxes
            chkDesktopShortcut = new CheckBox();
            chkDesktopShortcut.Text = "Create Desktop Shortcut";
            chkDesktopShortcut.Checked = true;
            chkDesktopShortcut.Location = new Point(26, 156);
            chkDesktopShortcut.AutoSize = true;
            this.Controls.Add(chkDesktopShortcut);

            chkStartMenuShortcut = new CheckBox();
            chkStartMenuShortcut.Text = "Create Start Menu Program Entry";
            chkStartMenuShortcut.Checked = true;
            chkStartMenuShortcut.Location = new Point(26, 182);
            chkStartMenuShortcut.AutoSize = true;
            this.Controls.Add(chkStartMenuShortcut);

            chkLaunchNow = new CheckBox();
            chkLaunchNow.Text = "Launch VocaFlow AI immediately when installation finishes";
            chkLaunchNow.Checked = true;
            chkLaunchNow.Location = new Point(26, 208);
            chkLaunchNow.AutoSize = true;
            this.Controls.Add(chkLaunchNow);

            // Progress Bar
            progressBar = new ProgressBar();
            progressBar.Location = new Point(24, 245);
            progressBar.Size = new Size(478, 16);
            progressBar.Style = ProgressBarStyle.Continuous;
            this.Controls.Add(progressBar);

            // Status Label
            lblStatus = new Label();
            lblStatus.Text = "Ready to install.";
            lblStatus.Font = new Font("Segoe UI", 8.5f);
            lblStatus.ForeColor = Color.FromArgb(148, 163, 184);
            lblStatus.Location = new Point(24, 268);
            lblStatus.Size = new Size(350, 20);
            this.Controls.Add(lblStatus);

            // Install Button
            btnInstall = new Button();
            btnInstall.Text = "Install Software";
            btnInstall.Location = new Point(362, 288);
            btnInstall.Size = new Size(140, 36);
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.BackColor = Color.FromArgb(0, 229, 153);
            btnInstall.ForeColor = Color.FromArgb(13, 17, 23);
            btnInstall.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            btnInstall.Cursor = Cursors.Hand;
            btnInstall.Click += BtnInstall_Click;
            this.Controls.Add(btnInstall);
        }

        private void BtnInstall_Click(object sender, EventArgs e)
        {
            string targetDir = txtTarget.Text.Trim();
            if (string.IsNullOrEmpty(targetDir)) return;

            btnInstall.Enabled = false;
            btnBrowse.Enabled = false;
            txtTarget.Enabled = false;

            Thread worker = new Thread(() =>
            {
                try
                {
                    PerformInstallation(targetDir, chkDesktopShortcut.Checked, chkStartMenuShortcut.Checked, chkLaunchNow.Checked, (pct, msg) => UpdateStatus(pct, msg));

                    this.Invoke((MethodInvoker)delegate
                    {
                        MessageBox.Show("VocaFlow AI has been successfully installed!\n\nLocation: " + targetDir,
                            "Installation Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        this.Close();
                    });
                }
                catch (Exception ex)
                {
                    this.Invoke((MethodInvoker)delegate
                    {
                        MessageBox.Show("Installation error: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        btnInstall.Enabled = true;
                    });
                }
            });

            worker.IsBackground = true;
            worker.Start();
        }

        public static void PerformInstallation(string targetDir, bool createDesktop, bool createStartMenu, bool launchNow, Action<int, string> progress = null)
        {
            if (progress != null) progress(10, "Preparing target directory...");
            Directory.CreateDirectory(targetDir);

            string sourceRoot = AppDomain.CurrentDomain.BaseDirectory;

            // Resolve backend source
            string backendSource = null;
            string[] backendCandidates = new string[]
            {
                Path.Combine(sourceRoot, "backend"),
                Path.Combine(sourceRoot, "vocaflow-ai", "backend"),
                Path.Combine(sourceRoot, "..", "backend"),
                Path.Combine(sourceRoot, "..", "vocaflow-ai", "backend"),
                Path.Combine(sourceRoot, @"..\..\backend"),
                Path.Combine(sourceRoot, @"..\..\vocaflow-ai\backend"),
                @"c:\spotify_music_remover\vocaflow-ai\backend",
                @"c:\spotify_music_remover\backend"
            };
            foreach (var cand in backendCandidates)
            {
                if (Directory.Exists(cand) && File.Exists(Path.Combine(cand, "app", "main.py")))
                {
                    backendSource = Path.GetFullPath(cand);
                    break;
                }
            }

            // Resolve frontend dist source
            string distSource = null;
            string[] distCandidates = new string[]
            {
                Path.Combine(sourceRoot, "frontend", "dist"),
                Path.Combine(sourceRoot, "vocaflow-ai", "frontend", "dist"),
                Path.Combine(sourceRoot, "..", "frontend", "dist"),
                Path.Combine(sourceRoot, "..", "vocaflow-ai", "frontend", "dist"),
                Path.Combine(sourceRoot, @"..\..\frontend\dist"),
                Path.Combine(sourceRoot, @"..\..\vocaflow-ai\frontend\dist"),
                @"c:\spotify_music_remover\vocaflow-ai\frontend\dist",
                @"c:\spotify_music_remover\frontend\dist"
            };
            foreach (var cand in distCandidates)
            {
                if (Directory.Exists(cand) && File.Exists(Path.Combine(cand, "index.html")))
                {
                    distSource = Path.GetFullPath(cand);
                    break;
                }
            }

            if (progress != null) progress(25, "Extracting and copying application files...");

            // 1. Copy VocaFlow-AI.exe
            string mainExeSource = Path.Combine(sourceRoot, "bin", "VocaFlow-AI.exe");
            if (!File.Exists(mainExeSource)) mainExeSource = Path.Combine(sourceRoot, "VocaFlow-AI.exe");
            if (!File.Exists(mainExeSource)) mainExeSource = Path.Combine(sourceRoot, "desktop", "bin", "VocaFlow-AI.exe");
            if (!File.Exists(mainExeSource)) mainExeSource = @"c:\spotify_music_remover\vocaflow-ai\desktop\bin\VocaFlow-AI.exe";
            if (!File.Exists(mainExeSource)) mainExeSource = @"c:\spotify_music_remover\VocaFlow-AI.exe";

            string destExe = Path.Combine(targetDir, "VocaFlow-AI.exe");
            if (File.Exists(mainExeSource))
            {
                File.Copy(mainExeSource, destExe, true);
            }

            // 2. Copy desktop app.ico
            string icoSource = Path.Combine(sourceRoot, "desktop", "app.ico");
            if (!File.Exists(icoSource)) icoSource = Path.Combine(sourceRoot, "app.ico");
            if (!File.Exists(icoSource)) icoSource = @"c:\spotify_music_remover\vocaflow-ai\desktop\app.ico";

            if (File.Exists(icoSource))
            {
                Directory.CreateDirectory(Path.Combine(targetDir, "desktop"));
                File.Copy(icoSource, Path.Combine(targetDir, "desktop", "app.ico"), true);
            }

            // 3. Copy backend folder
            if (progress != null) progress(45, "Installing Python AI backend modules...");
            string backendDest = Path.Combine(targetDir, "backend");
            if (!string.IsNullOrEmpty(backendSource) && Directory.Exists(backendSource))
            {
                CopyDirectory(backendSource, backendDest, new string[] { "__pycache__", ".pytest_cache" });
            }

            // 4. Copy frontend/dist folder
            if (progress != null) progress(70, "Installing optimized frontend UI bundle...");
            string frontendDistDest = Path.Combine(targetDir, "frontend", "dist");
            if (!string.IsNullOrEmpty(distSource) && Directory.Exists(distSource))
            {
                CopyDirectory(distSource, frontendDistDest, new string[0]);
            }

            // 5. Ensure local_storage structure exists
            if (progress != null) progress(85, "Configuring persistent audio stem storage...");
            string[] storageDirs = new string[] { "audio", "stems", "recordings", "artworks", "lyrics" };
            foreach (var s in storageDirs)
            {
                Directory.CreateDirectory(Path.Combine(targetDir, "local_storage", s));
            }

            // 6. Write backend_dir.txt
            try
            {
                File.WriteAllText(Path.Combine(targetDir, "backend_dir.txt"), backendDest);
            }
            catch { }

            // 6. Create Shortcuts
            if (progress != null) progress(95, "Creating desktop and start menu shortcuts...");
            if (createDesktop)
            {
                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                CreateShortcut(Path.Combine(desktopPath, "VocaFlow AI.lnk"), destExe, targetDir, Path.Combine(targetDir, "desktop", "app.ico"));
            }

            if (createStartMenu)
            {
                string startMenu = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                CreateShortcut(Path.Combine(startMenu, "VocaFlow AI.lnk"), destExe, targetDir, Path.Combine(targetDir, "desktop", "app.ico"));
            }

            if (progress != null) progress(100, "Installation complete!");

            if (launchNow && File.Exists(destExe))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = destExe,
                    WorkingDirectory = targetDir
                });
            }
        }

        private void UpdateStatus(int percent, string text)
        {
            if (this.InvokeRequired)
            {
                this.Invoke((MethodInvoker)delegate { UpdateStatus(percent, text); });
                return;
            }
            progressBar.Value = Math.Min(100, percent);
            lblStatus.Text = text;
        }

        private static void CopyDirectory(string sourceDir, string targetDir, string[] excludeNames)
        {
            if (!Directory.Exists(sourceDir)) return;
            Directory.CreateDirectory(targetDir);

            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string fileName = Path.GetFileName(file);
                File.Copy(file, Path.Combine(targetDir, fileName), true);
            }

            foreach (string dir in Directory.GetDirectories(sourceDir))
            {
                string dirName = Path.GetFileName(dir);
                bool exclude = false;
                foreach (var ex in excludeNames)
                {
                    if (dirName.Equals(ex, StringComparison.OrdinalIgnoreCase)) { exclude = true; break; }
                }
                if (!exclude)
                {
                    CopyDirectory(dir, Path.Combine(targetDir, dirName), excludeNames);
                }
            }
        }

        private static void CreateShortcut(string shortcutPath, string targetExePath, string workingDir, string iconPath)
        {
            try
            {
                // Use Windows Script Host COM object via reflection to avoid COM interop DLL dependency
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType != null)
                {
                    object shell = Activator.CreateInstance(shellType);
                    object shortcut = shellType.InvokeMember("CreateShortcut", System.Reflection.BindingFlags.InvokeMethod, null, shell, new object[] { shortcutPath });
                    Type shortcutType = shortcut.GetType();

                    shortcutType.InvokeMember("TargetPath", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { targetExePath });
                    shortcutType.InvokeMember("WorkingDirectory", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { workingDir });
                    shortcutType.InvokeMember("Description", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { "VocaFlow AI — Smart Karaoke & Music Studio" });

                    if (File.Exists(iconPath))
                    {
                        shortcutType.InvokeMember("IconLocation", System.Reflection.BindingFlags.SetProperty, null, shortcut, new object[] { iconPath });
                    }

                    shortcutType.InvokeMember("Save", System.Reflection.BindingFlags.InvokeMethod, null, shortcut, null);
                }
            }
            catch { }
        }

        [STAThread]
        public static void Main(string[] args)
        {
            if (args != null && args.Length > 0 && (args[0] == "--silent" || args[0] == "/S" || args[0] == "-y"))
            {
                string targetDir = args.Length > 1 ? args[1] : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "VocaFlow-AI");
                PerformInstallation(targetDir, true, true, false, null);
                Console.WriteLine("Installation completed to: " + targetDir);
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm());
        }
    }
}
