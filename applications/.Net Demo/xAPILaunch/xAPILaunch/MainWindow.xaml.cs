using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace WpfApplication1
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            StartBtn.IsEnabled = false;
            Question1Tab.IsEnabled = false;
            Question2Tab.IsEnabled = false;
            Question3Tab.IsEnabled = false;
            FinishTab.IsEnabled = false;
        }

        private void LaunchParam_Changed(object sender, TextChangedEventArgs e)
        {
            if (LaunchServerTxt.Text.Length > 0 && LaunchTokenTxt.Text.Length > 0)
            {
                Uri result;
                if (Uri.TryCreate(LaunchServerTxt.Text, UriKind.Absolute, out result))
                {
                    StartBtn.IsEnabled = true;
                    lblFeedback.Content = "";
                }
                else
                {
                    StartBtn.IsEnabled = false;
                    lblFeedback.Content = "Please use the absolute URL for your Launch Server";
                }
            }
            else
            {
                lblFeedback.Content = "Please enter both the Launch Token and the Launch Server URL";
            }
        }
    }
}
