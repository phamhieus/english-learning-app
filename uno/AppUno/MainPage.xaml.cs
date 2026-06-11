using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Web.WebView2.Core;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace AppUno;

public sealed partial class MainPage : Page
{
    public MainPage()
    {
        this.InitializeComponent();
        this.Loaded += MainPage_Loaded;
    }

    private async void MainPage_Loaded(object sender, RoutedEventArgs e)
    {
        await webView.EnsureCoreWebView2Async();

        // Automatically grant microphone permissions to prevent UI lag or hanging dialogs
        webView.CoreWebView2.PermissionRequested += (s, args) =>
        {
            if (args.PermissionKind == CoreWebView2PermissionKind.Microphone)
            {
                args.State = CoreWebView2PermissionState.Allow;
            }
        };

        // Native bridge for the web app's Installed AI detection
        // (web/src/services/native-bridge.ts). The browser sandbox cannot
        // touch the machine, so the host answers these four primitives;
        // all detection policy stays in the frontend.
        webView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;

        webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
            "appassets",
            "WebContent",
            CoreWebView2HostResourceAccessKind.Allow);
        webView.CoreWebView2.Navigate("http://appassets/index.html");
    }

    private async void OnWebMessageReceived(CoreWebView2 sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        long id = 0;
        try
        {
            using var doc = JsonDocument.Parse(args.WebMessageAsJson);
            var root = doc.RootElement;
            id = root.GetProperty("id").GetInt64();
            var op = root.GetProperty("op").GetString() ?? "";

            object? result;
            if (op == "run")
            {
                // Installed AI runtime: spawn a local CLI tool with a prompt.
                var file = Environment.ExpandEnvironmentVariables(root.GetProperty("file").GetString() ?? "");
                var runArgs = root.TryGetProperty("args", out var argsEl) && argsEl.ValueKind == JsonValueKind.Array
                    ? argsEl.EnumerateArray().Select(e => e.GetString() ?? "").ToArray()
                    : Array.Empty<string>();
                var stdin = root.TryGetProperty("stdin", out var stdinEl) ? stdinEl.GetString() ?? "" : "";
                result = await RunPromptAsync(file, runArgs, stdin);
            }
            else
            {
                var arg = Environment.ExpandEnvironmentVariables(root.GetProperty("arg").GetString() ?? "");
                result = op switch
                {
                    "fileExists" => File.Exists(arg),
                    "dirList" => Directory.Exists(arg)
                        ? Directory.GetDirectories(arg).Select(Path.GetFileName).ToArray()
                        : Array.Empty<string>(),
                    "which" => await WhichAsync(arg),
                    "version" => await VersionAsync(arg),
                    _ => throw new InvalidOperationException($"Unknown op: {op}"),
                };
            }

            PostReply(new BridgeReply(id, true, result, null));
        }
        catch (Exception ex)
        {
            PostReply(new BridgeReply(id, false, null, ex.Message));
        }
    }

    private sealed record BridgeReply(long id, bool ok, object? result, string? error);

    private void PostReply(BridgeReply reply) =>
        webView.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(reply));

    private static async Task<string?> WhichAsync(string command)
    {
        var locator = OperatingSystem.IsWindows() ? "where.exe" : "which";
        var output = await RunAsync(locator, $"\"{command}\"");
        var lines = (output ?? "").Split('\n').Select(l => l.Trim()).Where(l => l.Length > 0).ToArray();
        if (lines.Length == 0) return null;
        // On Windows `where` lists the extensionless shell shim first (not
        // spawnable); prefer a real executable extension when present.
        if (OperatingSystem.IsWindows())
        {
            return lines.FirstOrDefault(l =>
                l.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) ||
                l.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase) ||
                l.EndsWith(".bat", StringComparison.OrdinalIgnoreCase)) ?? lines[0];
        }
        return lines[0];
    }

    private static Task<string?> VersionAsync(string binaryPath)
    {
        // .cmd/.bat shims only run through the shell.
        var isCmdShim = OperatingSystem.IsWindows() &&
            (binaryPath.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase) ||
             binaryPath.EndsWith(".bat", StringComparison.OrdinalIgnoreCase));
        return isCmdShim
            ? RunAsync("cmd.exe", $"/c \"\"{binaryPath}\" --version\"")
            : RunAsync(binaryPath, "--version");
    }

    // Run a CLI tool, feeding `stdin` to it, and return stdout. Throws with
    // stderr on failure so the bridge surfaces a useful message to the web app.
    private static async Task<string> RunPromptAsync(string file, string[] args, string stdin, int timeoutMs = 180000)
    {
        var isCmdShim = OperatingSystem.IsWindows() &&
            (file.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase) ||
             file.EndsWith(".bat", StringComparison.OrdinalIgnoreCase));

        var psi = new ProcessStartInfo
        {
            FileName = isCmdShim ? "cmd.exe" : file,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        if (isCmdShim)
        {
            psi.ArgumentList.Add("/c");
            psi.ArgumentList.Add(file);
        }
        foreach (var a in args) psi.ArgumentList.Add(a);

        using var process = Process.Start(psi)
            ?? throw new InvalidOperationException($"Failed to start {file}.");

        try
        {
            await process.StandardInput.WriteAsync(stdin);
            process.StandardInput.Close();
        }
        catch { /* tool may close stdin early */ }

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();
        await Task.WhenAny(process.WaitForExitAsync(), Task.Delay(timeoutMs));
        if (!process.HasExited)
        {
            try { process.Kill(entireProcessTree: true); } catch { /* best effort */ }
            throw new TimeoutException($"{Path.GetFileName(file)} timed out.");
        }

        var stdout = await stdoutTask;
        if (process.ExitCode != 0)
        {
            var stderr = (await stderrTask).Trim();
            throw new InvalidOperationException(stderr.Length > 0 ? stderr : $"{Path.GetFileName(file)} exited with code {process.ExitCode}.");
        }
        return stdout.Trim();
    }

    private static async Task<string?> RunAsync(string file, string arguments, int timeoutMs = 10000)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = file,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var process = Process.Start(psi);
            if (process is null) return null;

            var stdout = process.StandardOutput.ReadToEndAsync();
            _ = process.StandardError.ReadToEndAsync();
            await Task.WhenAny(process.WaitForExitAsync(), Task.Delay(timeoutMs));
            if (!process.HasExited)
            {
                try { process.Kill(entireProcessTree: true); } catch { /* best effort */ }
                return null;
            }
            return process.ExitCode == 0 ? (await stdout).Trim() : null;
        }
        catch
        {
            return null;
        }
    }
}
