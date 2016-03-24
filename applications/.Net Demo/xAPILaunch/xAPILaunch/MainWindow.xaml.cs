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
using System.Web;
using System.Collections.Specialized;

using System.Security.Principal;

namespace WpfApplication1
{



    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private bool IsUserAdministrator()
        {
            //bool value to hold our return value
            bool isAdmin;
            WindowsIdentity user = null;
            try
            {
                //get the currently logged in user
                user = WindowsIdentity.GetCurrent();
                WindowsPrincipal principal = new WindowsPrincipal(user);
                isAdmin = principal.IsInRole(WindowsBuiltInRole.Administrator);
            }
            catch (UnauthorizedAccessException ex)
            {
                isAdmin = false;
            }
            catch (Exception ex)
            {
                isAdmin = false;
            }
            finally
            {
                if (user != null)
                    user.Dispose();
            }
            return isAdmin;
        }
        public MainWindow()
        {
            InitializeComponent();
            StartBtn.IsEnabled = false;
            Question1Tab.IsEnabled = false;
            Question2Tab.IsEnabled = false;
            Question3Tab.IsEnabled = false;
            FinishTab.IsEnabled = false;
            launchAPI = new xAPILaunch.LaunchAPI();
            ready = true;
            string[] args = Environment.GetCommandLineArgs();
            if (!IsUserAdministrator())
            {
                installHandlerBtn.IsEnabled = false;
                removeHandlerBtn.IsEnabled = false;
            }
            try
            {

                var url = new Uri(args[1]);
                var query = url.Query;
                NameValueCollection queryValues = HttpUtility.ParseQueryString(query);
                LaunchTokenTxt.Text = queryValues["xAPILaunchKey"];
                LaunchServerTxt.Text = queryValues["xAPILaunchService"];
                if (LaunchServerTxt.Text != null && LaunchServerTxt.Text.Length > 0 && LaunchTokenTxt.Text != null && LaunchTokenTxt.Text.Length > 0)
                {
                    StartBtn_Click(null, null);
                }
            }
            catch (Exception e)
            {

            }


        }
        private xAPILaunch.LaunchAPI launchAPI;
        private bool ready = false;
        private void LaunchParam_Changed(object sender, TextChangedEventArgs e)
        {
            if (!ready) return;
            if (LaunchServerTxt.Text != null && LaunchServerTxt.Text.Length > 0 && LaunchTokenTxt.Text != null && LaunchTokenTxt.Text.Length > 0)
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

        private void launch()
        {
            xAPILaunch.LaunchData launchData = launchAPI.Launch(LaunchServerTxt.Text, LaunchTokenTxt.Text);
            if (launchData != null && launchData.Actor != null)
            {
                Question1Tab.IsEnabled = true;
                Question1Tab.Focus();
                lblWelcome.Content = "Welcome " + launchData.Actor.name + "!";
                launchAPI.postInitialize(null);
            }else
            {
                System.Windows.Forms.MessageBox.Show(launchData.response);
            }
        }
        private void StartBtn_Click(object sender, RoutedEventArgs e)
        {
            this.launch();
        }

        private void installHandlerBtn_Click(object sender, RoutedEventArgs e)
        {
            if (!IsUserAdministrator())
            {
                return;
            }
            Microsoft.Win32.RegistryKey key;
            key = Microsoft.Win32.Registry.ClassesRoot.CreateSubKey("xAPILaunchDemo");

            key.SetValue("", "URL:xAPILaunchDemo");
            key.SetValue("URL Protocol", "");
            key.CreateSubKey("shell").CreateSubKey("open").CreateSubKey("command").SetValue("", "\"" + System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName.Replace(".vshost.exe", ".exe") + "\" \"%1\"");
            Console.WriteLine(System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName);
            MessageBox.Show("Handler for URL:xAPILaunchDemo installed for " + System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName);
            key.Close();
        }

        private void removeHandlerBtn_Click(object sender, RoutedEventArgs e)
        {
            if (!IsUserAdministrator())
            {
                return;
            }
            try
            {
                Microsoft.Win32.Registry.ClassesRoot.DeleteSubKeyTree("xAPILaunchDemo");
                MessageBox.Show("Handler for URL:xAPILaunchDemo removed");
            }
            catch (Exception ex)
            {

            }


        }

        private void button3_Click(object sender, RoutedEventArgs e)
        {
            LaunchTab.Focus();
        }

        private void button2_Click(object sender, RoutedEventArgs e)
        {
            if (question1Answer.Text == "")
                return;
            var answer = question1Answer.Text;
            var result = new xAPILaunch.xAPIResult();
            result.completion = true;
            result.success = Int16.Parse(answer) == 40;
            if (result.success)
                result.score = new xAPILaunch.xAPIScore(100,0,100);
            else
                result.score = new xAPILaunch.xAPIScore(0, 0, 100);
            result.response = answer;
            launchAPI.postStatement("http://adlnet.gov/expapi/verbs/answered",launchAPI.launchUrl +"/question1",result );
            Question2Tab.IsEnabled = true;
            Question2Tab.Focus();
        }

        private void button5_Click(object sender, RoutedEventArgs e)
        {
            Question1Tab.IsEnabled = true;
            Question1Tab.Focus();
        }

        private void button4_Click(object sender, RoutedEventArgs e)
        {
            if (question2Answer.Text == "")
                return;
            var answer = question2Answer.Text;
            var result = new xAPILaunch.xAPIResult();
            result.completion = true;
            result.success = Int16.Parse(answer) == 45;
            if (result.success)
                result.score = new xAPILaunch.xAPIScore(100, 0, 100);
            else
                result.score = new xAPILaunch.xAPIScore(0, 0, 100);
            result.response = answer;
            launchAPI.postStatement("http://adlnet.gov/expapi/verbs/answered", launchAPI.launchUrl + "/question1", result);
            Question2Tab.IsEnabled = true;
            Question2Tab.Focus();
            Question3Tab.IsEnabled = true;
            Question3Tab.Focus();

        }

        private void button7_Click(object sender, RoutedEventArgs e)
        {
            Question2Tab.IsEnabled = true;
            Question2Tab.Focus();
        }

        private void button6_Click(object sender, RoutedEventArgs e)
        {
            if (question3Answer.Text == "")
                return;
            var answer = question3Answer.Text;
            var result = new xAPILaunch.xAPIResult();
            result.completion = true;
            result.success = Int16.Parse(answer) == 48;
            if (result.success)
                result.score = new xAPILaunch.xAPIScore(100, 0, 100);
            else
                result.score = new xAPILaunch.xAPIScore(0, 0, 100);
            result.response = answer;
            launchAPI.postStatement("http://adlnet.gov/expapi/verbs/answered", launchAPI.launchUrl + "/question1", result);
            Question2Tab.IsEnabled = true;
            Question2Tab.Focus();
            FinishTab.IsEnabled = true;
            FinishTab.Focus();
        }
    }
}
