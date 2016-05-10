using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;

using Microsoft.Phone.Controls;
using Microsoft.Phone.Shell;
using Microsoft.Phone.Tasks;

namespace Cordova.Extension.Commands
{
    public class OpenWeb : BaseCommand
    {
        public void open(string options)
        {
            string href = JsonHelper.Deserialize<string[]>(options)[0];

            if (href.StartsWith("sms"))
            {
                SmsComposeTask task = new SmsComposeTask();
                task.To = href.Split(':')[1];
                task.Show();
            }
            else
            {
                WebBrowserTask browser = new WebBrowserTask();
                browser.Uri = new Uri(href);
                browser.Show();
            }
        }
    }
}
