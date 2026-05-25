using System;
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

        webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
            "appassets",
            "WebContent",
            CoreWebView2HostResourceAccessKind.Allow);
        webView.CoreWebView2.Navigate("http://appassets/index.html");
    }
}
