using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace VocaFlowAI.Desktop
{
    public class Program
    {
        private static Process _backendProcess;
        private static Process _browserProcess;
        private static NotifyIcon _trayIcon;
        private static IntPtr _jobHandle;
        private static readonly int Port = 8000;
        private static string _appDir;
        private static string _backendDir;

        [STAThread]
        public static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            bool createdNew;
            using (Mutex mutex = new Mutex(true, "VocaFlowAI_SingleInstance_App_Mutex", out createdNew))
            {
                if (!createdNew)
                {
                    // Backend already running! Focus app window and terminate duplicate launcher process
                    LaunchAppWindow();
                    return;
                }

                _appDir = AppDomain.CurrentDomain.BaseDirectory;
                _backendDir = ResolveBackendDir();

                // 1. Assign to Windows Job Object for bulletproof child-process termination
                EnableJobKillOnClose();

                // 2. Initialize System Tray
                SetupTrayIcon();

                // 3. Start Backend Process in Background
                bool started = StartBackendServer();
                if (!started)
                {
                    MessageBox.Show("Could not start VocaFlow AI backend server. Please verify Python is installed.",
                        "VocaFlow AI Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    Cleanup();
                    return;
                }

                // 4. Wait for server to be healthy
                bool ready = WaitForServerReady(30);
                if (!ready)
                {
                    MessageBox.Show("VocaFlow AI backend did not respond in time on port " + Port,
                        "VocaFlow AI Timeout", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }

                // 5. Launch Standalone Native Window (Edge/Chrome App Mode)
                LaunchAppWindow();

                // 6. Run message loop
                Application.Run();
            }
        }

        private static string ResolveBackendDir()
        {
            // 1. Check saved backend path if any
            string configDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "VocaFlow-AI");
            string configFile = Path.Combine(configDir, "backend_dir.txt");
            if (File.Exists(configFile))
            {
                try
                {
                    string saved = File.ReadAllText(configFile).Trim();
                    if (Directory.Exists(saved) && File.Exists(Path.Combine(saved, "app", "main.py")))
                    {
                        return Path.GetFullPath(saved);
                    }
                }
                catch { }
            }

            // 2. Check candidate directories
            string[] candidates = new string[]
            {
                Path.Combine(_appDir, "backend"),
                Path.Combine(_appDir, "vocaflow-ai", "backend"),
                Path.Combine(_appDir, "..", "backend"),
                Path.Combine(_appDir, "..", "vocaflow-ai", "backend"),
                Path.Combine(_appDir, @"..\..\backend"),
                Path.Combine(_appDir, @"..\..\vocaflow-ai\backend"),
                _appDir,
                Path.Combine(Directory.GetCurrentDirectory(), "backend"),
                Path.Combine(Directory.GetCurrentDirectory(), "vocaflow-ai", "backend"),
                @"c:\spotify_music_remover\vocaflow-ai\backend",
                @"c:\spotify_music_remover\backend",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "VocaFlow-AI", "backend")
            };

            foreach (var path in candidates)
            {
                try
                {
                    string full = Path.GetFullPath(path);
                    if (Directory.Exists(full) && File.Exists(Path.Combine(full, "app", "main.py")))
                    {
                        SaveBackendDir(full);
                        return full;
                    }
                }
                catch { }
            }

            // 3. Fallback: ask user to select backend folder
            using (FolderBrowserDialog fbd = new FolderBrowserDialog())
            {
                fbd.Description = "VocaFlow AI: Please select the 'backend' folder (or 'vocaflow-ai' root folder):";
                fbd.SelectedPath = _appDir;
                if (fbd.ShowDialog() == DialogResult.OK)
                {
                    string sel = fbd.SelectedPath;
                    if (File.Exists(Path.Combine(sel, "app", "main.py")))
                    {
                        SaveBackendDir(sel);
                        return Path.GetFullPath(sel);
                    }
                    string sub = Path.Combine(sel, "backend");
                    if (File.Exists(Path.Combine(sub, "app", "main.py")))
                    {
                        SaveBackendDir(sub);
                        return Path.GetFullPath(sub);
                    }
                }
            }

            return Path.GetFullPath(Path.Combine(_appDir, "backend"));
        }

        private static void SaveBackendDir(string dir)
        {
            try
            {
                string configDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "VocaFlow-AI");
                Directory.CreateDirectory(configDir);
                File.WriteAllText(Path.Combine(configDir, "backend_dir.txt"), dir);
            }
            catch { }
        }

        private static string FindPythonExecutable()
        {
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

            // Priority 1: Virtualenvs inside backend or project
            string[] venvPaths = new string[]
            {
                Path.Combine(_backendDir, ".venv", "Scripts", "python.exe"),
                Path.Combine(_backendDir, "venv", "Scripts", "python.exe"),
                Path.Combine(_backendDir, "..", ".venv", "Scripts", "python.exe"),
                Path.Combine(_appDir, "python", "python.exe"),
                Path.Combine(_appDir, "..", "python", "python.exe")
            };

            foreach (var vp in venvPaths)
            {
                if (File.Exists(vp)) return Path.GetFullPath(vp);
            }

            // Priority 2: Anaconda or standard Python installations
            string[] standardInstallations = new string[]
            {
                Path.Combine(userProfile, @"anaconda3\python.exe"),
                Path.Combine(userProfile, @"AppData\Local\Programs\Python\Python314\python.exe"),
                Path.Combine(userProfile, @"AppData\Local\Programs\Python\Python313\python.exe"),
                Path.Combine(userProfile, @"AppData\Local\Programs\Python\Python312\python.exe"),
                Path.Combine(userProfile, @"AppData\Local\Programs\Python\Python311\python.exe"),
                @"C:\Program Files\Python314\python.exe",
                @"C:\Program Files\Python313\python.exe",
                @"C:\Program Files\Python312\python.exe",
                @"C:\Program Files\Python311\python.exe"
            };

            foreach (var sp in standardInstallations)
            {
                if (File.Exists(sp)) return sp;
            }

            // Priority 3: Search PATH (ignore 0-byte WindowsApps stubs)
            string pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
            foreach (var p in pathEnv.Split(';'))
            {
                string dir = p.Trim();
                if (string.IsNullOrEmpty(dir) || dir.IndexOf("WindowsApps", StringComparison.OrdinalIgnoreCase) >= 0)
                    continue;

                string candidate = Path.Combine(dir, "python.exe");
                if (File.Exists(candidate))
                {
                    try
                    {
                        FileInfo fi = new FileInfo(candidate);
                        if (fi.Length > 1024) return candidate;
                    }
                    catch { }
                }
            }

            return "python.exe";
        }

        private static bool StartBackendServer()
        {
            string pythonExe = FindPythonExecutable();

            // Validate that backend directory exists
            if (!Directory.Exists(_backendDir))
            {
                MessageBox.Show(
                    "Backend directory does not exist:\n\n" + _backendDir +
                    "\n\nPlease ensure VocaFlow AI files are intact or run VocaFlow-AI-Setup.exe.",
                    "VocaFlow AI Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }

            // Validate that main.py exists
            string mainPy = Path.Combine(_backendDir, "app", "main.py");
            if (!File.Exists(mainPy))
            {
                MessageBox.Show(
                    "Backend main.py not found at:\n\n" + mainPy +
                    "\n\nPlease check your VocaFlow AI folder.",
                    "VocaFlow AI Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }

            try
            {
                string configDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "VocaFlow-AI");
                Directory.CreateDirectory(configDir);
                string logPath = Path.Combine(configDir, "backend.log");
                try { File.WriteAllText(logPath, "=== VocaFlow AI Backend Starting: " + DateTime.Now.ToString("s") + " ===\r\n"); } catch { }

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = pythonExe,
                    Arguments = "-m uvicorn app.main:app --host 127.0.0.1 --port " + Port,
                    WorkingDirectory = _backendDir,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                psi.EnvironmentVariables["KMP_DUPLICATE_LIB_OK"] = "TRUE";
                psi.EnvironmentVariables["PYTHONPATH"] = _backendDir;
                psi.EnvironmentVariables["PORT"] = Port.ToString();

                _backendProcess = new Process();
                _backendProcess.StartInfo = psi;
                _backendProcess.OutputDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        try { File.AppendAllText(logPath, "[OUT] " + e.Data + "\r\n"); } catch { }
                    }
                };
                _backendProcess.ErrorDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        try { File.AppendAllText(logPath, "[ERR] " + e.Data + "\r\n"); } catch { }
                    }
                };

                _backendProcess.Start();
                _backendProcess.BeginOutputReadLine();
                _backendProcess.BeginErrorReadLine();

                if (_jobHandle != IntPtr.Zero)
                {
                    AssignProcessToJobObject(_jobHandle, _backendProcess.Handle);
                }

                return true;
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Error launching backend: " + ex.Message + "\n\n" +
                    "Python: " + pythonExe + "\n" +
                    "Working Directory: " + _backendDir,
                    "VocaFlow AI Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }
        }

        private static bool WaitForServerReady(int maxSeconds)
        {
            string healthUrl = string.Format("http://127.0.0.1:{0}/api/health", Port);
            int attempts = maxSeconds * 4;

            for (int i = 0; i < attempts; i++)
            {
                try
                {
                    HttpWebRequest request = (HttpWebRequest)WebRequest.Create(healthUrl);
                    request.Timeout = 1000;
                    request.Method = "GET";
                    using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                    {
                        if (response.StatusCode == HttpStatusCode.OK)
                        {
                            return true;
                        }
                    }
                }
                catch
                {
                    // Backend still initializing
                }
                Thread.Sleep(250);
            }
            return false;
        }

        private static void LaunchAppWindow()
        {
            string url = string.Format("http://127.0.0.1:{0}", Port);

            // Locate Edge or Chrome for dedicated App Mode
            string edge = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                @"Microsoft\Edge\Application\msedge.exe");
            if (!File.Exists(edge))
            {
                edge = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                    @"Microsoft\Edge\Application\msedge.exe");
            }

            string chrome = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                @"Google\Chrome\Application\chrome.exe");
            if (!File.Exists(chrome))
            {
                chrome = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                    @"Google\Chrome\Application\chrome.exe");
            }

            string browserExe = File.Exists(edge) ? edge : (File.Exists(chrome) ? chrome : null);

            if (browserExe != null)
            {
                string userDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "VocaFlow-AI", "browser-data");
                try { Directory.CreateDirectory(userDataDir); } catch { }

                string args = string.Format(
                    "--app={0} --user-data-dir=\"{1}\" --no-first-run --no-default-browser-check --window-size=1440,900 --enable-media-stream --autoplay-policy=no-user-gesture-required",
                    url, userDataDir);

                try
                {
                    _browserProcess = Process.Start(new ProcessStartInfo
                    {
                        FileName = browserExe,
                        Arguments = args,
                        UseShellExecute = false
                    });

                    // Monitor browser process lifecycle
                    new Thread(() =>
                    {
                        try
                        {
                            if (_browserProcess != null)
                            {
                                DateTime launchTime = DateTime.UtcNow;
                                _browserProcess.WaitForExit();
                                TimeSpan duration = DateTime.UtcNow - launchTime;

                                // If the browser process stayed open for >= 5 seconds before exiting,
                                // the user actively used and intentionally closed the app window.
                                // In that case, cleanly shut down the entire application.
                                if (duration.TotalSeconds >= 5)
                                {
                                    Application.Exit();
                                }
                                else
                                {
                                    // Edge/Chrome delegated window creation to an existing browser instance.
                                    // CRITICAL: DO NOT kill the backend or exit!
                                    // The app window is actively displaying on screen.
                                    if (_trayIcon != null)
                                    {
                                        _trayIcon.ShowBalloonTip(3000, "VocaFlow AI", "VocaFlow AI is active and running.", ToolTipIcon.Info);
                                    }
                                }
                            }
                        }
                        catch { }
                    }) { IsBackground = true }.Start();
                }
                catch
                {
                    Process.Start(url);
                }
            }
            else
            {
                Process.Start(url);
            }
        }

        private static void SetupTrayIcon()
        {
            _trayIcon = new NotifyIcon();
            _trayIcon.Text = "VocaFlow AI — Smart Karaoke & Music Studio";

            string iconPath = Path.Combine(_appDir, "app.ico");
            if (!File.Exists(iconPath))
            {
                iconPath = Path.Combine(_appDir, "desktop", "app.ico");
            }

            if (File.Exists(iconPath))
            {
                try { _trayIcon.Icon = new Icon(iconPath); }
                catch { _trayIcon.Icon = SystemIcons.Application; }
            }
            else
            {
                _trayIcon.Icon = SystemIcons.Application;
            }

            string logPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "VocaFlow-AI", "backend.log");

            ContextMenu menu = new ContextMenu();
            menu.MenuItems.Add("🎵 Open VocaFlow AI", (s, e) => LaunchAppWindow());
            menu.MenuItems.Add("🌐 Open in Web Browser", (s, e) => Process.Start("http://127.0.0.1:" + Port));
            menu.MenuItems.Add("-");
            menu.MenuItems.Add("🟢 Engine Status: Active (Port " + Port + ")");
            menu.MenuItems.Add("📄 View Backend Logs", (s, e) => {
                try
                {
                    if (File.Exists(logPath)) Process.Start("notepad.exe", logPath);
                    else MessageBox.Show("Log file has not been created yet.", "VocaFlow AI");
                }
                catch { }
            });
            menu.MenuItems.Add("📁 Open Audio Library Folder", (s, e) => {
                try
                {
                    string audioDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "VocaFlow-AI", "local_storage", "audio");
                    if (!Directory.Exists(audioDir)) Directory.CreateDirectory(audioDir);
                    Process.Start("explorer.exe", audioDir);
                }
                catch { }
            });
            menu.MenuItems.Add("🔄 Restart Backend Engine", (s, e) => RestartBackend());
            menu.MenuItems.Add("-");
            menu.MenuItems.Add("❌ Exit VocaFlow AI", (s, e) => CleanupAndExit());

            _trayIcon.ContextMenu = menu;
            _trayIcon.Visible = true;
            _trayIcon.DoubleClick += (s, e) => LaunchAppWindow();

            Application.ApplicationExit += (s, e) => Cleanup();
        }

        private static void RestartBackend()
        {
            try
            {
                if (_backendProcess != null && !_backendProcess.HasExited)
                {
                    _backendProcess.Kill();
                    _backendProcess.WaitForExit(3000);
                }
            }
            catch { }

            StartBackendServer();
            WaitForServerReady(10);
            _trayIcon.ShowBalloonTip(2000, "VocaFlow AI", "Backend engine restarted.", ToolTipIcon.Info);
        }

        private static void CleanupAndExit()
        {
            Cleanup();
            Application.Exit();
        }

        private static void Cleanup()
        {
            if (_trayIcon != null)
            {
                _trayIcon.Visible = false;
                _trayIcon.Dispose();
                _trayIcon = null;
            }

            try
            {
                if (_backendProcess != null && !_backendProcess.HasExited)
                {
                    _backendProcess.Kill();
                }
            }
            catch { }
        }

        #region Windows Job Object (Auto-kill child processes on exit)
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
        static extern IntPtr CreateJobObject(IntPtr a, string lpName);

        [DllImport("kernel32.dll")]
        static extern bool SetInformationJobObject(IntPtr hJob, int JobObjectInfoClass, IntPtr lpJobObjectInfo, uint cbJobObjectInfoLength);

        [DllImport("kernel32.dll")]
        static extern bool AssignProcessToJobObject(IntPtr hJob, IntPtr hProcess);

        private const int JobObjectExtendedLimitInformation = 9;
        private const uint JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x2000;

        [StructLayout(LayoutKind.Sequential)]
        struct JOBOBJECT_BASIC_LIMIT_INFORMATION
        {
            public long PerProcessUserTimeLimit;
            public long PerJobUserTimeLimit;
            public uint LimitFlags;
            public UIntPtr MinimumWorkingSetSize;
            public UIntPtr MaximumWorkingSetSize;
            public uint ActiveProcessLimit;
            public UIntPtr Affinity;
            public uint PriorityClass;
            public uint SchedulingClass;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct IO_COUNTERS
        {
            public ulong ReadOperationCount;
            public ulong WriteOperationCount;
            public ulong OtherOperationCount;
            public ulong ReadTransferCount;
            public ulong WriteTransferCount;
            public ulong OtherTransferCount;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION
        {
            public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
            public IO_COUNTERS IoInfo;
            public UIntPtr ProcessMemoryLimit;
            public UIntPtr JobMemoryLimit;
            public UIntPtr PeakProcessMemoryLimit;
            public UIntPtr PeakJobMemoryLimit;
        }

        private static void EnableJobKillOnClose()
        {
            try
            {
                _jobHandle = CreateJobObject(IntPtr.Zero, null);
                var info = new JOBOBJECT_EXTENDED_LIMIT_INFORMATION();
                info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

                int length = Marshal.SizeOf(typeof(JOBOBJECT_EXTENDED_LIMIT_INFORMATION));
                IntPtr extendedInfoPtr = Marshal.AllocHGlobal(length);
                Marshal.StructureToPtr(info, extendedInfoPtr, false);

                SetInformationJobObject(_jobHandle, JobObjectExtendedLimitInformation, extendedInfoPtr, (uint)length);
                Marshal.FreeHGlobal(extendedInfoPtr);
            }
            catch { }
        }
        #endregion
    }
}

