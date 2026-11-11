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

        private static string ResolveBackendDir()
        {
            // Check direct subfolder or sibling folder
            string[] candidates = new string[]
            {
                Path.Combine(_appDir, "backend"),
                Path.Combine(_appDir, "..", "backend"),
                Path.Combine(_appDir, @"..\..\backend"),
                _appDir
            };

            foreach (var path in candidates)
            {
                string full = Path.GetFullPath(path);
                if (File.Exists(Path.Combine(full, "app", "main.py")))
                {
                    return full;
                }
            }
            return Path.GetFullPath(Path.Combine(_appDir, "backend"));
        }

        private static string FindPythonExecutable()
        {
            string[] venvPaths = new string[]
            {
                Path.Combine(_backendDir, ".venv", "Scripts", "python.exe"),
                Path.Combine(_backendDir, "venv", "Scripts", "python.exe"),
                Path.Combine(_backendDir, "..", ".venv", "Scripts", "python.exe"),
                Path.Combine(_appDir, "python", "python.exe")
            };

            foreach (var vp in venvPaths)
            {
                if (File.Exists(vp)) return Path.GetFullPath(vp);
            }

            // Check PATH for python.exe
            string pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
            foreach (var p in pathEnv.Split(';'))
            {
                string candidate = Path.Combine(p.Trim(), "python.exe");
                if (File.Exists(candidate)) return candidate;
            }

            return "python.exe";
        }

        private static bool StartBackendServer()
        {
            try
            {
                string pythonExe = FindPythonExecutable();

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = pythonExe,
                    Arguments = "-m uvicorn app.main:app --host 127.0.0.1 --port " + Port,
                    WorkingDirectory = _backendDir,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                psi.EnvironmentVariables["KMP_DUPLICATE_LIB_OK"] = "TRUE";
                psi.EnvironmentVariables["PYTHONPATH"] = _backendDir;
                psi.EnvironmentVariables["PORT"] = Port.ToString();

                _backendProcess = Process.Start(psi);
                if (_backendProcess != null && _jobHandle != IntPtr.Zero)
                {
                    AssignProcessToJobObject(_jobHandle, _backendProcess.Handle);
                }

                return _backendProcess != null;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error launching backend: " + ex.Message, "VocaFlow AI", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
                string args = string.Format(
                    "--app={0} --window-size=1440,900 --enable-media-stream --autoplay-policy=no-user-gesture-required",
                    url);

                _browserProcess = Process.Start(new ProcessStartInfo
                {
                    FileName = browserExe,
                    Arguments = args,
                    UseShellExecute = true
                });

                // Monitor browser process; exit app when main window closes
                new Thread(() =>
                {
                    try
                    {
                        if (_browserProcess != null)
                        {
                            _browserProcess.WaitForExit();
                            // Window was closed by user
                            Application.Exit();
                        }
                    }
                    catch { }
                }) { IsBackground = true }.Start();
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

            ContextMenu menu = new ContextMenu();
            menu.MenuItems.Add("🎵 Open VocaFlow AI", (s, e) => LaunchAppWindow());
            menu.MenuItems.Add("🌐 Open in Web Browser", (s, e) => Process.Start("http://127.0.0.1:" + Port));
            menu.MenuItems.Add("-");
            menu.MenuItems.Add("🟢 Engine Status: Active (Port " + Port + ")");
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
